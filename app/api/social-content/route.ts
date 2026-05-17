import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { llmRoute } from "@/lib/llm-router";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function sendTelegram(msg: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text: msg, parse_mode: "HTML" }),
  });
}

async function generateContent(product: any, locale: string): Promise<{ tiktok: string; ig: string; hashtags: string }> {
  const name = product.name ?? product.title ?? "producto";
  const price = product.price ?? "";
  const prompt =
    "Eres un experto en marketing de cosmética natural y moda femenina. Genera contenido para el producto beauty/skincare: " +
    name +
    (price ? " (precio: " + price + "EUR)" : "") +
    ". Idioma: " + locale + ". La marca es AizuaBeauty (@aizuabeauty), cosmética natural y moda femenina europea.\n" +
    "Responde SOLO en JSON con estas claves:\n" +
    '{"tiktok":"guion TikTok 60s con gancho beauty, beneficio, transformación, CTA (max 300 chars)","ig":"caption Instagram con emoji beauty y CTA (max 200 chars)","hashtags":"5 hashtags beauty relevantes separados por espacio"}';

  const { text } = await llmRoute({
    messages: [{ role: "user", content: prompt }],
    maxTokens: 512,
    preferCheap: true,
    tag: "social-content",
  });
  try {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : { tiktok: text, ig: "", hashtags: "" };
  } catch {
    return { tiktok: text, ig: "", hashtags: "" };
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("generate") !== "true") {
    return NextResponse.json({ ok: true, info: "Use ?generate=true to trigger social content generation" });
  }

  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  if (auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get top 3 beauty products (not Ringana — external links make no sense for social)
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, name_es, price, images, supplier")
    .eq("active", true)
    .eq("store", "beauty")           // ← only beauty products
    .neq("supplier", "ringana")      // ← Ringana products link externally
    .order("rating", { ascending: false })
    .limit(3);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const generated: any[] = [];
  const errors: string[] = [];

  for (const product of products ?? []) {
    try {
      const content = await generateContent(product, "es");
      const productName = product.name_es ?? (typeof product.name === "object" ? product.name?.es : product.name);
      const imgUrl: string | undefined = Array.isArray(product.images) ? product.images[0] : undefined;
      const output = {
        type: "social_content",
        product_id: product.id,
        locale: "es",
        content: JSON.stringify(content),
        brand_name: "beauty",        // ← discriminator for AG-46/47 Instagram/Pinterest
        image_url: imgUrl ?? null,   // ← needed for AG-46 to publish to IG
        status: "pending",           // ← awaits Telegram approval before publish
        created_at: new Date().toISOString(),
      };
      await supabase.from("content_outputs").insert(output);
      generated.push({ product: product.name, ...content });
    } catch (e: any) {
      errors.push(product.name + ": " + e.message);
    }
  }

  // Telegram digest
  if (generated.length > 0) {
    let msg = "<b>AG-13 Social Content</b> â " + generated.length + " contenidos generados\n\n";
    for (const g of generated) {
      msg += "<b>" + (g.product ?? "") + "</b>\n";
      msg += "TikTok: " + (g.tiktok ?? "").slice(0, 120) + "...\n";
      msg += (g.hashtags ?? "") + "\n\n";
    }
    await sendTelegram(msg);
  }

  return NextResponse.json({ ok: true, generated: generated.length, errors });
}
