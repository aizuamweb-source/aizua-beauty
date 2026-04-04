import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const REMOVE_BG_API = "https://api.remove.bg/v1.0/removebg";

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

// Remove background from image URL using remove.bg API
async function removeBackground(imageUrl: string): Promise<string | null> {
  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(REMOVE_BG_API, {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: imageUrl,
        size: "auto",
        bg_color: "ffffff", // white background for ecommerce
        format: "jpg",
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("remove.bg error:", err);
      return null;
    }

    // Returns image bytes â upload to Supabase storage
    const bytes = await res.arrayBuffer();
    const filename = "enhanced_" + Date.now() + ".jpg";

    const { data: upload, error } = await supabase.storage
      .from("product-images")
      .upload(filename, bytes, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(filename);

    return urlData?.publicUrl ?? null;
  } catch (e: any) {
    console.error("removeBackground error:", e.message);
    return null;
  }
}

// GET ?run=true â process up to 10 products per run (remove.bg free tier: 50/month)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("run") !== "true") {
    return NextResponse.json({ ok: true, info: "Use ?run=true to trigger image enhancement" });
  }

  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  if (auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "REMOVE_BG_API_KEX not configured" }, { status: 500 });
  }

  // Products that haven't been enhanced yet (no enhanced_image flag)
  const { data: products } = await supabase
    .from("products")
    .select("id, name, images, enhanced_images")
    .eq("active", true)
    .is("enhanced_images", null)
    .limit(10);

  let enhanced = 0;
  let failed = 0;
  const results: Array<{ id: string; name: string; status: string }> = [];

  for (const product of products ?? []) {
    try {
      const images = (() => {
        try {
          return typeof product.images === "string"
            ? JSON.parse(product.images)
            : product.images ?? [];
        } catch { return []; }
      })();

      if (!images.length) { failed++; continue; }

      // Process first image only (main product image)
      const mainImage = images[0];
      const enhancedUrl = await removeBackground(mainImage);

      if (!enhancedUrl) { failed++; continue; }

      // Save enhanced image URL
      await supabase
        .from("products")
        .update({ enhanced_images: JSON.stringify([enhancedUrl, ...images.slice(1)]) })
        .eq("id", product.id);

      enhanced++;
      results.push({ id: product.id, name: product.name, status: "ok" });
    } catch {
      failed++;
      results.push({ id: product.id, name: product.name, status: "error" });
    }
  }

  const msg =
    "<b>AG-37 Image Enhancement</b>\n" +
    "â Mejoradas: " + enhanced + "\n" +
    "â Fallidas: " + failed;
  await sendTelegram(msg);

  return NextResponse.json({ ok: true, enhanced, failed, results });
}
