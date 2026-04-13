import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const BREVO_API = "https://api.brevo.com/v3";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SubscribeBody {
  email: string;
  locale?: string;
  source?: string;
}

interface BlogPost {
  title: string;
  slug: string;
  excerpt: string | null;
  locale: string;
}

interface Product {
  name: string;
  slug: string;
  price: number;
  images: string[];
}

// ── Weekly newsletter HTML builder ────────────────────────────────────────────
function buildNewsletterHTML(
  locale: string,
  posts: BlogPost[],
  products: Product[]
): string {
  const isES = locale === "es";
  const storeUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aizua-store.vercel.app";
  const blogBaseUrl = `${storeUrl}/${locale}/blog`;
  const storeBaseUrl = `${storeUrl}/${locale}/products`;

  const postsHTML = posts.length
    ? posts
        .map(
          (p) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;">
          <a href="${blogBaseUrl}/${p.slug}" style="color:#3b82f6;font-weight:600;text-decoration:none;">${p.title}</a>
          ${p.excerpt ? `<p style="color:#64748b;font-size:14px;margin:4px 0 0;">${p.excerpt.slice(0, 120)}…</p>` : ""}
        </td>
      </tr>`
        )
        .join("")
    : `<tr><td style="color:#64748b;padding:12px 0;">${isES ? "No hay artículos nuevos esta semana." : "No new articles this week."}</td></tr>`;

  const productsHTML = products.length
    ? products
        .map(
          (p) => `
      <td style="width:33%;padding:8px;text-align:center;vertical-align:top;">
        ${p.images?.[0] ? `<img src="${p.images[0]}" alt="${p.name}" style="width:100%;max-width:160px;border-radius:8px;margin-bottom:8px;">` : ""}
        <div style="font-size:13px;font-weight:600;color:#1e293b;">${p.name}</div>
        <div style="font-size:14px;color:#3b82f6;margin:4px 0;">€${p.price.toFixed(2)}</div>
        <a href="${storeBaseUrl}/${p.slug}" style="font-size:12px;color:#64748b;">${isES ? "Ver producto" : "View product"} →</a>
      </td>`
        )
        .join("")
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

  <!-- Header -->
  <tr>
    <td style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:1px;">AizuaLabs</h1>
      <p style="color:#94a3b8;margin:8px 0 0;font-size:14px;">
        ${isES ? "Tu resumen semanal de tecnología y gadgets" : "Your weekly tech & gadgets digest"}
      </p>
    </td>
  </tr>

  <!-- Blog section -->
  <tr>
    <td style="padding:32px 40px 16px;">
      <h2 style="color:#1e293b;font-size:18px;margin:0 0 16px;">
        ${isES ? "📝 Artículos de esta semana" : "📝 This week's articles"}
      </h2>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${postsHTML}
      </table>
    </td>
  </tr>

  ${
    productsHTML
      ? `<!-- Products section -->
  <tr>
    <td style="padding:16px 40px 32px;">
      <h2 style="color:#1e293b;font-size:18px;margin:0 0 16px;">
        ${isES ? "⚡ Productos destacados" : "⚡ Featured products"}
      </h2>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>${productsHTML}</tr>
      </table>
    </td>
  </tr>`
      : ""
  }

  <!-- CTA -->
  <tr>
    <td style="padding:0 40px 32px;text-align:center;">
      <a href="${storeUrl}/${locale}" style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:15px;">
        ${isES ? "Ver toda la tienda →" : "Shop all products →"}
      </a>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background:#f1f5f9;padding:20px 40px;text-align:center;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">
        AizuaLabs · Málaga, España ·
        <a href="${storeUrl}/${locale}/legal/privacidad" style="color:#94a3b8;">
          ${isES ? "Cancelar suscripción" : "Unsubscribe"}
        </a>
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ── Weekly batch (cron Mon 09:00) ─────────────────────────────────────────────
async function runWeeklyNewsletter(): Promise<{
  campaigns_created: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let campaigns_created = 0;

  // Fetch last 7 days of blog posts
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: allPosts } = await supabase
    .from("blog_posts")
    .select("title, slug, excerpt, locale")
    .gte("created_at", weekAgo)
    .eq("status", "published")
    .limit(6);

  // Fetch 3 active products
  const { data: products } = await supabase
    .from("products")
    .select("name, slug, price, images")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(3);

  const featuredProducts = (products ?? []) as Product[];

  const SENDER = { email: "info@aizualabs.com", name: "AizuaLabs" };
  const today = new Date().toISOString().split("T")[0];

  for (const locale of ["es", "en"]) {
    const listId =
      locale === "es"
        ? Number(process.env.BREVO_LIST_NEWSLETTER_ES ?? "5")
        : Number(process.env.BREVO_LIST_NEWSLETTER_EN ?? "6");

    if (!listId) {
      errors.push(`Missing list ID for locale ${locale}`);
      continue;
    }

    const localePosts = ((allPosts ?? []) as BlogPost[]).filter(
      (p) => p.locale === locale || p.locale === "es" // fallback
    );

    const html = buildNewsletterHTML(locale, localePosts, featuredProducts);

    const campaignPayload = {
      name: `Newsletter AizuaLabs ${today} (${locale.toUpperCase()})`,
      subject:
        locale === "es"
          ? `🤖 AizuaLabs | Lo mejor de esta semana`
          : `🤖 AizuaLabs | Best of the week`,
      sender: SENDER,
      replyTo: "info@aizualabs.com",
      type: "classic",
      htmlContent: html,
      recipients: { listIds: [listId] },
    };

    // Create campaign
    const createRes = await fetch(BREVO_API + "/emailCampaigns", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY ?? "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(campaignPayload),
    });

    if (!createRes.ok) {
      const errBody = await createRes.json().catch(() => ({}));
      errors.push(`Campaign create (${locale}): ${JSON.stringify(errBody)}`);
      continue;
    }

    const { id: campaignId } = await createRes.json();

    // Send now
    const sendRes = await fetch(
      `${BREVO_API}/emailCampaigns/${campaignId}/sendNow`,
      {
        method: "POST",
        headers: {
          "api-key": process.env.BREVO_API_KEY ?? "",
          "Content-Type": "application/json",
        },
      }
    );

    if (!sendRes.ok) {
      const errBody = await sendRes.json().catch(() => ({}));
      errors.push(`Campaign send (${locale}): ${JSON.stringify(errBody)}`);
      continue;
    }

    campaigns_created++;
    console.log(`[newsletter] Sent ${locale} campaign ${campaignId}`);
  }

  return { campaigns_created, errors };
}

// ── GET /api/newsletter?weekly=true — Vercel cron (Mon 09:00) ─────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  if (searchParams.get("weekly") !== "true") {
    return NextResponse.json({ ok: true, message: "Newsletter API. Use POST to subscribe." });
  }

  // Cron auth
  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  if (auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runWeeklyNewsletter();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[newsletter-weekly]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// ── POST /api/newsletter — subscribe an email ─────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body: SubscribeBody = await req.json();
    const { email, locale = "es", source = "website" } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const listId =
      locale === "es"
        ? Number(process.env.BREVO_LIST_NEWSLETTER_ES ?? "5")
        : Number(process.env.BREVO_LIST_NEWSLETTER_EN ?? "6");

    const payload = {
      email,
      listIds: listId ? [listId] : [],
      attributes: {
        SOURCE: source,
        LOCALE: locale,
        SIGNUP_DATE: new Date().toISOString(),
      },
      updateEnabled: true,
    };

    const res = await fetch(BREVO_API + "/contacts", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY ?? "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (res.status === 204 || res.status === 201 || res.status === 200) {
      return NextResponse.json({
        ok: true,
        message:
          locale === "es" ? "Suscrito correctamente" : "Subscribed successfully",
      });
    }

    if (res.status === 400) {
      const data = await res.json();
      if (data.code === "duplicate_parameter") {
        return NextResponse.json({
          ok: true,
          message: locale === "es" ? "Ya estás suscrito" : "Already subscribed",
        });
      }
      return NextResponse.json(
        { error: data.message ?? "Brevo error" },
        { status: 400 }
      );
    }

    const errData = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: "Brevo error", detail: errData },
      { status: res.status }
    );
  } catch (err) {
    console.error("[newsletter]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
