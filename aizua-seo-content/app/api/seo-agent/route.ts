// app/api/seo-agent/route.ts
// Aizua — Agente SEO con Claude API
// Ejecutado por n8n cada día a las 7:00 AM
// Genera: meta descriptions, titles SEO, auditoría técnica básica, informe semanal

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase  = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const LOCALES = ["es", "en", "fr", "de", "pt", "it"] as const;

const LOCALE_INSTRUCTIONS: Record<string, string> = {
  es: "Escribe en español neutro, orientado al mercado europeo hispanohablante.",
  en: "Write in clear English, suitable for both European and US audiences.",
  fr: "Écris en français neutre, adapté au marché européen francophone.",
  de: "Schreibe auf Deutsch, präzise und für den deutschen Markt optimiert.",
  pt: "Escreva em português neutro, adequado para Portugal e Brasil.",
  it: "Scrivi in italiano chiaro, ottimizzato per il mercato italiano.",
};

// ── GENERAR META DESCRIPTION + SEO TITLE ──
async function generateSEOMeta(product: {
  id: string;
  name: Record<string, string>;
  description: Record<string, string>;
  price: number;
  category: string;
  rating: number;
  review_count: number;
  slug: string;
}, locale: string): Promise<{ title: string; metaDescription: string }> {

  const name = product.name?.[locale] || product.name?.en || "";
  const desc = (product.description?.[locale] || product.description?.en || "")
    .replace(/<[^>]+>/g, "")
    .slice(0, 600);

  const response = await anthropic.messages.create({
    model:      "claude-sonnet-4-6",
    max_tokens: 200,
    system: `Eres un experto en SEO especializado en e-commerce de electrónica. 
Genera títulos SEO y meta descriptions optimizados para Google.
Responde SOLO en JSON válido con las claves "title" y "metaDescription".
No uses markdown, no uses comillas escapadas innecesarias.`,
    messages: [{
      role: "user",
      content: `${LOCALE_INSTRUCTIONS[locale]}

Producto: ${name}
Categoría: ${product.category}
Precio: €${product.price}
Rating: ${product.rating}/5 (${product.review_count} reseñas)
Descripción: ${desc}

Genera:
- title: máximo 60 caracteres, incluye keyword principal y precio
- metaDescription: máximo 155 caracteres, incluye beneficio principal, precio, y llamada a la acción

Formato JSON exacto: {"title":"...","metaDescription":"..."}`,
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";

  try {
    return JSON.parse(text);
  } catch {
    // Fallback si el JSON no es válido
    return {
      title:           `${name.slice(0, 50)} | Aizua`,
      metaDescription: `${name.slice(0, 80)} desde €${product.price}. Envío gratis +€40. Garantía 2 años.`,
    };
  }
}

// ── AUDITORÍA TÉCNICA BÁSICA ──
async function runBasicAudit(): Promise<{
  productsWithoutMeta:  number;
  productsWithoutSlug:  number;
  totalProducts:        number;
  totalIndexableUrls:   number;
}> {
  const { data: products, count } = await supabase
    .from("products")
    .select("id, slug, seo_title, seo_description", { count: "exact" })
    .eq("active", true);

  const withoutMeta = (products || []).filter(p => !p.seo_title || !p.seo_description).length;
  const withoutSlug = (products || []).filter(p => !p.slug).length;

  return {
    productsWithoutMeta:  withoutMeta,
    productsWithoutSlug:  withoutSlug,
    totalProducts:        count || 0,
    totalIndexableUrls:   (count || 0) * LOCALES.length + LOCALES.length * 8, // productos + páginas estáticas
  };
}

// ── ENDPOINT PRINCIPAL ──
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.SYNC_SECRET_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action = "daily_audit" } = await req.json().catch(() => ({}));
  const results = { generated: 0, errors: 0, audit: null as null | object };

  // ── 1. AUDITORÍA DIARIA ──
  if (action === "daily_audit" || action === "full") {
    results.audit = await runBasicAudit();
  }

  // ── 2. GENERAR META TAGS PARA PRODUCTOS QUE FALTAN ──
  if (action === "generate_meta" || action === "full") {
    const { data: products } = await supabase
      .from("products")
      .select("id, name, description, price, category, rating, review_count, slug, seo_title, seo_description")
      .eq("active", true)
      .or("seo_title.is.null,seo_description.is.null")
      .limit(10); // Máximo 10 por ejecución para controlar coste API

    for (const product of products || []) {
      for (const locale of LOCALES) {
        try {
          const meta = await generateSEOMeta(product, locale);

          // Guardar en Supabase como JSONB indexado por locale
          const seoTitles      = product.seo_title      || {};
          const seoDescriptions = product.seo_description || {};
          seoTitles[locale]       = meta.title;
          seoDescriptions[locale] = meta.metaDescription;

          await supabase.from("products").update({
            seo_title:       seoTitles,
            seo_description: seoDescriptions,
            updated_at:      new Date().toISOString(),
          }).eq("id", product.id);

          results.generated++;

          // Rate limit Claude API
          await new Promise(r => setTimeout(r, 400));
        } catch {
          results.errors++;
        }
      }
    }
  }

  // ── 3. INFORME SEMANAL (lunes) ──
  const isMonday = new Date().getDay() === 1;
  if (isMonday && process.env.TELEGRAM_BOT_TOKEN) {
    const audit = results.audit as { totalProducts: number; totalIndexableUrls: number; productsWithoutMeta: number } | null;
    const msg =
      `📊 *INFORME SEO SEMANAL — AIZUA*\n\n` +
      `🗓️ ${new Date().toLocaleDateString("es-ES", { weekday:"long", day:"numeric", month:"long" })}\n\n` +
      `📦 Productos activos: ${audit?.totalProducts ?? "—"}\n` +
      `🔍 URLs indexables: ${audit?.totalIndexableUrls ?? "—"}\n` +
      `✍️ Meta generadas hoy: ${results.generated}\n` +
      `⚠️ Sin meta: ${audit?.productsWithoutMeta ?? "—"}\n\n` +
      `_Próxima auditoría: mañana a las 7:00 AM_`;

    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id:    process.env.TELEGRAM_CHAT_ID,
          text:       msg,
          parse_mode: "Markdown",
        }),
      }
    ).catch(console.error);
  }

  return NextResponse.json({ success: true, results });
}
