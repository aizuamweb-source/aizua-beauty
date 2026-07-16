import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { setRequestLocale } from "next-intl/server";
import { cache } from "react";
import ProductClient from "@/components/product/ProductClient";
import { getLocalizedName } from "@/lib/product-utils";
import MainNav from "@/components/nav/MainNav";
import Footer from "@/components/nav/Footer";

// SSG: pre-generate all beauty product pages for all locales at build time.
export const revalidate = 3600;

const LOCALES = ["es", "en", "fr", "de", "pt", "it"];

export async function generateStaticParams() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: products } = await supabase
      .from("products")
      .select("slug")
      .eq("active", true)
      .eq("store", "beauty");
    if (!products?.length) return [];
    return LOCALES.flatMap((locale) =>
      products.map((p) => ({ locale, slug: p.slug }))
    );
  } catch {
    return [];
  }
}

type ProductPageProps = {
  params: { locale: string; slug: string };
};

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const BEAUTY_BUY: Record<string, string> = {
  es: "Comprar", en: "Buy", fr: "Acheter", de: "Kaufen", pt: "Comprar", it: "Acquistare",
};
const BEAUTY_QUALIFIER: Record<string, string> = {
  es: "Cosmética Natural sin Parabenos", en: "Natural Cosmetics Paraben-Free",
  fr: "Cosmétiques Naturels Sans Parabènes", de: "Natürliche Kosmetik Parabenfrei",
  pt: "Cosmética Natural sem Parabenos", it: "Cosmetici Naturali Senza Parabeni",
};
const BEAUTY_SHIPPING: Record<string, string> = {
  es: "Envío EU Gratis", en: "Free EU Shipping", fr: "Livraison Gratuite UE",
  de: "Kostenloser EU-Versand", pt: "Envio Grátis EU", it: "Spedizione Gratuita EU",
};

function truncateTitle(name: string, max: number): string {
  if (name.length <= max) return name;
  const cut = name.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return lastSpace > max * 0.5 ? cut.slice(0, lastSpace) : cut;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: "Producto no encontrado" };

  const { locale, slug: productSlug } = params;
  const name = getLocalizedName(product as Record<string, unknown>, locale);
  const desc = typeof product.description === "string" ? product.description : (product.description?.[locale] ?? product.description?.en ?? "");
  const imgUrl = product.images?.[0] ?? "";
  const price = product.price ? `€${Number(product.price).toFixed(2)}` : "";
  const buyPrefix = BEAUTY_BUY[locale] ?? BEAUTY_BUY.en;
  const qualifier = BEAUTY_QUALIFIER[locale] ?? BEAUTY_QUALIFIER.en;
  const shipping = BEAUTY_SHIPPING[locale] ?? BEAUTY_SHIPPING.en;

  const cleanDesc = desc
    ? desc.replace(/<[^>]+>/g, "").slice(0, 155)
    : locale === "es"
      ? `${name}${price ? " — " + price : ""}. Sin conservantes artificiales, vegano. ${shipping} en 5-10 días. Compra ahora en AizuaBeauty.`
      : `${name}${price ? " — " + price : ""}. ${qualifier}. ${shipping} in 5-10 days. AizuaBeauty.`;

  const base = "https://beauty.aizualabs.com";
  const LOCALES = ["es","en","fr","de","pt","it"];

  const category = product.category ?? "";
  const keywords = [name, category, "Ringana", "cosmética natural", "sin parabenos", "natural cosmetics", shipping, "AizuaBeauty"]
    .filter(Boolean).join(", ");

  // Locales con nombre realmente traducido. Evita que /fr,/de,/it,/pt de productos
  // sin name_<locale> (que caen al nombre EN) se anuncien como alternativas hreflang
  // → Ahrefs "hreflang to non-canonical". es/en están en todo el catálogo.
  const availLocales = LOCALES.filter((l) => {
    const v = (product as Record<string, unknown>)[`name_${l}`];
    return typeof v === "string" && v.trim() !== "";
  });
  const baseLocales = availLocales.includes("es") ? availLocales : ["es", ...availLocales];
  // Google exige que toda página se auto-referencie en su propio cluster hreflang,
  // incluso si el producto no tiene ese idioma traducido (cae al fallback es/en) —
  // Ahrefs "Self-reference hreflang annotation missing" en /it,/fr,/de,/pt sin name_<locale>.
  const productLocales = baseLocales.includes(locale) ? baseLocales : [...baseLocales, locale];

  return {
    title: `${buyPrefix} ${truncateTitle(name, 38)} | AizuaBeauty`,
    description: cleanDesc,
    keywords,
    alternates: {
      canonical: `${base}/${locale}/product/${productSlug}`,
      languages: {
        ...Object.fromEntries(productLocales.map(l=>[l,`${base}/${l}/product/${productSlug}`])),
        "x-default": `${base}/es/product/${productSlug}`,
      },
    },
    openGraph: {
      title: `${name}${price ? " — " + price : ""} | ${qualifier} | AizuaBeauty`,
      description: cleanDesc,
      url: `${base}/${locale}/product/${productSlug}`,
      images: imgUrl ? [{ url: imgUrl, width: 800, height: 800, alt: name }] : [{ url: "/og-home.jpg", width: 1200, height: 630, alt: "AizuaBeauty" }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${buyPrefix} ${name}${price ? " — " + price : ""} | AizuaBeauty`,
      description: cleanDesc,
      images: imgUrl ? [imgUrl] : [],
    },
  };
}

// Wrapped in React cache() so generateMetadata + the page body share a single
// Supabase query per request instead of fetching the product twice.
const getProduct = cache(async function getProduct(slug: string) {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .eq("store", "beauty")   // solo productos de la tienda beauty
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
});

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
      .eq("store", "beauty")   // solo upsells de la tienda beauty
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

// Slugs de categoría con página /coleccion/[categoria] (mismo set que coleccion/[categoria]/page.tsx)
const CATEGORY_SLUGS = new Set(["skincare", "suplementos", "corporal", "capilar", "bolsos", "perfumes", "accesorios"]);
/** Nombre de categoría DB → slug URL (lowercase, espacios→guiones). null si no tiene página de categoría. */
function categoryToSlug(cat?: string | null): string | null {
  if (!cat) return null;
  const slug = cat.toLowerCase().trim().replace(/\s+/g, "-");
  return CATEGORY_SLUGS.has(slug) ? slug : null;
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
    image: product.images?.length ? product.images : undefined,
    description: descClean || productName,
    sku: product.slug,
    brand: { "@type": "Brand", name: "AizuaBeauty" },
    offers: {
      "@type": "Offer",
      price: product.price != null ? String(product.price) : "0",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: `https://beauty.aizualabs.com/${locale}/product/${product.slug}`,
      priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      seller: { "@type": "Organization", name: "AizuaBeauty", url: "https://beauty.aizualabs.com" },
    },
  };
  if (reviews.length > 0) {
    const avgRating = reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / reviews.length;
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: parseFloat(avgRating.toFixed(1)),
      ratingCount: reviews.length,
      reviewCount: reviews.length,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // BreadcrumbList: Home → Tienda → [Categoría] → Producto. El nivel de categoría solo se
  // incluye si el producto pertenece a una categoría con página /coleccion/[slug] (guard).
  const catSlug = categoryToSlug(typeof product.category === "string" ? product.category : null);
  const tiendaLabel = locale === "en" ? "Shop" : "Tienda";
  const breadcrumbItems: Record<string, unknown>[] = [
    { "@type": "ListItem", position: 1, name: "AizuaBeauty", item: `https://beauty.aizualabs.com/${locale}` },
    { "@type": "ListItem", position: 2, name: tiendaLabel, item: `https://beauty.aizualabs.com/${locale}/tienda` },
  ];
  if (catSlug && typeof product.category === "string") {
    breadcrumbItems.push({ "@type": "ListItem", position: 3, name: product.category, item: `https://beauty.aizualabs.com/${locale}/coleccion/${catSlug}` });
  }
  breadcrumbItems.push({ "@type": "ListItem", position: breadcrumbItems.length + 1, name: productName, item: `https://beauty.aizualabs.com/${locale}/product/${product.slug}` });
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8F9FB", fontFamily: "system-ui, sans-serif" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
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


