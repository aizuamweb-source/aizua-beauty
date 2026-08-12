import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const BASE = "https://beauty.aizualabs.com";
const LOCALES = ["es", "en", "fr", "de", "pt", "it"];

// s236: ver nota equivalente en tech (Aizua-store) app/sitemap.ts — mismo fix,
// mismo motivo: sin revalidate el sitemap queda cacheado desde el build y no
// refleja cambios de Supabase hasta el proximo deploy.
export const revalidate = 3600;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Static pages — ES + EN en el sitemap (s236). fr/de/pt/it se quedan fuera a
  // proposito, descubribles solo via hreflang: el riesgo de contenido duplicado
  // que motivo la exclusion original SI aplica a esos 4 (mismo listado de
  // productos en español). EN es distinto: verificado en produccion (tech.
  // aizualabs.com, misma plantilla compartida) que estas 3 rutas llevan meta
  // description realmente traducida en ingles, no una copia — y es uno de los
  // DOS mercados objetivo explicitos del proyecto, no uno secundario como los
  // otros 4. Sin esto Ahrefs marcaba las 3 rutas EN como "Indexable page not
  // in sitemap".
  const staticPages = ["", "/tienda", "/blog"];
  const staticSitemapLocales = ["es", "en"];
  for (const page of staticPages) {
    const basePriority = page === "" ? 1.0 : page === "/tienda" ? 0.9 : 0.8;
    for (const loc of staticSitemapLocales) {
      entries.push({
        url: `${BASE}/${loc}${page}`,
        lastModified: new Date(),
        changeFrequency: page === "" || page === "/tienda" ? "daily" : "weekly",
        priority: loc === "es" ? basePriority : basePriority - 0.05,
        alternates: {
          languages: {
            ...Object.fromEntries(LOCALES.map((l) => [l, `${BASE}/${l}${page}`])),
            "x-default": `${BASE}/es${page}`,
          },
        },
      });
    }
  }

  // Páginas legales — solo entrada ES, SIN alternates de idioma: el contenido no está
  // traducido (mismo texto en todos los locales) y el canonical de /en//fr/... apunta
  // siempre a /es/, así que declarar hreflang aquí reintroduciría "Hreflang to
  // non-canonical" (Ahrefs). Estaban ausentes del sitemap por completo → Ahrefs
  // "Indexable page not in sitemap" (mismo fix que tech.aizualabs.com).
  const legalSlugs = ["privacidad", "devoluciones", "cookies", "aviso-legal", "terminos"];
  for (const slug of legalSlugs) {
    entries.push({
      url: `${BASE}/es/legal/${slug}`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    });
  }

  // s229: la landing de la marca de cosmética externa salió del sitemap al desactivarla.
  // Su ruta redirige 301 a /[locale]/tienda (next.config.mjs) — una URL que redirige
  // nunca debe estar en el sitemap (Ahrefs "3XX redirect in sitemap").

  // Category pages — only include categories that actually have ≥1 active product.
  // Empty category pages are thin content → Google flags "crawled, not indexed"
  // and Ahrefs flags "hreflang group not fully crawled". Keep them out of the sitemap.
  // Taxonomia canonica beauty (s132): 7 slugs alineados con products.category en Supabase
  const CATEGORY_SLUG_TO_DB: Record<string, string> = {
    "skincare": "Skincare", "suplementos": "Suplementos", "corporal": "Corporal",
    "capilar": "Capilar", "bolsos": "Bolsos", "perfumes": "Perfumes", "accesorios": "Accesorios",
  };
  let categoriesWithProducts: string[] = [];
  try {
    const { data: catRows } = await getSupabase()
      .from("products")
      .select("category")
      .eq("active", true)
      .eq("store", "beauty")
      .not("category", "is", null);
    const dbCats = new Set((catRows ?? []).map((r: any) => r.category).filter(Boolean));
    categoriesWithProducts = Object.entries(CATEGORY_SLUG_TO_DB)
      .filter(([, db]) => dbCats.has(db))
      .map(([slug]) => slug);
  } catch {}
  // Category pages — only ES locale in sitemap (same reason as static pages above).
  for (const cat of categoriesWithProducts) {
    entries.push({
      url: `${BASE}/es/coleccion/${cat}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
      alternates: {
        languages: {
          ...Object.fromEntries(LOCALES.map((l) => [l, `${BASE}/${l}/coleccion/${cat}`])),
          "x-default": `${BASE}/es/coleccion/${cat}`,
        },
      },
    });
  }

  // Dynamic product pages — un locale se incluye solo si el producto tiene nombre
  // traducido (name_<locale>). Un producto sin name_<locale> cae al nombre EN en esa
  // ruta → Ahrefs "non-canonical in sitemap". La query ya filtra active=true, así que
  // los productos desactivados (s229) salen del sitemap solos.
  try {
    const { data: products } = await getSupabase()
      .from("products")
      .select("slug, updated_at, name_es, name_en, name_fr, name_de, name_it, name_pt")
      .eq("active", true)
      .eq("store", "beauty");   // solo productos de la tienda beauty en el sitemap

    if (products) {
      for (const p of products) {
        const prodLocales = LOCALES.filter((l) => {
          const v = (p as Record<string, unknown>)[`name_${l}`];
          return typeof v === "string" && v.trim() !== "";
        });
        const locs = prodLocales.includes("es") ? prodLocales : ["es", ...prodLocales];
        const langs = {
          ...Object.fromEntries(locs.map((l) => [l, `${BASE}/${l}/product/${p.slug}`])),
          "x-default": `${BASE}/es/product/${p.slug}`,
        };
        for (const locale of locs) {
          entries.push({
            url: `${BASE}/${locale}/product/${p.slug}`,
            lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
            alternates: { languages: langs },
          });
        }
      }
    }
  } catch {}

  // Dynamic blog posts — hreflang adapts automatically when EN content is added
  try {
    const { data: posts } = await getSupabase()
      .from("blog_posts")
      .select("slug, updated_at, langs")
      .eq("status", "published")
      .eq("brand", "beauty");

    if (posts) {
      for (const post of posts) {
        const postLangs: string[] = (post.langs as string[] | null) ?? ["es"];
        const altLangs = Object.fromEntries(
          postLangs.map((l: string) => [l, `${BASE}/${l}/blog/${post.slug}`])
        );
        altLangs["x-default"] = `${BASE}/es/blog/${post.slug}`;
        for (const lang of postLangs) {
          entries.push({
            url: `${BASE}/${lang}/blog/${post.slug}`,
            lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
            changeFrequency: "monthly",
            priority: 0.6,
            alternates: { languages: altLangs },
          });
        }
      }
    }
  } catch {}

  return entries;
}
