/**
 * /api/consulting-content — AG-18b Consulting Content Generator
 *
 * Genera contenido de posicionamiento para ConsultorIA (B2B, ES/LATAM):
 *  - LinkedIn post: 150-200 palabras, formato problema/impacto/solución/CTA
 *  - Artículo SEO: 500-700 palabras, keyword long-tail, enfoque práctico
 *
 * Ambos guardados en content_outputs. Notificación Telegram con preview.
 *
 * Cron: martes 09:00 UTC (via local_crons_runner.py FASE 17)
 *
 * GET /api/consulting-content               → último contenido generado
 * GET /api/consulting-content?generate=true → genera y guarda
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase  = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Temas rotativos B2B ConsultorIA ────────────────────────────────────────────
const CONSULTING_TOPICS = [
  {
    angle:   "Automatización de procesos administrativos con IA",
    keyword: "automatizar procesos empresariales con inteligencia artificial",
    sector:  "PYME y autónomos",
  },
  {
    angle:   "IA para atención al cliente 24/7 sin contratar personal",
    keyword: "chatbot IA atención cliente pequeña empresa",
    sector:  "E-commerce y retail",
  },
  {
    angle:   "Cómo los agentes de IA reducen costes operativos en un 40%",
    keyword: "reducir costes empresa agentes inteligencia artificial",
    sector:  "Empresas de servicios",
  },
  {
    angle:   "Generación de contenido y marketing automatizado para empresas",
    keyword: "marketing automatizado inteligencia artificial empresa España",
    sector:  "Marketing y comunicación",
  },
  {
    angle:   "Análisis de datos y toma de decisiones con IA sin equipo técnico",
    keyword: "análisis datos IA PYME sin programadores",
    sector:  "Dirección y estrategia",
  },
  {
    angle:   "Automatizar la gestión de pedidos y logística con IA",
    keyword: "gestión pedidos automatización IA tienda online",
    sector:  "Logística y operaciones",
  },
  {
    angle:   "ROI real de implementar IA en tu empresa: casos prácticos España",
    keyword: "rentabilidad implementar IA empresa española caso real",
    sector:  "Dirección general",
  },
];

const CONSULTING_URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/consulting`
  : "https://aizua-store.vercel.app/consulting";

const ACADEMY_URL = "https://aizualabs-academy.vercel.app";
const BREVO_API   = "https://api.brevo.com/v3";

// Mapeo ángulo de consultoría → curso Academy más relevante
const ANGLE_TO_COURSE: Record<number, { title: string; url: string }> = {
  0: { title: "Claude & Automatización de Negocios", url: `${ACADEMY_URL}/cursos/claude-automatizacion` },
  1: { title: "IA para E-Commerce: De 0 a Automatización", url: `${ACADEMY_URL}/cursos/ia-ecommerce` },
  2: { title: "Claude & Automatización de Negocios", url: `${ACADEMY_URL}/cursos/claude-automatizacion` },
  3: { title: "IA para E-Commerce: De 0 a Automatización", url: `${ACADEMY_URL}/cursos/ia-ecommerce` },
  4: { title: "Finanzas Inteligentes con IA",              url: `${ACADEMY_URL}/cursos/finanzas-ia` },
  5: { title: "IA para E-Commerce: De 0 a Automatización", url: `${ACADEMY_URL}/cursos/ia-ecommerce` },
  6: { title: "Finanzas Inteligentes con IA",              url: `${ACADEMY_URL}/cursos/finanzas-ia` },
};

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

// ── Genera LinkedIn post ───────────────────────────────────────────────────────
async function generateLinkedInPost(angle: string, sector: string): Promise<string> {
  const response = await anthropic.messages.create({
    model:      "claude-haiku-4-5-20251001",
    max_tokens: 500,
    messages: [{
      role: "user",
      content: `Eres un consultor experto en IA para empresas. Escribe un LinkedIn post sobre: "${angle}".

Sector objetivo: ${sector}

Estructura OBLIGATORIA:
1. Hook (primera línea que para el scroll, máx 15 palabras, dato concreto o pregunta directa)
2. Problema real que sufre el sector (2-3 frases)
3. Cómo la IA lo resuelve en la práctica (3-4 frases con ejemplo concreto)
4. Resultado/beneficio medible (1-2 frases)
5. CTA suave: invita a contactar o a visitar ${CONSULTING_URL}

Longitud: 150-200 palabras. Tono: directo, empático, sin tecnicismos. Sin emojis en exceso (máx 3). Sin hashtags de más (máx 4, al final).
Devuelve SOLO el texto del post, sin explicaciones adicionales.`,
    }],
  });

  return response.content[0].type === "text" ? response.content[0].text.trim() : "";
}

// ── Genera artículo SEO con Academy CTA integrado ─────────────────────────────
async function generateSEOArticle(
  angle: string,
  keyword: string,
  sector: string,
  academyCourse: { title: string; url: string }
): Promise<{ title: string; slug: string; html: string; excerpt: string }> {
  const response = await anthropic.messages.create({
    model:      "claude-haiku-4-5-20251001",
    max_tokens: 1400,
    messages: [{
      role: "user",
      content: `Eres un consultor experto en IA para empresas y redactor SEO.
Escribe un artículo sobre: "${angle}"
Keyword objetivo: "${keyword}"
Sector: ${sector}

Requisitos SEO:
- Incluye la keyword en el título H1, primer párrafo y al menos 2 veces más naturalmente
- Estructura: H1 → intro (2 párr) → H2 problema → H2 solución con IA → H2 caso práctico → H2 cómo empezar → [CTA consulting] → [bloque Academy]
- 500-700 palabras total
- Tono: profesional pero accesible. Orientado a dueños de empresa, no técnicos.

Al final del artículo incluye AMBOS bloques en este orden:

1. CTA consulting:
<div style="background:#f0f9ff;border-left:4px solid #0ea5e9;padding:1.2rem 1.5rem;border-radius:0 8px 8px 0;margin:2rem 0;">
<p style="margin:0;font-weight:600;color:#0369a1;">¿Listo para implementarlo en tu empresa?</p>
<p style="margin:0.5rem 0 0;color:#475569;">Agenda una sesión estratégica con nuestro equipo y diseña tu hoja de ruta de IA en 90 minutos.</p>
<a href="${CONSULTING_URL}" style="display:inline-block;margin-top:0.8rem;background:#0ea5e9;color:white;padding:0.6rem 1.4rem;border-radius:6px;text-decoration:none;font-weight:600;">Solicitar consultoría →</a>
</div>

2. Bloque "Aprende a hacerlo tú mismo":
<div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:1.2rem 1.5rem;border-radius:0 8px 8px 0;margin:2rem 0;">
<p style="margin:0;font-size:0.85rem;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:0.5px;">🎓 Formación recomendada</p>
<p style="margin:0.5rem 0 0;font-weight:600;color:#14532d;">${academyCourse.title}</p>
<p style="margin:0.4rem 0 0;color:#166534;font-size:0.9rem;">¿Prefieres aprenderlo tú mismo? Este curso te guía paso a paso.</p>
<a href="${academyCourse.url}" style="display:inline-block;margin-top:0.8rem;background:#22c55e;color:white;padding:0.6rem 1.4rem;border-radius:6px;text-decoration:none;font-weight:600;">Ver curso →</a>
</div>

Devuelve JSON con estas claves:
- "title": el H1 del artículo (incluye keyword, máx 65 chars)
- "slug": slug URL del título (solo letras minúsculas, números y guiones, sin stopwords)
- "excerpt": resumen SEO de 140-155 chars para meta description (incluye keyword)
- "html": HTML completo incluyendo ambos bloques CTA al final

Formato: {"title":"...","slug":"...","excerpt":"...","html":"..."}`,
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("no JSON");
    return JSON.parse(match[0]);
  } catch {
    return {
      title:   angle,
      slug:    angle.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 60),
      excerpt: angle.slice(0, 140),
      html:    `<h1>${angle}</h1><p>${text.slice(0, 600)}</p>`,
    };
  }
}

// ── GET handler ────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const auth = req.headers.get("authorization")?.replace("Bearer ", "");

  const isAuthorized =
    auth === process.env.CRON_SECRET ||
    auth === process.env.SYNC_SECRET_TOKEN;

  if (!isAuthorized) {
    if (searchParams.get("generate") !== "true") {
      return NextResponse.json({ ok: true, info: "Consulting Content endpoint. Use ?generate=true with auth." });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (searchParams.get("generate") !== "true") {
    const { data } = await supabase
      .from("content_outputs")
      .select("created_at, content_type, metadata")
      .eq("content_type", "consulting_linkedin")
      .order("created_at", { ascending: false })
      .limit(3);

    return NextResponse.json({ ok: true, recent: data });
  }

  // ── Proceso completo ──────────────────────────────────────────────────────
  const weekNum  = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const topicIdx = weekNum % CONSULTING_TOPICS.length;
  const topic    = CONSULTING_TOPICS[topicIdx];

  let linkedInPost = "";
  let article: { title: string; slug: string; html: string; excerpt: string } | null = null;
  const errors: string[] = [];

  const academyCourse = ANGLE_TO_COURSE[topicIdx] ?? ANGLE_TO_COURSE[0];

  // Genera LinkedIn post + artículo SEO en paralelo
  try {
    [linkedInPost, article] = await Promise.all([
      generateLinkedInPost(topic.angle, topic.sector),
      generateSEOArticle(topic.angle, topic.keyword, topic.sector, academyCourse),
    ]);
  } catch (e: any) {
    errors.push(e.message);
  }

  // Guarda LinkedIn post en content_outputs
  if (linkedInPost) {
    await supabase.from("content_outputs").insert({
      content_type: "consulting_linkedin",
      product_id:   null,
      locale:       "es",
      content:      linkedInPost,
      metadata:     {
        angle:      topic.angle,
        keyword:    topic.keyword,
        sector:     topic.sector,
        char_count: linkedInPost.length,
        academy_course: academyCourse.title,
      },
    });
  }

  // Guarda artículo como blog post (status=published → entra en newsletter semanal)
  let articleSlug = "";
  if (article?.html) {
    articleSlug = `consulting-${article.slug}-${new Date().toISOString().slice(0, 10)}`;
    await supabase.from("blog_posts").insert({
      title:       { es: article.title },   // objeto multilingüe — página usa title[locale]
      slug:        articleSlug,
      content:     { es: article.html },    // objeto multilingüe — fallback a 'es'
      excerpt:     { es: article.excerpt },
      locale:      "es",
      status:      "published",
      source:      "consulting",
      metadata:    { keyword: topic.keyword, sector: topic.sector, angle: topic.angle },
      cover_image: null,
    });
  }

  // Envía artículo como newsletter a Brevo lista 9 (Consulting leads)
  const brevoKey = process.env.BREVO_API_KEY;
  const consultingListId = Number(process.env.BREVO_LIST_CONSULTING ?? "9");
  let newsletterSent = false;

  if (brevoKey && consultingListId && article?.html) {
    const storeUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aizua-store.vercel.app";
    const articleUrl = articleSlug ? `${storeUrl}/es/blog/${articleSlug}` : CONSULTING_URL;

    const emailHTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#0f172a,#1e293b);padding:28px 40px;">
    <h1 style="color:#fff;margin:0;font-size:20px;">ConsultorIA · AizuaLabs</h1>
    <p style="color:#94a3b8;margin:6px 0 0;font-size:13px;">Inteligencia Artificial para empresas</p>
  </td></tr>
  <tr><td style="padding:32px 40px;">${article.html}</td></tr>
  <tr><td style="padding:0 40px 32px;text-align:center;">
    <a href="${articleUrl}" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">Leer artículo completo →</a>
  </td></tr>
  <tr><td style="background:#f8fafc;padding:16px 40px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:11px;margin:0;">AizuaLabs · Málaga, España ·
    <a href="${CONSULTING_URL}/unsubscribe?email={{contact.EMAIL}}" style="color:#94a3b8;">Darse de baja</a></p>
  </td></tr>
</table></td></tr></table></body></html>`;

    try {
      const createRes = await fetch(`${BREVO_API}/emailCampaigns`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", "api-key": brevoKey },
        body: JSON.stringify({
          name:        `ConsultorIA — ${topic.angle.slice(0, 40)} ${new Date().toISOString().slice(0,10)}`,
          subject:     `💼 ${article.title}`,
          htmlContent: emailHTML,
          sender:      { name: "ConsultorIA · AizuaLabs", email: "aizualabs@outlook.com" },
          recipients:  { listIds: [consultingListId] },
        }),
      });
      if (createRes.ok) {
        const { id: cid } = await createRes.json();
        const sendRes = await fetch(`${BREVO_API}/emailCampaigns/${cid}/sendNow`, {
          method: "POST", headers: { "Content-Type": "application/json", "api-key": brevoKey },
        });
        newsletterSent = sendRes.ok;
      }
    } catch { /* Brevo opcional — no bloquea */ }
  }

  // Telegram
  const preview = linkedInPost.slice(0, 180).replace(/</g, "&lt;");
  const tgMsg = errors.length
    ? `⚠️ <b>Consulting Content — errores</b>\n${errors.join("\n")}`
    : `💼 <b>Consulting Content generado</b>\n📌 <b>${topic.angle}</b>\n🔑 Keyword: ${topic.keyword}\n📧 Newsletter lista 9: ${newsletterSent ? "✅" : "⚠️ no enviado"}\n🎓 Academy CTA: ${academyCourse.title}\n\n${preview}…`;

  await sendTelegram(tgMsg);

  return NextResponse.json({
    ok:              errors.length === 0,
    topic:           topic.angle,
    keyword:         topic.keyword,
    linkedin_chars:  linkedInPost.length,
    article_title:   article?.title,
    newsletter_sent: newsletterSent,
    academy_course:  academyCourse.title,
    errors,
  });
}
