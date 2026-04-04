/**
 * /api/ali-sync — Agente de Precio (Fase 4)
 * Monitor semanal de precios AliExpress + alerta de margen bajo
 *
 * Flujo:
 *  1. Lee todos los proveedores activos (tabla suppliers)
 *  2. Consulta precio actual en AliExpress via API
 *  3. Si variación > PRICE_CHANGE_THRESHOLD (5%) → actualiza suppliers + alerta Telegram
 *  4. Si margen < MARGIN_LOW_THRESHOLD (15%)     → Risk Log + alerta sourcing alternativo
 *  5. Registra resultado en sync_logs
 *
 * Activación:
 *  - GET /api/ali-sync  → Vercel Cron (lunes 09:00 UTC) — auth via CRON_SECRET
 *  - POST /api/ali-sync → manual / integración externa  — auth via SYNC_SECRET_TOKEN
 *
 * Env vars:
 *   ALI_APP_KEY · ALI_APP_SECRET · ALI_ACCESS_TOKEN
 *   SYNC_SECRET_TOKEN · CRON_SECRET
 *   TELEGRAM_BOT_TOKEN · TELEGRAM_CHAT_ID
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { NextRequest, NextResponse } from "next/server";
import { aliexpress } from "@/lib/aliexpress/client";
import { createClient } from "@supabase/supabase-js";

// ── Supabase (service role para escribir en suppliers / sync_logs) ──
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Umbrales configurables ─────────────────────────────────
const PRICE_CHANGE_THRESHOLD = 0.05;   // 5%  → alerta + actualizar suppliers
const MARGIN_LOW_THRESHOLD   = 0.15;   // 15% → alerta sourcing alternativo
const RATE_LIMIT_MS          = 600;    // ms entre llamadas AliExpress (~1.6 req/s)

// ── Tipos internos ─────────────────────────────────────────
type SupplierRow = {
  id:           string;
  product_id:   string;
  slug:         string | null;
  aliexpress_id:string;
  cost:         number;
  shipping_cost:number;
  pvp?:         number;   // del JOIN con products
  product_name?: Record<string, string> | string;
};

type SyncResult = {
  checked:     number;
  updated:     number;
  alerts:      string[];
  low_margin:  string[];
  errors:      number;
  skipped:     number;
};

// ── Auth helper ────────────────────────────────────────────
function isAuthorized(req: NextRequest, isCron: boolean): boolean {
  const auth = req.headers.get("authorization") ?? "";
  if (isCron) {
    // Vercel Cron envía el secret en Authorization header
    const cronSecret = process.env.CRON_SECRET;
    return !cronSecret || auth === `Bearer ${cronSecret}`;
  }
  const token = process.env.SYNC_SECRET_TOKEN;
  return !token || auth === `Bearer ${token}`;
}

// ── Telegram helper ────────────────────────────────────────
async function sendTelegram(text: string) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
    });
  } catch { /* no bloquear */ }
}

// ── Nombre localizado de un producto ──────────────────────
function getName(name: Record<string, string> | string | undefined): string {
  if (!name) return "Producto desconocido";
  if (typeof name === "string") {
    // @ts-ignore
    try { name = JSON.parse(name); } catch { return name; }
  }
  return (name as Record<string, string>).es
      ?? (name as Record<string, string>).en
      ?? Object.values(name as Record<string, string>)[0]
      ?? "—";
}

// ══════════════════════════════════════════════════════════
// LÓGICA PRINCIPAL
// ══════════════════════════════════════════════════════════

async function runPriceMonitor(): Promise<SyncResult> {
  const result: SyncResult = {
    checked: 0, updated: 0, alerts: [], low_margin: [], errors: 0, skipped: 0,
  };

  // 1. Leer proveedores activos con precio de venta del producto
  const { data: suppliers, error: dbErr } = await supabase
    .from("suppliers")
    .select(`
      id,
      product_id,
      slug,
      aliexpress_id,
      cost,
      shipping_cost,
      products ( price, name )
    `)
    .eq("is_active", true);

  if (dbErr || !suppliers?.length) {
    console.error("[ali-sync] Error leyendo suppliers:", dbErr?.message);
    result.skipped = 1;
    return result;
  }

  // Mensajes de alerta para el informe final de Telegram
  const priceAlertLines:  string[] = [];
  const marginAlertLines: string[] = [];

  for (const row of suppliers as unknown as (SupplierRow & { products: { price: number; name: Record<string,string> } })[]) {
    try {
      result.checked++;

      // 2. Consultar precio actual en AliExpress
      const fresh = await aliexpress.syncProduct(row.aliexpress_id);

      const oldCost   = Number(row.cost);
      const newCost   = fresh.price;
      const pvp       = row.products?.price ?? 0;
      const shipCost  = Number(row.shipping_cost ?? 0);
      const name      = getName(row.products?.name ?? row.product_name);

      // 3. Calcular variación de precio
      const priceChange = oldCost > 0 ? (newCost - oldCost) / oldCost : 0;
      const absChange   = Math.abs(priceChange);

      if (absChange > PRICE_CHANGE_THRESHOLD) {
        const direction = priceChange > 0 ? "📈 SUBIDA" : "📉 BAJADA";
        const changeStr = `${priceChange > 0 ? "+" : ""}${Math.round(priceChange * 100)}%`;

        // Actualizar suppliers + guardar en historial
        await supabase
          .from("suppliers")
          .update({
            cost:             newCost,
            sku_list:         fresh.skus ?? undefined,
            last_price_check: new Date().toISOString(),
            updated_at:       new Date().toISOString(),
          })
          .eq("id", row.id);

        // Registrar en price_history (función SQL)
        await supabase.rpc("append_price_history", {
          supplier_id: row.id,
          old_cost:    oldCost,
          new_cost:    newCost,
        // @ts-ignore
        }).catch(() => { /* no bloquear si falla */ });

        result.updated++;
        priceAlertLines.push(
          `${direction} *${name}* ${changeStr}\n   €${oldCost.toFixed(2)} → €${newCost.toFixed(2)}`
        );
        result.alerts.push(`${name}: ${changeStr}`);
      } else {
        // Sin cambio significativo — actualizar solo last_price_check
        await supabase
          .from("suppliers")
          .update({ last_price_check: new Date().toISOString() })
          .eq("id", row.id);
      }

      // 4. Comprobar margen con el nuevo coste
      const totalCost  = newCost + shipCost;
      const marginPct  = pvp > 0 ? (pvp - totalCost) / pvp : 0;

      if (pvp > 0 && marginPct < MARGIN_LOW_THRESHOLD) {
        const marginStr = `${Math.round(marginPct * 100)}%`;
        marginAlertLines.push(
          `⚠️ *${name}*\n   Margen: ${marginStr} | Coste: €${totalCost.toFixed(2)} | PVP: €${pvp.toFixed(2)}\n   → Considerar proveedor alternativo o subir PVP`
        );
        result.low_margin.push(`${name} (${marginStr})`);
      }

    } catch (err) {
      result.errors++;
      console.error(`[ali-sync] Error en ${row.aliexpress_id}:`, err);
    }

    // Rate limit AliExpress
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
  }

  // 5. Enviar resumen por Telegram
  const now = new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" });
  const summaryLines = [
    `🔍 *Monitor Precios AliExpress* — ${now}`,
    `📦 Revisados: ${result.checked} · Actualizados: ${result.updated} · Errores: ${result.errors}`,
  ];

  if (priceAlertLines.length > 0) {
    summaryLines.push(`\n*Cambios de precio (>${Math.round(PRICE_CHANGE_THRESHOLD * 100)}%):*`);
    summaryLines.push(...priceAlertLines);
  }

  if (marginAlertLines.length > 0) {
    summaryLines.push(`\n*Margen bajo (<${Math.round(MARGIN_LOW_THRESHOLD * 100)}%):*`);
    summaryLines.push(...marginAlertLines);
  }

  if (result.checked > 0) {
    await sendTelegram(summaryLines.join("\n"));
  }

  // 6. Registrar en sync_logs
  await supabase.from("sync_logs").insert({
    type:    "price_monitor",
    synced:  result.checked,
    updated: result.updated,
    alerts:  result.alerts.length + result.low_margin.length,
    errors:  result.errors,
    ran_at:  new Date().toISOString(),
  });

  return result;
}


// ══════════════════════════════════════════════════════════
// HANDLERS HTTP
// ══════════════════════════════════════════════════════════

/** GET — Vercel Cron (cada lunes a las 09:00 UTC) */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req, true)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const results = await runPriceMonitor();
    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error("[ali-sync GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/** POST — trigger manual o integración externa */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req, false)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Opción: dry_run para ver qué haría sin escribir
  let dryRun = false;
  try {
    // @ts-ignore
    const body = await req.json().catch(() => ({}));
    dryRun = body.dry_run === true;
  } catch { /* no body */ }

  if (dryRun) {
    // En dry-run: solo devolver status de la tabla suppliers
    const { data, error } = await supabase
      .from("supplier_margins")
      .select("slug, aliexpress_id, cost, pvp, margin_pct, last_price_check");

    return NextResponse.json({
      dry_run: true,
      suppliers: data ?? [],
      error: error?.message,
    });
  }

  try {
    const results = await runPriceMonitor();
    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error("[ali-sync POST]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
