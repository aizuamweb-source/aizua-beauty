import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-06-20",
});

const WEBHOOK_SECRET  = process.env.STRIPE_BEAUTY_AF_WEBHOOK_SECRET!;
const APPS_SCRIPT_URL = process.env.AIZUAFINANCE_APPS_SCRIPT_URL!;
const SYNC_SECRET     = process.env.AIZUAFINANCE_SYNC_SECRET!;

/**
 * G1b — Stripe Beauty Store → AizuaFinance sync
 * Endpoint dedicado. No modifica el webhook principal de pedidos beauty.
 *
 * Entidad: "aizuabeauty"
 *
 * Setup Stripe (una sola vez):
 * Dashboard → Webhooks → Add endpoint → beauty.aizualabs.com/api/aizuafinance-store-sync
 * → Eventos: checkout.session.completed → STRIPE_BEAUTY_AF_WEBHOOK_SECRET en Vercel beauty
 */
export async function POST(req: NextRequest) {
  if (!WEBHOOK_SECRET) {
    console.error("[aizuafinance-beauty-sync] STRIPE_BEAUTY_AF_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "misconfigured" }, { status: 500 });
  }
  if (!APPS_SCRIPT_URL || !SYNC_SECRET) {
    console.error("[aizuafinance-beauty-sync] AIZUAFINANCE_APPS_SCRIPT_URL or AIZUAFINANCE_SYNC_SECRET not set");
    return NextResponse.json({ error: "misconfigured" }, { status: 500 });
  }

  const body = await req.text();
  const sig  = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error("[aizuafinance-beauty-sync] Invalid signature:", err);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true, skipped: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (!session.amount_total || session.amount_total === 0 || session.payment_status !== "paid") {
    return NextResponse.json({ received: true, skipped: true, reason: "zero_or_unpaid" });
  }

  const amountEur = session.amount_total / 100;
  const paidAt    = new Date(session.created * 1000).toISOString().slice(0, 10);
  const email     = session.customer_details?.email ?? "";
  const country   = session.customer_details?.address?.country ?? "";

  let description = "";
  try {
    const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 });
    description = items.data.map((i) => i.description ?? "").filter(Boolean).join(", ");
  } catch { /* no bloqueante */ }
  if (!description) description = `Pedido Beauty Store${country ? ` · ${country}` : ""}`;

  const payload = {
    stripe_invoice_id: session.id,
    amount_eur:        amountEur,
    currency:          (session.currency ?? "eur").toUpperCase(),
    customer_email:    email,
    paid_at:           paidAt,
    description:       description.substring(0, 200),
    plan_slug:         country,
    entity:            "aizuabeauty",
    _secret:           SYNC_SECRET,
  };

  let forwarded = false;
  let forwardError = "";

  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json", "x-aizuafinance-secret": SYNC_SECRET },
      body:    JSON.stringify(payload),
    });
    if (res.ok) forwarded = true;
    else forwardError = `HTTP ${res.status}: ${(await res.text().catch(() => "")).substring(0, 200)}`;
  } catch (err) {
    forwardError = String(err);
  }

  if (!forwarded) {
    console.error("[aizuafinance-beauty-sync] Apps Script error:", forwardError, session.id);
    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    const tgChat  = process.env.TELEGRAM_CHAT_ID;
    if (tgToken && tgChat) {
      fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          chat_id:    tgChat,
          text:       `⚠️ <b>AizuaFinance beauty sync fallido</b>\nPedido: ${session.id}\nImporte: ${amountEur} EUR\nError: ${forwardError.substring(0, 300)}`,
          parse_mode: "HTML",
        }),
      }).catch(() => {});
    }
    return NextResponse.json({ received: true, forwarded: false, error: forwardError });
  }

  console.log(`[aizuafinance-beauty-sync] Synced ${session.id} (${amountEur} EUR · ${country})`);
  return NextResponse.json({ received: true, forwarded: true, session_id: session.id });
}
