import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BREVO_API = "https://api.brevo.com/v3";
const STORE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://aizua-store.vercel.app";

const REVIEW_SUBJECTS: Record<string, string> = {
  es: "Â¿QuÃ© tal tu pedido? CuÃ©ntanos tu experiencia",
  en: "How was your order? Share your experience",
  fr: "Comment Ã©tait votre commande? Partagez votre avis",
  de: "Wie war Ihre Bestellung? Teilen Sie Ihre Erfahrung",
  pt: "Como foi o seu pedido? Partilhe a sua experiÃªncia",
  it: "Com'Ã¨ stato il tuo ordine? Condividi la tua esperienza",
};

function buildReviewEmail(locale: string, orderNumber: string, productName: string): string {
  const isEs = locale === "es";
  const reviewUrl = STORE_URL + "/" + locale + "/review?order=" + orderNumber;

  const title = isEs ? "Gracias por tu compra en AizÃ¼a" : "Thank you for your AizÃ¼a purchase";
  const body = isEs
    ? "Tu pedido <strong>#" + orderNumber + "</strong> ha llegado. Esperamos que estÃ©s disfrutando de tu " + productName + ". Tu opiniÃ³n nos ayuda a mejorar y a otros clientes a elegir."
    : "Your order <strong>#" + orderNumber + "</strong> has arrived. We hope you're enjoying your " + productName + ". Your review helps us improve and helps other customers choose.";
  const cta = isEs ? "Dejar mi reseÃ±a (30 seg)" : "Leave my review (30 sec)";
  const stars = "â¢ï¸â¢ï¸â¢ï¸â¢ï¸â¢ï¸";

  return (
    "<!DOCTYPE html><html><head><meta charset=\"utf-8\"></head>" +
    "<body style=\"margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;\">" +
    "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"padding:40px 20px;\"><tr><td align=\"center\">" +
    "<table width=\"580\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#fff;border-radius:12px;overflow:hidden;\">" +
    "<tr><td style=\"background:#0f172a;padding:24px 32px;text-align:center;\">" +
    "<span style=\"font-size:24px;font-weight:900;color:#fff;\">Aiz<span style=\"color:#3b82f6;\">u</span>a</span>" +
    "</td></tr>" +
    "<tr><td style=\"padding:36px 32px;\">" +
    "<h1 style=\"font-size:22px;font-weight:800;color:#0f172a;margin:0 0 16px;\">" + title + "</h1>" +
    "<p style=\"font-size:15px;color:#475569;line-height:1.6;margin:0 0 24px;\">" + body + "</p>" +
    "<div style=\"text-align:center;font-size:32px;margin:0 0 24px;\">" + stars + "</div>" +
    "<a href=\"" + reviewUrl + "\" style=\"display:inline-block;background:#3b82f6;color:#fff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:8px;text-decoration:none;\">" + cta + "</a>" +
    "<hr style=\"border:none;border-top:1px solid #e2e8f0;margin:32px 0;\">" +
    "<div style=\"background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:22px;\">" +
    "<p style=\"font-size:11px;color:#16a34a;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin:0 0 8px;\">AizuaLabs Academy</p>" +
    "<h2 style=\"font-size:17px;font-weight:800;color:#0f172a;margin:0 0 10px;\">" + (isEs ? "¿Quieres aprender a vender online como lo hace Aizüa?" : "Want to learn to sell online like Aizüa?") + "</h2>" +
    "<p style=\"font-size:13px;color:#475569;line-height:1.6;margin:0 0 16px;\">" + (isEs ? "Cursos prácticos de e-commerce, dropshipping e IA. Lo mismo que usamos en AizuaLabs." : "Practical e-commerce, dropshipping and AI courses. The same we use at AizuaLabs.") + "</p>" +
    "<a href=\"" + STORE_URL + "/" + locale + "/academy\" style=\"display:inline-block;background:#16a34a;color:#fff;font-size:13px;font-weight:700;padding:11px 26px;border-radius:8px;text-decoration:none;\">" + (isEs ? "Ver cursos" : "Browse courses") + "</a>" +
    "</div>" +
    "</td></tr>" +
    "<tr><td style=\"background:#f8fafc;padding:20px 32px;text-align:center;\">" +
    "<p style=\"font-size:11px;color:#94a3b8;margin:0;\">AizuaLabs &middot; Malaga, Espana &middot; info@aizualabs.com</p>" +
    "</td></tr></table></td></tr></table></body></html>"
  );
}

async function sendReviewEmail(to: string, locale: string, orderNumber: string, productName: string): Promise<boolean> {
  try {
    const subject = REVIEW_SUBJECTS[locale] ?? REVIEW_SUBJECTS["en"];
    const html = buildReviewEmail(locale, orderNumber, productName);
    const res = await fetch(BREVO_API + "/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { email: "info@aizualabs.com", name: "AizÃ¼a" },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("run") !== "true") {
    return NextResponse.json({ ok: true, info: "Use ?run=true to trigger review requests" });
  }

  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  if (auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Orders delivered ~7 days ago, no review request sent
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, order_number, customer_email, locale, items, review_requested_at")
    .in("status", ["delivered", "completed", "shipped"])
    .gte("created_at", eightDaysAgo)
    .lte("created_at", sevenDaysAgo)
    .is("review_requested_at", null)
    .limit(30);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const order of orders ?? []) {
    try {
      const email = order.customer_email;
      if (!email) continue;

      const locale = order.locale ?? "es";
      const orderNumber = order.order_number ?? order.id.slice(0, 8).toUpperCase();

      // Get first product name from items
      let productName = "tu producto";
      try {
        const items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
        if (items && items[0]) productName = items[0].name ?? items[0].title ?? productName;
      } catch { /* ignore */ }

      const ok = await sendReviewEmail(email, locale, orderNumber, productName);
      if (!ok) { errors.push("send_failed: " + email); continue; }

      // Mark review requested
      await supabase
        .from("orders")
        .update({ review_requested_at: new Date().toISOString() })
        .eq("id", order.id);

      sent++;
    } catch (e: any) {
      errors.push(order.id + ": " + e.message);
    }
  }

  return NextResponse.json({
    ok: true,
    candidates: orders?.length ?? 0,
    sent,
    errors,
  });
}
