import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://beauty.aizualabs.com";
const LOCALES = ["es", "en", "fr", "de", "pt", "it"];

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Static pages
  const staticPages = ["", "/tienda", "/ringana", "/blog", "/consulting"];
  for (const locale of LOCALES) {
    for (const page of staticPages) {
      entries.push({
        url: `${BASE}/${locale}${page}`,
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
  }

  // Category pages
  const BEAUTY_CATEGORIES = [
    "accesorios", "joyeria", "bolsos", "belleza",
    "cabello", "moda", "bienestar", "cuidado",
  ];
  for (const locale of LOCALES) {
    for (const cat of BEAUTY_CATEGORIES) {
      entries.push({
        url: `${BASE}/${locale}/coleccion/${cat}`,
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
  }

  // Dynamic product pages
  try {
    const { data: products } = await getSupabase()
      .from("products")
      .select("slug, updated_at")
      .eq("active", true)
      .eq("store", "beauty");   // solo productos de la tienda beauty en el sitemap

    if (products) {
      for (const locale of LOCALES) {
        for (const p of products) {
          entries.push({
            url: `${BASE}/${locale}/product/${p.slug}`,
            lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
            alternates: {
              languages: {
                ...Object.fromEntries(LOCALES.map((l) => [l, `${BASE}/${l}/product/${p.slug}`])),
                "x-default": `${BASE}/es/product/${p.slug}`,
              },
            },
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
