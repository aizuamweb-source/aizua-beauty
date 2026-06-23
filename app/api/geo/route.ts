import { NextRequest, NextResponse } from "next/server";

// País del visitante (geo-IP de Vercel) para la precisión por país en la ficha.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const country =
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    "";
  return NextResponse.json(
    { country: country.toUpperCase() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
