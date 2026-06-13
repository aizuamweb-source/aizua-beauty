// app/api/crm-agent/route.ts
// Aizua — Agente CRM con Claude API
// Recibe mensajes de clientes (vía n8n desde Gmail/Tidio/formulario)
// Responde automáticamente en el idioma del cliente en <5 minutos
// Si la confianza es baja o el tema es complejo, escala a humano vía Telegram

import { NextRequest, NextResponse } from "next/server";
import { llmRoute } from "@/lib/llm-router";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── CONTEXTO DEL AGENTE ──
// Todo lo que Claude necesita saber para atender como si fuera Aizua
const SYSTEM_PROMPT = `Eres el agente de atención al cliente de Aizua, una tienda online de gadgets y electrónica premium.

IDENTIDAD DE MARCA:
- Nombre: Aizua
- Tono: Amigable, directo, profesional. Nunca robótico.
- Email: info@aizualabs.com

POLÍTICAS CLAVE (responde SIEMPRE con esta información exacta):
- Envíos: 7-15 días hábiles para Europa, 10-25 días para resto del mundo
- Devoluciones: 14 días desde recepción. Producto en estado original. Gastos de envío a cargo del cliente.
- Garantía: 2 años por defectos de fabricación
- Reembolsos: Se procesan en 3-5 días hábiles tras recibir la devolución
- Número de seguimiento: Disponible por email 24-48h tras confirmar el pedido

REGLAS DE RESPUESTA:
1. Detecta el idioma del cliente y responde SIEMPRE en ese mismo idioma
2. Sé empático, nunca defensivo
3. Si el cliente está enfadado, empieza siempre disculpándote
4. Incluye siempre un siguiente paso claro
5. Firma siempre como "Equipo Aizua" (o el equivalente en el idioma)
6. Máximo 150 palabras por respuesta — breve y útil
7. No inventes información sobre pedidos específicos — usa los datos que se te proporcionan

ESCALAR A HUMANO si:
- El cliente amenaza con denuncia o acción legal
- El pedido supera los 30 días sin llegar
- El producto está roto y la garantía aplica
- El cliente pide hablar con una persona específicamente
- La situación requiere un reembolso inmediato >€50
- Tu confianza en la respuesta es menor del 70%

IDIOMAS SOPORTADOS: Español, English, Français, Deutsch, Português, Italiano`;

// ── TIPOS ──
type CRMRequest = {
  message:      string;
  customerName: string;
  customerEmail: string;
  orderId?:     string;
  orderStatus?: string;
  trackingNumber?: string;
  lang?:        string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
};

export async function POST(req: NextRequest) {
  // Verificar token de n8n
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.SYNC_SECRET_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: CRMRequest = await req.json();
    const { message, customerName, customerEmail, orderId, orderStatus, trackingNumber, conversationHistory = [] } = body;

    // Construir contexto del pedido si existe
    let orderContext = "";
    if (orderId) {
      // Obtener info del pedido de Supabase
      const { data: order } = await supabase
        .from("orders")
        .select("order_number, status, total, created_at, ali_order_id, tracking_number")
        .eq("id", orderId)
        .single();

      if (order) {
        orderContext = `
DATOS DEL PEDIDO DEL CLIENTE:
- Número: ${order.order_number}
- Estado: ${order.status}
- Total: €${order.total}
- Fecha: ${new Date(order.created_at).toLocaleDateString("es-ES")}
- Tracking: ${order.tracking_number || "Pendiente de asignar"}
`;
      }
    }

    // Construir mensajes para Claude
    const messages: Array<{ role: "user" | "assistant"; content: string }> = [
      // Historial de la conversación (para continuidad)
      ...conversationHistory.slice(-6), // Últimos 3 intercambios
      // Mensaje actual del cliente
      {
        role: "user",
        content: `Cliente: ${customerName} (${customerEmail})
${orderContext}
Mensaje del cliente: ${message}`,
      },
    ];

    // ── LLAMADA AL LLM ──
    const response = await llmRoute({
      system:    SYSTEM_PROMPT,
      messages,
      maxTokens: 500,
      tag:       "crm-agent",
    });

    // BORRADOR de respuesta IA — NUNCA se envía al cliente automáticamente.
    // Miguel lo revisa en Telegram y responde él mismo (gate de aprobación previa).
    const aiDraft = response.text ?? "";

    // ── DETECCIÓN DE PRIORIDAD (solo para marcar urgencia en Telegram) ──
    const escalationKeywords = [
      "escalar", "escalo", "escalate", "human", "persona real", "real person",
      "denuncia", "abogado", "legal", "tribunal", "refund immediately",
      "reembolso inmediato"
    ];
    const isPriority =
      escalationKeywords.some(kw => message.toLowerCase().includes(kw) || aiDraft.toLowerCase().includes(kw));

    // ── GUARDAR CONVERSACIÓN EN SUPABASE ──
    // status='pending_human' SIEMPRE — el agente NUNCA responde solo al cliente.
    await supabase.from("crm_conversations").upsert({
      customer_email:   customerEmail,
      customer_name:    customerName,
      last_message:     message,
      last_reply:       aiDraft,   // se guarda el borrador como referencia (no enviado)
      status:           isPriority ? "escalated" : "pending_human",
      order_id:         orderId || null,
      lang:             body.lang || detectLang(message),
      updated_at:       new Date().toISOString(),
    }, { onConflict: "customer_email" });

    // ── SIEMPRE a Telegram: Miguel revisa y responde él al cliente ──
    await notifyTelegram(
      `${isPriority ? "⚡ *PRIORITARIO — " : "📨 *"}MENSAJE DE CLIENTE (requiere tu respuesta)*\n\n` +
      `👤 ${customerName} (${customerEmail})\n` +
      `📦 Pedido: ${orderId || "N/A"}\n` +
      `💬 "${message.slice(0, 250)}"\n\n` +
      `🤖 Borrador IA (revísalo — NO se ha enviado):\n"${aiDraft.slice(0, 500)}"\n\n` +
      `✍️ Responde tú al cliente desde tu correo. El agente NO responde automáticamente.`
    );

    // n8n NO debe auto-enviar nada: 'reply' va vacío a propósito.
    return NextResponse.json({
      reply:            "",          // VACÍO — el cliente NO recibe respuesta automática
      ai_draft:         aiDraft,     // borrador para referencia (no enviar tal cual)
      auto_reply:       false,
      queued_for_human: true,
      escalated:        isPriority,
      lang:             detectLang(message),
      tokens:           0,
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error("[crm-agent] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ── HELPERS ──
function detectLang(text: string): string {
  const indicators: Record<string, string[]> = {
    es: ["hola", "gracias", "pedido", "envío", "cuándo", "devolución"],
    fr: ["bonjour", "merci", "commande", "livraison", "quand", "retour"],
    de: ["hallo", "danke", "bestellung", "lieferung", "wann", "rückgabe"],
    pt: ["olá", "obrigado", "pedido", "entrega", "quando", "devolução"],
    it: ["ciao", "grazie", "ordine", "spedizione", "quando", "reso"],
    en: ["hello", "thanks", "order", "shipping", "when", "return"],
  };
  const lower = text.toLowerCase();
  for (const [lang, words] of Object.entries(indicators)) {
    if (words.some(w => lower.includes(w))) return lang;
  }
  return "es";
}

async function notifyTelegram(text: string) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) return;
  await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id:    process.env.TELEGRAM_CHAT_ID,
        text,
        parse_mode: "Markdown",
      }),
    }
  ).catch(console.error);
}
