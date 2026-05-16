import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/active-promo — returns the highest-priority active beauty promo
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("store_promos")
      .select("*")
      .eq("active", true)
      .eq("store", "beauty")
      .order("priority", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({
        slug: "beauty-default",
        label_es: "Envío gratis desde 39€",
        label_en: "Free shipping from €39",
        label_fr: "Livraison gratuite dès 39€",
        label_de: "Kostenlos ab 39€",
        label_pt: "Frete grátis a partir de 39€",
        label_it: "Spedizione gratis da 39€",
        sublabel_es: "En toda la tienda beauty",
        sublabel_en: "On all beauty products",
        sublabel_fr: "Sur toute la boutique",
        sublabel_de: "Im gesamten Shop",
        sublabel_pt: "Em toda a loja",
        sublabel_it: "Su tutto il negozio",
        badge_es: "BEAUTY",
        badge_en: "BEAUTY",
        badge_fr: "BEAUTÉ",
        badge_de: "BEAUTY",
        badge_pt: "BEAUTY",
        badge_it: "BEAUTY",
        countdown_type: "daily",
        end_at: null,
      }, { status: 200 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("[active-promo beauty]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
