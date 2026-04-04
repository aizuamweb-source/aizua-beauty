// app/api/klaviyo-webhook/route.ts
// Aizua — Webhook entrante de Klaviyo
// Klaviyo puede enviarnos eventos cuando alguien abre un email, hace clic, etc.
// Útil para: detectar compradores muy comprometidos, actualizar Supabase, activar agente CRM

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const eventType = payload.type;
    const email     = payload.data?.attributes?.profile?.data?.attributes?.email;

    if (!email) return NextResponse.json({ ok: true });

    switch (eventType) {

      // Alguien hizo clic en un link de un email → cliente comprometido
      case "profile.clicked_email": {
        await supabase
          .from("newsletter_subscribers")
          .update({ last_click: new Date().toISOString(), engagement: "high" })
          .eq("email", email);
        break;
      }

      // Alguien se desuscribió → no volver a contactar
      case "profile.unsubscribed_from_list": {
        await supabase
          .from("newsletter_subscribers")
          .update({ active: false, unsubscribed_at: new Date().toISOString() })
          .eq("email", email);
        break;
      }

      // Alguien marcó como spam → crítico
      case "profile.marked_email_as_spam": {
        await supabase
          .from("newsletter_subscribers")
          .update({ active: false, spam_report: true })
          .eq("email", email);

        // Alerta Telegram
        if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
          await fetch(
            `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id:    process.env.TELEGRAM_CHAT_ID,
                text:       `⚠️ *SPAM REPORT*\n\n${email} marcó un email como spam. Revisar el contenido del último flow enviado.`,
                parse_mode: "Markdown",
              }),
            }
          ).catch(console.error);
        }
        break;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[klaviyo-webhook]", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
