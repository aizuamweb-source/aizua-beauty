import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { setRequestLocale } from "next-intl/server";
import ProductClient from "@/components/product/ProductClient";
import { getLocalizedName } from "@/lib/product-utils";
import MainNav from "@/components/nav/MainNav";
import Footer from "@/components/nav/Footer";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: { locale: string; slug: string };
};

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (url: RequestInfo | URL, init?: RequestInit) =>
          fetch(url, { ...init, cache: "no-store" }),
      },
    }
  );
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: "Producto no encontrado" };

  const name = getLocalizedName(product as Record<string, unknown>, params.locale);
  const desc = typeof product.description === "string" ? product.description : (product.description?.[params.locale] ?? product.description?.en ?? "");
  const imgUrl = product.images?.[0] ?? "";

  return {
    title: `${name} | Aizüa`,
    description: desc ? desc.replace(/<[^>]+>/g, "").slice(0, 160) : `${name} en Aizüa`,
    openGraph: {
      title: `${name} – €${product.price?.toFixed(2)} | Aizüa`,
      description: desc ? desc.replace(/<[^>]+>/g, "").slice(0, 200) : `${name} en Aizüa`,
      images: imgUrl ? [{ url: imgUrl, width: 800, height: 800 }] : [],
      type: "website",
    },
  };
}

async function getProduct(slug: string) {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error) {
      console.error("getProduct error:", error.message);
      return null;
    }
    return data;
  } catch (e) {
    console.error("getProduct exception:", e);
    return null;
  }
}

async function getReviews(productId: string) {
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("product_reviews")
      .select("id, name, rating, title, body, verified, created_at")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(20);
    return data ?? [];
  } catch {
    return [];
  }
}

async function getUpsells(category: string | null, currentId: string) {
  try {
    const supabase = getSupabase();
    let query = supabase
      .from("products")
      .select("id, slug, name, name_es, name_en, name_fr, name_de, name_pt, name_it, price, images, badge")
      .eq("active", true)
      .neq("id", currentId);

    // Filter by category if available, otherwise just get random products
    if (category) {
      query = query.eq("category", category);
    }

    const { data } = await query.order("created_at", { ascending: false }).limit(4);
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { locale, slug } = params;
  setRequestLocale(locale);

  const product = await getProduct(slug);
  if (!product) notFound();

  const [upsells, reviews] = await Promise.all([
    getUpsells(product.category ?? "", product.id),
    getReviews(product.id),
  ]);

  const productName = getLocalizedName(product as Record<string, unknown>, locale);
  const descRaw = typeof product.description === "string" ? product.description : (product.description?.[locale] ?? product.description?.es ?? "");
  const descClean = descRaw.replace(/<[^>]+>/g, "").slice(0, 300);
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productName,
    image: product.images ?? [],
    description: descClean || productName,
    sku: product.slug,
    brand: { "@type": "Brand", name: "AizuaBeauty" },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: `${process.env.NEXT_PUBLIC_APP_URL || "https://beauty.aizualabs.com"}/${locale}/product/${product.slug}`,
      seller: { "@type": "Organization", name: "AizuaBeauty", url: "https://beauty.aizualabs.com" },
    },
  };
  if (reviews.length > 0) {
    const avgRating = reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / reviews.length;
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: avgRating.toFixed(1),
      reviewCount: reviews.length,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8F9FB", fontFamily: "system-ui, sans-serif" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <MainNav locale={locale} />
      <ProductClient
        product={product}
        upsells={upsells}
        locale={locale}
        reviews={reviews}
      />
      <Footer locale={locale} />
    </div>
  );
}


