import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Supplier {
  id: string;
  aliexpress_product_id: string;
  coste_actual: number;
  margen_minimo: number;
  precio_min: number;
  precio_max: number;
  product_id: string;
  activo: boolean;
}

// POST /api/price-agent — update prices based on supplier costs
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: suppliers, error } = await supabase
      .from("suppliers")
      .select("*")
      .eq("activo", true);

    if (error) throw error;

    const updates = [];
    for (const s of (suppliers as Supplier[]) ?? []) {
      if (!s.coste_actual || !s.margen_minimo) continue;

      const minPrice = s.coste_actual * (1 + s.margen_minimo / 100);
      const newPrice = Math.max(minPrice, s.precio_min ?? 0);
      const cappedPrice = s.precio_max ? Math.min(newPrice, s.precio_max) : newPrice;
      const roundedPrice = Math.ceil(cappedPrice * 100) / 100;

      const { error: updateErr } = await supabase
        .from("products")
        .update({ price: roundedPrice, updated_at: new Date().toISOString() })
        .eq("id", s.product_id);

      if (!updateErr) updates.push({ product_id: s.product_id, price: roundedPrice });
    }

    await supabase.from("system_health").insert({
      fecha: new Date().toISOString().split("T")[0],
      alertas: [updates.length + " products repriced"],
    });

    return NextResponse.json({ ok: true, updated: updates.length, items: updates });
  } catch (err) {
    console.error("[price-agent]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// GET /api/price-agent — preview pricing without applying
export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("*, products(slug, price)")
    .eq("activo", true);

  return NextResponse.json({ preview: suppliers ?? [], generatedAt: new Date().toISOString() });
}
