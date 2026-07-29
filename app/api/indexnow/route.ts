import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const KEY = "aizualabs2026indexnow1a2b3c4d";
const HOST = "https://beauty.aizualabs.com";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

// Slug de URL → nombre de categoría en products.category (taxonomía beauty, s132)
const CATEGORY_SLUG_TO_DB: Record<string, string> = {
  skincare: "Skincare", suplementos: "Suplementos", corporal: "Corporal",
  capilar: "Capilar", bolsos: "Bolsos", perfumes: "Perfumes", accesorios: "Accesorios",
};

/**
 * Categorías que tienen ≥1 producto activo. Antes era una lista fija con las 7 y, al
 * desactivar un proveedor (s229), seguía pidiendo a Bing indexar colecciones vacías
 * — que la propia página ya marca noindex. Ahora se deriva del catálogo real.
 */
async function categoriesWithProducts(): Promise<string[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from("products")
      .select("category")
      .eq("active", true)
      .eq("store", "beauty")
      .not("category", "is", null);
    const live = new Set((data ?? []).map((r: { category: string }) => r.category));
    return Object.entries(CATEGORY_SLUG_TO_DB)
      .filter(([, db]) => live.has(db))
      .map(([slug]) => slug);
  } catch {
    return [];
  }
}

/**
 * POST /api/indexnow
 * Body: { urls: string[] }  OR empty → pings homepage + tienda + coleccion pages
 * GET /api/indexnow?url=<single-url>  → pings a single URL
 * Called from pipeline after product upload.
 */
export async function POST(req: NextRequest) {
  let urls: string[] = [];
  try {
    const body = await req.json().catch(() => ({}));
    if (Array.isArray(body?.urls) && body.urls.length > 0) {
      urls = body.urls.slice(0, 100);
    }
  } catch { /* ignore */ }

  if (urls.length === 0) {
    const locales = ["es", "en", "fr", "de"];
    for (const l of locales) {
      urls.push(`${HOST}/${l}`);
      urls.push(`${HOST}/${l}/tienda`);
    }
    for (const cat of await categoriesWithProducts()) {
      urls.push(`${HOST}/es/coleccion/${cat}`);
    }
  }

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: new URL(HOST).hostname,
        key: KEY,
        keyLocation: `${HOST}/${KEY}.txt`,
        urlList: urls,
      }),
    });
    return NextResponse.json({ ok: true, status: res.status, pinged: urls.length });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "url param required" }, { status: 400 });
  try {
    const res = await fetch(
      `${INDEXNOW_ENDPOINT}?url=${encodeURIComponent(url)}&key=${KEY}`,
      { method: "GET" }
    );
    return NextResponse.json({ ok: true, status: res.status, url });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
