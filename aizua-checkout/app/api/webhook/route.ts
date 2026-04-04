// app/api/webhook/route.ts
// Aizua — Stripe Webhook Handler
// Handles payment confirmations, failures and refunds
// CRITICAL: Must be registered in Stripe Dashboard → Developers → Webhooks
// Endpoint: https://aizua.vercel.app/api/webhook

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { buildOrderConfirmationEmail } from "@/lib/emails/order-confirmation";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role for webhook (bypasses RLS)
);
const resend = new Resend(process.env.RESEND_API_KEY);

// CRITICAL: Raw body required for Stripe signature verification
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

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

      // ── PAYMENT SUCCEEDED ──
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.log(`[webhook] Payment succeeded: ${pi.id} — €${(pi.amount / 100).toFixed(2)}`);

        // 1. Update order status in Supabase and fetch the order
        const { data: order, error: updateError } = await supabase
          .from("orders")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            stripe_payment_intent_id: pi.id,
          })
          .eq("stripe_payment_intent_id", pi.id)
          .select()
          .single();

        if (updateError || !order) {
          console.error("[webhook] Failed to update order:", updateError);
          break;
        }

        // 2. Trigger AliExpress fulfillment directly (fire-and-forget)
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aizua-store.vercel.app";
        fetch(`${appUrl}/api/ali-fulfill`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentIntentId: pi.id }),
        }).catch(err => console.error("[webhook] ali-fulfill error:", err));

        // 3. Send order confirmation email via Resend
        const { subject, html } = buildOrderConfirmationEmail(order);
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "Aizua <pedidos@aizua.com>",
          to:   order.customer_email,
          subject,
          html,
        }).catch(err => console.error("[webhook] Resend error:", err));

        console.log(`[webhook] Order ${order.order_number} confirmed, fulfillment triggered`);
        break;
      }

      // ── PAYMENT FAILED ──
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.log(`[webhook] Payment failed: ${pi.id}`);

        await supabase
          .from("orders")
          .update({
            status: "payment_failed",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_payment_intent_id", pi.id);

        break;
      }

      // ── REFUND / DISPUTE ──
      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        console.log(`[webhook] Dispute opened: ${dispute.id}`);

        // Alert via Telegram bot (or email)
        if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
          await fetch(
            `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: process.env.TELEGRAM_CHAT_ID,
                text: `⚠️ *DISPUTA ABIERTA*\nDisputa: ${dispute.id}\nCantidad: €${(dispute.amount / 100).toFixed(2)}\nMotivo: ${dispute.reason}`,
                parse_mode: "Markdown",
              }),
            }
          );
        }
        break;
      }

      // ── CHECKOUT SESSION (for future Stripe Checkout fallback) ──
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

// IMPORTANT: Disable body parsing for webhook route
// This is handled automatically in Next.js App Router (raw body via req.text())
