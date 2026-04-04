/**
 * POST /api/chat
 * Agente Soporte — Aizüa Labs (Módulo 7.3 / Fase 3)
 *
 * Flujo:
 *  1. Recibe mensaje del usuario + historial + locale
 *  2. Busca en knowledge_base (Supabase) — si hay coincidencia, responde directo
 *  3. Si no hay KB match → Claude API con contexto de la tienda
 *  4. Si confianza < 80% (flag del modelo) → guarda conversación y alerta Telegram
 *
 * Env vars:
 *   ANTHROPIC_API_KEY      — clave de Claude API
 *   NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
 *   TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID — para escalado
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

// ── Clientes ──────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!	
);

// ── Tipos ─────────────────────────────────────────────────
type Message = { role: "user" | "assistant"; content: string };

type ChatRequest = {
  message:  string;
  history:  Message[];       // últimos N turnos (máx. 10)
  locale:   string;          // 'es' | 'en' | 'fr' | 'it'
  metadata?: {
    page?:    string;        // URL actual del usuario
    orderId?: string;        // si el usuario ha indicado su pedido
  };
};

// ── Límites ───────────────────────────────────────────────
const MAX_HISTORY_TURNS   = 10;
const CONFIDENCE_THRESHOLD = 0.80;   // por debajo → escalar a Telegram
const MAX_INPUT_LENGTH    = 500;     // chars por mensaje

// ── System prompt base ────────────────────────────────────
function buildSystemPrompt(locale: string, kbContext: string): string {
  const lang = locale === "es" ? "español"
             : locale === "fr" ? "francés"
             : locale === "it" ? "italiano"
             : "inglés";

  return `Eres el agente de atención al cliente de Aizüa Store, una tienda online de gadgets tecnológicos premium con envío mundial. Responde SIEMPRE en ${lang}.

INFORMACIÓN DE LA TIENDA:
- Nombre: Aizüa Store (Aizüa Labs)
- Email contacto: aizualabs@outlook.com
- Email consulting: consulting@aizua.es
- Preparación del pedido: 1-3 días hábiles. Tiempo de envío: 3-7 días hábiles. El plazo total es la suma de ambos y puede variar según disponibilidad y destino.
- Política de devoluciones: 14 días naturales, gastos de devolución a cargo del cliente
- Métodos de pago: tarjeta de crédito/débito via Stripe (seguro, sin guardar datos)
- Empresa: Aizüa Labs — España

CONOCIMIENTO BASE RELEVANTE (consulta esto primero):
${kbContext || "No se encontró información específica en la base de conocimiento para esta consulta."}

INSTRUCCIONES:
1. Responde de forma clara, amable y concisa (máx. 3 párrafos)
2. Si tienes la respuesta en la base de conocimiento anterior, úsala directamente
3. Si no tienes información suficiente para responder con certeza, indícalo honestamente
4. NO inventes precios, plazos ni políticas que no estén en el contexto
5. NUNCA menciones aspectos de la operativa interna: modelos de negocio, proveedores, origen de productos ni términos como "dropshipping", "proveedor externo" o "intermediario"
6. Los plazos de entrega SOLO mencionarlos si el cliente pregunta expresamente. No proponerlos de forma espontánea
7. Para preguntas sobre pedidos específicos (número de pedido, estado), pide que contacten a aizualabs@outlook.com
8. Si detectas una oportunidad de venta de consultoría B2B, menciona consulting@aizua.es con naturalidad
9. Al final de tu respuesta, añade en una nueva línea: [confianza:X] donde X es un número entre 0 y 1 indicando tu nivel de confianza en la respuesta (0 = no sé / 1 = seguro)

TONO: Profesional pero cercano. Usa el tuteo en español. Evita respuestas genéricas.`;
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

// ── Guardar conversación y alertar Telegram ───────────────
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

  const summary = history.slice(-4).map((m) => `${m.role === "user" ? "👤" : "🤖"} ${m.content.slice(0, 80)}`).join("\n");

  const text = [
    `⚠️ *Agente Soporte — Escalado*`,
    `Confianza: ${Math.round(confidence * 100)}% (umbral: ${Math.round(CONFIDENCE_THRESHOLD * 100)}%)`,
    ``,
    `*Último mensaje del usuario:*`,
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
  } catch { /* no bloquear la respuesta al usuario */ }
}

// ── Extraer confianza del texto de respuesta ──────────────
function extractConfidence(text: string): { clean: string; confidence: number } {
  const match = text.match(/\[confianza:([\d.]+)\]/i);
  const confidence = match ? parseFloat(match[1]) : 0.9;
  const clean = text.replace(/\[confianza:[\d.]+\]/gi, "").trim();
  return { clean, confidence };
}

// ══════════════════════════════════════════════════════════
// HANDLER PRINCIPAL
// ══════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { message, history = [], locale = "es", metadata } = body;

    // ── Validaciones básicas ──────────────────────────────
    if (!message?.trim()) {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }
    const safeMessage = message.trim().slice(0, MAX_INPUT_LENGTH);
    const safeHistory = history.slice(-MAX_HISTORY_TURNS);

    // ── 1. Buscar en knowledge_base ───────────────────────
    const kbContext = await searchKnowledgeBase(safeMessage, locale);

    // ── 2. Llamar a Claude API ────────────────────────────
    const systemPrompt = buildSystemPrompt(locale, kbContext);

    const messages: Anthropic.MessageParam[] = [
      ...safeHistory.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: safeMessage },
    ];

    const claudeResponse = await anthropic.messages.create({
      model:      "claude-haiku-4-5",  // rápido y económico para soporte
      max_tokens: 512,
      system:     systemPrompt,
      messages,
    });

    const rawText =
      claudeResponse.content[0]?.type === "text"
        ? claudeResponse.content[0].text
        : "";

    // ── 3. Extraer confianza y limpiar respuesta ──────────
    const { clean: responseText, confidence } = extractConfidence(rawText);

    // ── 4. Escalar a Telegram si confianza baja ───────────
    if (confidence < CONFIDENCE_THRESHOLD) {
      // Fire and forget — no bloquea la respuesta
      escalateToTelegram(safeMessage, safeHistory, responseText, confidence, metadata);
    }

    return NextResponse.json({
      response:   responseText,
      confidence,
      escalated:  confidence < CONFIDENCE_THRESHOLD,
      kb_used:    kbContext.length > 0,
    });

  } catch (err) {
    console.error("[/api/chat]", err);
    // Respuesta de fallback sin revelar detalles del error
    const fallbacks: Record<string, string> = {
      es: "Lo siento, hay un problema técnico en este momento. Por favor escríbenos a aizualabs@outlook.com y te responderemos lo antes posible.",
      en: "Sorry, there is a technical issue right now. Please email us at aizualabs@outlook.com and we will reply as soon as possible.",
      fr: "Désolé, il y a un problème technique. Écrivez-nous à aizualabs@outlook.com.",
      it: "Siamo spiacenti, c'è un problema tecnico. Scrivi a aizualabs@outlook.com.",
    };
    return NextResponse.json({
      response:  fallbacks[new URL(req.url).searchParams.get("locale") ?? "es"] ?? fallbacks.es,
      confidence: 0,
      escalated:  true,
      kb_used:    false,
    });
  }
}
