import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-06-20",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

// POST /api/webhooks/stripe
// Receives Stripe events and:
// 1. Inserts paid orders into Supabase (orders table)
// 2. Tracks B2C sales by country for OSS compliance
// 3. Queues fulfillment tasks
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error("[stripe-webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSucceeded(pi);
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.warn("[stripe-webhook] payment failed:", pi.id);
        break;
      }
      default:
        console.log("[stripe-webhook] unhandled event:", event.type);
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[stripe-webhook] handler error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });

  const items = lineItems.data.map((item) => ({
    product_id: (item.price?.product as string) ?? null,
    name: item.description ?? "",
    qty: item.quantity ?? 1,
    unit_price: (item.price?.unit_amount ?? 0) / 100,
    total: (item.amount_total ?? 0) / 100,
  }));

  const country = session.customer_details?.address?.country ?? "";
  const orderData = {
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: session.payment_intent as string,
    customer_email: session.customer_details?.email ?? "",
    customer_name: session.customer_details?.name ?? "",
    amount_total: (session.amount_total ?? 0) / 100,
    currency: session.currency ?? "eur",
    source: "stripe_tienda",
    market: detectMarket(country),
    country,
    items,
    status: "paid",
    created_at: new Date().toISOString(),
  };

  const { error: orderError } = await supabase.from("orders").insert(orderData);
  if (orderError) console.error("[stripe-webhook] order insert:", orderError.message);

  // OSS tracking: only non-ES B2C EU sales
  if (country && country !== "ES") {
    await upsertOssSales(country, orderData.amount_total, new Date().getFullYear());
  }

  // Queue fulfillment
  await queueFulfillment(session.id, items, orderData.customer_email);

  console.log("[stripe-webhook] checkout.session.completed:", session.id, orderData.amount_total + orderData.currency);
}

async function handlePaymentSucceeded(pi: Stripe.PaymentIntent) {
  await supabase
    .from("orders")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("stripe_payment_intent_id", pi.id);
}

async function upsertOssSales(country: string, amount: number, year: number) {
  const { data: existing } = await supabase
    .from("b2c_sales_by_country")
    .select("id, total_revenue")
    .eq("country_code", country)
    .eq("year", year)
    .single();

  if (existing) {
    await supabase
      .from("b2c_sales_by_country")
      .update({ total_revenue: (existing.total_revenue ?? 0) + amount })
      .eq("id", existing.id);
  } else {
    await supabase.from("b2c_sales_by_country").insert({
      country_code: country,
      year,
      total_revenue: amount,
    });
  }
}

async function queueFulfillment(
  sessionId: string,
  items: { product_id: string | null; qty: number }[],
  email: string
) {
  const tasks = items.map((item) => ({
    order_source: "stripe",
    order_ref: sessionId,
    product_id: item.product_id,
    qty: item.qty,
    customer_email: email,
    status: "pending",
    created_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from("fulfillment_queue").insert(tasks);
  if (error) console.warn("[stripe-webhook] fulfillment queue:", error.message);
}

function detectMarket(country: string): string {
  const eu = ["DE", "FR", "IT", "PT", "NL", "BE", "AT", "PL", "SE", "DK", "FI", "IE", "GR", "CZ", "HU", "RO"];
  if (country === "ES") return "es";
  if (eu.includes(country)) return "eu";
  if (country === "US") return "us";
  return "other";
}
