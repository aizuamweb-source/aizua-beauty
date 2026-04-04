// app/[locale]/product/[slug]/page.tsx
// Aizua — Página de producto con SSG + ISR
// Renderizado estático en build, revalidación cada 1h

import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import ProductClient from "@/components/product/ProductClient";
import { getTranslations } from "next-intl/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── TIPOS ──
type ProductPageProps = {
  params: { locale: string; slug: string };
};

// ── METADATA DINÁMICA (SEO) ──
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProduct(params.slug, params.locale);
  if (!product) return { title: "Producto no encontrado" };

  const name   = product.name?.[params.locale] ?? product.name?.en ?? "";
  const desc   = product.description?.[params.locale] ?? product.description?.en ?? "";
  const imgUrl = product.images?.[0] ?? "";
  const price  = product.price?.toFixed(2);

  return {
    title:       `${name} | Aizua`,
    description: desc.replace(/<[^>]+>/g, "").slice(0, 160),
    openGraph: {
      title:       `${name} — €${price} | Aizua`,
      description: desc.replace(/<[^>]+>/g, "").slice(0, 200),
      images:      imgUrl ? [{ url: imgUrl, width: 800, height: 800 }] : [],
      type:        "website",
    },
    // Schema.org Product (Rich Results en Google)
    other: {
      "product:price:amount":   price ?? "",
      "product:price:currency": "EUR",
    },
  };
}

// ── GENERAR RUTAS ESTÁTICAS EN BUILD ──
export async function generateStaticParams() {
  const { data: products } = await supabase
    .from("products")
    .select("slug")
    .eq("active", true)
    .limit(200);

  const locales = ["es", "en", "fr", "de", "pt", "it"];
  const params = [];

  for (const product of products ?? []) {
    for (const locale of locales) {
      params.push({ locale, slug: product.slug });
    }
  }

  return params;
}

// ── FETCH PRODUCTO ──
async function getProduct(slug: string, locale: string) {
  const { data } = await supabase
    .from("products")
    .select(`
      *,
      product_reviews (
        id, customer_name, rating, comment, verified, lang, created_at
      )
    `)
    .eq("slug", slug)
    .eq("active", true)
    .single();

  return data;
}

// ── FETCH UPSELLS (productos relacionados) ──
async function getUpsells(category: string, currentId: string) {
  const { data } = await supabase
    .from("products")
    .select("id, slug, name, price, images, badge")
    .eq("active", true)
    .eq("category", category)
    .neq("id", currentId)
    .limit(3);

  return data ?? [];
}

// ── PAGE COMPONENT ──
export default async function ProductPage({ params }: ProductPageProps) {
  const { locale, slug } = params;
  const product = await getProduct(slug, locale);

  if (!product) notFound();

  const upsells = await getUpsells(product.category, product.id);
  const t = await getTranslations({ locale, namespace: "product" });

  // JSON-LD Schema para Rich Results en Google (estrellas, precio en SERP)
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name:         product.name?.[locale] ?? product.name?.en,
    description:  product.description?.[locale]?.replace(/<[^>]+>/g, "").slice(0, 500),
    image:        product.images ?? [],
    sku:          product.ali_product_id,
    brand:        { "@type": "Brand", name: "Aizua" },
    offers: {
      "@type":        "Offer",
      price:          product.price,
      priceCurrency:  "EUR",
      availability:   "https://schema.org/InStock",
      url:            `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/product/${slug}`,
      seller:         { "@type": "Organization", name: "Aizua" },
    },
    aggregateRating: product.product_reviews?.length > 0 ? {
      "@type":       "AggregateRating",
      ratingValue:   product.rating ?? 4.8,
      reviewCount:   product.product_reviews.length,
      bestRating:    5,
      worstRating:   1,
    } : undefined,
  };

  return (
    <>
      {/* JSON-LD para Google Rich Results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <ProductClient
        product={product}
        upsells={upsells}
        locale={locale}
        reviews={product.product_reviews ?? []}
      />
    </>
  );
}

// ISR — revalidar cada hora (precios y stock pueden cambiar)
export const revalidate = 3600;
