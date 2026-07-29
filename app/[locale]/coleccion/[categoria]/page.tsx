import { createClient } from "@supabase/supabase-js";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import CatalogoClient from "@/components/tienda/CatalogoClient";
import MainNav from "@/components/nav/MainNav";
import Footer from "@/components/nav/Footer";

export const revalidate = 3600; // ISR: cached page, low TTFB for crawlers
// s229: el Data Cache de Next PERSISTE entre deploys y servia el resultado viejo de
// Supabase (mismo bug que s224 en merchant-feed): tras desactivar 20 productos, esta
// pagina seguia pintandolos con Age:0 y X-Vercel-Cache:MISS. force-no-store evita que
// la lectura de catalogo/contenido se cachee; el ISR de pagina (revalidate) se mantiene.
export const fetchCache = "force-no-store";


const BASE = "https://beauty.aizualabs.com";
const LOCALES = ["es", "en", "fr", "de", "pt", "it"];

// URL slug → DB category name
const CATEGORY_MAP: Record<string, string> = {
  "skincare":    "Skincare",
  "suplementos": "Suplementos",
  "corporal":    "Corporal",
  "capilar":     "Capilar",
  "bolsos":      "Bolsos",
  "perfumes":    "Perfumes",
  "accesorios":  "Accesorios",
};

// SEO metadata per category per locale
const CATEGORY_META: Record<string, Record<string, { title: string; desc: string; keywords: string[] }>> = {
  "skincare": {
    es: { title: "Cuidado Facial y Labial Online", desc: "Cuidado facial y labial: cremas, bálsamos hidratantes y brillos de labios seleccionados. Envío gratis a España y toda la Unión Europea.", keywords: ["crema facial comprar online", "bálsamo labial hidratante", "brillo de labios mate", "cuidado facial mujer EU", "cosmética online España"] },
    en: { title: "Facial & Lip Care Online", desc: "Facial and lip care: creams, hydrating balms and lip glosses, hand-picked. Free shipping to Spain and across the European Union.", keywords: ["face cream buy online", "hydrating lip balm", "matte lip gloss", "facial care women EU", "cosmetics online EU"] },
    fr: { title: "Soins Visage et Lèvres en Ligne", desc: "Soins visage et lèvres: crèmes, baumes hydratants et gloss sélectionnés. Livraison gratuite en Espagne et dans toute l'UE.", keywords: ["crème visage acheter en ligne", "baume à lèvres hydratant", "gloss mat", "soin visage femme EU"] },
    de: { title: "Gesichts- und Lippenpflege Online", desc: "Gesichts- und Lippenpflege: Cremes, feuchtigkeitsspendende Balsame und Lipglosse. Kostenloser Versand nach Spanien und in die ganze EU.", keywords: ["Gesichtscreme online kaufen", "Lippenbalsam feuchtigkeitsspendend", "matter Lipgloss", "Gesichtspflege Damen EU"] },
  },
  "suplementos": {
    es: { title: "Complementos de Bienestar", desc: "Complementos de bienestar para tu rutina diaria. Categoría en preparación: estamos seleccionando referencias antes de publicarlas. Envío gratis EU.", keywords: ["complementos bienestar mujer EU", "suplementos online España", "bienestar rutina diaria"] },
    en: { title: "Wellness Supplements", desc: "Wellness supplements for your daily routine. Category in preparation: we are selecting references before publishing them. Free EU shipping.", keywords: ["wellness supplements women EU", "supplements online EU", "daily wellness routine"] },
    fr: { title: "Compléments Bien-être", desc: "Compléments bien-être pour votre routine quotidienne. Catégorie en préparation: nous sélectionnons les références. Livraison gratuite UE.", keywords: ["compléments bien-être femme EU", "compléments en ligne UE", "routine bien-être"] },
    de: { title: "Wellness-Nahrungsergänzung", desc: "Wellness-Nahrungsergänzung für den Alltag. Kategorie in Vorbereitung: wir wählen die Produkte noch aus. Kostenloser EU-Versand.", keywords: ["Wellness Nahrungsergänzung Damen EU", "Nahrungsergänzung online EU"] },
  },
  "corporal": {
    es: { title: "Cuidado Corporal Online", desc: "Cuidado corporal: cremas, aceites y accesorios para la piel. Categoría en preparación: estamos seleccionando referencias. Envío gratis España y EU.", keywords: ["crema corporal comprar online", "aceite corporal mujer EU", "cuidado corporal online España"] },
    en: { title: "Body Care Online", desc: "Body care: creams, oils and skin accessories. Category in preparation: we are selecting references. Free shipping to Spain and the EU.", keywords: ["body cream buy online", "body oil women EU", "body care online EU"] },
    fr: { title: "Soins Corps en Ligne", desc: "Soins corps: crèmes, huiles et accessoires. Catégorie en préparation: nous sélectionnons les références. Livraison gratuite UE.", keywords: ["crème corps acheter en ligne", "huile corporelle femme EU", "soin corps en ligne"] },
    de: { title: "Körperpflege Online", desc: "Körperpflege: Cremes, Öle und Zubehör. Kategorie in Vorbereitung: wir wählen die Produkte noch aus. Kostenloser EU-Versand.", keywords: ["Körpercreme online kaufen", "Körperöl Damen EU", "Körperpflege online EU"] },
  },
  "capilar": {
    es: { title: "Cuidado del Cabello y Accesorios", desc: "Cuidado del cabello: cepillos masajeadores, accesorios de peinado y herramientas para el cuero cabelludo. Envío gratis a España y toda la EU.", keywords: ["cepillo masajeador cuero cabelludo", "accesorios cabello mujer EU", "cepillo pelo comprar online", "herramientas peinado mujer"] },
    en: { title: "Hair Care & Accessories", desc: "Hair care: scalp massage brushes, styling accessories and tools for the scalp. Free shipping to Spain and across the EU.", keywords: ["scalp massage brush EU", "hair accessories women EU", "hair brush buy online", "styling tools women"] },
    fr: { title: "Soins Cheveux et Accessoires", desc: "Soins cheveux: brosses de massage du cuir chevelu, accessoires de coiffage et outils. Livraison gratuite en Espagne et dans toute l'UE.", keywords: ["brosse massage cuir chevelu", "accessoires cheveux femme EU", "brosse à cheveux en ligne"] },
    de: { title: "Haarpflege und Zubehör", desc: "Haarpflege: Kopfhaut-Massagebürsten, Styling-Zubehör und Werkzeuge. Kostenloser Versand nach Spanien und in die ganze EU.", keywords: ["Kopfhaut Massagebürste", "Haarzubehör Damen EU", "Haarbürste online kaufen"] },
  },
  "bolsos": {
    es: { title: "Bolsos Mujer Moda | Mini Bolsos y Tote Bags EU", desc: "Bolsos de moda para mujer con envío gratis a toda la EU. Mini bolsos de cadena, tote bags de canvas y más. Diseños virales y exclusivos.", keywords: ["bolsos mujer baratos", "mini bolso cadena", "tote bag canvas mujer", "bolsos moda EU"] },
    en: { title: "Women's Fashion Bags | Free EU Shipping", desc: "Trendy women's fashion bags with free EU shipping: mini chain bags, canvas tote bags and clutches. Viral and exclusive designs for every occasion.", keywords: ["women's bags EU", "mini chain bag", "canvas tote bag", "cheap bags EU"] },
    fr: { title: "Sacs Femme Mode | Livraison UE", desc: "Sacs de mode pour femme avec livraison gratuite dans toute l'UE: mini sacs à chaîne, tote bags en toile et pochettes. Designs exclusifs et tendance.", keywords: ["sacs femme mode", "mini sac chaîne", "tote bag", "livraison Europe"] },
    de: { title: "Damen Modetaschen | EU-Versand", desc: "Modische Damentaschen mit kostenlosem Versand in der ganzen EU: Mini-Kettentaschen, Canvas-Tote-Bags und Clutches. Exklusive, trendige Designs.", keywords: ["Damentaschen EU", "Mini Kettentasche", "Canvas Tote Bag günstig"] },
  },
  "perfumes": {
    es: { title: "Perfumes y Fragancias Mujer", desc: "Perfumes y fragancias para mujer. Categoría en preparación: estamos seleccionando referencias antes de publicarlas. Envío gratis a toda la EU.", keywords: ["perfume mujer comprar online", "fragancias mujer EU", "perfumes online España"] },
    en: { title: "Women's Perfumes & Fragrances", desc: "Perfumes and fragrances for women. Category in preparation: we are selecting references before publishing them. Free EU shipping.", keywords: ["women's perfume buy online", "fragrances women EU", "perfumes online EU"] },
    fr: { title: "Parfums et Fragrances Femme", desc: "Parfums et fragrances pour femme. Catégorie en préparation: nous sélectionnons les références. Livraison gratuite UE.", keywords: ["parfum femme acheter en ligne", "fragrances femme UE", "parfums en ligne"] },
    de: { title: "Damen Parfums und Düfte", desc: "Parfums und Düfte für Damen. Kategorie in Vorbereitung: wir wählen die Produkte noch aus. Kostenloser EU-Versand.", keywords: ["Damenparfum online kaufen", "Düfte Damen EU", "Parfums online EU"] },
  },
  "accesorios": {
    es: { title: "Bisutería y Accesorios Mujer Hipoalergénicos", desc: "Accesorios y bisutería de moda para mujer: pendientes, pulseras y collares de acero inoxidable hipoalergénico. Envío gratis a toda la EU.", keywords: ["bisutería mujer tendencia EU", "pendientes acero inoxidable hipoalergénico", "accesorios moda mujer baratos", "clip pelo mujer tendencia", "pulseras collares mujer EU"] },
    en: { title: "Hypoallergenic Jewellery for Women EU", desc: "Women's fashion accessories and jewellery: hypoallergenic stainless steel earrings, bracelets and necklaces. Free EU shipping on all orders.", keywords: ["women's fashion accessories EU", "hypoallergenic earrings EU", "cheap women's jewellery", "hair clip women EU", "bracelets necklaces EU"] },
    fr: { title: "Bijoux Femme Hypoallergéniques Tendance", desc: "Accessoires et bijoux mode pour femme avec livraison gratuite dans l'UE: boucles d'oreilles et colliers hypoallergéniques tendance.", keywords: ["bijoux femme mode EU", "boucles d'oreilles acier inoxydable", "accessoires mode femme pas cher", "clip cheveux tendance", "livraison Europe"] },
    de: { title: "Damen Modezubehör & Schmuck | EU-Versand", desc: "Damen Modezubehör und Schmuck mit kostenlosem Versand in der EU. Hypoallergene Edelstahl-Ohrringe, Armbänder, Halsketten und Haarklammern.", keywords: ["Damen Modezubehör EU", "hypoallergene Ohrringe Edelstahl", "günstiger Damenschmuck EU", "Haarklammer Damen Trend"] },
  },
};

// Category display names per locale
const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  "skincare":    { es: "Skincare", en: "Skincare", fr: "Soins Visage", de: "Hautpflege", pt: "Skincare", it: "Skincare" },
  "suplementos": { es: "Suplementos", en: "Supplements", fr: "Compléments", de: "Nahrungsergänzung", pt: "Suplementos", it: "Integratori" },
  "corporal":    { es: "Corporal", en: "Body Care", fr: "Soin Corps", de: "Körperpflege", pt: "Corporal", it: "Cura Corpo" },
  "capilar":     { es: "Capilar", en: "Hair Care", fr: "Capillaire", de: "Haarpflege", pt: "Capilar", it: "Capillare" },
  "bolsos":      { es: "Bolsos", en: "Bags", fr: "Sacs", de: "Taschen", pt: "Bolsas", it: "Borse" },
  "perfumes":    { es: "Perfumes", en: "Perfumes", fr: "Parfums", de: "Düfte", pt: "Perfumes", it: "Profumi" },
  "accesorios":  { es: "Accesorios", en: "Accessories", fr: "Accessoires", de: "Accessoires", pt: "Acessórios", it: "Accessori" },
};

// Category descriptions per locale
const CATEGORY_DESCRIPTIONS: Record<string, Record<string, string>> = {
  "skincare": {
    es: "Cuidado facial y labial seleccionado: cremas faciales, bálsamos labiales hidratantes y brillos de labios. Cada ficha detalla la composición del fabricante. Envío gratis desde España y Europa en 5-10 días.",
    en: "Curated facial and lip care: face creams, hydrating lip balms and lip glosses. Each product page details the manufacturer's composition. Free shipping from Spain and Europe in 5-10 days.",
    fr: "Soins visage et lèvres sélectionnés: crèmes, baumes hydratants et gloss. Chaque fiche détaille la composition du fabricant. Livraison gratuite UE.",
    de: "Ausgewählte Gesichts- und Lippenpflege: Gesichtscremes, Lippenbalsame und Lipglosse. Jede Produktseite nennt die Zusammensetzung des Herstellers. Kostenloser EU-Versand.",
  },
  "suplementos": {
    es: "Complementos de bienestar para tu rutina diaria. Estamos seleccionando las referencias de esta categoría antes de publicarlas — mientras tanto, explora el resto de la tienda.",
    en: "Wellness supplements for your daily routine. We are selecting the references for this category before publishing them — meanwhile, explore the rest of the store.",
    fr: "Compléments bien-être pour votre routine quotidienne. Nous sélectionnons les références de cette catégorie — en attendant, explorez le reste de la boutique.",
    de: "Wellness-Nahrungsergänzung für den Alltag. Wir wählen die Produkte dieser Kategorie noch aus — schauen Sie sich in der Zwischenzeit den restlichen Shop an.",
  },
  "corporal": {
    es: "Cuidado corporal: cremas hidratantes, aceites y accesorios para la piel. Estamos seleccionando las referencias de esta categoría antes de publicarlas.",
    en: "Body care: hydrating creams, oils and skin accessories. We are selecting the references for this category before publishing them.",
    fr: "Soins corps: crèmes hydratantes, huiles et accessoires. Nous sélectionnons les références de cette catégorie avant de les publier.",
    de: "Körperpflege: Feuchtigkeitscremes, Öle und Zubehör. Wir wählen die Produkte dieser Kategorie noch aus.",
  },
  "capilar": {
    es: "Cuidado del cabello y accesorios de peinado: cepillos masajeadores para el cuero cabelludo, cepillos de peinado y herramientas. Envío gratis a toda la EU.",
    en: "Hair care and styling accessories: scalp massage brushes, styling brushes and tools. Free EU shipping.",
    fr: "Soins cheveux et accessoires de coiffage: brosses de massage du cuir chevelu, brosses et outils. Livraison gratuite UE.",
    de: "Haarpflege und Styling-Zubehör: Kopfhaut-Massagebürsten, Bürsten und Werkzeuge. Kostenloser EU-Versand.",
  },
  "bolsos": {
    es: "Los bolsos más virales de temporada: mini bolsos de cadena, tote bags de canvas y clutches para salir. Diseños exclusivos con envío gratis a toda la EU.",
    en: "The most viral bags of the season: mini chain bags, canvas tote bags and clutches for going out. Exclusive designs with free EU shipping.",
    fr: "Les sacs les plus viraux de la saison: mini sacs à chaîne, tote bags et pochettes. Livraison gratuite UE.",
    de: "Die viralen Taschen der Saison: Mini-Kettentaschen, Canvas-Tote-Bags und Clutches. Kostenloser EU-Versand.",
  },
  "perfumes": {
    es: "Perfumes y fragancias para mujer. Estamos seleccionando las referencias de esta categoría antes de publicarlas — mientras tanto, explora el resto de la tienda.",
    en: "Perfumes and fragrances for women. We are selecting the references for this category before publishing them — meanwhile, explore the rest of the store.",
    fr: "Parfums et fragrances pour femme. Nous sélectionnons les références de cette catégorie avant de les publier.",
    de: "Parfums und Düfte für Damen. Wir wählen die Produkte dieser Kategorie noch aus.",
  },
  "accesorios": {
    es: "Accesorios y bisutería de moda para mujer: pendientes, pulseras, collares en acero inoxidable hipoalergénico, clips de pelo y complementos tendencia. Envío gratis a España y toda la EU.",
    en: "Women's fashion accessories and jewellery: hypoallergenic stainless steel earrings, bracelets, necklaces, hair clips and trending accessories. Free EU shipping.",
    fr: "Accessoires mode et bijoux pour femme: boucles d'oreilles, bracelets, colliers hypoallergéniques et clips cheveux. Livraison gratuite UE.",
    de: "Damen Modezubehör und Schmuck: hypoallergene Edelstahl-Ohrringe, Armbänder, Halsketten und Haarklammern. Kostenloser EU-Versand.",
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
      images: [{ url: "/og-home.jpg", width: 1200, height: 630, alt: meta.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.desc,
      images: ["/og-home.jpg"],
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

      {/* Breadcrumb — paddingTop 108px para no quedar bajo el MainNav fijo (mismo patrón que blog) */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "108px 24px 0", fontSize: 13, color: "#888" }}>
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
      <CatalogoClient products={products} locale={locale} asH1={false} />

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
