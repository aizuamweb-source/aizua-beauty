import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/reviews?productId=xxx â returns reviews + JSON-LD schema
// GET /api/reviews?refresh=true â cron to compute aggregate ratings
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  const refresh = searchParams.get("refresh");

  if (refresh === "true") {
    const auth = req.headers.get("authorization")?.replace("Bearer ", "");
    if (auth !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return runRefresh();
  }

  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  // Get product info
  const { data: product } = await supabase
    .from("products")
    .select("id, name, slug, price, images")
    .eq("id", productId)
    .single();

  // Get reviews for this product
  const { data: reviews } = await supabase
    .from("product_reviews")
    .select("id, rating, title, body, reviewer_name, verified_purchase, created_at")
    .eq("product_id", productId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(20);

  const reviewList = reviews ?? [];
  const avgRating = reviewList.length
    ? Math.round((reviewList.reduce((s, r) => s + r.rating, 0) / reviewList.length) * 10) / 10
    : 0;

  // Build JSON-LD schema
  const jsonLd = buildJsonLd(product, reviewList, avgRating);

  return NextResponse.json({
    product_id: productId,
    review_count: reviewList.length,
    average_rating: avgRating,
    reviews: reviewList,
    json_ld: jsonLd,
  });
}

function buildJsonLd(product: any, reviews: any[], avgRating: number) {
  if (!product || reviews.length === 0) return null;

  const storeUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aizua-store.vercel.app";
  const image = (() => {
    try {
      const imgs = typeof product.images === "string" ? JSON.parse(product.images) : product.images;
      return imgs?.[0] ?? "";
    } catch { return ""; }
  })();

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image,
    url: `${storeUrl}/es/products/${product.slug ?? product.id}`,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: avgRating,
      reviewCount: reviews.length,
      bestRating: 5,
      worstRating: 1,
    },
    review: reviews.slice(0, 5).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.reviewer_name ?? "Cliente verificado" },
      datePublished: r.created_at?.slice(0, 10),
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
      name: r.title ?? "",
      reviewBody: r.body ?? "",
    })),
  };
}

async function runRefresh() {
  // Get all products with reviews
  const { data: productIds } = await supabase
    .from("product_reviews")
    .select("product_id")
    .eq("status", "approved");

  const unique = [...new Set((productIds ?? []).map((r: any) => r.product_id))];
  let updated = 0;

  for (const pid of unique) {
    const { data: reviews } = await supabase
      .from("product_reviews")
      .select("rating")
      .eq("product_id", pid)
      .eq("status", "approved");

    if (!reviews?.length) continue;
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

    await supabase
      .from("products")
      .update({
        review_count: reviews.length,
        average_rating: Math.round(avg * 10) / 10,
      })
      .eq("id", pid);

    updated++;
  }

  return NextResponse.json({ ok: true, updated });
}
