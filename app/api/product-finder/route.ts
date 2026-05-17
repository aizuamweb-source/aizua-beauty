// app/api/product-finder/route.ts
// Aizua — Agente Buscador de Productos Ganadores (Fase 4)
// Criterios: margen >20%, has_invoice, shipping <15d, demanda alta
// Cron: viernes 08:00 UTC — envía top 3 a Telegram para revisión de Miguel

export const maxDuration = 60; // Vercel: necesario para Claude (>10s default)

import { NextRequest, NextResponse } from "next/server";
import { llmRoute } from "@/lib/llm-router";
import { createClient } from "@supabase/supabase-js";

const supabase  = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── UMBRALES DE SELECCIÓN ────────────────────────────────────
const CRITERIA = {
  MIN_MARGIN_PCT:    20,    // Margen bruto mínimo (%)
  MAX_SHIPPING_DAYS: 15,    // Máximo días de envío aceptable
  REQUIRE_INVOICE:   true,  // Preferir proveedores con factura
  MAX_COMPETITION:   "medium" as "low" | "medium" | "high",
  TOP_N_TELEGRAM:    3,     // Cuántos enviar a Telegram por sesión
  WEEKLY_BUDGET_EUR: 50,    // Presupuesto test sugerido por candidato
};

// ── TIPOS ────────────────────────────────────────────────────
type ProductCandidate = {
  name:                  string;
  aliexpress_url?:       string;
  aliexpress_id?:        string;
  tiktok_url?:           string;
  amazon_asin?:          string;
  estimated_cost:        number;
  estimated_pvp:         number;
  estimated_margin_pct:  number;
  shipping_days:         number;
  has_invoice:           boolean;
  has_invoice_note?:     string;
  tiktok_views?:         number;
  amazon_bsr?:           number;
  search_volume?:        number;
  competition:           "low" | "medium" | "high";
  score:                 number;
  score_breakdown:       Record<string, number>;
  summary:               string;
  risks:                 string;
  suggested_angle:       string;
  target_markets:        string[];
  source:                string;
};

// ── INVESTIGAR CON CLAUDE ────────────────────────────────────
async function researchWithClaude(context: {
  existingProducts: string[];
  recentCandidates: string[];
}): Promise<ProductCandidate[]> {
  const today = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });

  const response = await llmRoute({
    maxTokens: 4000,
    tag: "product-finder",
    system: `Eres el agente de sourcing de productos de AizuaBeauty, una tienda de cosmética natural y moda femenina (beauty.aizualabs.com) con mercados en ES/FR/IT/DE/PT/IE.
Tu misión: identificar productos beauty y complementos de bienestar ganadores para añadir al catálogo.

CRITERIOS OBLIGATORIOS:
- Margen bruto estimado > ${CRITERIA.MIN_MARGIN_PCT}%
- Envío estimado < ${CRITERIA.MAX_SHIPPING_DAYS} días (proveedor AliExpress a Europa)
- Preferencia por proveedores que emiten factura (requerimiento fiscal España)
- Competencia no mayor que "medium"
- PVP entre €10-€60 (sweet spot para cosmética e impulso en IG/TikTok)
- Nicho EXCLUSIVO: cosmética natural, skincare, herramientas belleza, accesorios moda, complementos bienestar

MERCADOS OBJETIVO: España (principal), Francia, Italia, Alemania, Portugal
CATEGORÍAS QUE FUNCIONAN EN AIZUABEAUTY: cremas faciales, herramientas masaje facial, pañuelos/fulares, complementos colágeno, herramientas peluquería, mascarillas naturales, accesorios pelo, aceites corporales, suplementos belleza

Responde SOLO en JSON válido. Sin markdown, sin comentarios.
Fecha de análisis: ${today}`,
    messages: [{
      role: "user" as const,
      content: `Identifica 5 productos ganadores potenciales para e-commerce en Europa ahora mismo.

Productos que YA tenemos (NO sugerir variantes idénticas):
${context.existingProducts.length > 0 ? context.existingProducts.join(", ") : "Catálogo vacío"}

Candidatos descartados recientemente (NO repetir):
${context.recentCandidates.length > 0 ? context.recentCandidates.join(", ") : "Ninguno"}

Para cada producto sugiere:
- Nombre comercial atractivo (en español)
- URL AliExpress o ID de producto representativo
- Coste estimado y PVP sugerido en euros
- Días de envío estimados desde AliExpress España/Europa
- Si el proveedor típico de este tipo de producto emite factura
- Señales de demanda (videos virales TikTok, tendencias Amazon)
- Competencia actual en España
- Puntuación 0-100 basada en: margen(30), demanda(25), competencia(20), logística(15), factura(10)
- Resumen de por qué es un buen candidato
- Riesgos principales
- Ángulo de marketing para TikTok/IG (hook de 3 segundos)

Formato de respuesta:
{
  "candidates": [
    {
      "name": "Nombre del producto",
      "aliexpress_url": "https://aliexpress.com/item/...",
      "aliexpress_id": "123456789",
      "tiktok_url": "https://tiktok.com/...",
      "estimated_cost": 8.50,
      "estimated_pvp": 34.99,
      "estimated_margin_pct": 56.7,
      "shipping_days": 10,
      "has_invoice": true,
      "has_invoice_note": "Mayoristas de esta categoría suelen emitir factura UE",
      "tiktok_views": 2500000,
      "competition": "low",
      "score": 82,
      "score_breakdown": { "margin": 27, "demand": 22, "competition": 18, "logistics": 12, "invoice": 3 },
      "summary": "Por qué es un buen candidato...",
      "risks": "Riesgos principales...",
      "suggested_angle": "Hook TikTok: ...",
      "target_markets": ["ES", "FR", "IT", "IE"],
      "source": "tiktok_cc"
    }
  ]
}`,
    }],
  });

  const text = response.text || "{}";

  // Limpiar posibles bloques de código markdown
  const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    const { candidates } = JSON.parse(clean);
    return Array.isArray(candidates) ? candidates : [];
  } catch {
    console.error("[product-finder] Error parseando respuesta Claude:", text.slice(0, 200));
    return [];
  }
}

// ── GUARDAR CANDIDATOS EN SUPABASE ───────────────────────────
type SavedCandidate = { candidate: ProductCandidate; id: string };

async function saveCandidates(candidates: ProductCandidate[]): Promise<SavedCandidate[]> {
  if (candidates.length === 0) return [];

  const rows = candidates.map(c => ({
    name:                 c.name,
    aliexpress_url:       c.aliexpress_url || null,
    aliexpress_id:        c.aliexpress_id  || null,
    tiktok_url:           c.tiktok_url     || null,
    amazon_asin:          c.amazon_asin    || null,
    estimated_cost:       c.estimated_cost,
    estimated_pvp:        c.estimated_pvp,
    estimated_margin_pct: c.estimated_margin_pct,
    shipping_days:        c.shipping_days,
    has_invoice:          c.has_invoice,
    has_invoice_note:     c.has_invoice_note || null,
    tiktok_views:         c.tiktok_views    || null,
    amazon_bsr:           c.amazon_bsr      || null,
    search_volume:        c.search_volume   || null,
    competition:          c.competition,
    score:                c.score,
    score_breakdown:      c.score_breakdown,
    summary:              c.summary,
    risks:                c.risks,
    suggested_angle:      c.suggested_angle,
    target_markets:       c.target_markets  || ["ES", "FR", "IT", "DE", "PT"],
    source:               c.source          || "ai_research",
    store:                "beauty",
    status:               "pending",
  }));

  const { error, data } = await supabase
    .from("product_candidates")
    .insert(rows)
    .select("id");

  if (error || !data) {
    console.error("[product-finder] Error insertando candidatos:", error?.message);
    return [];
  }

  // Mapear IDs de vuelta a los candidatos (mantienen el orden del insert)
  return data.map((row: { id: string }, i: number) => ({ candidate: candidates[i], id: row.id }));
}

// ── NOTIFICAR TOP 3 A TELEGRAM con botones inline ────────────
async function notifyTopCandidates(saved: SavedCandidate[]): Promise<void> {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) return;

  const top = [...saved]
    .sort((a, b) => b.candidate.score - a.candidate.score)
    .slice(0, CRITERIA.TOP_N_TELEGRAM);

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId   = process.env.TELEGRAM_CHAT_ID;

  // Mensaje cabecera
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      chat_id:    chatId,
      text:       `🌸 *CANDIDATOS BEAUTY — AIZUABEAUTY*\n📅 ${new Date().toLocaleDateString("es-ES")}\n_Aprueba los que quieres añadir al catálogo:_`,
      parse_mode: "Markdown",
    }),
  }).catch(() => null);

  // Un mensaje por candidato con botones inline
  for (const { candidate: c, id } of top) {
    const invoiceEmoji = c.has_invoice ? "✅" : "⚠️";
    let msg = `*${c.name}*\n`;
    msg += `💰 PVP: €${c.estimated_pvp} | Coste: €${c.estimated_cost} | Margen: ${c.estimated_margin_pct.toFixed(0)}%\n`;
    msg += `📦 Envío: ${c.shipping_days}d | ${invoiceEmoji} Factura | Competencia: ${c.competition}\n`;
    msg += `⭐ Score: ${c.score}/100\n`;
    msg += `💡 ${c.summary}\n`;
    msg += `🎬 _${c.suggested_angle}_\n`;
    msg += `⚠️ Riesgos: ${c.risks}\n`;
    if (c.aliexpress_url) msg += `🔗 ${c.aliexpress_url}`;

    const keyboard = {
      inline_keyboard: [[
        { text: "✅ Subir al Store", callback_data: `approve_${id}` },
        { text: "❌ Descartar",      callback_data: `discard_${id}` },
      ]],
    };

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        chat_id:    chatId,
        text:       msg,
        parse_mode: "Markdown",
        reply_markup: keyboard,
        disable_web_page_preview: true,
      }),
    }).catch(e => console.error("[product-finder] Telegram error:", e));
  }
}

// ── AUTH ─────────────────────────────────────────────────────
function isAuthorized(req: NextRequest): boolean {
  const auth  = req.headers.get("authorization") ?? "";
  const cron  = process.env.CRON_SECRET;
  const token = process.env.SYNC_SECRET_TOKEN;
  return (!!cron && auth === `Bearer ${cron}`) || (!!token && auth === `Bearer ${token}`);
}

// ── GET — Vercel Cron (viernes 08:00 UTC) ────────────────────
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runFinder();
}

// ── POST — Trigger manual / dry_run ─────────────────────────
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  // Listar candidatos existentes (con filtros opcionales)
  if (body.action === "list") {
    const status = body.status || "pending";
    const limit  = Math.min(body.limit || 20, 50);

    const { data, error } = await supabase
      .from("product_candidates")
      .select("id,name,score,estimated_margin_pct,estimated_pvp,shipping_days,has_invoice,competition,status,summary,suggested_angle,source,found_at")
      .eq("status", status)
      .order("score", { ascending: false })
      .limit(limit);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ candidates: data, count: data?.length ?? 0 });
  }

  // Actualizar estado de un candidato (approve / reject / sourcing)
  if (body.action === "update" && body.id) {
    const allowed = ["approved", "rejected", "sourcing", "live"];
    if (!allowed.includes(body.status)) {
      return NextResponse.json({ error: "Estado no válido" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      status:      body.status,
      reviewed_at: new Date().toISOString(),
    };
    if (body.notes)       updates.notes       = body.notes;
    if (body.promoted_to) updates.promoted_to = body.promoted_to;

    const { error } = await supabase
      .from("product_candidates")
      .update(updates)
      .eq("id", body.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, id: body.id, status: body.status });
  }

  // Stats del buscador
  if (body.action === "stats") {
    const { data, error } = await supabase.rpc("product_finder_stats");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ stats: data });
  }

  // Trigger de búsqueda (manual o dry_run)
  return runFinder(body.dry_run === true);
}

// ── LÓGICA PRINCIPAL ─────────────────────────────────────────
async function runFinder(dryRun = false) {
  try {
    // 1. Obtener productos existentes de beauty (para no repetir)
    const { data: existingProducts } = await supabase
      .from("products")
      .select("name")
      .eq("active", true)
      .eq("store", "beauty")
      .limit(30);

    const existingNames = (existingProducts || []).map((p: { name: string }) => p.name);

    // 2. Obtener candidatos recientes rechazados (para no repetir)
    const { data: recentRejected } = await supabase
      .from("product_candidates")
      .select("name")
      .in("status", ["rejected", "pending"])
      .gte("found_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(20);

    const recentNames = (recentRejected || []).map((p: { name: string }) => p.name);

    // 3. Investigar con Claude
    const candidates = await researchWithClaude({
      existingProducts: existingNames,
      recentCandidates: recentNames,
    });

    if (candidates.length === 0) {
      await notifyTelegram("⚠️ *Product Finder*: No se encontraron candidatos en esta ejecución.");
      return NextResponse.json({ success: true, saved: 0, message: "Sin candidatos encontrados" });
    }

    // Filtrar por criterios mínimos
    const qualified = candidates.filter(c =>
      c.estimated_margin_pct >= CRITERIA.MIN_MARGIN_PCT &&
      c.shipping_days        <= CRITERIA.MAX_SHIPPING_DAYS &&
      (CRITERIA.REQUIRE_INVOICE ? c.has_invoice : true) &&
      ["low", "medium"].includes(c.competition)
    );

    if (dryRun) {
      return NextResponse.json({
        dry_run:   true,
        found:     candidates.length,
        qualified: qualified.length,
        candidates: candidates.map(c => ({
          name:    c.name,
          score:   c.score,
          margin:  c.estimated_margin_pct,
          pvp:     c.estimated_pvp,
          invoice: c.has_invoice,
        })),
      });
    }

    // 4. Guardar en Supabase y obtener IDs
    const saved = await saveCandidates(qualified);

    // 5. Notificar top 3 a Telegram con botones inline de aprobación
    if (saved.length > 0) {
      await notifyTopCandidates(saved);
    }

    return NextResponse.json({
      success:   true,
      found:     candidates.length,
      qualified: qualified.length,
      saved:     saved.length,
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error("[product-finder]", msg);
    await notifyTelegram(`❌ *ERROR Product Finder*\n\n${msg}`);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function notifyTelegram(text: string): Promise<void> {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) return;
  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      chat_id:    process.env.TELEGRAM_CHAT_ID,
      text,
      parse_mode: "Markdown",
    }),
  }).catch(() => null);
}
