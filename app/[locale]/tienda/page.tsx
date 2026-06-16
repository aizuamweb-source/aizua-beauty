import { createClient } from "@supabase/supabase-js";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import CatalogoClient from "@/components/tienda/CatalogoClient";
import MainNav from "@/components/nav/MainNav";
import Footer from "@/components/nav/Footer";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isEs = params.locale === "es";
  const base = "https://beauty.aizualabs.com";
  const META: Record<string, { title: string; desc: string; keywords: string[] }> = {
    es: {
      title: "Comprar Cosmética Natural Ringana y Moda Femenina | Envío Gratis EU | AizuaBeauty",
      desc: "Tienda online de cosmética natural Ringana (sin parabenos, vegana) y moda femenina seleccionada: skincare, suplementos, neceseres, charms para bolso y accesorios beauty. Envío gratis a España y Europa en 5-10 días.",
      keywords: ["Ringana España comprar", "cosmética natural sin parabenos", "crema natural online", "moda femenina sin tallaje", "bolsos mujer online", "pañuelos seda", "cosmética vegana España", "envío gratis Europa"]
    },
    en: {
      title: "Buy Natural Ringana Cosmetics & Women's Fashion | Free EU Shipping | AizuaBeauty",
      desc: "Online store for natural Ringana cosmetics (paraben-free, vegan) and curated women's fashion: skincare, supplements, beauty bags, bag charms and accessories. Free shipping across Europe in 5-10 days.",
      keywords: ["buy Ringana Spain", "natural cosmetics paraben-free", "vegan skincare EU", "women's fashion online EU", "silk scarves", "natural cream EU", "free shipping Europe"]
    },
    fr: {
      title: "Acheter Cosmétiques Naturels Ringana et Mode Féminine | Livraison Gratuite UE | AizuaBeauty",
      desc: "Boutique en ligne de cosmétiques naturels Ringana (sans parabènes, vegan) et mode féminine. Livraison gratuite dans toute l'UE en 5-10 jours.",
      keywords: ["cosmétiques naturels sans parabènes", "Ringana France acheter", "mode féminine en ligne EU", "livraison gratuite Europe"]
    },
    de: {
      title: "Natürliche Ringana Kosmetik & Damenmode kaufen | Kostenloser EU-Versand | AizuaBeauty",
      desc: "Online-Shop für natürliche Ringana Kosmetik (parabenfrei, vegan) und ausgewählte Damenmode. Kostenloser Versand in ganz EU in 5-10 Tagen.",
      keywords: ["natürliche Kosmetik kaufen EU", "Ringana Deutschland", "vegane Kosmetik EU", "Damenmode online EU"]
    },
    pt: {
      title: "Comprar Cosméticos Naturais Ringana e Moda Feminina | Envio Grátis EU | AizuaBeauty",
      desc: "Loja online de cosméticos naturais Ringana (sem parabenos, vegano) e moda feminina selecionada. Envio grátis para toda a EU em 5-10 dias.",
      keywords: ["Ringana Portugal comprar", "cosméticos naturais sem parabenos", "moda feminina online EU", "envio grátis Europa"]
    },
    it: {
      title: "Acquistare Cosmetici Naturali Ringana e Moda Femminile | Spedizione Gratuita EU | AizuaBeauty",
      desc: "Negozio online di cosmetici naturali Ringana (senza parabeni, vegan) e moda femminile. Spedizione gratuita in tutta l'UE in 5-10 giorni.",
      keywords: ["Ringana Italia acquistare", "cosmetici naturali senza parabeni", "moda femminile online EU", "spedizione gratuita Europa"]
    },
  };
  const loc = META[params.locale] ?? META.en;
  return {
    title: loc.title,
    description: loc.desc,
    keywords: loc.keywords,
    openGraph: {
      title: loc.title,
      description: loc.desc,
      url: `${base}/${params.locale}/tienda`,
      type: "website",
      images: [{ url: "/og-home.jpg", width: 1200, height: 630, alt: loc.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: loc.title,
      description: loc.desc,
      images: ["/og-home.jpg"],
    },
    alternates: {
      canonical: `${base}/${params.locale}/tienda`,
      languages: { es:`${base}/es/tienda`, en:`${base}/en/tienda`, fr:`${base}/fr/tienda`, de:`${base}/de/tienda`, pt:`${base}/pt/tienda`, it:`${base}/it/tienda`, "x-default":`${base}/es/tienda` },
    },
  };
}

export const revalidate = 3600; // ISR: cached page, low TTFB for crawlers

type Product = {
  id: string; slug: string; name: string | Record<string, string>;
  name_es?: string; name_en?: string; name_fr?: string;
  name_de?: string; name_pt?: string; name_it?: string;
  price: number; compare_price?: number; images?: string[];
  badge?: string | null; rating?: number; review_count?: number; category?: string;
};

async function getProducts(): Promise<Product[]> {
  try {
    // Server component — usar service role key para bypass RLS y ver todos los productos activos
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data, error } = await supabase
      .from("products")
      .select("id, slug, name, name_es, name_en, name_fr, name_de, name_pt, name_it, price, compare_price, images, badge, rating, review_count, category, active, supplier, store, aliexpress_url")
      .eq("active", true)
      .eq("store", "beauty")
      .order("created_at", { ascending: false });
    if (error) console.error("Supabase error:", error.message);
    if (data && data.length > 0) return data.filter((p: any) => p.active === true) as Product[];
  } catch (e) {
    console.error("getProducts error:", e);
  }
  return [];
}

export default async function TiendaPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  setRequestLocale(locale);
  const products = await getProducts();
  return (
    <div style={{ minHeight: "100vh", background: "#F8F9FB", fontFamily: "system-ui, sans-serif" }}>
      <MainNav locale={locale} />
      <CatalogoClient products={products} locale={locale} />
      <Footer locale={locale} />
    </div>
  );
}
