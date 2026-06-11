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
    es: { title: "Comprar Crema Natural Ringana sin Parabenos | Skincare Fresco EU | AizuaBeauty", desc: "Cosmética Ringana FRESH: cremas hidratantes, sérums de vitamina C, limpiadores y tónicos sin conservantes artificiales ni parabenos. Formulados frescos desde Austria. Envío gratis España y EU.", keywords: ["crema natural sin parabenos comprar", "Ringana FRESH skincare", "sérum vitamina C natural", "cosmética fresca sin conservantes", "crema hidratante vegana EU", "skincare natural sin parabenos España"] },
    en: { title: "Buy Natural Ringana Skincare No Parabens | Fresh Cosmetics EU | AizuaBeauty", desc: "Ringana FRESH cosmetics: hydrating creams, vitamin C serums, cleansers and tonics without artificial preservatives or parabens. Freshly formulated from Austria. Free EU shipping.", keywords: ["natural skincare no parabens buy", "Ringana FRESH skincare EU", "vitamin C serum natural", "fresh cosmetics no preservatives", "vegan face cream EU"] },
    fr: { title: "Acheter Crème Naturelle Ringana Sans Parabènes | AizuaBeauty", desc: "Cosmétiques Ringana FRESH: crèmes hydratantes, sérums, nettoyants sans conservateurs artificiels. Livraison gratuite dans l'UE.", keywords: ["crème naturelle sans parabènes", "Ringana FRESH cosmétiques", "sérum vitamine C naturel", "livraison Europe"] },
    de: { title: "Natürliche Ringana Creme ohne Parabene kaufen | AizuaBeauty", desc: "Ringana FRESH Kosmetik: Feuchtigkeitscremes, Vitamin-C-Seren ohne künstliche Konservierungsstoffe. Kostenloser EU-Versand.", keywords: ["natürliche Creme ohne Parabene kaufen", "Ringana FRESH Kosmetik", "Vitamin-C-Serum natürlich", "EU Versand kostenlos"] },
  },
  "suplementos": {
    es: { title: "Suplementos Naturales Ringana sin Aditivos | Colágeno · Omega-3 EU | AizuaBeauty", desc: "Suplementos Ringana ADDS: colágeno vegano, omega-3 vegetal, vitamina D+K2 y cápsulas de brillo sin aditivos artificiales ni conservantes. Formulados frescos. Envío gratis España y EU.", keywords: ["suplementos naturales Ringana comprar", "colágeno vegano suplemento EU", "vitamina D K2 natural", "omega-3 vegetal sin aditivos", "suplementos sin conservantes EU", "suplementos naturales mujer Ringana"] },
    en: { title: "Natural Ringana Supplements No Additives | Collagen · Omega-3 EU | AizuaBeauty", desc: "Ringana ADDS supplements: vegan collagen, plant omega-3, vitamin D+K2 and glow capsules without artificial additives or preservatives. Freshly formulated. Free EU shipping.", keywords: ["natural supplements no additives Ringana EU", "vegan collagen supplement buy", "vitamin D K2 natural supplement", "plant omega-3 EU", "clean supplements no preservatives"] },
    fr: { title: "Compléments Naturels Ringana sans Additifs | Collagène · Oméga-3 EU | AizuaBeauty", desc: "Compléments Ringana ADDS: collagène végane, oméga-3 végétal, vitamine D+K2 sans additifs artificiels. Formulés frais. Livraison gratuite UE.", keywords: ["compléments naturels Ringana EU", "collagène végane acheter", "vitamine D K2 naturelle", "livraison Europe gratuite"] },
    de: { title: "Natürliche Ringana Nahrungsergänzung ohne Zusatzstoffe | EU | AizuaBeauty", desc: "Ringana ADDS Nahrungsergänzung: veganes Kollagen, pflanzliches Omega-3, Vitamin D+K2 ohne künstliche Zusatzstoffe. Frisch formuliert. Kostenloser EU-Versand.", keywords: ["natürliche Ringana Nahrungsergänzung EU", "veganes Kollagen kaufen", "Vitamin D K2 natürlich", "Omega-3 pflanzlich EU"] },
  },
  "corporal": {
    es: { title: "Cuidado Corporal Ringana Natural | Cremas y Jabones sin Parabenos EU | AizuaBeauty", desc: "Cuidado corporal Ringana FRESH sin parabenos ni siliconas: cremas hidratantes, jabones naturales y bálsamos formulados frescos. Veganos. Envío gratis España y EU.", keywords: ["crema corporal natural Ringana", "jabón natural sin parabenos comprar", "cuidado corporal vegano EU", "crema hidratante cuerpo sin siliconas", "Ringana FRESH cuerpo España"] },
    en: { title: "Natural Ringana Body Care | Creams & Soaps No Parabens EU | AizuaBeauty", desc: "Ringana FRESH body care without parabens or silicones: hydrating creams, natural soaps and balms freshly formulated. Vegan. Free EU shipping.", keywords: ["natural body care Ringana EU", "natural soap no parabens buy", "vegan body cream EU", "hydrating body cream no silicones"] },
    fr: { title: "Soins Corps Naturels Ringana | Crèmes et Savons sans Parabènes EU | AizuaBeauty", desc: "Soins corps Ringana FRESH sans parabènes: crèmes, savons naturels et baumes frais formulés. Véganes. Livraison gratuite UE.", keywords: ["crème corps naturelle Ringana", "savon naturel sans parabènes", "soin corps végane EU", "livraison Europe"] },
    de: { title: "Natürliche Ringana Körperpflege | Cremes & Seifen ohne Parabene EU | AizuaBeauty", desc: "Ringana FRESH Körperpflege ohne Parabene: Körpercremes, Naturseifen und Balsame frisch formuliert. Vegan. Kostenloser EU-Versand.", keywords: ["natürliche Körperpflege Ringana EU", "Naturseife ohne Parabene kaufen", "vegane Körpercreme EU"] },
  },
  "capilar": {
    es: { title: "Cuidado Capilar Ringana Natural | Champú sin Sulfatos EU | AizuaBeauty", desc: "Cuidado capilar Ringana FRESH sin sulfatos, siliconas ni parabenos: champús, acondicionadores y tratamientos para un cabello sano y brillante. Formulados frescos. Envío gratis España y EU.", keywords: ["champú natural sin sulfatos Ringana", "cuidado capilar vegano EU", "champú sin siliconas comprar", "tratamiento capilar natural sin parabenos", "Ringana FRESH cabello España"] },
    en: { title: "Natural Ringana Hair Care | Sulphate-Free Shampoo EU | AizuaBeauty", desc: "Ringana FRESH hair care without sulphates, silicones or parabens: shampoos, conditioners and treatments for healthy, shiny hair. Freshly formulated. Free EU shipping.", keywords: ["natural shampoo no sulphates Ringana EU", "vegan hair care EU", "sulphate-free shampoo buy", "natural hair treatment no parabens"] },
    fr: { title: "Soins Capillaires Ringana Naturels | Shampooing sans Sulfates EU | AizuaBeauty", desc: "Soins capillaires Ringana FRESH sans sulfates ni parabènes: shampoings, après-shampoings frais formulés. Livraison gratuite UE.", keywords: ["shampoing naturel sans sulfates Ringana", "soin capillaire végane EU", "livraison Europe"] },
    de: { title: "Natürliche Ringana Haarpflege | Sulfatfreies Shampoo EU | AizuaBeauty", desc: "Ringana FRESH Haarpflege ohne Sulfate oder Parabene: Shampoos, Conditioner und Behandlungen frisch formuliert. Kostenloser EU-Versand.", keywords: ["natürliches Shampoo ohne Sulfate Ringana", "vegane Haarpflege EU", "sulfatfreies Shampoo kaufen"] },
  },
  "bolsos": {
    es: { title: "Bolsos Mujer Moda | Mini Bolsos y Tote Bags EU | AizuaBeauty", desc: "Bolsos de moda para mujer con envío gratis a toda la EU. Mini bolsos de cadena, tote bags de canvas y más. Diseños virales y exclusivos.", keywords: ["bolsos mujer baratos", "mini bolso cadena", "tote bag canvas mujer", "bolsos moda EU"] },
    en: { title: "Women's Fashion Bags | Free EU Shipping | AizuaBeauty", desc: "Trendy women's bags with free EU shipping. Mini chain bags, canvas tote bags and more. Viral and exclusive designs.", keywords: ["women's bags EU", "mini chain bag", "canvas tote bag", "cheap bags EU"] },
    fr: { title: "Sacs Femme Mode | Livraison UE | AizuaBeauty", desc: "Sacs de mode pour femme avec livraison gratuite dans toute l'UE.", keywords: ["sacs femme mode", "mini sac chaîne", "tote bag", "livraison Europe"] },
    de: { title: "Damen Modetaschen | EU-Versand | AizuaBeauty", desc: "Modische Damentaschen mit kostenlosem Versand in der EU.", keywords: ["Damentaschen EU", "Mini Kettentasche", "Canvas Tote Bag günstig"] },
  },
  "perfumes": {
    es: { title: "Perfumes Naturales Ringana sin Ftalatos | Fragancias Frescas EU | AizuaBeauty", desc: "Fragancias Ringana con ingredientes naturales: perfumes frescos sin alcohol sintético ni ftalatos. Sprays corporales y aceites de perfume formulados en Austria. Envío gratis España y EU.", keywords: ["perfume natural sin ftalatos comprar", "fragancia Ringana natural EU", "perfume vegano España", "spray corporal natural sin alcohol", "perfume orgánico EU comprar"] },
    en: { title: "Natural Ringana Perfumes No Phthalates | Fresh Fragrances EU | AizuaBeauty", desc: "Ringana natural fragrances: fresh perfumes without synthetic alcohol or phthalates. Body sprays and perfume oils formulated in Austria. Free EU shipping.", keywords: ["natural perfume no phthalates buy", "Ringana fragrance EU", "vegan perfume EU", "natural body spray no alcohol", "organic perfume EU buy"] },
    fr: { title: "Parfums Naturels Ringana sans Phtalates | Fragrances Fraîches EU | AizuaBeauty", desc: "Fragrances Ringana naturelles: parfums frais sans alcool synthétique ni phtalates. Formulés en Autriche. Livraison gratuite UE.", keywords: ["parfum naturel sans phtalates", "fragrance Ringana EU", "parfum végane EU", "livraison Europe"] },
    de: { title: "Natürliche Ringana Parfums ohne Phthalate | Frische Düfte EU | AizuaBeauty", desc: "Ringana natürliche Düfte: frische Parfums ohne synthetischen Alkohol oder Phthalate. In Österreich formuliert. Kostenloser EU-Versand.", keywords: ["natürliches Parfum ohne Phthalate kaufen", "Ringana Duft EU", "veganes Parfum EU"] },
  },
  "accesorios": {
    es: { title: "Accesorios y Bisutería Mujer | Pendientes, Pulseras y Clips EU | AizuaBeauty", desc: "Accesorios y bisutería de moda para mujer con envío gratis a toda la EU. Pendientes, pulseras y collares de acero inoxidable hipoalergénico, clips de pelo y complementos tendencia.", keywords: ["bisutería mujer tendencia EU", "pendientes acero inoxidable hipoalergénico", "accesorios moda mujer baratos", "clip pelo mujer tendencia", "pulseras collares mujer EU"] },
    en: { title: "Women's Fashion Accessories & Jewellery | Free EU Shipping | AizuaBeauty", desc: "Women's fashion accessories and jewellery with free EU shipping. Hypoallergenic stainless steel earrings, bracelets, necklaces, hair clips and trending accessories.", keywords: ["women's fashion accessories EU", "hypoallergenic earrings EU", "cheap women's jewellery", "hair clip women EU", "bracelets necklaces EU"] },
    fr: { title: "Accessoires Mode et Bijoux Femme | Livraison EU | AizuaBeauty", desc: "Accessoires et bijoux mode pour femme avec livraison gratuite dans l'UE. Boucles d'oreilles, bracelets, colliers hypoallergéniques et clips cheveux tendance.", keywords: ["bijoux femme mode EU", "boucles d'oreilles acier inoxydable", "accessoires mode femme pas cher", "clip cheveux tendance", "livraison Europe"] },
    de: { title: "Damen Modezubehör & Schmuck | EU-Versand | AizuaBeauty", desc: "Damen Modezubehör und Schmuck mit kostenlosem Versand in der EU. Hypoallergene Edelstahl-Ohrringe, Armbänder, Halsketten und Haarklammern.", keywords: ["Damen Modezubehör EU", "hypoallergene Ohrringe Edelstahl", "günstiger Damenschmuck EU", "Haarklammer Damen Trend"] },
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
    es: "Cosmética Ringana FRESH sin conservantes artificiales: cremas hidratantes, sérums de vitamina C, limpiadores y tónicos formulados frescos. Sin parabenos, sin silicona, veganos. Envío gratis desde España y Europa en 5-10 días.",
    en: "Ringana FRESH cosmetics without artificial preservatives: hydrating creams, vitamin C serums, cleansers and tonics formulated fresh. No parabens, no silicone, vegan. Free shipping from Spain and Europe in 5-10 days.",
    fr: "Cosmétiques Ringana FRESH sans conservateurs: crèmes, sérums, nettoyants formulés frais. Sans parabènes. Livraison gratuite UE.",
    de: "Ringana FRESH Kosmetik ohne Konservierungsstoffe: Cremes, Seren, Reiniger frisch formuliert. Ohne Parabene. Kostenloser EU-Versand.",
  },
  "suplementos": {
    es: "Suplementos naturales Ringana ADDS sin aditivos artificiales: colágeno vegano, omega-3 de origen vegetal, vitamina D+K2 y cápsulas de brillo. Formulados frescos, sin conservantes. Envío gratis a España y toda la EU.",
    en: "Natural Ringana ADDS supplements without artificial additives: vegan collagen, plant-based omega-3, vitamin D+K2 and glow capsules. Freshly formulated, no preservatives. Free EU shipping.",
    fr: "Compléments naturels Ringana ADDS (collagène, oméga-3, vitamine D+K2) sans additifs. Formulés frais. Livraison gratuite UE.",
    de: "Natürliche Ringana ADDS Nahrungsergänzung (Kollagen, Omega-3, Vitamin D+K2) ohne Zusatzstoffe. Frisch formuliert. Kostenloser EU-Versand.",
  },
  "corporal": {
    es: "Cuidado corporal Ringana FRESH sin parabenos ni siliconas: cremas hidratantes de cuerpo, jabones naturales y bálsamos para una piel suave y nutrida. Formulados frescos, veganos. Envío gratis EU.",
    en: "Ringana FRESH body care without parabens or silicones: hydrating body creams, natural soaps and balms for soft, nourished skin. Freshly formulated, vegan. Free EU shipping.",
    fr: "Soins corps Ringana FRESH sans parabènes: crèmes corps, savons naturels, baumes hydratants. Formulés frais. Livraison gratuite UE.",
    de: "Ringana FRESH Körperpflege ohne Parabene: Körpercremes, Naturseifen und Balsame frisch formuliert. Vegan. Kostenloser EU-Versand.",
  },
  "capilar": {
    es: "Cuidado capilar Ringana FRESH sin sulfatos ni parabenos: champús, acondicionadores y tratamientos para un cabello sano y brillante. Formulados frescos sin agresivos conservantes. Envío gratis a toda la EU.",
    en: "Ringana FRESH hair care without sulphates or parabens: shampoos, conditioners and treatments for healthy, shiny hair. Freshly formulated without harsh preservatives. Free EU shipping.",
    fr: "Soins capillaires Ringana FRESH sans sulfates ni parabènes: shampoings, conditionneurs. Formulés frais. Livraison gratuite UE.",
    de: "Ringana FRESH Haarpflege ohne Sulfate oder Parabene: Shampoos, Conditioner frisch formuliert. Kostenloser EU-Versand.",
  },
  "bolsos": {
    es: "Los bolsos más virales de temporada: mini bolsos de cadena, tote bags de canvas y clutches para salir. Diseños exclusivos con envío gratis a toda la EU.",
    en: "The most viral bags of the season: mini chain bags, canvas tote bags and clutches for going out. Exclusive designs with free EU shipping.",
    fr: "Les sacs les plus viraux de la saison: mini sacs à chaîne, tote bags et pochettes. Livraison gratuite UE.",
    de: "Die viralen Taschen der Saison: Mini-Kettentaschen, Canvas-Tote-Bags und Clutches. Kostenloser EU-Versand.",
  },
  "perfumes": {
    es: "Fragancias Ringana con ingredientes naturales: perfumes frescos sin alcohol sintético ni ftalatos. Sprays corporales y aceites de perfume formulados en Austria. Envío gratis a España y toda la EU.",
    en: "Ringana natural fragrances: fresh perfumes without synthetic alcohol or phthalates. Body sprays and perfume oils formulated in Austria. Free EU shipping.",
    fr: "Fragrances naturelles Ringana: parfums frais sans phtalates. Formulés en Autriche. Livraison gratuite UE.",
    de: "Natürliche Ringana Düfte: frische Parfums ohne Phthalate. In Österreich formuliert. Kostenloser EU-Versand.",
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
