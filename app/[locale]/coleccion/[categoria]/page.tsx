import { createClient } from "@supabase/supabase-js";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import CatalogoClient from "@/components/tienda/CatalogoClient";
import MainNav from "@/components/nav/MainNav";
import Footer from "@/components/nav/Footer";

export const revalidate = 3600; // ISR: cached page, low TTFB for crawlers

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://beauty.aizualabs.com";
const LOCALES = ["es", "en", "fr", "de", "pt", "it"];

// URL slug → DB category name
const CATEGORY_MAP: Record<string, string> = {
  "accesorios": "Accesorios",
  "joyeria": "Joyería",
  "bolsos": "Bolsos",
  "belleza": "Belleza",
  "cabello": "Cabello",
  "moda": "Moda",
  "bienestar": "Bienestar",
  "cuidado": "Cuidado",
};

// SEO metadata per category per locale
const CATEGORY_META: Record<string, Record<string, { title: string; desc: string; keywords: string[] }>> = {
  "accesorios": {
    es: { title: "Accesorios de Moda Mujer | Envío gratis EU | AizuaBeauty", desc: "Descubre accesorios de moda femenina con envío gratis a toda la EU. Pañuelos, cinturones, gorros y más. Calidad y estilo europeo.", keywords: ["accesorios mujer baratos", "moda femenina accesorios", "pañuelos mujer EU", "envío gratis España"] },
    en: { title: "Women's Fashion Accessories | Free EU Shipping | AizuaBeauty", desc: "Shop women's fashion accessories with free EU shipping. Scarves, belts, hats and more. Quality and European style.", keywords: ["women's accessories EU", "fashion accessories cheap", "scarves women EU", "free EU shipping"] },
    fr: { title: "Accessoires Mode Femme | Livraison gratuite UE | AizuaBeauty", desc: "Découvrez des accessoires mode femme avec livraison gratuite dans toute l'UE.", keywords: ["accessoires femme", "mode féminine", "livraison gratuite Europe"] },
    de: { title: "Damen Mode Accessoires | Kostenloser EU-Versand | AizuaBeauty", desc: "Entdecken Sie Damen-Modezubehör mit kostenlosem Versand in der EU.", keywords: ["Damen Accessoires", "Mode Accessoires EU", "kostenloser Versand"] },
  },
  "joyeria": {
    es: { title: "Joyería Mujer Tendencia | Pendientes y Collares EU | AizuaBeauty", desc: "Joyería de moda para mujer con envío gratis a toda la EU. Pendientes, collares y pulseras de acero inoxidable hipoalergénico.", keywords: ["joyería mujer tendencia", "pendientes acero inoxidable", "collares mujer baratos EU", "bisutería mujer"] },
    en: { title: "Women's Trendy Jewellery | Free EU Shipping | AizuaBeauty", desc: "Trendy women's jewellery with free EU shipping. Hypoallergenic stainless steel earrings, necklaces and bracelets.", keywords: ["women's jewellery EU", "stainless steel earrings", "cheap necklaces EU", "fashion jewellery"] },
    fr: { title: "Bijoux Femme Tendance | Livraison UE | AizuaBeauty", desc: "Bijoux mode pour femme avec livraison gratuite dans toute l'UE.", keywords: ["bijoux femme tendance", "boucles d'oreilles", "livraison Europe"] },
    de: { title: "Damen Modeschmuck | EU-Versand | AizuaBeauty", desc: "Trendiger Damenschmuck mit kostenlosem Versand in der EU.", keywords: ["Damenschmuck EU", "Ohrringe Damen", "Modeschmuck günstig"] },
  },
  "bolsos": {
    es: { title: "Bolsos Mujer Moda | Mini Bolsos y Tote Bags EU | AizuaBeauty", desc: "Bolsos de moda para mujer con envío gratis a toda la EU. Mini bolsos de cadena, tote bags de canvas y más. Diseños virales y exclusivos.", keywords: ["bolsos mujer baratos", "mini bolso cadena", "tote bag canvas mujer", "bolsos moda EU"] },
    en: { title: "Women's Fashion Bags | Free EU Shipping | AizuaBeauty", desc: "Trendy women's bags with free EU shipping. Mini chain bags, canvas tote bags and more. Viral and exclusive designs.", keywords: ["women's bags EU", "mini chain bag", "canvas tote bag", "cheap bags EU"] },
    fr: { title: "Sacs Femme Mode | Livraison UE | AizuaBeauty", desc: "Sacs de mode pour femme avec livraison gratuite dans toute l'UE.", keywords: ["sacs femme mode", "mini sac chaîne", "tote bag", "livraison Europe"] },
    de: { title: "Damen Modetaschen | EU-Versand | AizuaBeauty", desc: "Modische Damentaschen mit kostenlosem Versand in der EU.", keywords: ["Damentaschen EU", "Mini Kettentasche", "Canvas Tote Bag günstig"] },
  },
  "belleza": {
    es: { title: "Cosmética y Belleza Natural | Skincare EU | AizuaBeauty", desc: "Productos de cosmética y belleza natural con envío gratis a toda la EU. Mascarillas, gua sha, rodillos de jade y rutinas de skincare consciente.", keywords: ["cosmética natural mujer", "skincare natural EU", "gua sha cuarzo", "rodillo jade facial"] },
    en: { title: "Natural Beauty & Skincare | Free EU Shipping | AizuaBeauty", desc: "Natural beauty and skincare products with free EU shipping. Face masks, gua sha, jade rollers and conscious skincare routines.", keywords: ["natural beauty EU", "natural skincare", "gua sha quartz", "jade roller facial"] },
    fr: { title: "Cosmétiques Beauté Naturelle | Livraison UE | AizuaBeauty", desc: "Produits de beauté naturelle avec livraison gratuite dans l'UE.", keywords: ["cosmétiques naturels", "skincare naturel", "gua sha", "livraison Europe"] },
    de: { title: "Natürliche Schönheit & Hautpflege | EU | AizuaBeauty", desc: "Natürliche Schönheitsprodukte mit kostenlosem EU-Versand.", keywords: ["natürliche Kosmetik EU", "Naturkosmetik günstig", "Gua Sha Quarz"] },
  },
  "cabello": {
    es: { title: "Accesorios de Cabello Virales | Clips y Horquillas EU | AizuaBeauty", desc: "Los accesorios de cabello más virales con envío gratis a toda la EU. Clips mariposa, pasadores, cepillos de bambú y más.", keywords: ["clip pelo mariposa viral", "accesorios cabello mujer", "horquillas tendencia EU", "clip pelo claw"] },
    en: { title: "Viral Hair Accessories | Free EU Shipping | AizuaBeauty", desc: "The most viral hair accessories with free EU shipping. Butterfly clips, hair pins, bamboo brushes and more.", keywords: ["butterfly hair clip viral", "women's hair accessories EU", "hair clips trend", "claw clip EU"] },
    fr: { title: "Accessoires Cheveux Viraux | Livraison UE | AizuaBeauty", desc: "Les accessoires cheveux les plus viraux avec livraison gratuite dans l'UE.", keywords: ["clip cheveux papillon", "accessoires cheveux", "livraison Europe"] },
    de: { title: "Virale Haaraccessoires | EU-Versand | AizuaBeauty", desc: "Die viralen Haaraccessoires mit kostenlosem Versand in der EU.", keywords: ["Schmetterling Haarklammer viral", "Haaraccessoires Damen EU"] },
  },
  "moda": {
    es: { title: "Moda Mujer Tendencia | Ropa y Complementos EU | AizuaBeauty", desc: "Moda femenina de tendencia con envío gratis a toda la EU. Pañuelos de seda, gorros de lana, calcetines decorativos y más prendas virales.", keywords: ["moda mujer tendencia", "ropa femenina barata EU", "pañuelo seda mujer", "complementos moda mujer"] },
    en: { title: "Women's Fashion Trends | Free EU Shipping | AizuaBeauty", desc: "Trending women's fashion with free EU shipping. Silk scarves, wool hats, decorative socks and more viral garments.", keywords: ["women's fashion trends EU", "cheap women's clothing EU", "silk scarf women", "fashion accessories"] },
    fr: { title: "Mode Femme Tendance | Livraison UE | AizuaBeauty", desc: "Mode féminine tendance avec livraison gratuite dans toute l'UE.", keywords: ["mode femme tendance", "vêtements féminins pas cher", "foulard soie femme", "livraison Europe"] },
    de: { title: "Damenmode Trends | EU-Versand | AizuaBeauty", desc: "Trendige Damenmode mit kostenlosem Versand in der EU.", keywords: ["Damenmode Trends EU", "günstige Damenkleidung", "Seidentuch Damen"] },
  },
  "bienestar": {
    es: { title: "Bienestar Femenino | Aromaterapia y Masaje EU | AizuaBeauty", desc: "Productos de bienestar y autocuidado femenino con envío gratis a toda la EU. Difusores de aromas, velas de soja, masajeadores faciales y más.", keywords: ["bienestar femenino", "difusor aromas USB", "vela aromaterapia soja", "masajeador facial eléctrico EU"] },
    en: { title: "Women's Wellness | Aromatherapy & Massage EU | AizuaBeauty", desc: "Women's wellness and self-care products with free EU shipping. Aroma diffusers, soy candles, facial massagers and more.", keywords: ["women's wellness EU", "USB aroma diffuser", "soy aromatherapy candle", "facial massager EU"] },
    fr: { title: "Bien-être Féminin | Aromathérapie UE | AizuaBeauty", desc: "Produits de bien-être féminin avec livraison gratuite dans l'UE.", keywords: ["bien-être féminin", "diffuseur arômes USB", "bougie soja aromathérapie", "livraison Europe"] },
    de: { title: "Damen Wellness | Aromatherapie EU | AizuaBeauty", desc: "Damen-Wellness-Produkte mit kostenlosem Versand in der EU.", keywords: ["Damen Wellness EU", "USB Aromadiffusor", "Sojakerze Aromatherapie"] },
  },
  "cuidado": {
    es: { title: "Cuidado Personal Mujer | Nail Art y Rutinas EU | AizuaBeauty", desc: "Productos de cuidado personal femenino con envío gratis a toda la EU. Sets de nail art, brochas de maquillaje, parches hidratantes y más.", keywords: ["cuidado personal mujer", "nail art set plantillas", "brochas maquillaje profesional", "parche hidratante ojeras EU"] },
    en: { title: "Women's Personal Care | Nail Art & Routines EU | AizuaBeauty", desc: "Women's personal care products with free EU shipping. Nail art sets, makeup brushes, hydrating patches and more.", keywords: ["women's personal care EU", "nail art set templates", "professional makeup brushes", "hydrating eye patches EU"] },
    fr: { title: "Soin Personnel Femme | Nail Art UE | AizuaBeauty", desc: "Produits de soin personnel féminin avec livraison gratuite dans l'UE.", keywords: ["soin personnel femme", "nail art set", "pinceaux maquillage", "livraison Europe"] },
    de: { title: "Damen Körperpflege | Nail Art EU | AizuaBeauty", desc: "Damen-Körperpflegeprodukte mit kostenlosem Versand in der EU.", keywords: ["Damen Körperpflege EU", "Nail Art Set", "Make-up Pinsel günstig"] },
  },
};

// Category display names per locale
const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  "accesorios": { es: "Accesorios", en: "Accessories", fr: "Accessoires", de: "Accessoires", pt: "Acessórios", it: "Accessori" },
  "joyeria": { es: "Joyería", en: "Jewellery", fr: "Bijoux", de: "Schmuck", pt: "Joias", it: "Gioielli" },
  "bolsos": { es: "Bolsos", en: "Bags", fr: "Sacs", de: "Taschen", pt: "Bolsas", it: "Borse" },
  "belleza": { es: "Belleza", en: "Beauty", fr: "Beauté", de: "Schönheit", pt: "Beleza", it: "Bellezza" },
  "cabello": { es: "Cabello", en: "Hair", fr: "Cheveux", de: "Haar", pt: "Cabelo", it: "Capelli" },
  "moda": { es: "Moda", en: "Fashion", fr: "Mode", de: "Mode", pt: "Moda", it: "Moda" },
  "bienestar": { es: "Bienestar", en: "Wellness", fr: "Bien-être", de: "Wellness", pt: "Bem-estar", it: "Benessere" },
  "cuidado": { es: "Cuidado Personal", en: "Personal Care", fr: "Soin Personnel", de: "Körperpflege", pt: "Cuidado Pessoal", it: "Cura Personale" },
};

// Category descriptions per locale
const CATEGORY_DESCRIPTIONS: Record<string, Record<string, string>> = {
  "accesorios": {
    es: "Complementa cada look con nuestra selección de accesorios femeninos. Pañuelos de seda, cinturones elásticos, gorros y bufandas para todas las estaciones, con envío gratis a España y toda la EU.",
    en: "Complete every look with our selection of women's accessories. Silk scarves, elastic belts, hats and scarves for all seasons, with free EU shipping.",
  },
  "joyeria": {
    es: "Joyería de tendencia para mujer en acero inoxidable hipoalergénico. Pendientes, collares y pulseras que no se oxidan ni causan alergias. Envío gratis a toda la EU.",
    en: "Trending women's jewellery in hypoallergenic stainless steel. Earrings, necklaces and bracelets that don't rust or cause allergies. Free EU shipping.",
  },
  "bolsos": {
    es: "Los bolsos más virales de temporada: mini bolsos de cadena, tote bags de canvas y clutches para salir. Diseños exclusivos con envío gratis a toda la EU.",
    en: "The most viral bags of the season: mini chain bags, canvas tote bags and clutches for going out. Exclusive designs with free EU shipping.",
  },
  "belleza": {
    es: "Cosmética natural y consciente para una piel sana y luminosa. Mascarillas hidratantes, gua sha de cuarzo rosa, rodillos de jade y rituales de skincare con ingredientes puros. Envío gratis a la EU.",
    en: "Natural and conscious cosmetics for healthy and glowing skin. Hydrating masks, rose quartz gua sha, jade rollers and skincare rituals with pure ingredients. Free EU shipping.",
  },
  "cabello": {
    es: "Accesorios de cabello virales que arrasan en redes. Clips mariposa, pasadores, diademas y cepillos de bambú antiestático para todo tipo de cabello. Con envío gratis a toda la EU.",
    en: "Viral hair accessories that dominate social media. Butterfly clips, hair pins, headbands and anti-static bamboo brushes for all hair types. Free EU shipping.",
  },
  "moda": {
    es: "Prendas y complementos de moda femenina de tendencia. Pañuelos de seda, gorros de lana balaclava, calcetines decorativos y ropa cápsula que combina con todo. Envío gratis a la EU.",
    en: "Trendy women's fashion garments and accessories. Silk scarves, balaclava wool hats, decorative socks and capsule wardrobe pieces that go with everything. Free EU shipping.",
  },
  "bienestar": {
    es: "Cuídate con nuestra selección de productos de bienestar femenino. Difusores de aromas USB, velas de soja artesanales, masajeadores faciales eléctricos y todo para tu ritual de autocuidado. Envío gratis a la EU.",
    en: "Take care of yourself with our selection of women's wellness products. USB aroma diffusers, artisanal soy candles, electric facial massagers and everything for your self-care ritual. Free EU shipping.",
  },
  "cuidado": {
    es: "Tu rutina de cuidado personal completa. Sets de nail art profesional, brochas de maquillaje de alta calidad, parches hidratantes para ojeras y mascarillas faciales para lucir radiante cada día. Envío gratis EU.",
    en: "Your complete personal care routine. Professional nail art sets, high-quality makeup brushes, hydrating under-eye patches and face masks to look radiant every day. Free EU shipping.",
  },
};

type Product = {
  id: string; slug: string; name: string | Record<string, string>;
  name_es?: string; name_en?: string; name_fr?: string;
  name_de?: string; name_pt?: string; name_it?: string;
  price: number; compare_price?: number; images?: string[];
  badge?: string | null; rating?: number; review_count?: number; category?: string;
};

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function getProductsByCategory(dbCategoryName: string): Promise<Product[]> {
  try {
    const { data, error } = await getSupabase()
      .from("products")
      .select("id, slug, name, name_es, name_en, name_fr, name_de, name_pt, name_it, price, compare_price, images, badge, rating, review_count, category, active, store")
      .eq("active", true)
      .eq("store", "beauty")
      .eq("category", dbCategoryName)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) console.error("Supabase error:", error.message);
    if (data && data.length > 0) return data.filter((p: any) => p.active === true) as Product[];
  } catch (e) {
    console.error("getProductsByCategory error:", e);
  }
  return [];
}

async function getAllCategories(): Promise<string[]> {
  try {
    const { data } = await getSupabase()
      .from("products")
      .select("category")
      .eq("active", true)
      .eq("store", "beauty")
      .not("category", "is", null);
    if (data) {
      const cats = [...new Set(data.map((p: any) => p.category).filter(Boolean))];
      return cats as string[];
    }
  } catch {}
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; categoria: string };
}): Promise<Metadata> {
  const { locale, categoria } = params;
  if (!CATEGORY_MAP[categoria]) return { title: "Categoría no encontrada" };

  const locKey = (locale === "pt" || locale === "it") ? "es" : locale;
  const meta = (CATEGORY_META[categoria] ?? {})[locKey] ?? CATEGORY_META[categoria]?.["es"];
  if (!meta) return { title: "Categoría" };

  // Empty categories are thin content — keep them out of the index until they have products.
  let productCount = 0;
  try {
    const { count } = await getSupabase()
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("active", true)
      .eq("store", "beauty")
      .eq("category", CATEGORY_MAP[categoria]);
    productCount = count ?? 0;
  } catch {}

  return {
    title: meta.title,
    description: meta.desc,
    keywords: meta.keywords,
    robots: productCount === 0 ? { index: false, follow: true } : undefined,
    openGraph: {
      title: meta.title,
      description: meta.desc,
      url: `${BASE}/${locale}/coleccion/${categoria}`,
      type: "website",
    },
    alternates: {
      canonical: `${BASE}/${locale}/coleccion/${categoria}`,
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [l, `${BASE}/${l}/coleccion/${categoria}`])),
        "x-default": `${BASE}/es/coleccion/${categoria}`,
      },
    },
  };
}

export default async function ColeccionPage({
  params,
}: {
  params: { locale: string; categoria: string };
}) {
  const { locale, categoria } = params;
  setRequestLocale(locale);

  // 404 if unknown category
  if (!CATEGORY_MAP[categoria]) notFound();

  const dbCategoryName = CATEGORY_MAP[categoria];
  const products = await getProductsByCategory(dbCategoryName);
  const allDbCategories = await getAllCategories();

  // Get label for current locale
  const labels = CATEGORY_LABELS[categoria] ?? {};
  const label = labels[locale] ?? labels["es"] ?? dbCategoryName;

  // Description
  const descMap = CATEGORY_DESCRIPTIONS[categoria] ?? {};
  const desc = descMap[locale] ?? descMap["es"] ?? descMap["en"] ?? "";

  // Related categories (all categories except current)
  const relatedCategorySlugs = Object.entries(CATEGORY_MAP)
    .filter(([slug, dbName]) => dbName !== dbCategoryName && allDbCategories.includes(dbName))
    .slice(0, 8);

  // JSON-LD Schema
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": label,
    "description": desc,
    "url": `${BASE}/${locale}/coleccion/${categoria}`,
    "numberOfItems": products.length,
    "itemListElement": products.slice(0, 20).map((p, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@type": "Product",
        "name": p.name_es ?? (typeof p.name === "string" ? p.name : (p.name as any)?.es ?? ""),
        "url": `${BASE}/${locale}/product/${p.slug}`,
        "image": p.images?.[0] ?? "",
        "offers": {
          "@type": "Offer",
          "price": String(p.price),
          "priceCurrency": "EUR",
          "availability": "https://schema.org/InStock",
        },
      },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "AizuaBeauty", "item": `${BASE}/${locale}` },
      { "@type": "ListItem", "position": 2, "name": locale === "en" ? "Shop" : "Tienda", "item": `${BASE}/${locale}/tienda` },
      { "@type": "ListItem", "position": 3, "name": label, "item": `${BASE}/${locale}/coleccion/${categoria}` },
    ],
  };

  const breadcrumbLabels: Record<string, { home: string; shop: string }> = {
    es: { home: "Inicio", shop: "Tienda" },
    en: { home: "Home", shop: "Shop" },
    fr: { home: "Accueil", shop: "Boutique" },
    de: { home: "Startseite", shop: "Shop" },
    pt: { home: "Início", shop: "Loja" },
    it: { home: "Home", shop: "Negozio" },
  };
  const bl = breadcrumbLabels[locale] ?? breadcrumbLabels.es;

  const accentColor = "#C9748F"; // AizuaBeauty rose accent

  return (
    <div style={{ minHeight: "100vh", background: "#FDF8F5", fontFamily: "system-ui, sans-serif" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <MainNav locale={locale} />

      {/* Breadcrumb */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 24px 0", fontSize: 13, color: "#888" }}>
        <Link href={`/${locale}`} style={{ color: "#888", textDecoration: "none" }}>{bl.home}</Link>
        <span style={{ margin: "0 6px" }}>›</span>
        <Link href={`/${locale}/tienda`} style={{ color: "#888", textDecoration: "none" }}>{bl.shop}</Link>
        <span style={{ margin: "0 6px" }}>›</span>
        <span style={{ color: "#333", fontWeight: 500 }}>{label}</span>
      </div>

      {/* Category Header */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 24px 12px" }}>
        <h1 style={{ fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 800, color: "#2C1A1A", margin: "0 0 10px" }}>
          {label}
        </h1>
        {desc && (
          <p style={{ fontSize: 15, color: "#666", maxWidth: 680, margin: "0 0 8px", lineHeight: 1.6 }}>
            {desc}
          </p>
        )}
        <p style={{ fontSize: 13, color: "#999" }}>
          {products.length} {locale === "es" ? "productos" : locale === "fr" ? "produits" : locale === "de" ? "Produkte" : "products"}
          {" · "}
          {locale === "es" ? "Envío gratis EU" : locale === "fr" ? "Livraison gratuite EU" : locale === "de" ? "Kostenloser EU-Versand" : "Free EU shipping"}
        </p>
      </div>

      {/* Products Grid */}
      <CatalogoClient products={products} locale={locale} />

      {/* Related Categories */}
      {relatedCategorySlugs.length > 0 && (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 48px" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#2C1A1A", marginBottom: 16 }}>
            {locale === "es" ? "Otras categorías" : locale === "fr" ? "Autres catégories" : locale === "de" ? "Andere Kategorien" : "Other categories"}
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {relatedCategorySlugs.map(([slug]) => {
              const relLabel = (CATEGORY_LABELS[slug] ?? {})[locale] ?? (CATEGORY_LABELS[slug] ?? {})["es"] ?? slug;
              return (
                <Link
                  key={slug}
                  href={`/${locale}/coleccion/${slug}`}
                  style={{
                    display: "inline-block",
                    padding: "8px 18px",
                    background: "#fff",
                    border: `1px solid #E8D5DA`,
                    borderRadius: 24,
                    fontSize: 14,
                    color: accentColor,
                    textDecoration: "none",
                    fontWeight: 500,
                    transition: "all 0.2s",
                  }}
                >
                  {relLabel}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <Footer locale={locale} />
    </div>
  );
}
