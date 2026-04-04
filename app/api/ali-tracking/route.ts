// app/api/ali-tracking/route.ts
// Aizua — Polling de tracking de pedidos en AliExpress
// Llamado por n8n cada 12h para actualizar estado de pedidos en tránsito

import { NextRequest, NextResponse } from "next/server";
import { aliexpress } from "@/lib/aliexpress/client";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);

// Estados de AliExpress → estado interno Aizua
const STATUS_MAP: Record<string, string> = {
  "PLACE_ORDER_SUCCESS":    "processing",
  "WAIT_SELLER_SEND_GOODS": "processing",
  "SELLER_PART_SEND_GOODS": "processing",
  "WAIT_BUYER_ACCEPT_GOODS":"shipped",
  "IN_ISSUE":               "issue",
  "IN_FROZEN":              "frozen",
  "WAIT_SELLER_EXAMINE_MONEY": "shipped",
  "FINISH":                 "delivered",
  "IN_CANCEL":              "cancelled",
};

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (process.env.SYNC_SECRET_TOKEN && auth !== `Bearer ${process.env.SYNC_SECRET_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { checked: 0, shipped: 0, delivered: 0, errors: 0 };

  // Obtener pedidos en processing o shipped (sin tracking aún o en tránsito)
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .in("status", ["processing", "shipped"])
    .not("ali_order_id", "is", null);

  for (const order of orders ?? []) {
    try {
      results.checked++;
      const aliStatus = await aliexpress.getOrderStatus(order.ali_order_id);
      const newStatus = STATUS_MAP[aliStatus.order_status] ?? order.status;

      // ── NUEVO: Pedido enviado — obtener tracking ──
      if (newStatus === "shipped" && order.status !== "shipped") {
        const tracking = await aliexpress.getTracking(order.ali_order_id);

        await supabase.from("orders").update({
          status:           "shipped",
          tracking_number:  tracking.tracking_number,
          ali_status:       aliStatus.order_status,
          shipped_at:       new Date().toISOString(),
          updated_at:       new Date().toISOString(),
        }).eq("id", order.id);

        results.shipped++;

        // Email "¡Tu pedido está en camino!" al cliente
        const trackingUrl = `https://t.17track.net/en#nums=${tracking.tracking_number}`;
        await resend.emails.send({
          from:    process.env.RESEND_FROM_EMAIL || "Aizua <pedidos@aizua.com>",
          to:      order.customer_email,
          subject: "¡Tu pedido está en camino! 🚚",
          html:    buildShippingEmail(order, tracking.tracking_number, trackingUrl),
        });

        // Telegram
        await notifyTelegram(
          `🚚 *ENVIADO*: ${order.order_number}\n👤 ${order.customer_name}\nTracking: \`${tracking.tracking_number}\``
        );
      }

      // ── NUEVO: Pedido entregado ──
      else if (newStatus === "delivered" && order.status !== "delivered") {
        await supabase.from("orders").update({
          status:       "delivered",
          ali_status:   aliStatus.order_status,
          delivered_at: new Date().toISOString(),
          updated_at:   new Date().toISOString(),
        }).eq("id", order.id);

        results.delivered++;

        // Disparar solicitud de review en n8n (con delay de 3 días)
        if (process.env.N8N_REVIEW_WEBHOOK_URL) {
          fetch(process.env.N8N_REVIEW_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event: "request_review", order }),
          });
        }

        await notifyTelegram(`✅ *ENTREGADO*: ${order.order_number}\n👤 ${order.customer_name}`);
      }

      // ── Cualquier cambio de estado ──
      else if (newStatus !== order.status) {
        await supabase.from("orders").update({
          status:     newStatus,
          ali_status: aliStatus.order_status,
          updated_at: new Date().toISOString(),
        }).eq("id", order.id);
      }

      await new Promise(r => setTimeout(r, 500)); // Rate limit

    } catch {
      results.errors++;
    }
  }

  return NextResponse.json({ success: true, results });
}

// ── HELPERS ──

async function notifyTelegram(text: string) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) return;
  await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text, parse_mode: "Markdown" }),
    }
  ).catch(console.error);
}

function buildShippingEmail(order: Record<string, unknown>, tracking: string, trackingUrl: string): string {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#07070F;font-family:system-ui,sans-serif;">
<table width="100%" style="padding:40px 20px;"><tr><td align="center">
<table width="560" style="background:#0D0D1A;border-radius:16px;overflow:hidden;">
<tr><td style="padding:24px 36px;text-align:center;border-bottom:1px solid #1A1A2E;">
  <div style="font-size:26px;font-weight:900;color:#00C9B1;font-family:Arial;">AIZUA</div>
</td></tr>
<tr><td style="padding:32px 36px;text-align:center;">
  <div style="font-size:40px;margin-bottom:12px;">🚚</div>
  <h1 style="color:#F0F0F0;font-size:22px;margin:0 0 6px;">¡Tu pedido está en camino!</h1>
  <p style="color:#5A5A72;font-size:13px;margin:0;">${order.order_number}</p>
</td></tr>
<tr><td style="padding:0 36px 28px;">
  <div style="background:#111120;border-radius:10px;padding:16px 20px;margin-bottom:14px;">
    <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:#5A5A72;text-transform:uppercase;margin-bottom:4px;">Número de seguimiento</div>
    <div style="font-size:18px;font-weight:700;color:#00C9B1;font-family:monospace;">${tracking}</div>
  </div>
  <a href="${trackingUrl}" style="display:block;background:#00C9B1;color:#000;text-align:center;padding:14px;border-radius:10px;font-weight:700;text-decoration:none;font-size:14px;">🔍 Ver seguimiento</a>
  <p style="color:#5A5A72;font-size:11px;text-align:center;margin-top:10px;">El enlace puede tardar 24-48h en activarse · ¿Preguntas? hola@aizua.com</p>
</td></tr>
</table></td></tr></table>
</body></html>`;
}
