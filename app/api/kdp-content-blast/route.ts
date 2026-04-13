import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BREVO_API = "https://api.brevo.com/v3";
const STORE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://aizua-store.vercel.app";

// Brevo lists to blast: Newsletter ES (5), Newsletter EN (6), Clientes (7)
const BLAST_LISTS = [5, 6, 7];

// ── Haiku call ───────────────────────────────────────────────────────────────

async function callHaiku(prompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error("Haiku API error: " + res.status);
  const data = await res.json();
  return data.content[0].text.trim();
}

// ── Blog post generation ─────────────────────────────────────────────────────

async function generateBookBlogPost(bookData: {
  title: string;
  serie: string;
  asin: string;
  rating?: string;
  reviews?: string;
  price?: string;
}): Promise<{ title: string; excerpt: string; html: string; slug: string }> {
  const prompt = `Eres copywriter de AizuaLabs. Genera contenido para anunciar el lanzamiento de un libro en Amazon KDP.

Libro: "${bookData.title}"
Serie: ${bookData.serie}
${bookData.rating ? `Rating: ${bookData.rating}/5 (${bookData.reviews || "0"} reseñas)` : ""}
${bookData.price ? `Precio: ${bookData.price}€` : ""}

Responde SOLO en JSON válido sin markdown:
{
  "blog_title": "título del post en español (max 70 chars)",
  "excerpt": "descripción corta en español (max 160 chars)",
  "html_body": "contenido HTML completo del post (300-500 palabras, con <h2>, <p>, <ul>). Incluye al menos 1 CTA con enlace a https://www.amazon.es/dp/${bookData.asin}. No uses estilos inline."
}

Tono: directo, práctico, sin humo. La marca es AizuaLabs.`;

  const text = await callHaiku(prompt);
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("No JSON in Haiku response");
  const parsed = JSON.parse(m[0]);

  const slug =
    "libro-" +
    bookData.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 50) +
    "-" +
    Date.now().toString(36);

  return {
    title: parsed.blog_title,
    excerpt: parsed.excerpt,
    html: parsed.html_body,
    slug,
  };
}

// ── Email HTML builder ────────────────────────────────────────────────────────

function buildBlastEmail(
  locale: string,
  bookTitle: string,
  excerpt: string,
  asin: string,
  blogSlug: string
): string {
  const isEs = locale === "es";
  const amazonUrl = `https://www.amazon.es/dp/${asin}`;
  const blogUrl = `${STORE_URL}/${locale}/blog/${blogSlug}`;

  const headline = isEs
    ? `Nuevo libro publicado: ${bookTitle}`
    : `New book published: ${bookTitle}`;
  const subheadline = isEs
    ? "El nuevo libro de AizuaLabs ya está disponible en Amazon"
    : "The new AizuaLabs book is now available on Amazon";
  const ctaAmazon = isEs ? "Ver en Amazon" : "View on Amazon";
  const ctaBlog = isEs ? "Leer artículo completo" : "Read full article";
  const academyBlurb = isEs
    ? "¿Quieres aplicar lo que lees? Accede a los cursos prácticos de AizuaLabs Academy."
    : "Want to apply what you read? Access AizuaLabs Academy practical courses.";
  const academyCta = isEs ? "Ver Academy" : "Browse Academy";

  return (
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>` +
    `<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">` +
    `<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;"><tr><td align="center">` +
    `<table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">` +
    // Header
    `<tr><td style="background:#0f172a;padding:24px 32px;text-align:center;">` +
    `<span style="font-size:24px;font-weight:900;color:#fff;">Aiz<span style="color:#3b82f6;">u</span>a</span>` +
    `<span style="display:block;font-size:11px;color:#94a3b8;margin-top:4px;letter-spacing:2px;text-transform:uppercase;">Academy Books</span>` +
    `</td></tr>` +
    // Book badge
    `<tr><td style="padding:32px 32px 0;">` +
    `<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:10px 16px;display:inline-block;margin-bottom:20px;">` +
    `<span style="font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:1px;">&#128218; Nuevo libro publicado</span>` +
    `</div>` +
    `<h1 style="font-size:22px;font-weight:800;color:#0f172a;margin:0 0 8px;">${headline}</h1>` +
    `<p style="font-size:14px;color:#64748b;margin:0 0 20px;">${subheadline}</p>` +
    `<p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 28px;">${excerpt}</p>` +
    // CTAs
    `<div style="margin:0 0 28px;">` +
    `<a href="${amazonUrl}" style="display:inline-block;background:#f59e0b;color:#fff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;margin-right:12px;">${ctaAmazon}</a>` +
    `<a href="${blogUrl}" style="display:inline-block;background:#3b82f6;color:#fff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;">${ctaBlog}</a>` +
    `</div>` +
    // Academy cross-sell
    `<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:20px;">` +
    `<p style="font-size:13px;color:#475569;margin:0 0 14px;">${academyBlurb}</p>` +
    `<a href="${STORE_URL}/${locale}/academy" style="display:inline-block;background:#16a34a;color:#fff;font-size:13px;font-weight:700;padding:10px 24px;border-radius:8px;text-decoration:none;">${academyCta}</a>` +
    `</div>` +
    `</td></tr>` +
    // Footer
    `<tr><td style="background:#f8fafc;padding:20px 32px;text-align:center;margin-top:24px;">` +
    `<p style="font-size:11px;color:#94a3b8;margin:0;">AizuaLabs &middot; Malaga, Espana &middot; info@aizualabs.com</p>` +
    `</td></tr></table></td></tr></table></body></html>`
  );
}

// ── Brevo: send campaign to multiple lists ───────────────────────────────────

async function sendBrevoBlast(
  subject: string,
  htmlEs: string,
  htmlEn: string
): Promise<{ ok: boolean; campaignId?: number; error?: string }> {
  // Create campaign (ES primary content, EN as default fallback via list 6)
  const createRes = await fetch(`${BREVO_API}/emailCampaigns`, {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `KDP Book Blast — ${new Date().toISOString().slice(0, 10)}`,
      subject,
      sender: { email: "info@aizualabs.com", name: "AizuaLabs" },
      type: "classic",
      htmlContent: htmlEs, // Main content (ES)
      recipients: { listIds: BLAST_LISTS },
      scheduledAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // +5min
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    return { ok: false, error: err };
  }

  const campaign = await createRes.json();
  return { ok: true, campaignId: campaign.id };
}

// ── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  if (auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    asin: string;
    title: string;
    serie?: string;
    rating?: string;
    reviews?: string;
    price?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.asin || !body.title) {
    return NextResponse.json(
      { error: "asin and title are required" },
      { status: 400 }
    );
  }

  try {
    // 1. Generate blog post content
    const post = await generateBookBlogPost({
      title: body.title,
      serie: body.serie ?? "AizuaLabs Books",
      asin: body.asin,
      rating: body.rating,
      reviews: body.reviews,
      price: body.price,
    });

    // 2. Save blog post to Supabase
    const { data: blogRow, error: blogErr } = await supabase
      .from("blog_posts")
      .insert({
        slug: post.slug,
        title: { es: post.title, en: post.title },
        excerpt: { es: post.excerpt, en: post.excerpt },
        content: { es: post.html, en: post.html },
        status: "published",
        source: "kdp",
        published_at: new Date().toISOString(),
        cover_image: `https://images.amazon.com/images/P/${body.asin}.01._SCLZZZZZZZ_.jpg`,
        tags: ["libro", "amazon", body.serie ?? "aizuabooks"].filter(Boolean),
      })
      .select("id")
      .single();

    if (blogErr) throw new Error("Blog insert: " + blogErr.message);

    // 3. Build emails
    const subject = `📚 Nuevo libro AizuaLabs: ${body.title}`;
    const htmlEs = buildBlastEmail("es", body.title, post.excerpt, body.asin, post.slug);
    const htmlEn = buildBlastEmail("en", body.title, post.excerpt, body.asin, post.slug);

    // 4. Send Brevo blast
    const blast = await sendBrevoBlast(subject, htmlEs, htmlEn);

    // 5. Log to content_outputs
    await supabase.from("content_outputs").insert({
      type: "kdp_blast",
      title: post.title,
      content: post.excerpt,
      metadata: {
        asin: body.asin,
        serie: body.serie,
        blog_post_id: blogRow?.id,
        brevo_campaign_id: blast.campaignId,
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      blog_slug: post.slug,
      blog_post_id: blogRow?.id,
      brevo_campaign_id: blast.campaignId,
      blast_error: blast.error,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

// ── GET — health check ────────────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({
    ok: true,
    info: "POST with {asin, title, serie?, rating?, reviews?, price?} to trigger KDP content blast",
    lists: BLAST_LISTS,
  });
}
