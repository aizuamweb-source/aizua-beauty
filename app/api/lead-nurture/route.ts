import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const BREVO_API = "https://api.brevo.com/v3";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ââ NURTURE EMAIL TEMPLATES âââââââââââââââââââââââââââââââââââââââââââ

const NURTURE_SUBJECTS: Record<number, Record<string, string>> = {
  1: {
    es: "Has explorado nuestra tienda? Tu cupon WELCOME10 te espera",
    en: "Have you explored our store? Your WELCOME10 coupon is waiting",
    fr: "Avez-vous explore notre boutique? Votre coupon WELCOME10 vous attend",
    de: "Hast du unseren Shop entdeckt? Dein WELCOME10-Gutschein wartet",
    pt: "Ja explorou a nossa loja? O seu cupao WELCOME10 esta a espera",
    it: "Hai esplorato il nostro negozio? Il tuo coupon WELCOME10 ti aspetta",
  },
  2: {
    es: "Ultimo recordatorio - tu cupon WELCOME10 expira pronto",
    en: "Last reminder - your WELCOME10 coupon expires soon",
    fr: "Dernier rappel - votre coupon WELCOME10 expire bientot",
    de: "Letzte Erinnerung - dein WELCOME10-Gutschein lauft bald ab",
    pt: "Ultimo lembrete - o seu cupao WELCOME10 expira em breve",
    it: "Ultimo promemoria - il tuo coupon WELCOME10 scade presto",
  },
  3: {
    es: "Aprende a vender como AizuaLabs — cursos de e-commerce e IA",
    en: "Learn to sell like AizuaLabs — e-commerce and AI courses",
    fr: "Apprenez a vendre comme AizuaLabs — cours e-commerce et IA",
    de: "Verkaufen wie AizuaLabs — E-Commerce und KI-Kurse",
    pt: "Aprenda a vender como AizuaLabs — cursos de e-commerce e IA",
    it: "Impara a vendere come AizuaLabs — corsi e-commerce e IA",
  },
};

function buildNurtureEmail(step: number, locale: string): string {
  const isEs = locale === "es";
  const storeUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aizua-store.vercel.app";
  const academyUrl = storeUrl + "/" + locale + "/academy";

  const title = step === 1
    ? (isEs ? "Hola de nuevo! Tu cupon sigue activo ð" : "Hey again! Your coupon is still active ð")
    : step === 2
    ? (isEs ? "Ultima oportunidad para tu 10% de descuento â°" : "Last chance for your 10% discount â°")
    : (isEs ? "¿Sabias que tienes acceso a formacion gratuita de AizuaLabs?" : "Did you know you have access to free AizuaLabs training?");

  const body = step === 1
    ? (isEs
        ? "Notamos que aun no has realizado tu primer pedido. Recuerda que tienes un 10% de descuento esperandote con el cupon WELCOME10. Tenemos gadgets premium con envio rapido a toda Europa."
        : "We noticed you haven't placed your first order yet. Remember you have a 10% discount waiting with coupon WELCOME10. We have premium gadgets with fast shipping across Europe.")
    : step === 2
    ? (isEs
        ? "Este es nuestro ultimo recordatorio: tu cupon WELCOME10 sigue activo pero no queremos molestarte mas. Aprovechalo cuando lo necesites."
        : "This is our last reminder: your WELCOME10 coupon is still active but we don't want to bother you further. Use it whenever you need.")
    : (isEs
        ? "En AizuaLabs Academy encontrarás cursos prácticos de e-commerce, dropshipping e IA aplicada. Los mismos métodos que usamos para construir nuestra tienda y automatizar ventas."
        : "At AizuaLabs Academy you'll find practical courses on e-commerce, dropshipping and applied AI. The same methods we use to build our store and automate sales.");

  const cta = step === 1
    ? (isEs ? "Ver productos ahora" : "Browse products now")
    : step === 2
    ? (isEs ? "Usar mi cupon" : "Use my coupon")
    : (isEs ? "Ver cursos gratis" : "Browse free courses");

  const ctaUrl = step === 3 ? academyUrl : storeUrl;

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
    "<div style=\"background:#f0f9ff;border:2px dashed #3b82f6;border-radius:10px;padding:20px;text-align:center;margin:0 0 24px;\">" +
    "<p style=\"font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;\">Cupon / Coupon</p>" +
    "<span style=\"font-size:30px;font-weight:900;letter-spacing:4px;color:#0f172a;\">WELCOME10</span>" +
    "<p style=\"font-size:14px;color:#3b82f6;font-weight:700;margin:6px 0 0;\">10% OFF</p>" +
    "</div>" +
    "<a href=\"" + ctaUrl + "\" style=\"display:inline-block;background:#3b82f6;color:#fff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:8px;text-decoration:none;\">" + cta + "</a>" +
    "</td></tr>" +
    "<tr><td style=\"background:#f8fafc;padding:20px 32px;text-align:center;\">" +
    "<p style=\"font-size:11px;color:#94a3b8;margin:0;\">AizuaLabs &middot; Malaga, Espana &middot; info@aizualabs.com</p>" +
    "</td></tr></table></td></tr></table></body></html>"
  );
}

async function sendTransactional(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const res = await fetch(BREVO_API + "/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { email: "info@aizualabs.com", name: "Aizua" },
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

// ââ GET ?run=true â Vercel cron (daily 11:00) âââââââââââââââââââââââââ

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("run") !== "true") {
    return NextResponse.json({ ok: true, info: "Use ?run=true to trigger nurture sequence" });
  }

  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  if (auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date().toISOString();

  const { data: pending, error } = await supabase
    .from("lead_nurturing")
    .select("*")
    .lte("next_send_at", now)
    .is("completed_at", null)
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  let completed = 0;
  const errors: string[] = [];

  for (const lead of pending ?? []) {
    try {
      const subjects = NURTURE_SUBJECTS[lead.step as 1 | 2 | 3];
      const subject = subjects?.[lead.locale] ?? subjects?.["en"] ?? "Your exclusive offer";
      const html = buildNurtureEmail(lead.step, lead.locale);

      const ok = await sendTransactional(lead.email, subject, html);
      if (!ok) {
        errors.push("send_failed: " + lead.email);
        continue;
      }
      sent++;

      if (lead.step === 1) {
        // Schedule step 2 in 48h
        const next48h = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
        await supabase
          .from("lead_nurturing")
          .update({ step: 2, next_send_at: next48h })
          .eq("id", lead.id);
      } else if (lead.step === 2) {
        // Schedule step 3 (Academy upsell) in 4 days
        const next4d = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString();
        await supabase
          .from("lead_nurturing")
          .update({ step: 3, next_send_at: next4d })
          .eq("id", lead.id);
      } else {
        // Step 3 done — mark completed
        await supabase
          .from("lead_nurturing")
          .update({ completed_at: now })
          .eq("id", lead.id);
        completed++;
      }
    } catch (e: any) {
      errors.push(lead.email + ": " + e.message);
    }
  }

  return NextResponse.json({
    ok: true,
    processed: pending?.length ?? 0,
    sent,
    completed,
    errors,
  });
}
