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
 * Proveedores activos: AliExpress (gadgets/accesorios) · Ringana (cosmética natural)
 * CJ Dropshipping: plantilla disponible, activar cuando proceda.
 *
 * IMPORTANTE — prohibición médica:
 *   Ninguna respuesta puede hacer afirmaciones terapéuticas o medicinales sobre productos.
 */

import { NextRequest, NextResponse } from "next/server";
import { llmRoute } from "@/lib/llm-router";
import { createClient } from "@supabase/supabase-js";

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
  metadata?: {
    page?:    string;
    orderId?: string;
  };
};

type SupportedLocale = "es" | "en" | "fr" | "it";

// ── Límites ───────────────────────────────────────────────
const MAX_HISTORY_TURNS    = 10;
const CONFIDENCE_THRESHOLD = 0.80;
const MAX_INPUT_LENGTH     = 500;
const MAX_MSGS_PER_SESSION = 20;

// ── Config de envíos y devoluciones por proveedor ─────────
//
// Ringana: cosmética natural austriaca. Envía directamente desde Austria.
//          Los productos Ringana en la web redirigen a la tienda del partner
//          (botón externo) — no pasan por nuestro checkout.
//
// AliExpress: gadgets y accesorios. Plazo según almacén disponible.
//
// CJ Dropshipping: plantilla preparada, activar cambiando activeProviders.

const PROVIDERS = {

  aliexpress: {
    label: {
      es: "gadgets y accesorios",
      en: "gadgets and accessories",
      fr: "gadgets et accessoires",
      it: "gadget e accessori",
    },
    deliveryPrep: {
      es: "1-3 días hábiles de preparación",
      en: "1-3 business days preparation",
      fr: "1-3 jours ouvrables de préparation",
      it: "1-3 giorni lavorativi di preparazione",
    },
    deliveryTransit: {
      es: "más 3-7 días hábiles de envío para España y Europa (puede variar según destino)",
      en: "plus 3-7 business days shipping for Spain and Europe (may vary by destination)",
      fr: "plus 3-7 jours ouvrables de livraison pour l'Espagne et l'Europe (variable selon destination)",
      it: "più 3-7 giorni lavorativi per Spagna ed Europa (variabile per destinazione)",
    },
    returnDefective: {
      es: "Si el producto llega defectuoso, dañado o no es el que pediste, contáctanos en los 15 días siguientes a la recepción. Revisamos cada caso individualmente y buscamos la mejor solución (reembolso o reenvío).",
      en: "If the product arrives defective, damaged, or incorrect, contact us within 15 days of receipt. We review each case individually and find the best solution (refund or replacement).",
      fr: "Si le produit est défectueux, endommagé ou incorrect, contactez-nous dans les 15 jours suivant la réception. Nous étudions chaque cas individuellement.",
      it: "Se il prodotto è difettoso, danneggiato o errato, contattaci entro 15 giorni dal ricevimento. Valutiamo ogni caso individualmente.",
    },
    returnChangeOfMind: {
      es: "Para devoluciones por arrepentimiento: 14 días naturales desde la recepción, artículo sin usar y en embalaje original. Los gastos de devolución corren a cargo del cliente. Escríbenos primero a info@aizualabs.com.",
      en: "For change-of-mind returns: 14 calendar days from receipt, item unused in original packaging. Return shipping is at the customer's expense. Please email us first at info@aizualabs.com.",
      fr: "Pour les retours par repentir: 14 jours calendaires, article non utilisé dans son emballage. Frais de retour à la charge du client. Écrivez-nous d'abord à info@aizualabs.com.",
      it: "Per i resi per ripensamento: 14 giorni di calendario, prodotto inutilizzato nella confezione originale. Spese di reso a carico del cliente. Scrivi prima a info@aizualabs.com.",
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
        "Giappone", "Corea del Sud", "Singapore",
      ],
    },
  },

  ringana: {
    label: {
      es: "cosmética natural Ringana",
      en: "Ringana natural cosmetics",
      fr: "cosmétiques naturels Ringana",
      it: "cosmetici naturali Ringana",
    },
    // Ringana envía desde Austria — solo UE + países cercanos
    deliveryPrep: {
      es: "1-2 días hábiles de preparación",
      en: "1-2 business days preparation",
      fr: "1-2 jours ouvrables de préparation",
      it: "1-2 giorni lavorativi di preparazione",
    },
    deliveryTransit: {
      es: "más 3-5 días hábiles de envío para España y Europa",
      en: "plus 3-5 business days for Spain and Europe",
      fr: "plus 3-5 jours ouvrables pour l'Espagne et l'Europe",
      it: "più 3-5 giorni lavorativi per Spagna ed Europa",
    },
    // Los productos Ringana redirigen a la tienda del partner — no pasan por nuestro checkout
    externalCheckout: true,
    externalNote: {
      es: "Los productos Ringana se adquieren a través de nuestra tienda partner oficial. Al hacer clic en el producto serás redirigido al proceso de compra de Ringana.",
      en: "Ringana products are purchased through our official partner store. Clicking the product redirects you to Ringana's purchase process.",
      fr: "Les produits Ringana s'achètent via notre boutique partenaire officielle. Cliquer sur le produit vous redirige vers le processus d'achat de Ringana.",
      it: "I prodotti Ringana si acquistano tramite il nostro negozio partner ufficiale. Cliccando sul prodotto verrai reindirizzato al processo d'acquisto Ringana.",
    },
    returnNote: {
      es: "Para devoluciones de productos Ringana, el proceso se gestiona directamente con Ringana según sus condiciones de venta. Contáctanos en info@aizualabs.com y te orientamos.",
      en: "Ringana product returns are managed directly with Ringana under their terms of sale. Contact us at info@aizualabs.com and we will guide you.",
      fr: "Les retours de produits Ringana sont gérés directement avec Ringana selon leurs conditions de vente. Contactez-nous à info@aizualabs.com.",
      it: "I resi dei prodotti Ringana vengono gestiti direttamente con Ringana secondo le loro condizioni di vendita. Contattaci a info@aizualabs.com.",
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
    },
  },

  // Plantilla CJ Dropshipping — activar cuando se añadan productos CJ
  // cj: { label: {...}, deliveryPrep: {...}, deliveryTransit: {...}, ... }

} as const;

// Proveedores actualmente activos (los que el bot conoce)
const ACTIVE_PROVIDERS: Array<keyof typeof PROVIDERS> = ["aliexpress", "ringana"];

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
      const extNote  = p.externalNote[l]  ?? p.externalNote.en;
      const retNote  = p.returnNote[l]    ?? p.returnNote.en;
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
    locale === "fr" ? "fr" : locale === "it" ? "it" : locale === "en" ? "en" : "es";

  const lang = safeLocale === "es" ? "español"
             : safeLocale === "fr" ? "francés"
             : safeLocale === "it" ? "italiano"
             : "inglés";

  const shippingContext = getShippingContext(safeLocale);

  return `Eres el agente de atención al cliente de Aizüa Beauty, tienda de cosmética natural y moda femenina. Responde SIEMPRE en ${lang}.

INFORMACIÓN DE LA TIENDA:
- Nombre: Aizüa Beauty (Aizüa Labs)
- Email contacto: info@aizualabs.com
- Métodos de pago: tarjeta de crédito/débito vía Stripe (solo para productos propios). Productos Ringana se pagan en la tienda partner de Ringana.
- Empresa: Aizüa Labs — España

${shippingContext}

CONOCIMIENTO BASE RELEVANTE (consulta esto primero):
${kbContext || "No se encontró información específica en la base de conocimiento para esta consulta."}

INSTRUCCIONES:
0. CRÍTICO: Responde ÚNICAMENTE con el mensaje final dirigido al cliente. NUNCA escribas tu razonamiento, análisis ni pasos intermedios. NUNCA menciones "el usuario", "las instrucciones", "el system prompt" ni hagas meta-comentarios. Nada de "Voy a...", "Revisando...", "El usuario pregunta...". Solo la respuesta directa, como si hablaras con la clienta.
1. Responde de forma cálida, cercana y concisa (máx. 3 párrafos). Usa el tuteo en español.
2. Si tienes la respuesta en la base de conocimiento, úsala directamente.
3. Cuando el cliente pregunte por un producto, identifica si es Ringana o gadget/accesorio, y aplica el contexto correcto de envío y devolución.
4. Para envíos: usa SIEMPRE el formato en dos partes (preparación + tránsito). Nunca combines en un único número ni uses "garantizado".
5. SOLO confirma envío a países de la lista correspondiente. Para otros países di: "Para confirmar si enviamos a [país], escríbenos a info@aizualabs.com."
6. Para devoluciones: aplica la política correcta según el tipo de producto y si es defecto o arrepentimiento. NUNCA prometas reembolso automático.
7. Para stock o disponibilidad: no tienes datos en tiempo real. Di: "Te recomendamos verificar la disponibilidad en la ficha del producto."
8. Para ingredientes o composición: remite a la ficha del producto. No los inventes.
9. Para precios: nunca ofrezcas descuentos ni modifiques precios. Remite a la tienda.
10. Para aduanas o aranceles: "Dependen de la legislación de tu país. Consulta con tu aduana local."
11. Para pedidos en curso: pide que contacten a info@aizualabs.com con el número de pedido.
12. NUNCA menciones proveedores por nombre (AliExpress, CJ, Ringana en contexto de proveedor), origen de fabricación, ni términos como "dropshipping" o "partner".
13. Al final añade: [confianza:X] donde X es 0-1 (0 = no sé / 1 = seguro)

PROHIBICIONES ABSOLUTAS — NUNCA digas esto:
- "enviamos a todo el mundo" / "envío mundial"
- "te llega en X días" / "entrega garantizada"
- "tenemos stock" / "está disponible" (sin verificación real)
- cualquier afirmación médica, terapéutica o de curación: "cura", "trata", "elimina enfermedades", "efecto clínico", "medicinal" — esto es ilegal en cosmética
- "100% seguro para pieles sensibles/alérgicas" (sin indicarlo la ficha oficial)
- descuentos, cupones o precios especiales no incluidos en el contexto
- composición o ingredientes que no vengan de la base de conocimiento

FRASES SEGURAS:
- "No dispongo de ese detalle. Escríbenos a info@aizualabs.com y te respondemos en menos de 24h."
- "Para ese caso concreto, lo mejor es que nos contactes directamente."
- "Te recomiendo revisar la ficha del producto para los detalles completos."

TONO: Cálido, femenino, consciente. Como una amiga que sabe de cosmética natural. Evita tecnicismos innecesarios.`;
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
// Para preguntas genéricas usa la config general (aliexpress = gadgets/accesorios).
function staticFallback(message: string, locale: string): string | null {
  const msg = message.toLowerCase();
  const l: SupportedLocale =
    locale === "fr" ? "fr" : locale === "it" ? "it" : locale === "en" ? "en" : "es";
  const p = PROVIDERS.aliexpress;

  const shippingKW: Record<SupportedLocale, string[]> = {
    es: ["envío", "envio", "entrega", "plazo", "cuánto tarda", "cuanto tarda", "cuándo llega", "cuando llega", "tardan", "tiempo"],
    en: ["shipping", "delivery", "how long", "when will", "arrival", "dispatch"],
    fr: ["livraison", "expédition", "délai", "quand", "combien de temps"],
    it: ["spedizione", "consegna", "quanto ci vuole", "quando arriva", "tempi"],
  };
  const returnKW: Record<SupportedLocale, string[]> = {
    es: ["devolu", "devolver", "reembolso", "cambio", "defecto", "roto", "no funciona", "arrepent"],
    en: ["return", "refund", "exchange", "broken", "defect", "not working", "change mind"],
    fr: ["retour", "remboursement", "échange", "défectueux", "cassé"],
    it: ["reso", "rimborso", "cambio", "difetto", "rotto", "non funziona"],
  };
  const countryKW: Record<SupportedLocale, string[]> = {
    es: ["países", "paises", "envían a", "enviáis a", "enviais", "hacéis los envíos", "haceis los envios"],
    en: ["ship to", "deliver to", "countries", "international"],
    fr: ["livrez", "pays", "international"],
    it: ["spedite", "paesi", "internazionale"],
  };
  const contactKW: Record<SupportedLocale, string[]> = {
    es: ["contacto", "contactar", "email", "correo", "teléfono", "telefono", "hablar con", "persona real", "humano"],
    en: ["contact", "email", "phone", "talk to", "human", "agent", "speak to"],
    fr: ["contact", "email", "téléphone", "parler à"],
    it: ["contatto", "email", "telefono", "parlare con"],
  };

  if (shippingKW[l].some((k) => msg.includes(k))) {
    const prep = p.deliveryPrep[l] ?? p.deliveryPrep.en;
    const transit = p.deliveryTransit[l] ?? p.deliveryTransit.en;
    const ans: Record<SupportedLocale, string> = {
      es: `Los pedidos tienen ${prep} y ${transit}.\n\nPara consultas concretas sobre tu pedido, escríbenos a info@aizualabs.com.`,
      en: `Orders require ${prep} and ${transit}.\n\nFor specific queries about your order, email info@aizualabs.com.`,
      fr: `Les commandes nécessitent ${prep} et ${transit}.\n\nPour toute question: info@aizualabs.com.`,
      it: `Gli ordini richiedono ${prep} e ${transit}.\n\nPer informazioni: info@aizualabs.com.`,
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
    };
    return ans[l];
  }
  if (contactKW[l].some((k) => msg.includes(k))) {
    const ans: Record<SupportedLocale, string> = {
      es: `Puedes escribirnos a info@aizualabs.com. Te respondemos en menos de 24 horas hábiles.`,
      en: `You can email us at info@aizualabs.com. We reply within 24 business hours.`,
      fr: `Contactez-nous à info@aizualabs.com. Réponse en moins de 24h ouvrées.`,
      it: `Scrivici a info@aizualabs.com. Rispondiamo entro 24 ore lavorative.`,
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
    const { message, history = [], locale = "es", metadata } = body;

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
    if (!responseText || looksLikeReasoning(responseText) || leaksInternalInfo(responseText)) {
      const staticReply = staticFallback(safeMessage, locale);
      const safe = staticReply ?? (SAFE_GENERIC[locale] ?? SAFE_GENERIC.es);
      escalateToTelegram(
        safeMessage, safeHistory,
        `[LEAK BLOQUEADO] ${responseText.slice(0, 140)}`, 0, metadata,
      );
      return NextResponse.json({
        response:   safe,
        confidence: staticReply ? 0.8 : 0,
        escalated:  true,
        kb_used:    kbContext.length > 0,
      });
    }

    // 4. Escalar si confianza baja
    if (confidence < CONFIDENCE_THRESHOLD) {
      escalateToTelegram(safeMessage, safeHistory, responseText, confidence, metadata);
    }

    return NextResponse.json({
      response:  responseText,
      confidence,
      escalated: confidence < CONFIDENCE_THRESHOLD,
      kb_used:   kbContext.length > 0,
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
