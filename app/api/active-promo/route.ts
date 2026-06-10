import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/active-promo — returns the highest-priority active beauty promo
export async function GET() {
  try {
    // Cliente dentro del handler: si faltan env vars, cae al catch → {promo:null}
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data, error } = await supabase
      .from("store_promos")
      .select("*")
      .eq("active", true)
      .eq("store", "beauty")
      .order("priority", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Sin promo activa o caducada → null explícito (sin banners fake).
    // Las ofertas solo viven en sus periodos reales (AG-62 Promo Manager).
    if (error || !data || (data.end_at && new Date(data.end_at).getTime() < Date.now())) {
      return NextResponse.json({ promo: null }, { status: 200 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("[active-promo beauty]", err);
    // Un fallo consultando promos nunca debe romper al consumidor → sin promo
    return NextResponse.json({ promo: null }, { status: 200 });
  }
}
