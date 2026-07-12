/**
 * AG-39 Cloud — Order Summary
 * GET /api/order-summary
 *
 * Cron: 0 9 * * * (diario 09:00 UTC)
 * Envía resumen por Telegram de pedidos pendientes de fulfillment, con botones
 * de compra 1-tap. Protegido por CRON_SECRET header (Vercel lo pone automáticamente).
 *
 * Nota (s187): antes leía de una tabla `order_items` que nunca existió en Supabase
 * (siempre devolvía error silencioso → "sin items" en cada pedido, sin botón).
 * Los items viven en la columna jsonb `orders.items`, poblada por create-order
 * y enriquecida con `aliexpress_product_id` desde products.aliexpress_id.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── TELEGRAM ─────────────────────────────────────────────────────────────────
// Texto plano (sin parse_mode): nombres de producto con '_','*','(' rompían
// Markdown v1 (mismo bug ya corregido en AG-39/AG-45/webhook, s187).
async function sendTelegram(msg: string, buttons: Array<{ text: string; url: string }>) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  const payload: Record<string, unknown> = {
    chat_id: chatId,
    text: msg,
    disable_web_page_preview: true,
  };
  if (buttons.length) {
    payload.reply_markup = { inline_keyboard: buttons.slice(0, 8).map(b => [b]) };
  }
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(console.error);
}

// ── ALIEXPRESS LINK ───────────────────────────────────────────────────────────
function aliLink(productId?: string | null): string {
  if (!productId) return "";
  return `https://www.aliexpress.com/item/${productId}.html`;
}

// ── FETCH PENDING ORDERS ──────────────────────────────────────────────────────
interface OrderItem {
  id?: string;
  name: string;
  qty: number;
  price?: number;
  aliexpress_product_id?: string | null;
  proveedor_alternativo?: string | null;
}

interface OrderRow {
  id:               string;
  order_number:     string;
  status:           string;
  customer_name:    string;
  customer_email:   string;
  shipping_address: Record<string, string>;
  items:            OrderItem[] | null;
  total:            number;
  currency:         string;
  paid_at:          string;
  created_at:       string;
  dsers_order_id:   string | null;
  dsers_status:     string | null;
}

const ORDER_SELECT =
  "id,order_number,status,customer_name,customer_email," +
  "shipping_address,items,total,currency,paid_at,created_at," +
  "dsers_order_id,dsers_status";

async function getPendingOrders(): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .in("status", ["paid", "processing", "pending"])
    .is("dsers_status", null)          // sin fulfillment DSers aún
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) {
    console.error("getPendingOrders error:", error);
    // Fallback: buscar sin filtro dsers_status
    const { data: data2 } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .in("status", ["paid", "processing"])
      .order("created_at", { ascending: true })
      .limit(50);
    return (data2 as unknown as OrderRow[]) ?? [];
  }
  return (data as unknown as OrderRow[]) ?? [];
}

// ── FORMAT MESSAGE ────────────────────────────────────────────────────────────
function formatMessage(orders: OrderRow[]): { text: string; buttons: Array<{ text: string; url: string }> } {
  const now = new Date().toLocaleString("es-ES", {
    timeZone: "Europe/Madrid",
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  if (!orders.length) {
    return {
      text:
        `🤖 AG-39 Order Manager\n📅 ${now}\n` +
        `${"═".repeat(30)}\n\n` +
        `✅ Sin pedidos pendientes\nTodo al día 🎉`,
      buttons: [],
    };
  }

  const lines: string[] = [
    `🤖 AG-39 Order Manager`,
    `📅 ${now}`,
    `${"═".repeat(30)}`,
    `💅 AIZUABEAUTY — ${orders.length} pedido${orders.length > 1 ? "s" : ""} pendiente${orders.length > 1 ? "s" : ""}`,
    "─".repeat(30),
  ];
  const buttons: Array<{ text: string; url: string }> = [];

  let totalRevenue = 0;
  for (const o of orders) {
    const addr    = o.shipping_address ?? {};
    const city    = addr.city ?? addr.ciudad ?? "";
    const country = addr.country ?? addr.pais ?? "";
    const loc     = [city, country].filter(Boolean).join(", ");
    const date    = (o.paid_at ?? o.created_at ?? "").slice(0, 10);
    totalRevenue += Number(o.total ?? 0);

    lines.push(`\n📦 #${o.order_number} — ${date}`);
    lines.push(`👤 ${o.customer_name} (${o.customer_email})`);
    if (loc) lines.push(`📍 ${loc}`);
    lines.push(`💰 ${Number(o.total).toFixed(2)} ${o.currency}`);

    const items = Array.isArray(o.items) ? o.items : [];
    if (items.length) {
      lines.push("🛒 Productos:");
      for (const it of items) {
        const name = it.name ?? "Producto";
        const link = aliLink(it.aliexpress_product_id);
        let line = `  • ${name.slice(0, 50)} x${it.qty}`;
        if (it.price) line += ` (~${Number(it.price).toFixed(2)}€)`;
        if (link) {
          line += `\n    🔗 ${link}`;
          buttons.push({ text: `🛒 #${o.order_number} · ${name.slice(0, 30)}`, url: link });
        } else if (it.proveedor_alternativo) {
          line += `\n    🔗 ${it.proveedor_alternativo}`;
        } else {
          line += `\n    ⚠️ Sin link proveedor (producto sin aliexpress_id)`;
        }
        lines.push(line);
      }
    } else {
      lines.push("  (sin items o ya sincronizado con DSers)");
    }
  }

  lines.push("");
  lines.push("═".repeat(30));
  lines.push(`💵 Total: ${totalRevenue.toFixed(2)} EUR`);
  lines.push(`Procesa los pedidos usando los botones/links de arriba`);

  const msg = lines.join("\n");
  // Telegram limit 4096 chars
  const text = msg.length > 4000 ? msg.slice(0, 3900) + `\n\n...mensaje truncado (${orders.length} pedidos)` : msg;
  return { text, buttons };
}

// ── HANDLER ───────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  // Verificar CRON_SECRET (Vercel lo manda automáticamente en crons)
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orders = await getPendingOrders();
    const { text, buttons } = formatMessage(orders);
    await sendTelegram(text, buttons);

    // Log a system_health
    await supabase.from("system_health").insert({
      service:    "ag39_order_summary",
      status:     "ok",
      details:    JSON.stringify({ pending_orders: orders.length }),
      checked_at: new Date().toISOString(),
    }).then(() => {});

    return NextResponse.json({
      ok:             true,
      pending_orders: orders.length,
      message:        `Resumen enviado: ${orders.length} pedidos pendientes`,
    });

  } catch (err) {
    console.error("order-summary error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
