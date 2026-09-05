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
      // Title <=46c (+" | AizuaBeauty"=60c) y desc 120-155c (Ahrefs "title/desc fuera de rango", s189-ter)
      title: "Comprar Belleza y Accesorios de Mujer",
      desc: "Tienda online de belleza y accesorios femeninos: cuidado facial y labial, cepillos de cabello, bolsos y joyería. Envío gratis a España y Europa.",
      keywords: ["cuidado facial comprar online", "bálsamo labial hidratante", "accesorios mujer online", "moda femenina sin tallaje", "bolsos mujer online", "joyería mujer online", "organizador maquillaje", "envío gratis Europa"]
    },
    en: {
      title: "Buy Women's Beauty & Accessories",
      desc: "Online store for women's beauty and accessories: facial and lip care, hair brushes, bags and jewellery. Free shipping across the EU.",
      keywords: ["facial care buy online", "hydrating lip balm", "women's accessories online EU", "women's fashion online EU", "women's jewellery online", "makeup organiser EU", "free shipping Europe"]
    },
    fr: {
      title: "Beauté et Accessoires Femme",
      desc: "Boutique en ligne de beauté et accessoires féminins: soins visage et lèvres, brosses, sacs et bijoux. Livraison gratuite dans toute l'UE en 5-10 jours.",
      keywords: ["soin visage acheter en ligne", "baume à lèvres hydratant", "accessoires femme en ligne UE", "bijoux femme en ligne", "livraison gratuite Europe"]
    },
    de: {
      title: "Damen Beauty & Accessoires kaufen",
      desc: "Online-Shop für Damen-Beauty und Accessoires: Gesichts- und Lippenpflege, Haarbürsten, Taschen und Schmuck. Kostenloser EU-Versand in 5-10 Tagen.",
      keywords: ["Gesichtspflege online kaufen", "Lippenbalsam feuchtigkeitsspendend", "Damenmode online EU", "Damen Accessoires online", "Damenschmuck online EU"]
    },
    pt: {
      title: "Beleza e Moda Feminina Online",
      desc: "Loja online de beleza e acessórios femininos: cuidado facial e labial, escovas, bolsas e joias. Envio grátis para toda a EU em 5-10 dias.",
      keywords: ["cuidado facial comprar online", "bálsamo labial hidratante", "acessórios femininos online EU", "moda feminina online EU", "envio grátis Europa"]
    },
    it: {
      title: "Bellezza e Moda Femminile Online",
      desc: "Negozio online di bellezza e accessori femminili: cura del viso e delle labbra, spazzole, borse e bijoux. Spedizione gratuita in tutta l'UE in 5-10 giorni.",
      keywords: ["cura del viso acquistare online", "balsamo labbra idratante", "accessori femminili online EU", "moda femminile online EU", "spedizione gratuita Europa"]
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

// s280 — VENTANA A 6 h (estaba en 1 h). La ficha de producto ya esta en 24 h
// desde el 04/09, asi que un listado a 1 h no daba mas frescura real que la
// pagina a la que enlaza: solo pagaba mas renders. 6 h sigue siendo cuatro
// veces mas fresco que la ficha.
export const revalidate = 21600;
// s277: AQUI HABIA `export const fetchCache = "force-no-store"`, puesto en s229
// para que no se sirviera catalogo viejo desde el Data Cache. El comentario que
// lo acompanaba decia "el ISR de pagina (revalidate) se mantiene". NO se mantenia:
// force-no-store hace DINAMICA la ruta entera, asi que el `revalidate` de arriba
// quedaba muerto y esta pagina se renderizaba en el servidor EN CADA PETICION.
// Medido en produccion el 01/09: beauty devolvia `Cache-Control: private,
// no-cache, no-store` y `X-Vercel-Cache: MISS` en /es, /es/tienda y /es/blog,
// mientras tech.aizualabs.com —mismo codigo, sin esta linea— devolvia HIT/STALE.
// Con la cuota de Vercel al 98,9 % eso no es un detalle: cada visita y cada
// rastreador costaban una invocacion.
// Quitarla NO devuelve el bug de s229: sin fetchCache, los fetch de este segmento
// heredan el `revalidate` de arriba, o sea que el dato caduca igual. Si algun dia
// hace falta frescura inmediata tras un cambio, la herramienta es revalidatePath()
// bajo demanda, no apagar la cache de la pagina entera.


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
