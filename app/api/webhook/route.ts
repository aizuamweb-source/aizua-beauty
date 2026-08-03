// app/api/webhook/route.ts
// Aizua — Stripe Webhook Handler
// Handles payment confirmations, failures and refunds
// CRITICAL: Must be registered in Stripe Dashboard → Developers → Webhooks
// Endpoint: https://aizua.vercel.app/api/webhook
//
// Flujo tras payment_intent.succeeded:
//   1. Marcar order como "paid" en Supabase
//   2. Llamar ali-fulfill (fire-and-forget) → compra automática en AliExpress
//   3. Enviar email confirmación vía Resend
//   4. Registrar evento en Klaviyo (activa flows post-compra)
//   5. Actualizar acumulador OSS por país

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendOrderConfirmation } from "@/lib/emails/order-confirmation";
import { klaviyo } from "@/lib/klaviyo/client";
import { brevo } from "@/lib/brevo/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Helpers ──────────────────────────────────────────────────
async function notifyTelegram(text: string): Promise<void> {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) return;
  await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        chat_id:    process.env.TELEGRAM_CHAT_ID,
        text,
        parse_mode: "Markdown",
      }),
    }
  ).catch(() => null);
}

// Aviso instantáneo de pedido nuevo con botones de compra 1-tap (s187/½ sesión).
// Sin parse_mode: nombres de producto con '_','*','(' rompían Markdown (mismo bug
// que ya se corrigió en AG-39/AG-45). Backup diario: /api/order-summary (cron).
async function notifyNewOrder(order: {
  order_number: string;
  customer_name: string;
  total: number;
  items: Array<{ name: string; qty: number; price?: number; aliexpress_product_id?: string | null }>;
}): Promise<void> {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) return;

  const lines = [
    `🛒 PEDIDO NUEVO — AizuaBeauty`,
    `📋 #${order.order_number}`,
    `👤 ${order.customer_name}`,
    `💰 €${Number(order.total).toFixed(2)}`,
    "",
  ];
  const buttons: Array<{ text: string; url: string }> = [];
  for (const it of order.items) {
    const line = `  • ${it.name} x${it.qty}`;
    if (it.aliexpress_product_id) {
      const url = `https://www.aliexpress.com/item/${it.aliexpress_product_id}.html`;
      lines.push(`${line}\n    🔗 ${url}`);
      buttons.push({ text: `🛒 ${it.name.slice(0, 40)}`, url });
    } else {
      lines.push(`${line}\n    ⚠️ Sin link proveedor (producto sin aliexpress_id)`);
    }
  }
  lines.push("", "✅ Pago manual. Confirma y compra en AliExpress.");

  const payload: Record<string, unknown> = {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    text: lines.join("\n"),
    disable_web_page_preview: true,
  };
  if (buttons.length) {
    payload.reply_markup = { inline_keyboard: buttons.slice(0, 8).map(b => [b]) };
  }

  await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
  ).catch(() => null);
}

function getEstimatedDelivery(lang: string): string {
  const ranges: Record<string, string> = {
    es: "7-15 días hábiles",
    en: "7-15 business days",
    fr: "7-15 jours ouvrés",
    it: "7-15 giorni lavorativi",
  };
  return ranges[lang] || ranges.es;
}

// CRITICAL: Raw body required for Stripe signature verification
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {

      // ── PAYMENT SUCCEEDED ──────────────────────────────────
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.log(`[webhook] Payment succeeded: ${pi.id} — €${(pi.amount / 100).toFixed(2)}`);

        // 1. Marcar order como "paid" y obtener datos del pedido
        const { data: order, error: updateError } = await supabase
          .from("orders")
          .update({
            status:  "paid",
            paid_at: new Date().toISOString(),
          })
          .eq("stripe_payment_intent_id", pi.id)
          .select("id, order_number, customer_email, customer_name, items, subtotal, total, shipping_cost, shipping_address, locale")
          .single();

        if (updateError) {
          console.error("[webhook] Failed to update order:", updateError.message);
        }

        // 2. Llamar ali-fulfill directamente (fire-and-forget — no bloquear webhook)
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://store.aizua.com";
        fetch(`${appUrl}/api/ali-fulfill`, {
          method:  "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${process.env.SYNC_SECRET_TOKEN || ""}`,
          },
          body: JSON.stringify({ payment_intent_id: pi.id }),
        }).catch(err => console.error("[webhook] ali-fulfill fire error:", err));

        // 3. Email de confirmación vía Resend + Klaviyo (si tenemos datos del pedido)
        if (order) {
          const lang    = (order.locale as string) || "es";
          const items   = Array.isArray(order.items) ? order.items : [];
          const address = order.shipping_address as {
            firstName?: string; lastName?: string;
            address: string; city: string; postal: string; country: string;
          };

          // Aviso instantáneo Telegram con botones de compra (no esperar al cron diario
          // ni al arranque del PC de agent39_order_manager.py)
          notifyNewOrder({
            order_number: order.order_number,
            customer_name: order.customer_name,
            total: order.total,
            items,
          }).catch(err => console.error("[webhook] notifyNewOrder error:", err));

          // Email transaccional (Resend)
          sendOrderConfirmation({
            to:              order.customer_email,
            orderNumber:     order.order_number,
            customerName:    order.customer_name,
            items:           items.map((i: { name: string; qty: number; price: number; emoji?: string }) => ({
              name:  i.name,
              qty:   i.qty,
              price: i.price,
              emoji: i.emoji || "📦",
            })),
            subtotal:        order.subtotal,
            shipping:        order.shipping_cost,
            total:           order.total,
            shippingAddress: {
              address: address.address,
              city:    address.city,
              postal:  address.postal,
              country: address.country,
            },
            estimatedDelivery: getEstimatedDelivery(lang),
            lang,
          }).catch(err => console.error("[webhook] Resend error:", err));

          // Klaviyo — activa flow "Post-purchase"
          klaviyo.trackOrder(order.customer_email, {
            orderNumber: order.order_number,
            total:       order.total,
            items:       items.map((i: { id?: string; name: string; price: number; qty: number }) => ({
              id:    i.id || "",
              name:  i.name,
              price: i.price,
              qty:   i.qty,
            })),
            estimatedDelivery: getEstimatedDelivery(lang),
          }).catch(err => console.error("[webhook] Klaviyo error:", err));

          // Brevo: añadir/actualizar contacto como cliente (activa tag "cliente_tienda")
          brevo.addCustomer(order.customer_email, {
            firstName:  order.customer_name?.split(" ")[0],
            lang,
            country:    address.country,
            totalSpent: order.total,
          }).catch(err => console.error("[webhook] Brevo error:", err));

          // AizuaFinance: registrar transacción en tabla transactions
          const country = address.country?.toUpperCase() || "ES";
          const market = country === "ES" ? "ES"
                       : ["FR","DE","IT","PT","NL","BE","PL","SE","AT","IE"].includes(country) ? "EU"
                       : country === "GB" ? "UK"
                       : country === "US" ? "US"
                       : "LATAM";

          supabase.from("transactions").insert({
            source:           "stripe_beauty",
            tipo:             "ingreso",
            regimen:          "RG",
            importe_eur:      order.total,
            moneda_orig:      "EUR",
            iva_tipo:         country === "ES" ? 21 : 0,  // OSS: IVA del país destino cuando aplique
            order_id:         order.id,
            stripe_pi_id:     pi.id,
            customer_email:   order.customer_email,
            customer_country: country,
            market,
            sku_list:         items.map((i: { id?: string; name: string; price: number; qty: number }) => ({
              id: i.id, name: i.name, price: i.price, qty: i.qty,
            })),
            descripcion:      `Pedido ${order.order_number} — ${order.customer_name}`,
            estado:           "confirmado",
          }).then(() => null, err => console.error("[webhook] transactions insert error:", err));

          // OSS: refrescar acumulador de ventas B2C por país (async)
          if (country !== "ES") {
            supabase.rpc("refresh_b2c_sales_by_country").then(() => null, () => null);
          }
        }

        break;
      }

      // ── PAYMENT FAILED ─────────────────────────────────────
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.log(`[webhook] Payment failed: ${pi.id}`);

        await supabase
          .from("orders")
          .update({ status: "payment_failed", updated_at: new Date().toISOString() })
          .eq("stripe_payment_intent_id", pi.id);

        break;
      }

      // ── REFUND / DISPUTE ────────────────────────────────────
      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        console.log(`[webhook] Dispute opened: ${dispute.id}`);

        await notifyTelegram(
          `⚠️ *DISPUTA ABIERTA — AIZUA*\n\n` +
          `ID: \`${dispute.id}\`\n` +
          `Cantidad: €${(dispute.amount / 100).toFixed(2)}\n` +
          `Motivo: ${dispute.reason}\n\n` +
          `_Accede a Stripe Dashboard para responder antes del plazo._`
        );
        break;
      }

      // ── REFUND CREATED ─────────────────────────────────────
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const refundedAmount = (charge.amount_refunded / 100).toFixed(2);
        console.log(`[webhook] Charge refunded: ${charge.id} — €${refundedAmount}`);

        // Actualizar estado del pedido
        if (charge.payment_intent) {
          const piId = typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent.id;

          await supabase
            .from("orders")
            .update({ status: "refunded", updated_at: new Date().toISOString() })
            .eq("stripe_payment_intent_id", piId);
        }

        // AizuaFinance: marcar transacción como reembolsada
        if (charge.payment_intent) {
          const piId = typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent.id;
          supabase.from("transactions")
            .update({ estado: "reembolsado", updated_at: new Date().toISOString() })
            .eq("stripe_pi_id", piId)
            .then(() => null, () => null);
        }

        await notifyTelegram(
          `↩️ *REEMBOLSO PROCESADO — AIZUA*\n\nCantidad: €${refundedAmount}`
        );
        break;
      }

      // ── CHECKOUT SESSION ────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`[webhook] Checkout session completed: ${session.id}`);
        break;
      }

      default:
        console.log(`[webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[webhook] Handler error:", error);
    // Return 200 to prevent Stripe from retrying a handler error
    return NextResponse.json({ received: true, error: "Handler error" });
  }
}
