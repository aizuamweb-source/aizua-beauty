import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

/**
 * AG-TikTok Order Monitor (relay cloud)
 * ──────────────────────────────────────
 * POST  → recibe pedidos nuevos desde el agente Python local,
 *         guarda en Supabase (dedup), reenvía a Telegram.
 *
 * El agente Python (agent_tiktok_order_monitor.py) detecta los pedidos
 * usando cookies de sesión y llama a este endpoint.
 * Cuando tengamos access_token OAuth, el GET cron puede activarse.
 */

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_CHAT  = process.env.TELEGRAM_CHAT_ID!;
const CRON_SECRET    = process.env.CRON_SECRET!;

async function sendTelegram(text: string) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) return;
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT, text, parse_mode: "HTML" }),
  }).catch(() => {});
}

// ── POST: recibe desde Python ────────────────────────────────
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const orders: any[] = body.orders || [];

  if (!orders.length) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Dedup: filtrar IDs ya vistos
  const ids = orders.map((o: any) => o.order_id).filter(Boolean);
  const { data: existing } = await supabase
    .from("tiktok_order_alerts")
    .select("order_id")
    .in("order_id", ids);
  const existingSet = new Set((existing || []).map((r: any) => r.order_id));

  let sent = 0;
  const toInsert: any[] = [];

  for (const o of orders) {
    if (!o.order_id || existingSet.has(o.order_id)) continue;
    await sendTelegram(o.message || `🛒 Nuevo pedido TikTok: ${o.order_id}`);
    toInsert.push({
      order_id:     o.order_id,
      message:      o.message || null,
      telegram_sent: true,
    });
    sent++;
  }

  if (toInsert.length) {
    await supabase.from("tiktok_order_alerts").insert(toInsert);
  }

  return NextResponse.json({ ok: true, sent });
}

// ── GET: Vercel cron health check (no auth needed — Vercel crons no envían header) ──
export async function GET() {
  return NextResponse.json({ ok: true, status: "TikTok order relay active", ts: new Date().toISOString() });
}
