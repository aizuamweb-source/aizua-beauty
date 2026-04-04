// app/api/ali-populate/route.ts
// Aizua — Pobla imágenes + sku_list en Supabase usando la API oficial de AliExpress
// Llamar UNA VEZ tras ejecutar supabase-populate-aliexpress-ids.sql
//
// GET  /api/ali-populate         → estado: cuántos productos necesitan sync
// POST /api/ali-populate         → ejecuta sync para todos los productos con aliexpress_id
// POST /api/ali-populate { slug } → sync de un solo producto

import { NextRequest, NextResponse } from "next/server";
import { aliexpress } from "@/lib/aliexpress/client";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: estado actual — cuántos productos necesitan sincronización
export async function GET() {
  const { data: products } = await supabase
    .from("products")
    .select("slug, aliexpress_id, ali_product_id, images")
    .eq("active", true)
    .order("created_at", { ascending: false });

  const stats = (products ?? []).map(p => ({
    slug:          p.slug,
    aliexpress_id: p.aliexpress_id,
    ali_product_id: p.ali_product_id,
    has_images:    p.images && p.images.length > 0,
    images_count:  p.images?.length ?? 0,
    needs_sync:    !p.aliexpress_id || !p.images || p.images.length === 0,
  }));

  return NextResponse.json({
    total:      stats.length,
    need_sync:  stats.filter(p => p.needs_sync).length,
    ready:      stats.filter(p => !p.needs_sync).length,
    products:   stats,
  });
}

// POST: sync de imágenes y sku_list para productos con aliexpress_id
export async function POST(req: NextRequest) {
  // Auth básica: solo service role puede llamar esto
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET || process.env.SYNC_SECRET_TOKEN;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { slug } = body;

  // Construir query — un producto o todos los que tienen aliexpress_id
  let query = supabase
    .from("products")
    .select("id, slug, aliexpress_id, images")
    .eq("active", true)
    .not("aliexpress_id", "is", null);

  if (slug) {
    query = query.eq("slug", slug);
  }

  const { data: products, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!products || products.length === 0) {
    return NextResponse.json({ message: "No hay productos con aliexpress_id para sincronizar", synced: 0 });
  }

  const results: Array<{ slug: string; status: string; images?: number; error?: string }> = [];
  let synced = 0;
  let errors = 0;

  for (const product of products) {
    try {
      // Obtener datos del producto via API oficial de AliExpress
      const aliProduct = await aliexpress.getProduct(product.aliexpress_id);

      // Construir array de imágenes (principal + galería, máx 5)
      const images = [aliProduct.image_url, ...(aliProduct.image_urls ?? [])]
        .filter((url, idx, arr) => url && arr.indexOf(url) === idx) // deduplicar
        .slice(0, 5);

      // Construir sku_list en formato Supabase
      const sku_list = (aliProduct.sku_list ?? []).map(sku => ({
        sku_id:               sku.sku_id,
        sku_attr:             sku.sku_attr,
        sku_price:            sku.sku_price,
        sku_stock:            sku.sku_stock,
        sku_available_stock:  sku.sku_available_stock,
      }));

      // Actualizar producto en Supabase
      const { error: updateError } = await supabase
        .from("products")
        .update({
          images,
          sku_list,
          ali_product_id:  product.aliexpress_id,  // sincronizar ali_product_id
          ali_price:       aliProduct.price_min,
          shipping_days:   aliProduct.ship_to_days ?? 15,
          store_id:        aliProduct.store_id,
          store_name:      aliProduct.store_name,
          updated_at:      new Date().toISOString(),
        })
        .eq("id", product.id);

      if (updateError) {
        errors++;
        results.push({ slug: product.slug, status: "error", error: updateError.message });
      } else {
        synced++;
        results.push({ slug: product.slug, status: "ok", images: images.length });
        console.log(`[ali-populate] ✅ ${product.slug}: ${images.length} imágenes, ${sku_list.length} SKUs`);
      }

    } catch (err: unknown) {
      errors++;
      const msg = err instanceof Error ? err.message : "Error desconocido";
      console.error(`[ali-populate] ❌ ${product.slug}:`, msg);
      results.push({ slug: product.slug, status: "error", error: msg });
    }

    // Rate limit: 600ms entre peticiones (límite AliExpress ~2 req/s)
    await new Promise(r => setTimeout(r, 600));
  }

  // Notificar a Telegram si hay errores
  if (errors > 0 && process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: `⚠️ *ali-populate completado con errores*\n✅ ${synced} ok · ❌ ${errors} errores`,
          parse_mode: "Markdown",
        }),
      }
    ).catch(console.error);
  }

  return NextResponse.json({
    message: `Sincronizados ${synced}/${products.length} productos`,
    synced,
    errors,
    results,
  });
}
