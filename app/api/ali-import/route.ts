// app/api/ali-import/route.ts
// Aizua — Importar producto desde AliExpress API directa
// POST { url: "https://aliexpress.com/item/XXXX.html", category?, badge? }

import { NextRequest, NextResponse } from "next/server";
import { aliexpress } from "@/lib/aliexpress/client";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Markup por categoría — ajustable
const MARKUP: Record<string, number> = {
  Audio: 4.0, Wearables: 4.2, Charging: 4.5,
  Camera: 3.8, Connectivity: 4.0, Lighting: 4.5,
};
const DEFAULT_MARKUP = 3.5;

// 16/08/2026 — misma convención que el importador que SÍ funciona
// (pipeline_product_upload.py:896): NFKD → sin acentos → no-alfanumérico a "-"
// → recortar guiones → cortar a 60. El orden importa: se recorta ANTES de
// cortar, por eso algunos slugs reales acaban en "-". Se replica tal cual para
// no generar slugs que colisionen con los ya existentes en la tabla.
const slugify = (s: string) =>
  s.toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

export async function POST(req: NextRequest) {
  try {
    const { url, customPrice, category, badge } = await req.json();
    if (!url) return NextResponse.json({ error: "URL requerida" }, { status: 400 });

    // 1. Obtener producto de AliExpress
    const ali = await aliexpress.getProduct(url);

    // 2. Calcular precio con markup + redondeo psicológico
    const markup    = MARKUP[category] ?? DEFAULT_MARKUP;
    const rawPrice  = customPrice ? parseFloat(customPrice) : ali.price_min * markup;
    const myPrice   = Math.ceil(rawPrice) - 0.01; // €39.99, €89.99, etc.
    const margin    = Math.round((1 - ali.price_min / myPrice) * 100);

    // 3. Procesar imágenes (guardar en Cloudinary vía n8n — async)
    const images = [ali.image_url, ...ali.image_urls].filter(Boolean).slice(0, 8);

    if (process.env.N8N_IMAGES_WEBHOOK_URL) {
      fetch(process.env.N8N_IMAGES_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ali_product_id: ali.product_id, images }),
      });
    }

    // 4. Guardar en Supabase
    const { data: product, error } = await supabase
      .from("products")
      // 16/08/2026 — este insert estaba escrito contra el esquema de
      // ALL_PENDING_MIGRATIONS.sql, que NUNCA se aplicó. SEIS de sus columnas no
      // existen en public.products (verificado contra information_schema):
      // ali_product_id, ali_price, shipping_days, sku_list, store_id y
      // store_name. Postgres rechaza el insert entero por la primera, así que
      // esta ruta no ha podido dar de alta un solo producto nunca. Además metía
      // un objeto {en,es,fr,…} en `name`, que es text — las traducciones viven
      // en name_es/name_en/…
      // OJO — este fichero era BYTE A BYTE idéntico al de Aizua-store, así que
      // sin `store` los productos de AizuaBeauty caían en el catálogo 'tech'
      // (public.products es una tabla COMPARTIDA; misma clase que s230/AG-13).
      // shipping_days, sku_list, store_id y store_name se pierden: no existe
      // ninguna columna equivalente donde guardarlos.
      .insert({
        aliexpress_id:  String(ali.product_id),
        slug:           slugify(ali.subject),
        name:           ali.subject,
        // n8n + Claude traducirá estas async
        name_es:        ali.subject,
        name_en:        ali.subject,
        name_fr:        ali.subject,
        name_de:        ali.subject,
        name_pt:        ali.subject,
        name_it:        ali.subject,
        description: {
          en: ali.detail, es: ali.detail,
          fr: ali.detail, de: ali.detail, pt: ali.detail, it: ali.detail,
        },
        price:          myPrice,
        compare_price:  Math.round(myPrice * 1.3 * 100) / 100,
        cost_price:     ali.price_min,
        margin_pct:     margin,
        images,
        category:       category || ali.category_name || "General",
        stock:          999,
        active:         true,
        badge:          badge || null,
        rating:         ali.avg_star,
        review_count:   ali.review_count,
        store:          "beauty",
        supplier:       "aliexpress",
        created_at:     new Date().toISOString(),
        updated_at:     new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("[ali-import] Supabase:", error);
      return NextResponse.json({ error: "Error guardando producto" }, { status: 500 });
    }

    // 5. Disparar traducción async (Claude API vía n8n)
    if (process.env.N8N_TRANSLATE_WEBHOOK_URL) {
      fetch(process.env.N8N_TRANSLATE_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id:     product.id,
          ali_product_id: ali.product_id,
          name_en:        ali.subject,
          description_en: ali.detail.slice(0, 2000), // Claude tiene límite de tokens
          languages:      ["es", "fr", "de", "pt", "it"],
        }),
      });
    }

    return NextResponse.json({
      success:  true,
      product: {
        id:        product.id,
        name:      ali.subject,
        aliPrice:  ali.price_min,
        myPrice,
        margin,
        images:    images.length,
        variants:  ali.sku_list.length,
        rating:    ali.avg_star,
        reviews:   ali.review_count,
        shipDays:  ali.ship_to_days,
      },
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error("[ali-import] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
