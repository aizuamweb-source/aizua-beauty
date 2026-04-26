import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://beauty.aizualabs.com";
const LOCALES = ["es", "en"];

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
          languages: Object.fromEntries(LOCALES.map((l) => [l, `${BASE}/${l}${page}`])),
        },
      });
    }
  }

  // Dynamic product pages
  try {
    const { data: products } = await getSupabase()
      .from("products")
      .select("slug, updated_at")
      .eq("active", true);

    if (products) {
      for (const locale of LOCALES) {
        for (const p of products) {
          entries.push({
            url: `${BASE}/${locale}/product/${p.slug}`,
            lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
            alternates: {
              languages: Object.fromEntries(LOCALES.map((l) => [l, `${BASE}/${l}/product/${p.slug}`])),
            },
          });
        }
      }
    }
  } catch {}

  // Dynamic blog posts
  try {
    const { data: posts } = await getSupabase()
      .from("blog_posts")
      .select("slug, updated_at")
      .eq("published", true);

    if (posts) {
      for (const locale of LOCALES) {
        for (const post of posts) {
          entries.push({
            url: `${BASE}/${locale}/blog/${post.slug}`,
            lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
            changeFrequency: "monthly",
            priority: 0.6,
          });
        }
      }
    }
  } catch {}

  return entries;
}
