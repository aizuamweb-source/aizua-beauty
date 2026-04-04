/**
 * AG-39 Cloud — Order Summary
 * GET /api/order-summary
 *
 * Cron: 0 8 * * * (diario 08:00 UTC) + 0 16 * * * (16:00)
 * Envía resumen por Telegram de pedidos pendientes de fulfillment.
 * Protegido por CRON_SECRET header (Vercel lo pone automáticamente).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── TELEGRAM ─────────────────────────────────────────────────────────────────
async function sendTelegram(msg: string) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id:                  chatId,
      text:                     msg,
      parse_mode:               "Markdown",
      disable_web_page_preview: true,
    }),
  }).catch(console.error);
}

// ── ALIEXPRESS LINK ───────────────────────────────────────────────────────────
function aliLink(productId?: string | null, variantId?: string | null): string {
  if (!productId) return "";
  let url = `https://www.aliexpress.com/item/${productId}.html`;
  if (variantId) url += `?skuId=${variantId}`;
  return url;
}

// ── FETCH PENDING ORDERS ──────────────────────────────────────────────────────
interface OrderRow {
  id:               string;
  order_number:     string;
  status:           string;
  customer_name:    string;
  customer_email:   string;
  shipping_address: Record<string, string>;
  total:            number;
  currency:         string;
  paid_at:          string;
  created_at:       string;
  dsers_order_id:   string | null;
  dsers_status:     string | null;
}

interface ItemRow {
  id:                    string;
  order_id:              string;
  product_name:          string | null;
  sku:                   string | null;
  quantity:              number;
  unit_price:            number;
  aliexpress_product_id: string | null;
  aliexpress_variant_id: string | null;
  proveedor_alternativo: string | null;
}

async function getPendingOrders(): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,order_number,status,customer_name,customer_email," +
      "shipping_address,total,currency,paid_at,created_at," +
      "dsers_order_id,dsers_status"
    )
    .in("status", ["paid", "processing", "pending"])
    .is("dsers_status", null)          // sin fulfillment DSers aún
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) {
    console.error("getPendingOrders error:", error);
    // Fallback: buscar sin filtro dsers_status
    const { data: data2 } = await supabase
      .from("orders")
      .select(
        "id,order_number,status,customer_name,customer_email," +
        "shipping_address,total,currency,paid_at,created_at," +
        "dsers_order_id,dsers_status"
      )
      .in("status", ["paid", "processing"])
      .order("created_at", { ascending: true })
      .limit(50);
    return (data2 as OrderRow[]) ?? [];
  }
  return (data as OrderRow[]) ?? [];
}

async function getOrderItems(orderIds: string[]): Promise<ItemRow[]> {
  if (!orderIds.length) return [];
  const { data, error } = await supabase
    .from("order_items")
    .select(
      "id,order_id,product_name,sku,quantity,unit_price," +
      "aliexpress_product_id,aliexpress_variant_id,proveedor_alternativo"
    )
    .in("order_id", orderIds);
  if (error) console.error("getOrderItems error:", error);
  return (data as ItemRow[]) ?? [];
}

// ── FORMAT MESSAGE ────────────────────────────────────────────────────────────
function formatMessage(
  orders: OrderRow[],
  itemsByOrder: Record<string, ItemRow[]>
): string {
  const now = new Date().toLocaleString("es-ES", {
    timeZone: "Europe/Madrid",
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  if (!orders.length) {
    return (
      `🤖 *AG-39 Order Manager*\n📅 ${now}\n` +
      `${"═".repeat(30)}\n\n` +
      `✅ *Sin pedidos pendientes*\nTodo al día 🎉`
    );
  }

  const lines: string[] = [
    `🤖 *AG-39 Order Manager*`,
    `📅 ${now}`,
    `${"═".repeat(30)}`,
    `🏪 *AIZUA STORE — ${orders.length} pedido${orders.length > 1 ? "s" : ""} pendiente${orders.length > 1 ? "s" : ""}*`,
    "─".repeat(30),
  ];

  let totalRevenue = 0;
  for (const o of orders) {
    const addr    = o.shipping_address ?? {};
    const city    = addr.city ?? addr.ciudad ?? "";
    const country = addr.country ?? addr.pais ?? "";
    const loc     = [city, country].filter(Boolean).join(", ");
    const date    = (o.paid_at ?? o.created_at ?? "").slice(0, 10);
    totalRevenue += Number(o.total ?? 0);

    lines.push(`\n📦 *#${o.order_number}* — ${date}`);
    lines.push(`👤 ${o.customer_name} (${o.customer_email})`);
    if (loc) lines.push(`📍 ${loc}`);
    lines.push(`💰 ${Number(o.total).toFixed(2)} ${o.currency}`);

    const items = itemsByOrder[o.id] ?? [];
    if (items.length) {
      lines.push("🛒 *Productos:*");
      for (const it of items) {
        const name = it.product_name ?? it.sku ?? "Producto";
        const link = aliLink(it.aliexpress_product_id, it.aliexpress_variant_id);
        let line = `  • ${name.slice(0, 50)} x${it.quantity}`;
        if (it.unit_price) line += ` (~${Number(it.unit_price).toFixed(2)}€)`;
        if (link) {
          line += `\n    🔗 [Pedir en AliExpress](${link})`;
        } else if (it.proveedor_alternativo) {
          line += `\n    🔗 ${it.proveedor_alternativo}`;
        } else {
          line += `\n    ⚠️ Sin link proveedor`;
        }
        lines.push(line);
      }
    } else {
      lines.push("  _(sin items o ya sincronizado con DSers)_");
    }
  }

  lines.push("");
  lines.push("═".repeat(30));
  lines.push(`💵 *Total: ${totalRevenue.toFixed(2)} EUR*`);
  lines.push(`_Procesa los pedidos usando los links de AliExpress_`);

  const msg = lines.join("\n");
  // Telegram limit 4096 chars
  return msg.length > 4000 ? msg.slice(0, 3900) + `\n\n_...mensaje truncado (${orders.length} pedidos)_` : msg;
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
    const orderIds = orders.map((o) => o.id);
    const items    = await getOrderItems(orderIds);

    // Agrupar items por order_id
    const itemsByOrder: Record<string, ItemRow[]> = {};
    for (const it of items) {
      if (!itemsByOrder[it.order_id]) itemsByOrder[it.order_id] = [];
      itemsByOrder[it.order_id].push(it);
    }

    const msg = formatMessage(orders, itemsByOrder);
    await sendTelegram(msg);

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
