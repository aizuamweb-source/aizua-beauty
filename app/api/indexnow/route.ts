import { NextRequest, NextResponse } from "next/server";

const KEY = "aizualabs2026indexnow1a2b3c4d";
const HOST = "https://beauty.aizualabs.com";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

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
    const cats = ["skincare","capilar","corporal","suplementos","perfumes","bolsos","accesorios"];
    for (const l of locales) {
      urls.push(`${HOST}/${l}`);
      urls.push(`${HOST}/${l}/tienda`);
    }
    for (const cat of cats) urls.push(`${HOST}/es/coleccion/${cat}`);
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
