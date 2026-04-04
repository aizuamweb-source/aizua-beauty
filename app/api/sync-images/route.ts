// app/api/sync-images/route.ts
// Fetches product images from AliExpress CDN by aliexpress_id and stores them in Supabase
// Usage: POST /api/sync-images  { "limit": 50 }   <- syncs all products missing images
//        POST /api/sync-images  { "slug": "my-slug" }  <- syncs one product

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// AliExpress product detail endpoint (open API, no auth needed for basic info)
async function fetchAliExpressImages(aliexpressId: string): Promise<string[]> {
  try {
    // AliExpress CDN image pattern — the main product image
    // Format: https://ae01.alicdn.com/kf/{IMAGE_HASH}.jpg
    // We can get image hashes by fetching the product page
    const url = `https://www.aliexpress.com/item/${aliexpressId}.html`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return [];
    const html = await res.text();

    // Extract image URLs from the product page JSON data
    const imageMatches = html.matchAll(/"https:\/\/ae\d+\.alicdn\.com\/kf\/[^"]+\.(?:jpg|jpeg|png|webp)"/gi);
    const images: string[] = [];
    const seen = new Set<string>();

    for (const match of imageMatches) {
      const url = match[0].slice(1, -1); // Remove surrounding quotes
      // Filter out small thumbnails and duplicate domains
      if (!seen.has(url) && !url.includes("_50x50") && !url.includes("_220x220")) {
        seen.add(url);
        images.push(url);
        if (images.length >= 5) break;
      }
    }

    return images;
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { slug, limit = 20 } = body;

    // Build query
    let query = supabase
      .from("products")
      .select("id, slug, aliexpress_id, images")
      .eq("active", true);

    if (slug) {
      query = query.eq("slug", slug);
    } else {
      // Only products with empty images array
      query = query.or("images.eq.{},images.is.null").limit(limit);
    }

    const { data: products, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ message: "No products need image sync", updated: 0 });
    }

    const results = [];
    let updated = 0;

    for (const product of products) {
      if (!product.aliexpress_id) {
        results.push({ slug: product.slug, status: "skipped", reason: "no aliexpress_id" });
        continue;
      }

      const images = await fetchAliExpressImages(product.aliexpress_id);

      if (images.length === 0) {
        results.push({ slug: product.slug, status: "no_images_found" });
        continue;
      }

      const { error: updateError } = await supabase
        .from("products")
        .update({ images, updated_at: new Date().toISOString() })
        .eq("id", product.id);

      if (updateError) {
        results.push({ slug: product.slug, status: "error", error: updateError.message });
      } else {
        results.push({ slug: product.slug, status: "updated", images_count: images.length });
        updated++;
      }

      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 500));
    }

    return NextResponse.json({
      message: `Synced ${updated}/${products.length} products`,
      updated,
      results,
    });
  } catch (err) {
    console.error("[sync-images]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET: check how many products are missing images
export async function GET() {
  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("active", true)
    .or("images.eq.{},images.is.null");

  const { count: total } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("active", true);

  return NextResponse.json({
    total_products: total,
    missing_images: count,
    has_images: (total || 0) - (count || 0),
  });
}
