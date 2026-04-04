// app/api/content-agent/route.ts
// Aizua — Agente Content con Claude API
// Genera: descripciones de producto, artículos de blog SEO,
// posts RRSS, guiones TikTok/Reels — todo en 6 idiomas
// Llamado por: admin panel, n8n al importar nuevo producto, solicitud manual

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase  = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type ContentType = "product_description" | "blog_article" | "social_post" | "tiktok_script" | "email_subject";
type Locale = "es" | "en" | "fr" | "de" | "pt" | "it";

const BRAND_VOICE = `
IDENTIDAD DE MARCA AIZUA:
- Tono: Premium pero accesible. Directo. Sin jerga corporativa.
- Personalidad: Experto en tecnología que es tu amigo — no un vendedor.
- Evitar: superlativos vacíos ("increíble", "revolucionario"), clichés tech.
- Usar: beneficios concretos, números reales, lenguaje cotidiano.
- Siempre incluir: precio, ventaja principal, y un dato técnico específico.
`;

const PROMPTS: Record<ContentType, (params: ContentParams, locale: Locale) => string> = {

  product_description: (p, locale) => `${BRAND_VOICE}
Escribe una descripción de producto para una tienda e-commerce de gadgets.
Idioma: ${locale.toUpperCase()}
Producto: ${p.productName}
Precio: €${p.price}
Características clave: ${p.features?.join(", ")}
Keyword principal: ${p.keyword || p.productName}

Formato:
- Párrafo de apertura (gancho emocional o situacional, 2 frases)
- 5-6 bullet points con emoji, beneficio + dato técnico
- Párrafo de cierre (llamada a la acción suave)
Máximo 250 palabras. Sin asteriscos de markdown en el output final.`,

  blog_article: (p, locale) => `${BRAND_VOICE}
Escribe el inicio de un artículo de blog SEO optimizado.
Idioma: ${locale.toUpperCase()}
Título: ${p.blogTitle || `Los mejores ${p.productName} en ${new Date().getFullYear()}`}
Keyword principal: ${p.keyword}
Intención de búsqueda: ${p.intent || "informacional"}

Estructura:
- H1 con keyword
- Introducción (150 palabras) — engancha al lector con un problema real
- H2: "¿Por qué necesitas un ${p.keyword}?"
- Primer apartado (200 palabras) con subtítulo H3
- CTA natural hacia la tienda

SEO: menciona la keyword 3-4 veces de forma natural. Incluye pregunta frecuente.`,

  social_post: (p, locale) => `${BRAND_VOICE}
Escribe un post para Instagram/Facebook.
Idioma: ${locale.toUpperCase()}
Producto: ${p.productName}
Precio: €${p.price}
Beneficio principal: ${p.features?.[0] || ""}

Formato:
- Línea de apertura impactante (máx 10 palabras, sin emoji al inicio)
- 2-3 párrafos cortos con el beneficio principal
- 3-4 emojis estratégicos
- Precio y envío gratis
- CTA: "🔗 Link en bio"
- 5 hashtags relevantes al final

Máximo 200 palabras.`,

  tiktok_script: (p, locale) => `${BRAND_VOICE}
Escribe un guión para un vídeo de TikTok/Reels de 30-45 segundos.
Idioma: ${locale.toUpperCase()}
Producto: ${p.productName}
Precio: €${p.price}
Hook visual sugerido: ${p.hookIdea || "Contraste antes/después del problema que resuelve"}

Formato exacto:
[0-3s] HOOK: descripción de la imagen de apertura + texto superpuesto
[3-10s] PROBLEMA: narración del pain point del usuario
[10-20s] SOLUCIÓN: mostrar el producto en uso, características clave
[20-28s] PRUEBA SOCIAL: rating, número de ventas o reseña
[28-33s] PRECIO + CTA: precio, envío, "Link en bio"

Incluye sugerencias de música trending entre paréntesis.`,

  email_subject: (p, locale) => `${BRAND_VOICE}
Genera 5 variantes de asunto de email para un flow de carrito abandonado.
Idioma: ${locale.toUpperCase()}
Producto en el carrito: ${p.productName}
Precio: €${p.price}

Genera exactamente 5 asuntos, uno por línea, sin numeración.
Mezcla: urgencia, curiosidad, beneficio, social proof y personalización.
Máximo 50 caracteres cada uno.`,
};

type ContentParams = {
  productName:  string;
  price?:       number;
  features?:    string[];
  keyword?:     string;
  blogTitle?:   string;
  intent?:      string;
  hookIdea?:    string;
  productId?:   string;
  locales?:     Locale[];
};

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.SYNC_SECRET_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      type,
      params,
      saveToProduct = false,
    }: { type: ContentType; params: ContentParams; saveToProduct?: boolean } = body;

    if (!type || !params?.productName) {
      return NextResponse.json({ error: "type y params.productName requeridos" }, { status: 400 });
    }

    const targetLocales: Locale[] = params.locales || ["es", "en", "fr", "de", "pt", "it"];
    const results: Record<string, string> = {};

    // Generar contenido en todos los idiomas en paralelo
    await Promise.all(
      targetLocales.map(async (locale) => {
        try {
          const prompt = PROMPTS[type]?.(params, locale);
          if (!prompt) return;

          const response = await anthropic.messages.create({
            model:      "claude-sonnet-4-6",
            max_tokens: type === "blog_article" ? 1000 : 500,
            system: "Eres un experto en copywriting y SEO para e-commerce de tecnología. Genera contenido de alta calidad listo para publicar.",
            messages: [{ role: "user", content: prompt }],
          });

          results[locale] = response.content[0].type === "text"
            ? response.content[0].text
            : "";
        } catch (e) {
          console.error(`[content-agent] Error locale ${locale}:`, e);
          results[locale] = "";
        }
      })
    );

    // Guardar en Supabase si se pide y hay productId
    if (saveToProduct && params.productId && type === "product_description") {
      await supabase
        .from("products")
        .update({
          description: results,
          updated_at:  new Date().toISOString(),
        })
        .eq("id", params.productId);
    }

    // Guardar artículo de blog en tabla separada
    if (type === "blog_article" && params.keyword) {
      await supabase.from("blog_posts").upsert({
        slug:      params.keyword.toLowerCase().replace(/\s+/g, "-"),
        title:     params.blogTitle || `Blog: ${params.keyword}`,
        content:   results,
        keyword:   params.keyword,
        status:    "draft",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "slug" });
    }

    return NextResponse.json({
      success: true,
      type,
      locales:  Object.keys(results),
      content:  results,
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error("[content-agent]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
