import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const BASE = "https://beauty.aizualabs.com";
const LOCALES = ["es", "en", "fr", "de", "pt", "it"];

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Static pages — only ES locale in sitemap. Hreflang alternates still reference all locales
  // so Google discovers /fr/ /de/ etc. via hreflang. Avoids "non-canonical in sitemap"
  // (FR/DE/PT/IT show same ES product names → Ahrefs flags them as non-canonical).
  const staticPages = ["", "/tienda", "/blog"];
  for (const page of staticPages) {
    entries.push({
      url: `${BASE}/es${page}`,
      lastModified: new Date(),
      changeFrequency: page === "" || page === "/tienda" ? "daily" : "weekly",
      priority: page === "" ? 1.0 : page === "/tienda" ? 0.9 : 0.8,
      alternates: {
        languages: {
          ...Object.fromEntries(LOCALES.map((l) => [l, `${BASE}/${l}${page}`])),
          "x-default": `${BASE}/es${page}`,
        },
      },
    });
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

  // Ringana — only es/en; fr/de/pt/it canonical → /es/ringana so they must not appear in sitemap
  // (Ahrefs "non-canonical in sitemap" fix — commit f718334 set canonical correctly, now sitemap matches)
  const RINGANA_LOCALES = ["es", "en"];
  for (const locale of RINGANA_LOCALES) {
    entries.push({
      url: `${BASE}/${locale}/ringana`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: {
        languages: {
          es: `${BASE}/es/ringana`,
          en: `${BASE}/en/ringana`,
          "x-default": `${BASE}/es/ringana`,
        },
      },
    });
  }

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
  // traducido (name_<locale>). Los productos Ringana solo tienen es/en; sus páginas
  // fr/de/it/pt caen al nombre EN → Ahrefs "non-canonical in sitemap". Los productos
  // AliExpress sí tienen los 6 idiomas y se incluyen completos.
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
