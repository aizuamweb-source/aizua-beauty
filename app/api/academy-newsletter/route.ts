/**
 * /api/academy-newsletter — AG-11b Academy Newsletter
 *
 * Genera y envía newsletter semanal a Brevo lista 8 (BREVO_LIST_ACADEMY).
 * Contenido: tip educativo sobre IA/negocio digital + preview de formaciones
 * disponibles en AizuaLabs Academy + CTA.
 *
 * Cron: lunes 09:00 UTC (via local_crons_runner.py FASE 17)
 *
 * GET /api/academy-newsletter              → estado / último envío
 * GET /api/academy-newsletter?weekly=true  → procesa envío completo
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const BREVO_API = "https://api.brevo.com/v3";
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase  = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ACADEMY_URL = "https://aizualabs-academy.vercel.app";

// ── Temas rotativos de tips educativos ────────────────────────────────────────
const TIP_TOPICS = [
  { topic: "automatización de tareas repetitivas con IA",   emoji: "🤖", keyword: "automatización IA" },
  { topic: "generación de contenido con Claude para tu negocio", emoji: "✍️", keyword: "contenido IA" },
  { topic: "cómo la IA puede multiplicar tus ventas online", emoji: "📈", keyword: "ventas con IA" },
  { topic: "prompt engineering: cómo hablarle a la IA para obtener resultados",  emoji: "💡", keyword: "prompt engineering" },
  { topic: "automatizar tu e-commerce con agentes IA",      emoji: "🛒", keyword: "e-commerce IA" },
  { topic: "cómo construir tu primer agente de IA sin programar", emoji: "⚡", keyword: "agentes IA" },
  { topic: "IA para analizar datos de tu negocio y tomar mejores decisiones", emoji: "📊", keyword: "análisis con IA" },
];

// ── Cursos disponibles (sincronizado con Academy) ─────────────────────────────
const COURSES = [
  {
    title: "IA para E-Commerce: De 0 a Automatización",
    description: "Aprende a automatizar tu tienda online con agentes de IA reales. Sin código complejo.",
    url: `${ACADEMY_URL}/cursos/ia-ecommerce`,
    badge: "NUEVO",
  },
  {
    title: "Claude & Automatización de Negocios",
    description: "Domina Claude y los mejores frameworks de IA para escalar tu negocio digital.",
    url: `${ACADEMY_URL}/cursos/claude-automatizacion`,
    badge: "POPULAR",
  },
  {
    title: "Finanzas Inteligentes con IA",
    description: "Gestiona tus finanzas personales y de negocio con herramientas de inteligencia artificial.",
    url: `${ACADEMY_URL}/cursos/finanzas-ia`,
    badge: "",
  },
];

async function sendTelegram(msg: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat  = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ chat_id: chat, text: msg, parse_mode: "HTML" }),
  });
}

// ── Genera tip educativo con Claude Haiku ─────────────────────────────────────
async function generateWeeklyTip(topic: string): Promise<{ title: string; body: string; takeaway: string }> {
  const response = await anthropic.messages.create({
    model:      "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [{
      role: "user",
      content: `Eres un experto en IA aplicada a negocios digitales. Genera un tip educativo semanal sobre: "${topic}".

Responde SOLO en JSON con estas claves:
- "title": titular del tip (máx 70 chars, directo, orientado a beneficio)
- "body": explicación práctica en 3-4 frases (tono cercano, sin tecnicismos, orientado a dueños de negocio). No uses bullet points.
- "takeaway": una frase corta de cierre tipo "Esta semana, prueba..." con acción concreta (máx 100 chars)

Formato exacto: {"title":"...","body":"...","takeaway":"..."}`,
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";
  try {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : { title: `Tip: ${topic}`, body: "", takeaway: "" };
  } catch {
    return { title: `Tip: ${topic}`, body: text.slice(0, 300), takeaway: "" };
  }
}

// ── Construye HTML del email ──────────────────────────────────────────────────
function buildEmailHTML(
  tip: { title: string; body: string; takeaway: string },
  topicEmoji: string,
  storeProducts: Array<{ name: string; slug: string; price: number; images?: string[] }>
): string {
  const storeUrl = "https://aizua-store.vercel.app";
  const courseCards = COURSES.map(c => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              ${c.badge ? `<span style="background:#0ea5e9;color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;text-transform:uppercase;letter-spacing:0.5px;">${c.badge}</span><br>` : ""}
              <a href="${c.url}" style="color:#0f172a;font-weight:600;font-size:15px;text-decoration:none;">${c.title}</a>
              <p style="color:#64748b;font-size:13px;margin:4px 0 0;">${c.description}</p>
            </td>
            <td style="width:80px;text-align:right;vertical-align:middle;">
              <a href="${c.url}" style="background:#0ea5e9;color:#fff;font-size:12px;padding:6px 14px;border-radius:6px;text-decoration:none;white-space:nowrap;">Ver curso →</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f0f9ff;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

  <!-- Header -->
  <tr>
    <td style="background:linear-gradient(135deg,#0ea5e9 0%,#0369a1 100%);padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:1px;">AizuaLabs Academy</h1>
      <p style="color:#bae6fd;margin:8px 0 0;font-size:14px;">Tu formación semanal en IA aplicada</p>
    </td>
  </tr>

  <!-- Tip semanal -->
  <tr>
    <td style="padding:32px 40px 24px;">
      <p style="color:#0ea5e9;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">${topicEmoji} TIP DE LA SEMANA</p>
      <h2 style="color:#0f172a;font-size:20px;margin:0 0 16px;line-height:1.3;">${tip.title}</h2>
      <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 16px;">${tip.body}</p>
      ${tip.takeaway ? `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:#f0f9ff;border-left:4px solid #0ea5e9;padding:14px 18px;border-radius:0 8px 8px 0;">
            <p style="color:#0369a1;font-size:14px;font-weight:600;margin:0;">⚡ ${tip.takeaway}</p>
          </td>
        </tr>
      </table>` : ""}
    </td>
  </tr>

  <!-- Divisor -->
  <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #e2e8f0;margin:0;"></td></tr>

  <!-- Cursos -->
  <tr>
    <td style="padding:24px 40px 32px;">
      <h3 style="color:#0f172a;font-size:17px;margin:0 0 16px;">🎓 Formaciones disponibles</h3>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${courseCards}
      </table>
    </td>
  </tr>

  <!-- CTA principal -->
  <tr>
    <td style="padding:0 40px 24px;text-align:center;">
      <a href="${ACADEMY_URL}" style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#0369a1);color:#fff;font-size:15px;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;">
        Explorar todos los cursos →
      </a>
    </td>
  </tr>

  ${storeProducts.length > 0 ? `
  <!-- Divisor -->
  <tr><td style="padding:0 40px;"><hr style="border:none;border-top:2px solid #e2e8f0;margin:0;"></td></tr>

  <!-- Gadgets recomendados (cross-branch: Store) -->
  <tr>
    <td style="padding:24px 40px 8px;">
      <p style="color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">🛒 Herramientas recomendadas esta semana</p>
      <p style="color:#94a3b8;font-size:12px;margin:0 0 16px;">Gadgets y tecnología seleccionados por nuestro equipo</p>
    </td>
  </tr>
  <tr>
    <td style="padding:0 40px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          ${storeProducts.map(p => {
            const name = typeof p.name === "object" ? (p.name as any).es || (p.name as any).en || "Producto" : p.name;
            const img  = p.images?.[0] ?? "";
            const url  = `${storeUrl}/es/product/${p.slug}`;
            return `<td style="width:33%;padding:0 6px;text-align:center;vertical-align:top;">
              ${img ? `<img src="${img}" alt="${name}" style="width:100%;max-width:140px;height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px;">` : ""}
              <p style="font-size:12px;font-weight:600;color:#1e293b;margin:0 0 4px;line-height:1.3;">${name.slice(0, 45)}${name.length > 45 ? "…" : ""}</p>
              <p style="font-size:13px;color:#0ea5e9;font-weight:700;margin:0 0 6px;">€${p.price.toFixed(2)}</p>
              <a href="${url}" style="font-size:11px;background:#f1f5f9;color:#475569;padding:4px 10px;border-radius:4px;text-decoration:none;">Ver →</a>
            </td>`;
          }).join("")}
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:0 40px 28px;text-align:center;">
      <a href="${storeUrl}/es/tienda" style="font-size:13px;color:#0ea5e9;text-decoration:none;">Ver toda la tienda de tecnología →</a>
    </td>
  </tr>` : ""}

  <!-- Footer -->
  <tr>
    <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">AizuaLabs Academy · Málaga, España</p>
      <p style="color:#94a3b8;font-size:11px;margin:8px 0 0;">
        <a href="${ACADEMY_URL}/unsubscribe?email={{contact.EMAIL}}" style="color:#94a3b8;">Darse de baja</a>
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ── Envía campaña Brevo ───────────────────────────────────────────────────────
async function sendBrevoNewsletter(subject: string, html: string): Promise<{ ok: boolean; campaignId?: number; error?: string }> {
  const listId = Number(process.env.BREVO_LIST_ACADEMY ?? "8");
  if (!listId) return { ok: false, error: "BREVO_LIST_ACADEMY no configurado" };

  const brevoKey = process.env.BREVO_API_KEY;
  if (!brevoKey) return { ok: false, error: "BREVO_API_KEY no configurado" };

  const payload = {
    name:       `Academy Newsletter ${new Date().toISOString().slice(0, 10)}`,
    subject,
    htmlContent: html,
    sender:     { name: "AizuaLabs Academy", email: "aizualabs@outlook.com" },
    recipients: { listIds: [listId] },
    header:     "AizuaLabs Academy",
  };

  const createRes = await fetch(`${BREVO_API}/emailCampaigns`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", "api-key": brevoKey },
    body:    JSON.stringify(payload),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    return { ok: false, error: `Brevo create error ${createRes.status}: ${err.slice(0, 200)}` };
  }

  const { id: campaignId } = await createRes.json();

  const sendRes = await fetch(`${BREVO_API}/emailCampaigns/${campaignId}/sendNow`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", "api-key": brevoKey },
  });

  if (!sendRes.ok) {
    const err = await sendRes.text();
    return { ok: false, campaignId, error: `Brevo send error ${sendRes.status}: ${err.slice(0, 200)}` };
  }

  return { ok: true, campaignId };
}

// ── GET handler ───────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const auth = req.headers.get("authorization")?.replace("Bearer ", "");

  const isAuthorized =
    auth === process.env.CRON_SECRET ||
    auth === process.env.SYNC_SECRET_TOKEN;

  if (!isAuthorized) {
    // Sin auth → status simple
    if (searchParams.get("weekly") !== "true") {
      return NextResponse.json({ ok: true, info: "Academy Newsletter endpoint. Use ?weekly=true with auth." });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (searchParams.get("weekly") !== "true") {
    // Consulta estado: último envío en content_outputs
    const { data } = await supabase
      .from("content_outputs")
      .select("created_at, content_type, metadata")
      .eq("content_type", "academy_newsletter")
      .order("created_at", { ascending: false })
      .limit(1);

    return NextResponse.json({
      ok:         true,
      last_send:  data?.[0]?.created_at ?? null,
      academy_url: ACADEMY_URL,
    });
  }

  // ── Proceso completo ─────────────────────────────────────────────────────
  const weekNum  = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const tipIndex = weekNum % TIP_TOPICS.length;
  const tipMeta  = TIP_TOPICS[tipIndex];

  let tip: { title: string; body: string; takeaway: string };
  try {
    tip = await generateWeeklyTip(tipMeta.topic);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: `generateWeeklyTip: ${e.message}` }, { status: 500 });
  }

  // Fetch 3 productos activos de la store para cross-promotion
  const { data: storeProductsRaw } = await supabase
    .from("products")
    .select("name, slug, price, images")
    .eq("active", true)
    .order("rating", { ascending: false })
    .limit(3);

  const storeProducts = (storeProductsRaw ?? []) as Array<{
    name: string; slug: string; price: number; images?: string[]
  }>;

  const subject = `${tipMeta.emoji} ${tip.title}`;
  const html    = buildEmailHTML(tip, tipMeta.emoji, storeProducts);

  const sendResult = await sendBrevoNewsletter(subject, html);

  // Guardar en content_outputs
  await supabase.from("content_outputs").insert({
    content_type: "academy_newsletter",
    product_id:   null,
    locale:       "es",
    content:      JSON.stringify({ subject, tip }),
    metadata:     {
      tip_topic:      tipMeta.topic,
      tip_keyword:    tipMeta.keyword,
      campaign_id:    sendResult.campaignId ?? null,
      brevo_list:     8,
      sent_ok:        sendResult.ok,
      store_products: storeProducts.map(p => p.slug),
    },
  });

  const msg = sendResult.ok
    ? `📧 <b>Academy Newsletter enviada</b>\n📌 ${subject}\n🛒 ${storeProducts.length} productos store incluidos\n🆔 Campaign ${sendResult.campaignId}`
    : `❌ <b>Academy Newsletter FALLÓ</b>\n${sendResult.error}`;

  await sendTelegram(msg);

  return NextResponse.json({
    ok:             sendResult.ok,
    subject,
    campaign_id:    sendResult.campaignId,
    tip_topic:      tipMeta.topic,
    store_products: storeProducts.length,
    error:          sendResult.error,
  });
}
