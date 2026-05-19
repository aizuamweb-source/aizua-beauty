import { NextRequest, NextResponse } from "next/server";

const KEY = "aizualabs2026indexnow1a2b3c4d";
const HOST = process.env.NEXT_PUBLIC_APP_URL || "https://beauty.aizualabs.com";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

export async function POST(req: NextRequest) {
  let urls: string[] = [];

  try {
    const body = await req.json().catch(() => ({}));
    if (Array.isArray(body?.urls) && body.urls.length > 0) {
      urls = body.urls.slice(0, 100);
    }
  } catch {
    // ignore
  }

  if (urls.length === 0) {
    const locales = ["es", "en", "fr", "de", "pt", "it"];
    for (const l of locales) {
      urls.push(`${HOST}/${l}`);
      urls.push(`${HOST}/${l}/tienda`);
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
