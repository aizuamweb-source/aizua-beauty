/**
 * POST /api/chat
 * Agente Soporte — Aizüa Beauty
 *
 * Flujo:
 *  1. Recibe mensaje + historial + locale
 *  2. Busca en knowledge_base (Supabase)
 *  3. Claude API con contexto de la tienda + políticas por proveedor
 *  4. Si confianza < 80% → alerta Telegram
 *
 * Proveedores activos: línea propia de belleza y accesorios (checkout propio).
 * CJ Dropshipping: plantilla disponible, activar cuando proceda.
 *
 * s229: la marca externa de cosmética quedó DESACTIVADA. Su bloque en PROVIDERS se
 * conserva para poder reactivarla, pero está fuera de ACTIVE_PROVIDERS: el agente no
 * la conoce, no la menciona y no da su política de envío ni de devolución.
 *
 * IMPORTANTE — prohibición médica:
 *   Ninguna respuesta puede hacer afirmaciones terapéuticas o medicinales sobre productos.
 */

import { NextRequest, NextResponse } from "next/server";
import { llmRoute } from "@/lib/llm-router";
import { createClient } from "@supabase/supabase-js";
// s265: para dar de alta en la lista al lead que deja su correo en el chat.
import { upsertContact, getListIdForLocale } from "@/lib/brevo/client";
import {
  GUARDRAILS_PROMPT, esExtraccionDePrompt, RECHAZO_EXTRACCION, filtraSalida,
} from "@/lib/agent-guardrails";

// ── Clientes ──────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Tipos ─────────────────────────────────────────────────
type Message = { role: "user" | "assistant"; content: string };

type ChatRequest = {
  message:  string;
  history:  Message[];
  locale:   string;   // 'es' | 'en' | 'fr' | 'it'
  conversationId?: string;   // s244: hilo ya abierto (lo devuelve esta API)
  metadata?: {
    page?:    string;
    orderId?: string;
  };
};

// ── Persistencia de conversaciones (s244) ─────────────────
// Este endpoint NO guardaba NADA: buscaba en knowledge_base, respondía y, si la
// confianza era baja, avisaba por Telegram. Las conversaciones vivían solo en el
// sessionStorage del visitante y se perdían al cerrar la pestaña — por eso el
// portal mostraba 0 conversaciones de esta tienda con el chat funcionando.
// Ahora se escriben en las MISMAS tablas que el widget de consulting
// (agent_conversations + agent_messages), bajo el cliente "AizuaBeauty"
// (aizuafit@outlook.com), que cuelga de la agencia miguel@aizualabs.com.
const SAAS_CLIENT_ID = process.env.SAAS_CLIENT_ID ?? "0c1eab5b-e276-4f22-b378-db00efd4dc22";

// Tope de espera del guardado: la respuesta al visitante manda siempre.
const PERSIST_TIMEOUT_MS = 2500;

/**
 * Guarda el turno en agent_conversations / agent_messages.
 *
 * REGLA DURA: esto NUNCA puede dejar sin respuesta al visitante.
 *   · Un ERROR de Supabase lo absorbe el try/catch.
 *   · Un CUELGUE lo corta persistirConTimeout(): se responde igual y como mucho
 *     se pierde el AGRUPADO de ese turno, nunca la respuesta.
 */
async function persistirTurno(args: {
  conversationId?: string;
  locale: string;
  userMessage: string;
  assistantMessage: string;
  escalated: boolean;
  confidence: number;
  metadata?: { page?: string; orderId?: string };
}): Promise<string | undefined> {
  const { conversationId, locale, userMessage, assistantMessage,
          escalated, confidence, metadata } = args;
  try {
    let convId = conversationId;

    if (!convId) {
      const { data, error } = await supabase
        .from("agent_conversations")
        .insert({
          client_id:       SAAS_CLIENT_ID,
          channel:         "web",
          status:          escalated ? "escalated" : "active",
          message_count:   0,
          started_at:      new Date().toISOString(),
          last_message_at: new Date().toISOString(),
          metadata:        { locale, page: metadata?.page ?? null,
                             order_id: metadata?.orderId ?? null, source: "beauty-chat" },
        })
        .select("id")
        .single();
      if (error || !data) return conversationId;
      convId = data.id as string;
    }

    await supabase.from("agent_messages").insert([
      { conversation_id: convId, role: "user",      content: userMessage },
      { conversation_id: convId, role: "assistant", content: assistantMessage,
        model: `beauty-chat/confianza:${confidence.toFixed(2)}` },
    ]);

    // Se recuenta de verdad: un contador que no puede demostrarse no se escribe.
    const { count } = await supabase
      .from("agent_messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", convId);

    await supabase
      .from("agent_conversations")
      .update({
        last_message_at: new Date().toISOString(),
        message_count:   count ?? undefined,
        ...(escalated ? { status: "escalated", escalated_at: new Date().toISOString(),
                          escalation_reason: "confianza baja" } : {}),
      })
      .eq("id", convId);

    return convId;
  } catch (e) {
    console.error("[/api/chat] no se pudo guardar la conversación:", e);
    return conversationId;
  }
}

/**
 * Si NO se consigue guardar, el turno se manda a Telegram para no perderlo.
 * Dar error al visitante no salvaria la conversacion (la pierde igual, y encima
 * pierde a la clienta), y encolar no es posible: las funciones de Vercel son
 * efimeras y una cola duradera necesitaria la base de datos que esta caida.
 * Telegram es un canal independiente y ya esta integrado aqui.
 */
async function persistirConTimeout(
  args: Parameters<typeof persistirTurno>[0],
): Promise<string | undefined> {
  const guardado = persistirTurno(args).catch((e) => {
    console.error("[/api/chat] guardado falló:", e);
    return undefined;
  });
  const CORTE = Symbol("timeout");
  const corte = new Promise<typeof CORTE>((r) => setTimeout(() => r(CORTE), PERSIST_TIMEOUT_MS));
  const res = await Promise.race([guardado, corte]);

  if (res === CORTE || res === undefined) {
    const motivo = res === CORTE
      ? `Supabase no respondió en ${PERSIST_TIMEOUT_MS} ms`
      : "el guardado en Supabase falló";
    console.error(`[/api/chat] ${motivo} — la conversación va a Telegram para no perderla`);
    escalateToTelegram(
      args.userMessage,
      [{ role: "assistant", content: args.assistantMessage }],
      `[NO GUARDADO — ${motivo}] ${args.assistantMessage.slice(0, 300)}`,
      args.confidence,
      args.metadata,
    );
    return args.conversationId;
  }
  return res as string | undefined;
}

type SupportedLocale = "es" | "en" | "fr" | "it" | "de" | "pt";
// Fuente unica de verdad: antes cada punto repetia su ternario y anadir un
// idioma exigia acordarse de los dos; el olvidado caia a español en silencio.
const SUPPORTED: readonly SupportedLocale[] = ["es", "en", "fr", "it", "de", "pt"];

// ── Límites ───────────────────────────────────────────────
const MAX_HISTORY_TURNS    = 10;
const CONFIDENCE_THRESHOLD = 0.80;
const MAX_INPUT_LENGTH     = 500;
const MAX_MSGS_PER_SESSION = 20;

// ── Config de envíos y devoluciones por proveedor ─────────
//
// Línea propia de belleza y accesorios, con checkout Stripe. Plazo según almacén disponible.
//
// El bloque de la marca externa desactivada (s229) queda más abajo, inerte: no está en
// ACTIVE_PROVIDERS, así que getShippingContext() no lo inyecta nunca en el prompt.
//
// CJ Dropshipping: plantilla preparada, activar cambiando activeProviders.

const PROVIDERS = {

  aliexpress: {
    label: {
      es: "moda y accesorios",
      en: "fashion and accessories",
      fr: "mode et accessoires",
      it: "moda e accessori",
      de: "Mode und Accessoires",
      pt: "moda e acessórios",
    },
    deliveryPrep: {
      es: "1-3 días hábiles de preparación",
      en: "1-3 business days preparation",
      fr: "1-3 jours ouvrables de préparation",
      it: "1-3 giorni lavorativi di preparazione",
      de: "1-3 Werktage Bearbeitung",
      pt: "1-3 dias úteis de preparação",
    },
    deliveryTransit: {
      es: "más 3-7 días hábiles de envío para España y Europa (puede variar según destino)",
      en: "plus 3-7 business days shipping for Spain and Europe (may vary by destination)",
      fr: "plus 3-7 jours ouvrables de livraison pour l'Espagne et l'Europe (variable selon destination)",
      it: "più 3-7 giorni lavorativi per Spagna ed Europa (variabile per destinazione)",
      de: "plus 3-7 Werktage Versand für Spanien und Europa (kann je nach Ziel variieren)",
      pt: "mais 3-7 dias úteis de envio para Espanha e Europa (pode variar por destino)",
    },
    returnDefective: {
      es: "Si el producto llega defectuoso, dañado o no es el que pediste, contáctanos en los 15 días siguientes a la recepción. Revisamos cada caso individualmente y buscamos la mejor solución (reembolso o reenvío).",
      en: "If the product arrives defective, damaged, or incorrect, contact us within 15 days of receipt. We review each case individually and find the best solution (refund or replacement).",
      fr: "Si le produit est défectueux, endommagé ou incorrect, contactez-nous dans les 15 jours suivant la réception. Nous étudions chaque cas individuellement.",
      it: "Se il prodotto è difettoso, danneggiato o errato, contattaci entro 15 giorni dal ricevimento. Valutiamo ogni caso individualmente.",
      de: "Falls das Produkt defekt, beschädigt oder falsch ist, kontaktieren Sie uns innerhalb von 15 Tagen nach Erhalt. Wir prüfen jeden Fall einzeln und suchen die beste Lösung (Erstattung oder Ersatz).",
      pt: "Se o produto chegar defeituoso, danificado ou incorreto, contacte-nos nos 15 dias seguintes à receção. Analisamos cada caso individualmente e procuramos a melhor solução (reembolso ou reenvio).",
    },
    returnChangeOfMind: {
      es: "Para devoluciones por arrepentimiento: 14 días naturales desde la recepción, artículo sin usar y en embalaje original. Los gastos de devolución corren a cargo del cliente. Escríbenos primero a info@aizualabs.com.",
      en: "For change-of-mind returns: 14 calendar days from receipt, item unused in original packaging. Return shipping is at the customer's expense. Please email us first at info@aizualabs.com.",
      fr: "Pour les retours par repentir: 14 jours calendaires, article non utilisé dans son emballage. Frais de retour à la charge du client. Écrivez-nous d'abord à info@aizualabs.com.",
      it: "Per i resi per ripensamento: 14 giorni di calendario, prodotto inutilizzato nella confezione originale. Spese di reso a carico del cliente. Scrivi prima a info@aizualabs.com.",
      de: "Bei Widerruf: 14 Kalendertage ab Erhalt, Artikel unbenutzt in der Originalverpackung. Die Rücksendekosten trägt der Kunde. Schreiben Sie uns zuerst an info@aizualabs.com.",
      pt: "Para devoluções por arrependimento: 14 dias de calendário desde a receção, artigo por usar e na embalagem original. Os custos de devolução são do cliente. Escreva-nos primeiro para info@aizualabs.com.",
    },
    // Países donde AliExpress confirma envío
    countries: {
      es: [
        "España", "Francia", "Italia", "Alemania", "Portugal", "Bélgica",
        "Países Bajos", "Austria", "Polonia", "Suecia", "Dinamarca", "Finlandia",
        "Irlanda", "República Checa", "Hungría", "Rumanía", "Bulgaria", "Croacia",
        "Eslovaquia", "Eslovenia", "Estonia", "Letonia", "Lituania", "Luxemburgo",
        "Malta", "Chipre", "Grecia", "Reino Unido", "Suiza", "Noruega",
        "Estados Unidos", "Canadá", "México", "Argentina", "Chile", "Colombia",
        "Perú", "Brasil", "Australia", "Nueva Zelanda", "Japón", "Corea del Sur",
        "Singapur", "Emiratos Árabes Unidos", "Arabia Saudí", "Israel",
      ],
      en: [
        "Spain", "France", "Italy", "Germany", "Portugal", "Belgium",
        "Netherlands", "Austria", "Poland", "Sweden", "Denmark", "Finland",
        "Ireland", "Czech Republic", "Hungary", "Romania", "Bulgaria", "Croatia",
        "Slovakia", "Slovenia", "Estonia", "Latvia", "Lithuania", "Luxembourg",
        "Malta", "Cyprus", "Greece", "United Kingdom", "Switzerland", "Norway",
        "United States", "Canada", "Mexico", "Argentina", "Chile", "Colombia",
        "Peru", "Brazil", "Australia", "New Zealand", "Japan", "South Korea",
        "Singapore", "United Arab Emirates", "Saudi Arabia", "Israel",
      ],
      fr: [
        "Espagne", "France", "Italie", "Allemagne", "Portugal", "Belgique",
        "Pays-Bas", "Autriche", "Pologne", "Suède", "Danemark", "Finlande",
        "Irlande", "République tchèque", "Hongrie", "Roumanie", "Bulgarie",
        "Croatie", "Slovaquie", "Slovénie", "Estonie", "Lettonie", "Lituanie",
        "Luxembourg", "Malte", "Chypre", "Grèce", "Royaume-Uni", "Suisse",
        "Norvège", "États-Unis", "Canada", "Mexique", "Argentine", "Chili",
        "Colombie", "Pérou", "Brésil", "Australie", "Nouvelle-Zélande",
        "Japon", "Corée du Sud", "Singapour",
      ],
      it: [
        "Spagna", "Francia", "Italia", "Germania", "Portogallo", "Belgio",
        "Paesi Bassi", "Austria", "Polonia", "Svezia", "Danimarca", "Finlandia",
        "Irlanda", "Repubblica Ceca", "Ungheria", "Romania", "Bulgaria",
        "Croazia", "Slovacchia", "Slovenia", "Estonia", "Lettonia", "Lituania",
        "Lussemburgo", "Malta", "Cipro", "Grecia", "Regno Unito", "Svizzera",
        "Norvegia", "Stati Uniti", "Canada", "Messico", "Argentina", "Cile",
        "Colombia", "Perù", "Brasile", "Australia", "Nuova Zelanda",
        "Giappone", "Corea del Sud", "Singapore", "Emirati Arabi Uniti",
        "Arabia Saudita", "Israele",
      ],
      de: [
        "Spanien", "Frankreich", "Italien", "Deutschland", "Portugal", "Belgien",
        "Niederlande", "Österreich", "Polen", "Schweden", "Dänemark", "Finnland",
        "Irland", "Tschechien", "Ungarn", "Rumänien", "Bulgarien", "Kroatien",
        "Slowakei", "Slowenien", "Estland", "Lettland", "Litauen", "Luxemburg",
        "Malta", "Zypern", "Griechenland", "Vereinigtes Königreich", "Schweiz",
        "Norwegen", "Vereinigte Staaten", "Kanada", "Mexiko", "Argentinien",
        "Chile", "Kolumbien", "Peru", "Brasilien", "Australien", "Neuseeland",
        "Japan", "Südkorea", "Singapur", "Vereinigte Arabische Emirate",
        "Saudi-Arabien", "Israel",
      ],
      pt: [
        "Espanha", "França", "Itália", "Alemanha", "Portugal", "Bélgica",
        "Países Baixos", "Áustria", "Polónia", "Suécia", "Dinamarca", "Finlândia",
        "Irlanda", "República Checa", "Hungria", "Roménia", "Bulgária", "Croácia",
        "Eslováquia", "Eslovénia", "Estónia", "Letónia", "Lituânia", "Luxemburgo",
        "Malta", "Chipre", "Grécia", "Reino Unido", "Suíça", "Noruega",
        "Estados Unidos", "Canadá", "México", "Argentina", "Chile", "Colômbia",
        "Peru", "Brasil", "Austrália", "Nova Zelândia", "Japão", "Coreia do Sul",
        "Singapura", "Emirados Árabes Unidos", "Arábia Saudita", "Israel",
      ],
    },
  },

  ringana: {
    label: {
      es: "cosmética natural Ringana",
      en: "Ringana natural cosmetics",
      fr: "cosmétiques naturels Ringana",
      it: "cosmetici naturali Ringana",
      de: "Ringana Naturkosmetik",
      pt: "cosmética natural Ringana",
    },
    // Ringana envía desde Austria — solo UE + países cercanos
    deliveryPrep: {
      es: "1-2 días hábiles de preparación",
      en: "1-2 business days preparation",
      fr: "1-2 jours ouvrables de préparation",
      it: "1-2 giorni lavorativi di preparazione",
      de: "1-2 Werktage Bearbeitung",
      pt: "1-2 dias úteis de preparação",
    },
    deliveryTransit: {
      es: "más 3-5 días hábiles de envío para España y Europa",
      en: "plus 3-5 business days for Spain and Europe",
      fr: "plus 3-5 jours ouvrables pour l'Espagne et l'Europe",
      it: "più 3-5 giorni lavorativi per Spagna ed Europa",
      de: "plus 3-5 Werktage für Spanien und Europa",
      pt: "mais 3-5 dias úteis para Espanha e Europa",
    },
    // Los productos Ringana redirigen a la tienda del partner — no pasan por nuestro checkout
    externalCheckout: true,
    externalNote: {
      es: "Los productos Ringana se adquieren a través de nuestra tienda partner oficial. Al hacer clic en el producto serás redirigido al proceso de compra de Ringana.",
      en: "Ringana products are purchased through our official partner store. Clicking the product redirects you to Ringana's purchase process.",
      fr: "Les produits Ringana s'achètent via notre boutique partenaire officielle. Cliquer sur le produit vous redirige vers le processus d'achat de Ringana.",
      it: "I prodotti Ringana si acquistano tramite il nostro negozio partner ufficiale. Cliccando sul prodotto verrai reindirizzato al processo d'acquisto Ringana.",
      de: "Ringana-Produkte werden über unseren offiziellen Partnershop gekauft. Ein Klick auf das Produkt leitet Sie zum Kaufvorgang von Ringana weiter.",
      pt: "Os produtos Ringana são adquiridos através da nossa loja parceira oficial. Ao clicar no produto será redirecionado para o processo de compra da Ringana.",
    },
    returnNote: {
      es: "Para devoluciones de productos Ringana, el proceso se gestiona directamente con Ringana según sus condiciones de venta. Contáctanos en info@aizualabs.com y te orientamos.",
      en: "Ringana product returns are managed directly with Ringana under their terms of sale. Contact us at info@aizualabs.com and we will guide you.",
      fr: "Les retours de produits Ringana sont gérés directement avec Ringana selon leurs conditions de vente. Contactez-nous à info@aizualabs.com.",
      it: "I resi dei prodotti Ringana vengono gestiti direttamente con Ringana secondo le loro condizioni di vendita. Contattaci a info@aizualabs.com.",
      de: "Rücksendungen von Ringana-Produkten werden direkt mit Ringana nach deren Verkaufsbedingungen abgewickelt. Schreiben Sie uns an info@aizualabs.com und wir helfen Ihnen weiter.",
      pt: "As devoluções de produtos Ringana são tratadas diretamente com a Ringana segundo as suas condições de venda. Contacte-nos em info@aizualabs.com e orientamos.",
    },
    countries: {
      es: [
        "España", "Francia", "Italia", "Alemania", "Austria", "Portugal",
        "Bélgica", "Países Bajos", "Suiza", "Polonia", "Suecia", "Dinamarca",
        "Finlandia", "Irlanda", "República Checa", "Hungría", "Rumanía",
        "Bulgaria", "Eslovaquia", "Eslovenia", "Luxemburgo", "Grecia",
        "Reino Unido", "Noruega",
      ],
      en: [
        "Spain", "France", "Italy", "Germany", "Austria", "Portugal",
        "Belgium", "Netherlands", "Switzerland", "Poland", "Sweden", "Denmark",
        "Finland", "Ireland", "Czech Republic", "Hungary", "Romania",
        "Bulgaria", "Slovakia", "Slovenia", "Luxembourg", "Greece",
        "United Kingdom", "Norway",
      ],
      fr: [
        "Espagne", "France", "Italie", "Allemagne", "Autriche", "Portugal",
        "Belgique", "Pays-Bas", "Suisse", "Pologne", "Suède", "Danemark",
        "Finlande", "Irlande", "République tchèque", "Hongrie", "Roumanie",
        "Bulgarie", "Slovaquie", "Slovénie", "Luxembourg", "Grèce",
        "Royaume-Uni", "Norvège",
      ],
      it: [
        "Spagna", "Francia", "Italia", "Germania", "Austria", "Portogallo",
        "Belgio", "Paesi Bassi", "Svizzera", "Polonia", "Svezia", "Danimarca",
        "Finlandia", "Irlanda", "Repubblica Ceca", "Ungheria", "Romania",
        "Bulgaria", "Slovacchia", "Slovenia", "Lussemburgo", "Grecia",
        "Regno Unito", "Norvegia",
      ],
      de: [
        "Spanien", "Frankreich", "Italien", "Deutschland", "Österreich", "Portugal",
        "Belgien", "Niederlande", "Schweiz", "Polen", "Schweden", "Dänemark",
        "Finnland", "Irland", "Tschechien", "Ungarn", "Rumänien",
        "Bulgarien", "Slowakei", "Slowenien", "Luxemburg", "Griechenland",
        "Vereinigtes Königreich", "Norwegen",
      ],
      pt: [
        "Espanha", "França", "Itália", "Alemanha", "Áustria", "Portugal",
        "Bélgica", "Países Baixos", "Suíça", "Polónia", "Suécia", "Dinamarca",
        "Finlândia", "Irlanda", "República Checa", "Hungria", "Roménia",
        "Bulgária", "Eslováquia", "Eslovénia", "Luxemburgo", "Grécia",
        "Reino Unido", "Noruega",
      ],
    },
  },

  // Plantilla CJ Dropshipping — activar cuando se añadan productos CJ
  // cj: { label: {...}, deliveryPrep: {...}, deliveryTransit: {...}, ... }

} as const;

// Proveedores actualmente activos (los que el bot conoce).
// s229: la marca externa de cosmética salió de esta lista — reactivarla = volver a añadirla.
const ACTIVE_PROVIDERS: Array<keyof typeof PROVIDERS> = ["aliexpress"];

// ── Construcción del contexto de envíos para el prompt ────
function getShippingContext(locale: SupportedLocale): string {
  const l = locale;
  const blocks: string[] = [];

  for (const key of ACTIVE_PROVIDERS) {
    const p = PROVIDERS[key];
    const label = p.label[l] ?? p.label.en;
    const prep    = p.deliveryPrep[l]    ?? p.deliveryPrep.en;
    const transit = p.deliveryTransit[l] ?? p.deliveryTransit.en;
    const countries = p.countries[l] ?? p.countries.en;

    if (key === "ringana") {
      // Referencia directa al provider concreto para que TS estreche el tipo
      // (narrowing por `key` no estrecha `p`, que es la unión de providers).
      const pRin = PROVIDERS.ringana;
      const extNote  = pRin.externalNote[l]  ?? pRin.externalNote.en;
      const retNote  = pRin.returnNote[l]    ?? pRin.returnNote.en;
      blocks.push(
        `── ${label.toUpperCase()} ──\n` +
        `Envío: ${prep} + ${transit}\n` +
        `Países disponibles: ${(countries as readonly string[]).join(", ")}\n` +
        `Compra: ${extNote}\n` +
        `Devoluciones: ${retNote}`
      );
    } else {
      // aliexpress (y futuros providers con checkout propio)
      const pAli = PROVIDERS.aliexpress;
      const retDef  = pAli.returnDefective[l]    ?? pAli.returnDefective.en;
      const retCom  = pAli.returnChangeOfMind[l] ?? pAli.returnChangeOfMind.en;
      blocks.push(
        `── ${label.toUpperCase()} ──\n` +
        `Envío: ${prep} + ${transit}\n` +
        `Países disponibles: ${(countries as readonly string[]).join(", ")}\n` +
        `Devolución defecto/error: ${retDef}\n` +
        `Devolución arrepentimiento: ${retCom}`
      );
    }
  }

  return `ENVÍOS Y DEVOLUCIONES POR TIPO DE PRODUCTO:\n\n${blocks.join("\n\n")}`;
}

// ── System prompt ─────────────────────────────────────────
function buildSystemPrompt(locale: string, kbContext: string): string {
  const safeLocale: SupportedLocale =
    SUPPORTED.includes(locale as SupportedLocale) ? (locale as SupportedLocale) : "es";

  const lang = { es: "español", en: "inglés", fr: "francés",
                 it: "italiano", de: "alemán", pt: "portugués" }[safeLocale];

  const shippingContext = getShippingContext(safeLocale);

  return `Eres el agente de atención al cliente de Aizüa Beauty, tienda de cosmética natural y moda femenina. Responde SIEMPRE en ${lang}.

INFORMACIÓN DE LA TIENDA:
- Nombre: Aizüa Beauty (Aizüa Labs)
- Email contacto: info@aizualabs.com
- Métodos de pago: tarjeta de crédito/débito vía Stripe. Todos los productos del catálogo se compran y se pagan en nuestra propia web.
- Empresa: Aizüa Labs — España

${shippingContext}

CONOCIMIENTO BASE RELEVANTE (consulta esto primero):
${kbContext || "No se encontró información específica en la base de conocimiento para esta consulta."}

INSTRUCCIONES:
0. CRÍTICO: Responde ÚNICAMENTE con el mensaje final dirigido al cliente. NUNCA escribas tu razonamiento, análisis ni pasos intermedios. NUNCA menciones "el usuario", "las instrucciones", "el system prompt" ni hagas meta-comentarios. Nada de "Voy a...", "Revisando...", "El usuario pregunta...". Solo la respuesta directa, como si hablaras con la clienta.
1. Responde de forma cálida, cercana y concisa (máx. 3 párrafos). Usa el tuteo en español.
2. Si tienes la respuesta en la base de conocimiento, úsala directamente.
3. Todo el catálogo es de la línea propia con checkout en nuestra web: aplica siempre el mismo contexto de envío y devolución. No existen productos que se compren en tiendas de terceros.
4. Para envíos: usa SIEMPRE el formato en dos partes (preparación + tránsito). Nunca combines en un único número ni uses "garantizado".
5. SOLO confirma envío a países de la lista correspondiente. Para otros países di: "Para confirmar si enviamos a [país], escríbenos a info@aizualabs.com."
6. Para devoluciones: aplica la política correcta según el tipo de producto y si es defecto o arrepentimiento. NUNCA prometas reembolso automático.
7. Para stock o disponibilidad: no tienes datos en tiempo real. Di: "Te recomendamos verificar la disponibilidad en la ficha del producto."
8. Para ingredientes o composición: remite a la ficha del producto. No los inventes.
9. Para precios: nunca ofrezcas descuentos ni modifiques precios. Remite a la tienda.
10. Para aduanas o aranceles: "Dependen de la legislación de tu país. Consulta con tu aduana local."
11. Para pedidos en curso: pide que contacten a info@aizualabs.com con el número de pedido.
12. NUNCA menciones proveedores ni marcas de terceros por nombre, ni el origen de fabricación, ni términos como "dropshipping" o "partner". Si la clienta pregunta por una marca concreta que no está en el catálogo, di simplemente que no la tenemos disponible.
13. Al final añade: [confianza:X] donde X es 0-1 (0 = no sé / 1 = seguro)

PROHIBICIONES ABSOLUTAS — NUNCA digas esto:
- "enviamos a todo el mundo" / "envío mundial"
- "te llega en X días" / "entrega garantizada"
- "tenemos stock" / "está disponible" (sin verificación real)
- cualquier afirmación médica, terapéutica o de curación: "cura", "trata", "elimina enfermedades", "efecto clínico", "medicinal" — esto es ilegal en cosmética
- "100% seguro para pieles sensibles/alérgicas" (sin indicarlo la ficha oficial)
- descuentos, cupones o precios especiales no incluidos en el contexto
- composición o ingredientes que no vengan de la base de conocimiento
- afirmar que un producto es "natural", "vegano", "cruelty-free", "sin parabenos" o
  "certificado" si eso no consta en la base de conocimiento o en la ficha del producto

FRASES SEGURAS:
- "No dispongo de ese detalle. Escríbenos a info@aizualabs.com y te respondemos en menos de 24h."
- "Para ese caso concreto, lo mejor es que nos contactes directamente."
- "Te recomiendo revisar la ficha del producto para los detalles completos."

TONO: Cálido, femenino, consciente. Como una amiga que sabe de cosmética natural. Evita tecnicismos innecesarios.

CAPTURA DE CONTACTO (s244): si la clienta te da su email o su nombre para que la
contactemos —o pide presupuesto, pedido especial, compra al por mayor o cualquier
cosa que necesite seguimiento humano— añade AL FINAL de tu respuesta, en una
línea aparte, exactamente esto:
[LEAD: nombre="..." email="..." asunto="..." urgencia="alta|media|baja"]
Rellena solo los campos que te haya dado; omite los que no sepas.
NUNCA te inventes un email ni un nombre. NUNCA menciones esta etiqueta ni la
expliques: la clienta no debe verla (se elimina antes de mostrarle la respuesta).
Si no hay datos de contacto reales, NO escribas la etiqueta.

AVISO AL TOMAR EL CORREO (s265, OBLIGATORIO): cuando la clienta te da su
email, dile con tus palabras y en una frase corta que lo usaremos para
responderle y que ademas le llegara alguna novedad de la tienda de vez en
cuando, y que puede darse de baja en un clic desde cualquiera de esos
correos. No lo digas si no te ha dado el email. No lo repitas si ya se lo
has dicho en esta conversacion.

${GUARDRAILS_PROMPT}`;
}

// ── Búsqueda en knowledge_base ────────────────────────────
async function searchKnowledgeBase(query: string, lang: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .rpc("search_knowledge_base", {
        query_text: query.slice(0, 100),
        lang,
        max_rows: 3,
      });

    if (error || !data?.length) return "";

    return data
      .map((row: { question: string; answer: string; category: string }) =>
        `[${row.category}] P: ${row.question}\nR: ${row.answer}`
      )
      .join("\n\n");
  } catch {
    return "";
  }
}

// ── Escalar a Telegram ─────────────────────────────────────
/**
 * s265: capta de verdad al lead del chat. Antes SOLO se avisaba por Telegram: no
 * entraba ni en crm_conversations ni en Brevo, mientras los leads del formulario
 * si entran en las dos. Media puerta de entrada.
 *
 * Fail-soft en los dos pasos: un fallo del CRM o de Brevo no puede tumbar la
 * respuesta al cliente, que es lo unico que el esta esperando.
 */
async function capturarLeadDelChat(opts: {
  email: string;
  nombre?: string;
  telefono?: string;
  asunto?: string;
  urgencia?: string;
  locale: string;
  mensaje: string;
}): Promise<void> {
  const email = (opts.email || "").trim().toLowerCase();
  if (!email.includes("@") || !email.includes(".")) return;

  // ── CRM ──────────────────────────────────────────────────────────────
  // Se COMPRUEBA antes en vez de hacer upsert: un upsert por customer_email
  // exigiria una restriccion unica en esa columna que no esta verificada, y
  // apoyarse en una que no existe seria peor que consultar.
  try {
    const { data: yaEsta } = await supabase
      .from("crm_conversations")
      .select("id")
      .eq("customer_email", email)
      .limit(1);
    if (!yaEsta?.length) {
      await supabase.from("crm_conversations").insert({
        customer_email:  email,
        email,
        name:            opts.nombre || "",
        phone:           opts.telefono || "",
        message:         opts.mensaje.slice(0, 2000),
        // "chat_<marca>" y NO "consulting": el bucle de follow-ups del pipeline
        // filtra por source="consulting", asi que un lead de tienda no recibira
        // esos correos. Son embudos distintos — quien pregunta por un producto no
        // es un lead de consultoria, y mandarle servicios de IA seria usar su dato
        // para otra cosa. Lo que si gana: sale en el CRM, cuenta en las metricas y
        // entra en la retencion de AG-68.
        source:          "chat_beauty",
        status:          "new",
        stage:           "new",
        replied:         false,
        priority:        opts.urgencia === "alta" ? "alta" : "normal",
        service:         opts.asunto || "",
        lang:            opts.locale === "es" ? "es" : "en",
        ticket_count:    1,
        follow_up_count: 0,
      });
    }
  } catch (e) {
    console.error("[chat] no se pudo guardar el lead en el CRM:", e);
  }

  // ── Brevo ────────────────────────────────────────────────────────────
  // Lista de ESTA tienda: #11 ES / #12 EN de AizuaBeauty.
  //
  // s265: aqui ponia "#5 ES / #6 EN" y era cierto - getListIdForLocale leia las
  // variables NEWSLETTER, que en el entorno de beauty valen 5 y 6, o sea las listas de
  // AizuaTec. Quien dejaba su correo en una tienda de BELLEZA acababa en la de GADGETS.
  // Arreglado en lib/brevo/client.ts, que ya solo puede devolver 11/12.
  //
  // SIN el atributo AVISO_ENVIADO a proposito: en Brevo es de tipo DATE y guarda
  // el dia en que salio el aviso legal, asi que dejarlo vacio es lo que marca al
  // contacto como PENDIENTE de aviso.
  try {
    const partes = (opts.nombre || "").trim().split(" ");
    await upsertContact({
      email,
      attributes: {
        FIRSTNAME:  partes[0] || "",
        LASTNAME:   partes.slice(1).join(" "),
        ORIGEN:     "chat tienda AizuaBeauty",
        FECHA_ALTA: new Date().toISOString().slice(0, 10),
        CATEGORIA:  (opts.asunto || "consulta en el chat").slice(0, 60),
      },
      listIds: [getListIdForLocale(opts.locale, "newsletter")],
    });
  } catch (e) {
    // En beauty la clave de Brevo devuelve 401 desde hace dias (item -20.1), asi
    // que aqui fallara hasta que se reponga. El lead ya esta en el CRM.
    console.error("[chat] no se pudo dar de alta en Brevo:", e);
  }
}

async function escalateToTelegram(
  message: string,
  history: Message[],
  response: string,
  confidence: number,
  metadata?: ChatRequest["metadata"]
) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const summary = history.slice(-4)
    .map((m) => `${m.role === "user" ? "👤" : "🤖"} ${m.content.slice(0, 80)}`)
    .join("\n");

  const text = [
    `⚠️ *Beauty Chat — Escalado*`,
    `Confianza: ${Math.round(confidence * 100)}% (umbral: ${Math.round(CONFIDENCE_THRESHOLD * 100)}%)`,
    ``,
    `*Último mensaje:*`,
    `> ${message.slice(0, 200)}`,
    ``,
    `*Respuesta del agente:*`,
    `> ${response.slice(0, 200)}`,
    ``,
    `*Contexto previo:*`,
    summary,
    metadata?.page ? `\nPágina: ${metadata.page}` : "",
  ].join("\n");

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
    });
  } catch { /* fire and forget */ }
}

// ── Extraer confianza ──────────────────────────────────────
function extractConfidence(text: string): { clean: string; confidence: number } {
  const match = text.match(/\[confianza:([\d.]+)\]/i);
  const confidence = match ? parseFloat(match[1]) : 0.9;
  const clean = text.replace(/\[confianza:[\d.]+\]/gi, "").trim();
  return { clean, confidence };
}

// ── Fallback estático — responde sin LLM usando PROVIDERS ──
// Se activa cuando el LLM no está disponible o filtró razonamiento.
// Para preguntas genéricas usa la config general (línea moda y accesorios).
function staticFallback(message: string, locale: string): string | null {
  const msg = message.toLowerCase();
  const l: SupportedLocale =
    SUPPORTED.includes(locale as SupportedLocale) ? (locale as SupportedLocale) : "es";
  const p = PROVIDERS.aliexpress;

  const shippingKW: Record<SupportedLocale, string[]> = {
    es: ["envío", "envio", "entrega", "plazo", "cuánto tarda", "cuanto tarda", "cuándo llega", "cuando llega", "tardan", "tiempo"],
    en: ["shipping", "delivery", "how long", "when will", "arrival", "dispatch"],
    fr: ["livraison", "expédition", "délai", "quand", "combien de temps"],
    it: ["spedizione", "consegna", "quanto ci vuole", "quando arriva", "tempi"],
    de: ["versand", "lieferung", "wie lange", "wann kommt", "zustellung", "lieferzeit"],
    pt: ["envio", "entrega", "quanto tempo", "quando chega", "prazo", "expedição"],
  };
  const returnKW: Record<SupportedLocale, string[]> = {
    es: ["devolu", "devolver", "reembolso", "cambio", "defecto", "roto", "no funciona", "arrepent"],
    en: ["return", "refund", "exchange", "broken", "defect", "not working", "change mind"],
    fr: ["retour", "remboursement", "échange", "défectueux", "cassé"],
    it: ["reso", "rimborso", "cambio", "difetto", "rotto", "non funziona"],
    de: ["rückgabe", "ruckgabe", "erstattung", "umtausch", "defekt", "kaputt", "funktioniert nicht", "widerruf"],
    pt: ["devolução", "devolucao", "devolver", "reembolso", "troca", "defeito", "avariado", "não funciona", "arrependimento"],
  };
  const countryKW: Record<SupportedLocale, string[]> = {
    es: ["países", "paises", "envían a", "enviáis a", "enviais", "hacéis los envíos", "haceis los envios"],
    en: ["ship to", "deliver to", "countries", "international"],
    fr: ["livrez", "pays", "international"],
    it: ["spedite", "paesi", "internazionale"],
    de: ["länder", "lander", "liefern sie nach", "versand nach", "international"],
    pt: ["países", "paises", "enviam para", "envio para", "internacional"],
  };
  const contactKW: Record<SupportedLocale, string[]> = {
    es: ["contacto", "contactar", "email", "correo", "teléfono", "telefono", "hablar con", "persona real", "humano"],
    en: ["contact", "email", "phone", "talk to", "human", "agent", "speak to"],
    fr: ["contact", "email", "téléphone", "parler à"],
    it: ["contatto", "email", "telefono", "parlare con"],
    de: ["kontakt", "email", "e-mail", "telefon", "sprechen mit", "mensch", "mitarbeiter"],
    pt: ["contacto", "contato", "email", "telefone", "falar com", "pessoa real", "humano"],
  };

  if (shippingKW[l].some((k) => msg.includes(k))) {
    const prep = p.deliveryPrep[l] ?? p.deliveryPrep.en;
    const transit = p.deliveryTransit[l] ?? p.deliveryTransit.en;
    const ans: Record<SupportedLocale, string> = {
      es: `Los pedidos tienen ${prep} y ${transit}.\n\nPara consultas concretas sobre tu pedido, escríbenos a info@aizualabs.com.`,
      en: `Orders require ${prep} and ${transit}.\n\nFor specific queries about your order, email info@aizualabs.com.`,
      fr: `Les commandes nécessitent ${prep} et ${transit}.\n\nPour toute question: info@aizualabs.com.`,
      it: `Gli ordini richiedono ${prep} e ${transit}.\n\nPer informazioni: info@aizualabs.com.`,
      de: `Bestellungen benötigen ${prep} und ${transit}.\n\nBei Fragen: info@aizualabs.com.`,
      pt: `As encomendas requerem ${prep} e ${transit}.\n\nPara questões: info@aizualabs.com.`,
    };
    return ans[l];
  }
  if (returnKW[l].some((k) => msg.includes(k))) {
    const def = p.returnDefective[l] ?? p.returnDefective.en;
    const com = p.returnChangeOfMind[l] ?? p.returnChangeOfMind.en;
    const ans: Record<SupportedLocale, string> = {
      es: `Para devoluciones tenemos dos casos:\n\n**Producto defectuoso o error:** ${def}\n\n**Arrepentimiento:** ${com}`,
      en: `For returns we have two cases:\n\n**Defective or wrong item:** ${def}\n\n**Change of mind:** ${com}`,
      fr: `Pour les retours, deux cas:\n\n**Produit défectueux:** ${def}\n\n**Repentir:** ${com}`,
      it: `Per i resi, due casi:\n\n**Prodotto difettoso:** ${def}\n\n**Ripensamento:** ${com}`,
      de: `Bei Rückgaben gibt es zwei Fälle:\n\n**Defektes Produkt:** ${def}\n\n**Widerruf:** ${com}`,
      pt: `Para devoluções há dois casos:\n\n**Produto defeituoso:** ${def}\n\n**Arrependimento:** ${com}`,
    };
    return ans[l];
  }
  if (countryKW[l].some((k) => msg.includes(k))) {
    const countries = (p.countries[l] ?? p.countries.en) as readonly string[];
    const short = countries.slice(0, 22).join(", ");
    const ans: Record<SupportedLocale, string> = {
      es: `Realizamos envíos a más de 40 países: ${short} y más. Si tu país no aparece, consúltanos en info@aizualabs.com y lo verificamos.`,
      en: `We ship to 40+ countries: ${short} and more. If your country is not listed, email info@aizualabs.com and we'll check.`,
      fr: `Nous livrons dans plus de 40 pays: ${short} et plus. Écrivez-nous à info@aizualabs.com.`,
      it: `Spediamo in oltre 40 paesi: ${short} e altri. Per verificare: info@aizualabs.com.`,
      de: `Wir versenden in über 40 Länder: ${short} und weitere. Zum Prüfen: info@aizualabs.com.`,
      pt: `Enviamos para mais de 40 países: ${short} e outros. Para verificar: info@aizualabs.com.`,
    };
    return ans[l];
  }
  if (contactKW[l].some((k) => msg.includes(k))) {
    const ans: Record<SupportedLocale, string> = {
      es: `Puedes escribirnos a info@aizualabs.com. Te respondemos en menos de 24 horas hábiles.`,
      en: `You can email us at info@aizualabs.com. We reply within 24 business hours.`,
      fr: `Contactez-nous à info@aizualabs.com. Réponse en moins de 24h ouvrées.`,
      it: `Scrivici a info@aizualabs.com. Rispondiamo entro 24 ore lavorative.`,
      de: `Schreiben Sie uns an info@aizualabs.com. Wir antworten innerhalb von 24 Werkstunden.`,
      pt: `Escreva-nos para info@aizualabs.com. Respondemos em menos de 24 horas úteis.`,
    };
    return ans[l];
  }
  return null;
}

// ── Guard anti reasoning-leak (red de seguridad cara al cliente) ──
const HARD_REASONING = [
  "el usuario", "revisando las instrucciones", "según las instrucciones",
  "el cliente pregunta", "el usuario pregunta", "el usuario quiere",
  "debo responder", "mi tarea es", "voy a responder", "déjame analizar",
  "the user", "my task is", "i need to respond", "according to the instructions",
  "system prompt", "let me analyze", "i should respond",
];
const FORBIDDEN_INTERNAL = [
  "aliexpress", "ali express", "dropshipping", "drop shipping", "cj dropshipping",
];
function looksLikeReasoning(text: string): boolean {
  const head = text.trim().slice(0, 220).toLowerCase();
  return HARD_REASONING.some((m) => head.includes(m));
}
function leaksInternalInfo(text: string): boolean {
  const t = text.toLowerCase();
  return FORBIDDEN_INTERNAL.some((w) => t.includes(w));
}
/**
 * ¿El modelo ha devuelto estructura de datos en vez de una frase? (s244)
 *
 * No lo cubría NADIE: el router sanea razonamiento y CJK, pero un JSON crudo le
 * parece texto válido — y con razón, porque muchos de sus consumidores le PIDEN
 * JSON a propósito. Por eso el guard va aquí, en la superficie que ve un
 * cliente. Una clienta que pregunta por un envío y recibe {"response": "..."}
 * ve un producto roto, aunque el contenido fuera correcto.
 *
 * Se mira el ARRANQUE, no el texto entero: una respuesta legítima puede
 * mencionar llaves ("el pack incluye {2 unidades}"), pero ninguna empieza con
 * { o [ seguido de comillas, ni viene envuelta en ```json.
 */
/**
 * ¿El cliente está pidiendo hablar con una persona? (s244)
 *
 * Portado del runtime de consulting, que ya lo tenía, PERO con los 4 idiomas
 * del store: allí la lista solo cubría es/en, y estas tiendas venden también en
 * francés e italiano — un "je veux parler à quelqu'un" no habría saltado.
 * Antes de esto, en las tiendas no pasaba NADA cuando alguien pedía un humano:
 * solo saltaba el aviso si el modelo respondía con poca confianza, por
 * casualidad.
 */
function detectHumanRequest(message: string): boolean {
  const lower = message.toLowerCase();
  const triggers = [
    // es
    "hablar con alguien", "hablar con una persona", "una persona real",
    "humano", "persona real", "no me sirves", "no me ayudas",
    "atención al cliente", "atencion al cliente", "quiero una persona",
    // en
    "talk to a human", "real person", "speak to someone", "human agent",
    "customer service", "speak to a person",
    // fr
    "parler à quelqu'un", "parler a quelqu'un", "une personne réelle",
    "un humain", "service client",
    // it
    "parlare con qualcuno", "una persona vera", "un umano",
    "servizio clienti",
  ];
  return triggers.some((t) => lower.includes(t));
}

/**
 * Extrae la etiqueta [LEAD: ...] que el agente añade cuando capta un contacto,
 * y la QUITA de lo que ve el cliente. Mismo formato que consulting, para que
 * los leads de las 4 webs se lean igual en Telegram.
 */
type LeadTienda = { nombre?: string; email?: string; asunto?: string; urgencia?: string };

/**
 * Contacto que el CLIENTE ha escrito, detectado de forma determinista (s244).
 *
 * POR QUÉ EXISTE, y por qué es la capa principal y no la de la etiqueta:
 * la etiqueta [LEAD: ...] la escribe el MODELO, así que hereda sus fallos —
 * puede olvidarse de ponerla (y el lead se pierde sin que nadie se entere),
 * puede inventarse un email, o escribirla mal y que la regex no case.
 * Esto no le pregunta al modelo: si el cliente ha tecleado un email o un
 * teléfono, es un HECHO que está en su mensaje. No se puede olvidar ni alucinar.
 * La etiqueta se mantiene, pero para lo que esto no puede saber: el asunto y la
 * urgencia, que sí son interpretación.
 */
function contactoEnMensaje(texto: string): { email?: string; telefono?: string } {
  const out: { email?: string; telefono?: string } = {};
  const email = texto.match(/[\w.+-]+@[\w-]+\.[\w.]{2,}/);
  if (email) out.email = email[0];
  // Teléfono: 9+ dígitos admitiendo espacios, puntos, guiones y prefijo.
  // Se exige un mínimo de 9 para no capturar códigos de pedido ni precios.
  const tel = texto.match(/(?:\+\d{1,3}[\s.-]?)?(?:\d[\s.-]?){9,14}\d/);
  if (tel) {
    const soloDigitos = tel[0].replace(/\D/g, "");
    if (soloDigitos.length >= 9 && soloDigitos.length <= 15) out.telefono = tel[0].trim();
  }
  return out;
}
function extractLead(reply: string): { cleanReply: string; lead: LeadTienda | null } {
  const match = reply.match(/\[LEAD:\s*([^\]]+)\]/i);
  if (!match) return { cleanReply: reply, lead: null };

  const body = match[1];
  const lead: LeadTienda = {};
  for (const f of ["nombre", "email", "asunto", "urgencia"] as const) {
    const m = body.match(new RegExp(`${f}\\s*=\\s*"([^"]*)"`, "i"));
    if (m && m[1]) lead[f] = m[1];
  }
  // La etiqueta se elimina SIEMPRE, aunque venga incompleta: el cliente no debe
  // verla en ningún caso.
  const cleanReply = reply.replace(/\[LEAD:[^\]]*\]/gi, "").trim();
  return { cleanReply, lead: lead.email || lead.nombre ? lead : null };
}

function looksLikeRawData(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (/^```\s*(json|javascript|ts|python)?/i.test(t)) return true;   // bloque de código
  if (/^[{[]\s*["'`]/.test(t)) return true;                          // {"clave": ... o ["...
  if (/^[{[][\s\S]{0,200}["'][a-z_]+["']\s*:/i.test(t)) return true; // objeto con clave:valor
  if (/^<\/?[a-z][\w-]*[\s>]/i.test(t)) return true;                 // XML/HTML crudo
  return false;
}
const SAFE_GENERIC: Record<string, string> = {
  es: "Disculpa, ahora mismo no puedo darte ese dato con seguridad. Escríbenos a info@aizualabs.com y te respondemos en menos de 24h.",
  en: "Sorry, I can't confirm that right now. Email us at info@aizualabs.com and we'll reply within 24h.",
  fr: "Désolé, je ne peux pas confirmer cela maintenant. Écrivez-nous à info@aizualabs.com.",
  it: "Spiacenti, non posso confermarlo ora. Scrivici a info@aizualabs.com.",
};

// ══════════════════════════════════════════════════════════
// HANDLER PRINCIPAL
// ══════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { message, history = [], locale = "es", metadata, conversationId } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    // Rate limit por sesión
    if (history.length >= MAX_MSGS_PER_SESSION) {
      const limitMsg: Record<string, string> = {
        es: "Has alcanzado el límite de mensajes de esta sesión. Para más ayuda escríbenos a info@aizualabs.com.",
        en: "You've reached the session message limit. For further help, email us at info@aizualabs.com.",
        fr: "Vous avez atteint la limite de messages. Pour plus d'aide: info@aizualabs.com.",
        it: "Hai raggiunto il limite messaggi. Per assistenza: info@aizualabs.com.",
      };
      return NextResponse.json({
        response: limitMsg[locale] ?? limitMsg.en,
        confidence: 1,
        escalated: false,
        kb_used: false,
      });
    }

    const safeMessage = message.trim().slice(0, MAX_INPUT_LENGTH);
    const safeHistory = history.slice(-MAX_HISTORY_TURNS);

    // 0b. Intento de extraer el prompt o saltarse las reglas (s244).
    // Se corta ANTES de llamar al LLM: es el único punto donde "el agente no
    // revela sus instrucciones" no depende de que el modelo colabore.
    if (esExtraccionDePrompt(safeMessage)) {
      const rechazo = RECHAZO_EXTRACCION[locale] ?? RECHAZO_EXTRACCION.es;
      escalateToTelegram(
        safeMessage, safeHistory,
        "[🛡️ INTENTO DE EXTRACCIÓN DE PROMPT — bloqueado sin llamar al LLM]",
        1, metadata,
      );
      const convId = await persistirConTimeout({
        conversationId, locale, userMessage: safeMessage, assistantMessage: rechazo,
        escalated: false, confidence: 1, metadata,
      });
      return NextResponse.json({
        response: rechazo, confidence: 1, escalated: false,
        kb_used: false, conversationId: convId,
      });
    }

    // 1. Knowledge base
    const kbContext = await searchKnowledgeBase(safeMessage, locale);

    // 2. Claude
    const systemPrompt = buildSystemPrompt(locale, kbContext);

    const messages: Array<{ role: "user" | "assistant"; content: string }> = [
      ...safeHistory.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: safeMessage },
    ];

    const claudeResponse = await llmRoute({
      system:      systemPrompt,
      messages,
      maxTokens:   768,
      preferCheap: true,
      tag:         "chat",
    });

    const rawText = claudeResponse.text ?? "";

    // 3. Extraer confianza
    const { clean: responseText, confidence } = extractConfidence(rawText);

    // 3b. Guard anti reasoning-leak / info interna ──
    // Si el LLM filtró su razonamiento o un término interno, NUNCA mostrarlo.
    // Caemos a la respuesta determinista (envíos/devoluciones/contacto) y, si no
    // hay coincidencia, a un mensaje seguro genérico. Siempre escalamos a Telegram.
    // Contacto que la clienta ha escrito, detectado sin depender del modelo.
    // Se calcula ANTES del guard de leak a propósito: si el modelo se va por la
    // borda, la respuesta se descarta, pero el email que acaba de dejar sigue
    // siendo válido y no se puede perder.
    const contacto = contactoEnMensaje(safeMessage);

    if (!responseText || looksLikeReasoning(responseText)
        || leaksInternalInfo(responseText) || looksLikeRawData(responseText)) {
      const staticReply = staticFallback(safeMessage, locale);
      const safe = staticReply ?? (SAFE_GENERIC[locale] ?? SAFE_GENERIC.es);
      const contactoLeak = contacto.email || contacto.telefono
        ? `\n🎯 CONTACTO DE LA CLIENTA: ${contacto.email ?? "—"} | ${contacto.telefono ?? "—"}`
        : "";
      escalateToTelegram(
        safeMessage, safeHistory,
        `[LEAK BLOQUEADO]${contactoLeak}\n${responseText.slice(0, 140)}`, 0, metadata,
      );
      const convId = await persistirConTimeout({
        conversationId, locale, userMessage: safeMessage, assistantMessage: safe,
        escalated: true, confidence: staticReply ? 0.8 : 0, metadata,
      });
      return NextResponse.json({
        response:   safe,
        confidence: staticReply ? 0.8 : 0,
        escalated:  true,
        kb_used:    kbContext.length > 0,
        conversationId: convId,
      });
    }

    // 4. Lead / petición de humano / confianza baja → Telegram
    // s244: antes SOLO se avisaba por confianza baja. Una clienta que dejaba su
    // email o pedía hablar con una persona no generaba ningún aviso, así que se
    // perdía. Ahora los tres casos escalan, con el motivo en el mensaje.
    const { cleanReply, lead } = extractLead(responseText);

    // Filtro de salida — última red por si el prompt no bastó. Va DESPUÉS de
    // extractLead: la etiqueta [LEAD: ...] es legítima y ya se ha quitado, así
    // que un marcador aquí significa que el modelo recita su configuración.
    const salida = filtraSalida(cleanReply);
    if (!salida.limpio) {
      const staticReply = staticFallback(safeMessage, locale);
      const safe = staticReply ?? (SAFE_GENERIC[locale] ?? SAFE_GENERIC.es);
      escalateToTelegram(
        safeMessage, safeHistory,
        `[🛡️ FUGA BLOQUEADA EN SALIDA · marcador: ${salida.motivo}]\n${cleanReply.slice(0, 200)}`,
        0, metadata,
      );
      const convId = await persistirConTimeout({
        conversationId, locale, userMessage: safeMessage, assistantMessage: safe,
        escalated: true, confidence: staticReply ? 0.8 : 0, metadata,
      });
      return NextResponse.json({
        response: safe, confidence: staticReply ? 0.8 : 0, escalated: true,
        kb_used: kbContext.length > 0, conversationId: convId,
      });
    }

    const pideHumano = detectHumanRequest(safeMessage);
    const bajaConfianza = confidence < CONFIDENCE_THRESHOLD;

    // El contacto detectado en el mensaje de la clienta MANDA sobre el de la
    // etiqueta: el primero es lo que escribió ella, el segundo lo que el modelo
    // dice que escribió.
    const leadFinal: LeadTienda | null =
      lead || contacto.email || contacto.telefono
        ? { ...(lead ?? {}), email: contacto.email ?? lead?.email }
        : null;
    const escalado = !!leadFinal || pideHumano || bajaConfianza;

    if (escalado) {
      const motivo = leadFinal ? "🎯 LEAD CAPTURADO"
                   : pideHumano ? "🙋 PIDE HABLAR CON UNA PERSONA"
                   : "⚠️ Confianza baja";
      const datosLead = leadFinal
        ? `\nnombre: ${leadFinal.nombre ?? "—"} | email: ${leadFinal.email ?? "—"}` +
          `\ntelefono: ${contacto.telefono ?? "—"}` +
          `\nasunto: ${leadFinal.asunto ?? "—"} | urgencia: ${leadFinal.urgencia ?? "—"}`
        : "";
      // s265: ademas de avisar, CAPTAR. Fire and forget igual que el aviso:
      // el cliente no tiene que esperar a que escribamos en el CRM.
      if (leadFinal?.email) {
        capturarLeadDelChat({
          email:    leadFinal.email,
          nombre:   leadFinal.nombre,
          telefono: contacto.telefono,
          asunto:   leadFinal.asunto,
          urgencia: leadFinal.urgencia,
          locale,
          mensaje:  safeMessage,
        }).catch(() => {});
      }
      escalateToTelegram(
        safeMessage, safeHistory,
        `[${motivo}]${datosLead}\n\n${cleanReply}`,
        confidence, metadata,
      );
    }

    const convId = await persistirConTimeout({
      conversationId, locale, userMessage: safeMessage, assistantMessage: cleanReply,
      escalated: escalado, confidence, metadata,
    });

    return NextResponse.json({
      // cleanReply, no responseText: la etiqueta [LEAD: ...] NUNCA se muestra
      response:  cleanReply,
      confidence,
      escalated: escalado,
      kb_used:   kbContext.length > 0,
      conversationId: convId,
    });

  } catch (err) {
    console.error("[beauty/api/chat]", err);
    const fallbacks: Record<string, string> = {
      es: "Lo siento, hay un problema técnico. Por favor escríbenos a info@aizualabs.com.",
      en: "Sorry, there is a technical issue. Please email us at info@aizualabs.com.",
      fr: "Désolé, problème technique. Écrivez-nous à info@aizualabs.com.",
      it: "Siamo spiacenti, problema tecnico. Scrivi a info@aizualabs.com.",
    };
    return NextResponse.json({
      response:  fallbacks[new URL(req.url).searchParams.get("locale") ?? "es"] ?? fallbacks.es,
      confidence: 0,
      escalated:  true,
      kb_used:    false,
    });
  }
}
