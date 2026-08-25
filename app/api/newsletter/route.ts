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
  const storeUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://beauty.aizualabs.com";
  const blogBaseUrl = `${storeUrl}/${locale}/blog`;
  // La ruta real es /[locale]/product/[slug] — SINGULAR (app/[locale]/product/).
  // Estaba en plural y TODOS los enlaces "Ver producto" de la newsletter daban
  // 404 al cliente. Verificado en produccion el 17/08: /es/products/<slug> -> 404,
  // /es/product/<slug> -> 200. (s243)
  const storeBaseUrl = `${storeUrl}/${locale}/product`;

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
      <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:1px;">AizuaBeauty</h1>
      <p style="color:#e8c4ce;margin:8px 0 0;font-size:14px;">
        ${isES ? "Tu dosis semanal de belleza y bienestar" : "Your weekly beauty & wellness digest"}
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

  <!-- ── AVISO DE SUSCRIPCION ─────────────────────────────────────────────────
       s262: esta era la UNICA de las cuatro newsletters sin el bloque, y su
       "Cancelar suscripcion" apuntaba a /legal/privacidad — o sea que no daba
       de baja de nada. Una newsletter de marketing cuyo enlace de baja no da de
       baja es peor que una sin enlace: aparenta cumplir.
       {{ unsubscribe }} es el merge tag nativo de Brevo y SOLO funciona en
       campanas — la newsletter lo es, asi que aqui es la baja buena. -->
  <tr>
    <td style="padding:0 40px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
        <tr><td style="padding:16px 18px;">
          <p style="margin:0 0 8px;font-size:10px;letter-spacing:1.2px;color:#94a3b8;font-weight:700;">
            ${isES ? "POR QUÉ RECIBES ESTO" : "WHY YOU ARE RECEIVING THIS"}
          </p>
          <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#475569;">
            ${isES ? "Recibes esto porque nos dejaste tu correo al comprar en AizuaBeauty o al suscribirte a la newsletter. Te escribimos de vez en cuando sobre belleza, cuidado personal y complementos: nada más, y nunca cedemos tu correo a nadie." : "You are receiving this because you left us your email when buying from AizuaBeauty or when subscribing to the newsletter. We write every now and then about beauty, personal care and accessories: nothing else, and we never share your email."}
          </p>
          <p style="margin:0 0 10px;font-size:12px;line-height:1.6;color:#475569;">
            ${isES ? "Si prefieres no recibirla, " : "If you would rather not receive it, "}<a href="{{ unsubscribe }}" style="color:#0284c7;font-weight:600;text-decoration:underline;">${isES ? "date de baja aquí" : "unsubscribe here"}</a>${isES ? " — es un clic." : " — one click."}
          </p>
          <p style="margin:0;font-size:10px;line-height:1.55;color:#94a3b8;">
            ${isES ? "Responsable: AizuaLabs (Málaga, España). Puedes acceder, rectificar, suprimir, oponerte o pedir la portabilidad de tus datos escribiendo a info@aizualabs.com, y reclamar ante la AEPD." : "Controller: AizuaLabs (Málaga, Spain). You can access, rectify, erase, object to or port your data by writing to info@aizualabs.com, and lodge a complaint with the Spanish DPA (AEPD)."}
            <a href="https://beauty.aizualabs.com/es/legal/privacidad" style="color:#94a3b8;text-decoration:underline;">${isES ? "Política de privacidad" : "Privacy policy"}</a>.
          </p>
        </td></tr>
      </table>
    </td>
  </tr>
  <!-- Footer -->
  <tr>
    <td style="background:#f1f5f9;padding:20px 40px;text-align:center;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">
        AizuaBeauty · beauty.aizualabs.com ·
        <a href="{{ unsubscribe }}" style="color:#94a3b8;text-decoration:underline;">
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

  // Fetch last 7 days of beauty blog posts only
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: allPosts } = await supabase
    .from("blog_posts")
    .select("title, slug, excerpt, locale")
    .gte("created_at", weekAgo)
    .eq("status", "published")
    .eq("brand", "beauty")   // ← only beauty posts
    .limit(6);

  // Fetch 3 active beauty products (not Ringana — those link externally)
  const { data: products } = await supabase
    .from("products")
    .select("name, slug, price, images")
    .eq("active", true)
    .eq("store", "beauty")            // ← only beauty products
    .neq("supplier", "ringana")       // ← Ringana products link externally
    .order("sort_order", { ascending: true })
    .limit(3);

  const featuredProducts = (products ?? []) as Product[];

  const SENDER = { email: "info@aizualabs.com", name: "AizuaBeauty" };
  const today = new Date().toISOString().split("T")[0];

  for (const locale of ["es", "en"]) {
    // Beauty newsletter uses its own dedicated lists #11/#12
    const listId =
      locale === "es"
        ? Number(process.env.BREVO_LIST_BEAUTY_ES ?? "11")
        : Number(process.env.BREVO_LIST_BEAUTY_EN ?? "12");

    if (!listId) {
      errors.push(`Missing list ID for locale ${locale}`);
      continue;
    }

    const localePosts = ((allPosts ?? []) as BlogPost[]).filter(
      (p) => p.locale === locale || p.locale === "es" // fallback
    );

    const html = buildNewsletterHTML(locale, localePosts, featuredProducts);

    const campaignPayload = {
      name: `Newsletter AizuaBeauty ${today} (${locale.toUpperCase()})`,
      subject:
        locale === "es"
          ? `🌿 AizuaBeauty | Tu dosis de belleza de esta semana`
          : `🌿 AizuaBeauty | Your beauty picks this week`,
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

// ── Telegram helper ───────────────────────────────────────────────────────────
async function sendTelegram(msg: string, replyMarkup?: object): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat  = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  const body: Record<string, unknown> = { chat_id: chat, text: msg, parse_mode: "HTML" };
  if (replyMarkup) body.reply_markup = replyMarkup;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  }).catch(() => {});
}

async function sendBrevoCampaignBeauty(
  subject: string, html: string, locale: string, listId: number
): Promise<{ ok: boolean; campaignId?: number; error?: string }> {
  const brevoKey = process.env.BREVO_API_KEY ?? "";
  const today = new Date().toISOString().split("T")[0];
  const createRes = await fetch(`${BREVO_API}/emailCampaigns`, {
    method: "POST",
    headers: { "api-key": brevoKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      name:        `Newsletter AizuaBeauty ${today} (${locale.toUpperCase()})`,
      subject,
      htmlContent: html,
      sender:      { email: "info@aizualabs.com", name: "AizuaBeauty" },
      replyTo:     "info@aizualabs.com",
      type:        "classic",
      recipients:  { listIds: [listId] },
    }),
  });
  if (!createRes.ok) return { ok: false, error: (await createRes.text()).slice(0, 200) };
  const { id: campaignId } = await createRes.json();
  const sendRes = await fetch(`${BREVO_API}/emailCampaigns/${campaignId}/sendNow`, {
    method: "POST", headers: { "api-key": brevoKey, "Content-Type": "application/json" },
  });
  if (!sendRes.ok) return { ok: false, campaignId, error: (await sendRes.text()).slice(0, 200) };
  return { ok: true, campaignId };
}

// ── GET /api/newsletter — Vercel cron + manual ────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  const isAuthorized = auth === process.env.CRON_SECRET || auth === process.env.SYNC_SECRET_TOKEN;

  if (!isAuthorized) {
    if (searchParams.get("weekly") !== "true" && !searchParams.get("send_draft")) {
      return NextResponse.json({ ok: true, message: "Beauty Newsletter API. Use POST to subscribe." });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Modo: enviar borrador aprobado ───────────────────────────────────────────
  const sendDraftId = searchParams.get("send_draft");
  if (sendDraftId) {
    const { data: draft } = await supabase
      .from("content_outputs").select("*")
      .eq("id", sendDraftId).eq("status", "pending_newsletter").single();

    if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

    const content = JSON.parse(draft.content ?? "{}") as { subjects: Record<string, string>; htmls: Record<string, string> };

    let sentCount = 0;
    for (const locale of ["es", "en"]) {
      // Lists #11/#12 dedicated to beauty (NOT shared with tech store #5/#6)
      const listId = locale === "es"
        ? Number(process.env.BREVO_LIST_BEAUTY_ES ?? "11")
        : Number(process.env.BREVO_LIST_BEAUTY_EN ?? "12");
      const result = await sendBrevoCampaignBeauty(content.subjects[locale], content.htmls[locale], locale, listId);
      if (result.ok) sentCount++;
    }

    await supabase.from("content_outputs").update({
      status: sentCount > 0 ? "sent_newsletter" : "error_newsletter",
      published_ig_at: new Date().toISOString(),
    }).eq("id", sendDraftId);

    await sendTelegram(
      sentCount > 0
        ? `✅ <b>Newsletter AizuaBeauty enviada</b>\n${sentCount} idioma(s)\n📋 Listas #11 (Beauty ES) + #12 (Beauty EN)`
        : `❌ <b>Error enviando newsletter beauty</b>`
    );

    return NextResponse.json({ ok: sentCount > 0, sent_campaigns: sentCount });
  }

  // ── Modo: generar borrador + pedir aprobación Telegram ───────────────────────
  if (searchParams.get("weekly") !== "true") {
    return NextResponse.json({ ok: true, message: "Beauty Newsletter API. Use POST to subscribe." });
  }

  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: allPosts } = await supabase.from("blog_posts")
      .select("title, slug, excerpt, locale")
      .gte("created_at", weekAgo).eq("status", "published").eq("brand", "beauty").limit(6);

    const { data: products } = await supabase.from("products")
      .select("name, slug, price, images")
      .eq("active", true).eq("store", "beauty").neq("supplier", "ringana")
      .order("sort_order", { ascending: true }).limit(3);

    const subjects: Record<string, string> = {};
    const htmls:    Record<string, string> = {};

    for (const locale of ["es", "en"]) {
      const localePosts = ((allPosts ?? []) as BlogPost[]).filter(p => p.locale === locale || p.locale === "es");
      subjects[locale] = locale === "es"
        ? `🌿 AizuaBeauty | Tu dosis de belleza de esta semana`
        : `🌿 AizuaBeauty | Your beauty picks this week`;
      htmls[locale]    = buildNewsletterHTML(locale, localePosts, (products ?? []) as Product[]);
    }

    const { data: draftRow } = await supabase.from("content_outputs").insert({
      content_type: "newsletter_draft",
      brand:        "beauty",
      locale:       "es",
      status:       "pending_newsletter",
      content:      JSON.stringify({ subjects, htmls }),
      metadata:     { brevo_list_es: 11, brevo_list_en: 12, posts: (allPosts ?? []).length, products: (products ?? []).length },
    }).select("id").single();

    const draftId  = draftRow?.id ?? "unknown";
    const postCount = (allPosts ?? []).length;
    const prodCount = (products ?? []).length;

    await sendTelegram(
      `🌸 <b>Borrador — Newsletter AizuaBeauty</b>\n\n` +
      `📰 Posts beauty esta semana: ${postCount}\n` +
      `🛍 Productos beauty destacados: ${prodCount}\n` +
      `📋 Listas: #11 (Beauty ES) + #12 (Beauty EN)\n\n` +
      `⚠️ El email NO se ha enviado aún. Confirma para enviar.`,
      {
        inline_keyboard: [[
          { text: "✅ Enviar newsletter Beauty", callback_data: `newsletter_pub_${draftId}` },
          { text: "❌ Cancelar",                 callback_data: `newsletter_disc_${draftId}` },
        ]]
      }
    );

    return NextResponse.json({
      ok: true, status: "draft_pending_approval", draft_id: draftId,
      posts: postCount, products: prodCount,
      message: "Borrador guardado — esperando aprobación Telegram antes de enviar a Brevo",
    });
  } catch (err) {
    console.error("[newsletter-weekly-beauty]", err);
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

    // s261: esto apuntaba a BREVO_LIST_NEWSLETTER_ES/_EN, que son las listas 5 y
    // 6 de AizuaTec — en el MISMO fichero cuyas campanas salen a las 11/12 de
    // beauty. O sea que quien se suscribia aqui entraba en la lista de gadgets y
    // la newsletter de beauty se mandaba a una lista que quedaba vacia para
    // siempre. No es solo un cruce: mandar contenido de gadgets a quien pidio
    // belleza rompe el requisito de "productos similares" del art. 21.2 LSSI.
    const listId =
      locale === "es"
        ? Number(process.env.BREVO_LIST_BEAUTY_ES ?? "11")
        : Number(process.env.BREVO_LIST_BEAUTY_EN ?? "12");

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
