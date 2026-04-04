// app/api/ali-sync/route.ts
// Aizua — Sync automático de precios y stock con AliExpress
// Llamado por n8n cada 6 horas. También disponible manualmente.

import { NextRequest, NextResponse } from "next/server";
import { aliexpress } from "@/lib/aliexpress/client";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PRICE_ALERT_THRESHOLD = 0.15; // Alerta si el coste sube >15%

export async function POST(req: NextRequest) {
  // Verificar token de n8n
  const auth = req.headers.get("authorization");
  if (process.env.SYNC_SECRET_TOKEN && auth !== `Bearer ${process.env.SYNC_SECRET_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { synced: 0, updated: 0, alerts: [] as string[], errors: 0 };

  const { data: products } = await supabase
    .from("products")
    .select("id, ali_product_id, ali_price, price, name")
    .eq("active", true)
    .not("ali_product_id", "is", null);

  for (const product of products ?? []) {
    try {
      const fresh = await aliexpress.syncProduct(product.ali_product_id);
      results.synced++;

      if (fresh.price !== product.ali_price) {
        // Mantener el mismo margen porcentual
        const margin      = 1 - product.ali_price / product.price;
        const newMyPrice  = Math.ceil(fresh.price / (1 - margin) * 100 - 1) / 100;
        const priceChange = (fresh.price - product.ali_price) / product.ali_price;

        await supabase.from("products").update({
          ali_price:  fresh.price,
          price:      newMyPrice,
          sku_list:   fresh.skus,
          updated_at: new Date().toISOString(),
        }).eq("id", product.id);

        results.updated++;

        // Alerta si el proveedor subió mucho el precio
        if (priceChange > PRICE_ALERT_THRESHOLD) {
          const name = typeof product.name === "object"
            ? product.name.es || product.name.en
            : product.name;

          results.alerts.push(`${name}: +${Math.round(priceChange * 100)}%`);

          if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
            await fetch(
              `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: process.env.TELEGRAM_CHAT_ID,
                  text: `⚠️ *ALERTA PRECIO AIZUA*\n\n📦 ${name}\n💰 Coste: €${product.ali_price} → €${fresh.price} (+${Math.round(priceChange * 100)}%)\n💡 Nuevo precio venta: €${newMyPrice}`,
                  parse_mode: "Markdown",
                }),
              }
            ).catch(console.error);
          }
        }
      }

      // Rate limit AliExpress: ~2 req/s
      await new Promise(r => setTimeout(r, 600));

    } catch {
      results.errors++;
    }
  }

  // Log en Supabase
  await supabase.from("sync_logs").insert({
    type:    "aliexpress_sync",
    synced:  results.synced,
    updated: results.updated,
    alerts:  results.alerts.length,
    errors:  results.errors,
    ran_at:  new Date().toISOString(),
  }).catch(console.error);

  return NextResponse.json({ success: true, results });
}

export async function GET() {
  const { data } = await supabase
    .from("sync_logs")
    .select("*")
    .order("ran_at", { ascending: false })
    .limit(10);

  return NextResponse.json({ logs: data ?? [] });
}
