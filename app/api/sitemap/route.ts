// app/api/sitemap/route.ts
// Aizua — Sitemap.xml dinámico con todos los productos y páginas
// Accesible en: https://aizua.vercel.app/sitemap.xml

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const LOCALES = ["es", "en", "fr", "de", "pt", "it"];
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://aizua.vercel.app";

// Páginas estáticas (todas en los 6 idiomas)
const STATIC_PAGES = ["", "shop", "contact", "privacy", "returns", "terms", "cookies", "legal"];

export async function GET() {
  const { data: products } = await supabase
    .from("products")
    .select("slug, updated_at")
    .eq("active", true)
    .order("updated_at", { ascending: false });

  const urls: string[] = [];

  // Páginas estáticas
  for (const locale of LOCALES) {
    for (const page of STATIC_PAGES) {
      const path = page ? `/${locale}/${page}` : `/${locale}`;
      urls.push(`
  <url>
    <loc>${BASE_URL}${path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${page === "" ? "1.0" : "0.8"}</priority>
  </url>`);
    }
  }

  // Páginas de producto (6 idiomas × n productos)
  for (const product of products ?? []) {
    for (const locale of LOCALES) {
      urls.push(`
  <url>
    <loc>${BASE_URL}/${locale}/product/${product.slug}</loc>
    <lastmod>${new Date(product.updated_at).toISOString().split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`);
    }
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      "Content-Type":  "application/xml",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
