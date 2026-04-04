import { createClient } from "@supabase/supabase-js";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import CatalogoClient from "@/components/tienda/CatalogoClient";
import MainNav from "@/components/nav/MainNav";
import Footer from "@/components/nav/Footer";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isEs = params.locale === "es";
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://aizuabeauty.vercel.app";
  return {
    title: isEs ? "Tienda — Skincare Natural y Moda Femenina | AizuaBeauty" : "Shop — Natural Skincare & Women's Fashion | AizuaBeauty",
    description: isEs
      ? "Compra cosmética natural y moda femenina seleccionada. Bolsos, pañuelos, bisutería, gorros y más. Envío desde España y Europa."
      : "Shop natural cosmetics and curated women's fashion. Bags, scarves, jewellery, hats and more. Ships from Spain and Europe.",
    keywords: isEs
      ? ["comprar cosmética natural", "moda femenina online", "bolsos mujer", "pañuelos seda", "bisutería", "envío Europa"]
      : ["buy natural cosmetics", "women's fashion online", "women's bags", "silk scarves", "jewellery", "European shipping"],
    openGraph: {
      title: isEs ? "Tienda AizuaBeauty — Skincare y Moda Femenina" : "AizuaBeauty Shop — Skincare & Women's Fashion",
      url: `${base}/${params.locale}/tienda`,
      type: "website",
    },
    alternates: { canonical: `${base}/${params.locale}/tienda` },
  };
}

export const dynamic = "force-dynamic";

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
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          fetch: (url: RequestInfo | URL, init?: RequestInit) =>
            fetch(url, { ...init, cache: "no-store" }),
        },
      }
    );
    const { data, error } = await supabase
      .from("products")
      .select("id, slug, name, name_es, name_en, name_fr, name_de, name_pt, name_it, price, compare_price, images, badge, rating, review_count, category, active")
      .eq("active", true)
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
