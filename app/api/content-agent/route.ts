/**
 * /api/content-agent — Agente de Contenido (Fase 5)
 * Genera guiones TikTok/IG, posts, descripciones y blog desde el catálogo.
 *
 * Endpoints:
 *  GET  /api/content-agent              → listado de content_outputs recientes
 *  GET  /api/content-agent?stats=1      → estadísticas por tipo
 *  POST /api/content-agent              → generar contenido (tipo + producto)
 *  POST /api/content-agent {batch:true} → batch semanal: top 5 productos → tiktok_script
 *
 * Auth:
 *  - GET: CRON_SECRET (Vercel Cron) o SYNC_SECRET_TOKEN (manual)
 *  - POST: SYNC_SECRET_TOKEN
 *
 * Cron: miércoles 08:00 UTC (batch semanal de guiones TikTok)
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

// ── Clientes ──────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase  = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Tipos ─────────────────────────────────────────────────
type ContentType =
  | "tiktok_script"
  | "social_post"
  | "product_description"
  | "email_subject"
  | "blog_article"
  | "kdp_chapter"
  | "academy_module";

type Locale = "es" | "en" | "fr" | "de" | "pt" | "it";

type ContentParams = {
  productName:  string;
  price?:       number;
  features?:    string[];
  keyword?:     string;
  blogTitle?:   string;
  intent?:      string;
  hookIdea?:    string;
  productId?:   string;
  productSlug?: string;
  locales?:     Locale[];
  category?:    string;
};

// ── Voz de marca ──────────────────────────────────────────
const BRAND_VOICE = `
IDENTIDAD DE MARCA AIZÜA:
- Tono: Premium pero accesible. Directo. Sin jerga corporativa.
- Personalidad: Experto en tecnología que es tu amigo — no un vendedor.
- Evitar: superlativos vacíos ("increíble", "revolucionario"), clichés tech.
- Usar: beneficios concretos, números reales, lenguaje cotidiano.
- Siempre incluir: precio, ventaja principal, y un dato técnico específico.
- Emoji: usar con criterio, solo donde añaden valor visual.
`.trim();

// ── Prompts por tipo ──────────────────────────────────────
const PROMPTS: Record<ContentType, (p: ContentParams, locale: Locale) => string> = {

  tiktok_script: (p, locale) => `${BRAND_VOICE}

Escribe un guión para un vídeo de TikTok/Reels de 30-45 segundos.
Idioma: ${locale.toUpperCase()}
Producto: ${p.productName}
Precio: €${p.price}
Categoría: ${p.category || "gadget tecnológico"}
Hook visual sugerido: ${p.hookIdea || "Contraste antes/después del problema que resuelve el producto"}

Formato EXACTO (respeta las etiquetas de tiempo):
[0-3s]   HOOK: imagen de apertura + texto superpuesto en pantalla (máx 6 palabras impactantes)
[3-10s]  PROBLEMA: narración del pain point real del usuario (voz en off o texto)
[10-22s] SOLUCIÓN: mostrar el producto en uso + 2-3 características clave con datos concretos
[22-30s] PRUEBA SOCIAL: rating, "miles de clientes" o reseña corta creíble
[30-38s] PRECIO + CTA: precio, envío gratis, "Link en bio → aizua.es"

Añade entre paréntesis: sugerencia de música trending o sonido viral para este vídeo.
El guión debe sentirse auténtico, no como un anuncio corporativo.`,

  social_post: (p, locale) => `${BRAND_VOICE}

Escribe un post para Instagram/Facebook.
Idioma: ${locale.toUpperCase()}
Producto: ${p.productName}
Precio: €${p.price}
Beneficio principal: ${p.features?.[0] || "tecnología de calidad a precio justo"}

Formato:
- Línea de apertura impactante (máx 10 palabras, sin emoji al inicio)
- 2-3 párrafos cortos con beneficio + dato técnico
- Emojis estratégicos (no más de 4)
- Precio y envío gratis
- CTA: "🔗 Link en bio → aizua.es"
- 5 hashtags relevantes al final (mix de nicho + masivos)

Máximo 200 palabras.`,

  product_description: (p, locale) => `${BRAND_VOICE}

Escribe una descripción de producto para tienda e-commerce de gadgets.
Idioma: ${locale.toUpperCase()}
Producto: ${p.productName}
Precio: €${p.price}
Características clave: ${p.features?.join(", ") || "no especificadas"}
Keyword SEO principal: ${p.keyword || p.productName}

Formato:
- Párrafo de apertura: gancho situacional o emocional (2 frases)
- 5-6 bullet points con emoji: beneficio concreto + dato técnico
- Párrafo de cierre: llamada a la acción suave (no agresiva)

Máximo 250 palabras. Sin asteriscos markdown en el output final.`,

  blog_article: (p, locale) => `${BRAND_VOICE}

Escribe el inicio de un artículo de blog SEO optimizado.
Idioma: ${locale.toUpperCase()}
Título: ${p.blogTitle || `Los mejores ${p.productName} en ${new Date().getFullYear()}`}
Keyword principal: ${p.keyword || p.productName}
Intención de búsqueda: ${p.intent || "informacional/comparativa"}

Estructura:
- H1 con keyword (el título exacto dado)
- Introducción: 150 palabras, engancha con un problema real del lector
- H2: "¿Por qué necesitas un ${p.keyword || p.productName}?"
- Primer apartado: 200 palabras con H3 descriptivo
- CTA natural hacia aizua.es

SEO: keyword 3-4 veces de forma natural. Incluye una pregunta frecuente (FAQ).`,

  email_subject: (p, locale) => `${BRAND_VOICE}

Genera 5 variantes de asunto de email para carrito abandonado.
Idioma: ${locale.toUpperCase()}
Producto en el carrito: ${p.productName}
Precio: €${p.price}

5 asuntos, uno por línea, sin numeración ni guiones.
Mezcla de estilos: urgencia / curiosidad / beneficio / social proof / personalización.
Máximo 50 caracteres cada uno.`,

  kdp_chapter: (p, locale) => `${BRAND_VOICE}

Escribe la introducción de un capítulo para un libro Amazon KDP.
Idioma: ${locale.toUpperCase()}
Tema del capítulo: ${p.productName} (como solución a un problema del lector)
Contexto: libro de e-commerce / gadgets / productividad personal

Estructura:
- Titular del capítulo atractivo
- Anécdota o situación real (150 palabras) que engancha al lector
- Transición hacia el contenido del capítulo
- 3 bullet points de "lo que aprenderás en este capítulo"

Tono: más reflexivo que el copy de tienda. Autoridad + cercanía.`,

  academy_module: (p, locale) => `${BRAND_VOICE}

Escribe el guión de introducción de un módulo de curso online.
Idioma: ${locale.toUpperCase()}
Tema del módulo: ${p.productName}
Plataforma: AizuaLabs Academy

Estructura:
- Bienvenida al módulo (2-3 frases directas)
- Objetivo de aprendizaje: "Al final de este módulo sabrás/podrás..."
- Por qué importa este tema (problema + consecuencia)
- Vista general del módulo: 3-4 puntos que se van a cubrir
- CTA: "Empecemos"

Tono: mentor experto, no academicista. Máx 200 palabras.`,
};

// ── Auth helper ────────────────────────────────────────────
function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? "";
  const cron  = process.env.CRON_SECRET;
  const token = process.env.SYNC_SECRET_TOKEN;
  return (!!cron && auth === `Bearer ${cron}`) ||
         (!!token && auth === `Bearer ${token}`) ||
         (!cron && !token); // sin configurar → dev mode
}

// ── Generar contenido para un producto ────────────────────
async function generateForProduct(
  type: ContentType,
  params: ContentParams,
  locales: Locale[]
): Promise<{ content: Record<string, string>; tokens: number }> {
  const content: Record<string, string> = {};
  let totalTokens = 0;

  await Promise.all(
    locales.map(async (locale) => {
      try {
        const prompt = PROMPTS[type]?.(params, locale);
        if (!prompt) return;

        const response = await anthropic.messages.create({
          model:      "claude-sonnet-4-5",
          max_tokens: type === "blog_article" || type === "kdp_chapter" ? 1200 : 600,
          system:     "Eres un experto en copywriting y marketing de contenidos para e-commerce de tecnología. Genera contenido auténtico, listo para publicar.",
          messages:   [{ role: "user", content: prompt }],
        });

        content[locale] = response.content[0]?.type === "text" ? response.content[0].text : "";
        totalTokens += (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);
      } catch (e) {
        console.error(`[content-agent] Error ${locale}:`, e);
        content[locale] = "";
      }
    })
  );

  return { content, tokens: totalTokens };
}

// ── Guardar en content_outputs ────────────────────────────
async function saveOutput(
  type: ContentType,
  content: Record<string, string>,
  params: ContentParams,
  tokens: number,
  channel?: string
) {
  const promptHash = createHash("md5")
    .update(`${type}:${params.productName}:${params.locales?.join(",")}`)
    .digest("hex")
    .slice(0, 12);

  return supabase.from("content_outputs").insert({
    product_id:   params.productId   ?? null,
    product_slug: params.productSlug ?? null,
    content_type: type,
    content,
    model:        "claude-sonnet-4-5",
    prompt_hash:  promptHash,
    tokens_used:  tokens,
    status:       "draft",
    channel:      channel ?? (type === "tiktok_script" ? "tiktok" : type === "social_post" ? "instagram" : null),
  });
}

// ── Batch semanal: top 5 productos → guiones TikTok ───────
async function runWeeklyBatch(): Promise<{ generated: number; errors: number }> {
  // Seleccionar top productos por rating y review_count
  const { data: products } = await supabase
    .from("products")
    .select("id, slug, name, price, category, ali_price")
    .eq("active", true)
    .order("rating", { ascending: false })
    .limit(5);

  if (!products?.length) return { generated: 0, errors: 0 };

  let generated = 0;
  let errors    = 0;

  for (const product of products) {
    try {
      const name = typeof product.name === "string"
        ? product.name
        : (product.name?.es ?? product.name?.en ?? "Producto");

      const params: ContentParams = {
        productName:  name,
        price:        product.price,
        productId:    product.id,
        productSlug:  product.slug,
        category:     product.category,
        locales:      ["es", "en"],   // TikTok: es + en para mayor alcance
      };

      const { content, tokens } = await generateForProduct("tiktok_script", params, ["es", "en"]);
      await saveOutput("tiktok_script", content, params, tokens, "tiktok");
      generated++;

      // Rate limit Claude API
      await new Promise((r) => setTimeout(r, 1000));
    } catch (e) {
      console.error("[content-agent] batch error:", e);
      errors++;
    }
  }

  // Telegram: notificar batch completado
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (token && chatId && generated > 0) {
    const now = new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" });
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id:    chatId,
        text:       `🎬 *Agente Contenido — Batch semanal*\n${now}\n\n✅ ${generated} guiones TikTok generados\n${errors > 0 ? `⚠️ ${errors} errores` : ""}\n\nRevisa en: aizua.es/es/admin/content`,
        parse_mode: "Markdown",
      }),
    }).catch(() => {});
  }

  return { generated, errors };
}


// ── 6 Categorías SEO del Blog ─────────────────────────────
const BLOG_CATEGORIES = [
  {
    id: "iluminacion",
    topic: "Iluminación Ambiental y Proyectores LED",
    keyword_es: "proyectores led para habitación",
    keyword_en: "led room projectors",
    title_es: (year: number) => `Los mejores proyectores LED de ambiente en ${year}`,
    title_en: (year: number) => `Best LED ambient projectors in ${year}`,
    cat_filter: "iluminacion",
  },
  {
    id: "audio",
    topic: "Auriculares y Audio Premium sin cables",
    keyword_es: "mejores auriculares inalámbricos calidad precio",
    keyword_en: "best wireless earbuds value",
    title_es: (year: number) => `Guía auriculares inalámbricos ${year}: los más valorados`,
    title_en: (year: number) => `Wireless earbuds guide ${year}: top rated picks`,
    cat_filter: "audio",
  },
  {
    id: "smart-home",
    topic: "Smart Home y Gadgets para el Hogar Inteligente",
    keyword_es: "gadgets hogar inteligente baratos",
    keyword_en: "cheap smart home gadgets",
    title_es: (year: number) => `${year}: Los gadgets smart home que sí merece la pena comprar`,
    title_en: (year: number) => `${year}: Smart home gadgets actually worth buying`,
    cat_filter: "smart-home",
  },
  {
    id: "carga",
    topic: "Cargadores Rápidos y Accesorios Móvil",
    keyword_es: "cargadores rápidos USB-C recomendados",
    keyword_en: "best fast usb-c chargers",
    title_es: (year: number) => `Cargadores USB-C ${year}: GaN y carga rápida explicados`,
    title_en: (year: number) => `USB-C chargers ${year}: GaN and fast charging explained`,
    cat_filter: "carga",
  },
  {
    id: "gaming",
    topic: "Gaming Retro y Consolas Portátiles",
    keyword_es: "consolas retro portátiles baratas",
    keyword_en: "cheap retro portable game consoles",
    title_es: (year: number) => `Consolas retro portátiles ${year}: análisis y comparativa`,
    title_en: (year: number) => `Retro portable consoles ${year}: comparison and review`,
    cat_filter: "gaming",
  },
  {
    id: "bienestar",
    topic: "Bienestar y Tecnología para la Salud",
    keyword_es: "gadgets bienestar salud recomendados",
    keyword_en: "health and wellness tech gadgets",
    title_es: (year: number) => `Gadgets de salud y bienestar ${year} que funcionan de verdad`,
    title_en: (year: number) => `Health and wellness gadgets ${year} that actually work`,
    cat_filter: "bienestar",
  },
] as const;

// ── Batch semanal: 1 artículo de blog SEO por rotación ────
async function runWeeklyBlogBatch(): Promise<{ blog_generated: number; blog_category: string }> {
  // Rotar categoría por número de semana del año
  const weekNum = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (7 * 24 * 3600 * 1000)
  );
  const cat = BLOG_CATEGORIES[weekNum % BLOG_CATEGORIES.length];
  const year = new Date().getFullYear();

  // Buscar un producto activo de esa categoría (o cualquiera si no hay)
  const { data: products } = await supabase
    .from("products")
    .select("id, slug, name, price, category")
    .eq("active", true)
    .ilike("category", `%${cat.cat_filter}%`)
    .order("rating", { ascending: false })
    .limit(1);

  const product = products?.[0];
  const productName = product
    ? (typeof product.name === "string" ? product.name : (product.name?.es ?? product.name?.en ?? "Producto"))
    : cat.topic;

  const params: ContentParams = {
    productName,
    price:       product?.price,
    productId:   product?.id,
    productSlug: product?.slug,
    category:    cat.id,
    keyword:     cat.keyword_es,
    blogTitle:   cat.title_es(year),
    intent:      cat.topic,
    locales:     ["es", "en"],
  };

  try {
    const { content, tokens } = await generateForProduct("blog_article", params, ["es", "en"]);
    await saveOutput("blog_article", content, params, tokens, "blog");
    return { blog_generated: 1, blog_category: cat.id };
  } catch (e) {
    console.error("[content-agent] blog batch error:", e);
    return { blog_generated: 0, blog_category: cat.id };
  }
}

// ══════════════════════════════════════════════════════════
// HANDLERS HTTP
// ══════════════════════════════════════════════════════════

/** GET — listar outputs o stats — también activa el batch semanal (Cron) */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);

  // Stats
  if (searchParams.get("stats") === "1") {
    const { data } = await supabase.rpc("content_agent_stats");
    return NextResponse.json({ stats: data ?? [] });
  }

  // Batch (Vercel Cron lo llama así: GET ?batch=true)
  if (searchParams.get("batch") === "true" || searchParams.get("batch") === "1") {
    const [tiktok, blog] = await Promise.all([runWeeklyBatch(), runWeeklyBlogBatch()]);
    return NextResponse.json({ success: true, ...tiktok, ...blog });
  }

  // Listado de drafts recientes
  const status = searchParams.get("status") ?? "draft";
  const type   = searchParams.get("type");
  const limit  = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

  let query = supabase
    .from("content_outputs")
    .select("id, content_type, product_slug, status, channel, created_at, content, tokens_used")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status !== "all") query = query.eq("status", status);
  if (type)              query = query.eq("content_type", type);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ outputs: data ?? [], count: data?.length ?? 0 });
}

/** POST — generar contenido puntual o batch */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // ── Modo batch ────────────────────────────────────────
    if (body.batch === true) {
      const [tiktok, blog] = await Promise.all([runWeeklyBatch(), runWeeklyBlogBatch()]);
      return NextResponse.json({ success: true, ...tiktok, ...blog });
    }

    // ── Modo individual ───────────────────────────────────
    const {
      type,
      params,
      save = true,
      channel,
    }: {
      type:     ContentType;
      params:   ContentParams;
      save?:    boolean;
      channel?: string;
    } = body;

    if (!type || !params?.productName) {
      return NextResponse.json(
        { error: "type y params.productName son requeridos" },
        { status: 400 }
      );
    }

    const targetLocales: Locale[] = params.locales ?? ["es", "en"];
    const { content, tokens }     = await generateForProduct(type, params, targetLocales);

    // Guardar si se pide (default true)
    if (save) {
      await saveOutput(type, content, params, tokens, channel);
    }

    // Guardar artículo de blog también en blog_posts
    if (type === "blog_article" && params.keyword) {
      // Obtener cover_image: usar imagen del producto asociado o el top producto por sort_order
      let coverImage: string | null = null;
      if (params.productId) {
        const { data: prod } = await supabase
          .from("products").select("images").eq("id", params.productId).single();
        coverImage = prod?.images?.[0] ?? null;
      }
      if (!coverImage && params.productSlug) {
        const { data: prod } = await supabase
          .from("products").select("images").eq("slug", params.productSlug).single();
        coverImage = prod?.images?.[0] ?? null;
      }
      if (!coverImage) {
        // Fallback: imagen del producto top (sort_order 1)
        const { data: topProd } = await supabase
          .from("products").select("images").eq("active", true)
          .order("sort_order", { ascending: true }).limit(1).single();
        coverImage = topProd?.images?.[0] ?? null;
      }

      await supabase.from("blog_posts").upsert({
        slug:        params.keyword.toLowerCase().replace(/\s+/g, "-"),
        title:       { es: params.blogTitle ?? `Blog: ${params.keyword}`, en: params.blogTitle ?? `Blog: ${params.keyword}` },
        content,
        keyword:     params.keyword,
        excerpt:     { es: content.es?.slice(0, 160) ?? "", en: content.en?.slice(0, 160) ?? "" },
        product_id:  params.productId ?? null,
        cover_image: coverImage,
        status:      "draft",
      }, { onConflict: "slug" });
    }

    return NextResponse.json({
      success: true,
      type,
      locales:     Object.keys(content),
      content,
      tokens_used: tokens,
      saved:       save,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error("[content-agent]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** PATCH — actualizar status de un output (approve / publish / reject) */
export async function PATCH(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, status, notes, published_at } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: "id y status requeridos" }, { status: 400 });
    }

    const validStatuses = ["draft", "approved", "published", "rejected"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `status debe ser: ${validStatuses.join(" | ")}` }, { status: 400 });
    }

    const { error } = await supabase
      .from("content_outputs")
      .update({
        status,
        notes:        notes ?? undefined,
        published_at: status === "published" ? (published_at ?? new Date().toISOString()) : undefined,
        updated_at:   new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, id, status });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
