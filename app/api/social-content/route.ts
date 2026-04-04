import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
    "Eres un experto en marketing digital para e-commerce. Genera contenido para el producto: " +
    name +
    (price ? " (precio: " + price + "EUR)" : "") +
    ". Idioma: " + locale + ".\n" +
    "Responde SOLO en JSON con estas claves:\n" +
    '{"tiktok":"guion TikTok 60s con gancho, problema, soluciÃ³n, CTA (max 300 chars)","ig":"caption Instagram con emoji y CTA (max 200 chars)","hashtags":"5 hashtags relevantes separados por espacio"}';

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "{}";
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

  // Get top 3 products by rating/sales
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, price, images")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const generated: any[] = [];
  const errors: string[] = [];

  for (const product of products ?? []) {
    try {
      const content = await generateContent(product, "es");
      const output = {
        type: "social_content",
        product_id: product.id,
        locale: "es",
        content: JSON.stringify(content),
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
