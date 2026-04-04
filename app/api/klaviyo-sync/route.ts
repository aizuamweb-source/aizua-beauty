// app/api/klaviyo-sync/route.ts
// Aizua — Newsletter signup + Klaviyo sync
// POST { email, lang?, source? }

import { NextRequest, NextResponse } from "next/server";
import { klaviyo } from "@/lib/klaviyo/client";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// IDs de listas en Klaviyo — crear en Klaviyo Dashboard y pegar aquí
const KLAVIYO_LISTS = {
  all:      process.env.KLAVIYO_LIST_ALL      || "LIST_ID_ALL",
  es:       process.env.KLAVIYO_LIST_ES       || "LIST_ID_ES",
  en:       process.env.KLAVIYO_LIST_EN       || "LIST_ID_EN",
  fr:       process.env.KLAVIYO_LIST_FR       || "LIST_ID_FR",
  de:       process.env.KLAVIYO_LIST_DE       || "LIST_ID_DE",
  pt:       process.env.KLAVIYO_LIST_PT       || "LIST_ID_PT",
  it:       process.env.KLAVIYO_LIST_IT       || "LIST_ID_IT",
};

export async function POST(req: NextRequest) {
  try {
    const { email, lang = "es", source = "footer" } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    // Comprobar si ya existe
    const { data: existing } = await supabase
      .from("newsletter_subscribers")
      .select("id")
      .eq("email", email)
      .single();

    if (existing) {
      return NextResponse.json({ success: true, alreadySubscribed: true });
    }

    // Guardar en Supabase
    await supabase.from("newsletter_subscribers").insert({
      email,
      lang,
      source,
      active:       true,
      created_at:   new Date().toISOString(),
    });

    // Sincronizar con Klaviyo
    await Promise.allSettled([
      // Disparar evento → activa el flow "Welcome series" automáticamente
      klaviyo.trackNewsletterSignup(email, { lang, source }),
      // Añadir a lista global + lista del idioma
      klaviyo.addToList(KLAVIYO_LISTS.all, [email]),
      klaviyo.addToList(KLAVIYO_LISTS[lang as keyof typeof KLAVIYO_LISTS] || KLAVIYO_LISTS.es, [email]),
    ]);

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("[klaviyo-sync]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
