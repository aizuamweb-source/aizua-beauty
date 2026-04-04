import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Firma AliExpress API
function signRequest(params: Record<string, string>, secret: string): string {
  const sorted = Object.keys(params).sort().map((k) => `${k}${params[k]}`).join("");
  return createHmac("sha256", secret).update(sorted).digest("hex").toUpperCase();
}

async function getAliExpressImages(itemId: string): Promise<string[]> {
  const appKey = process.env.ALI_APP_KEY!;
  const appSecret = process.env.ALI_APP_SECRET!;
  const timestamp = String(Date.now());

  const params: Record<string, string> = {
    app_key: appKey,
    timestamp,
    sign_method: "sha256",
    method: "aliexpress.ds.product.get",
    product_id: itemId,
    ship_to_country: "ES",
    target_currency: "EUR",
    target_language: "ES",
    fields: "ae_item_base_info_dto,ae_multimedia_info_dto",
  };

  params.sign = signRequest(params, appSecret);

  const url = "https://api-sg.aliexpress.com/sync?" + new URLSearchParams(params).toString();
  const res = await fetch(url);
  const data = await res.json();

  // Extraer imágenes del response
  const result = data?.aliexpress_ds_product_get_response?.result;
  if (!result) return [];

  const images: string[] = [];

  // Imagen principal
  const mainImg = result?.ae_item_base_info_dto?.subject_trans;
  const mainImgUrl = result?.ae_multimedia_info_dto?.image_urls;

  if (mainImgUrl) {
    const urls = mainImgUrl.split(";").filter(Boolean);
    images.push(...urls.map((u: string) => u.trim()));
  }

  // Imagen de la galería
  const galleryImgs = result?.ae_multimedia_info_dto?.ae_video_dtos?.ae_video_dto;
  if (Array.isArray(galleryImgs)) {
    galleryImgs.forEach((v: { poster_url?: string }) => {
      if (v.poster_url) images.push(v.poster_url);
    });
  }

  return images.slice(0, 5); // máximo 5 imágenes por producto
}

export async function GET(request: Request) {
  // Verificar token de seguridad
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (token !== process.env.SYNC_SECRET_TOKEN) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Obtener todos los productos con aliexpress_id
  const { data: products, error } = await supabase
    .from("products")
    .select("id, slug, aliexpress_id")
    .not("aliexpress_id", "is", null);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const results: { slug: string; status: string; images?: string[] }[] = [];

  for (const product of products ?? []) {
    try {
      const images = await getAliExpressImages(product.aliexpress_id);

      if (images.length > 0) {
        const { error: updateError } = await supabase
          .from("products")
          .update({ images })
          .eq("id", product.id);

        if (updateError) throw updateError;
        results.push({ slug: product.slug, status: "ok", images });
      } else {
        results.push({ slug: product.slug, status: "no_images" });
      }

      // Esperar 500ms entre requests para no sobrecargar la API
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      results.push({ slug: product.slug, status: `error: ${String(err)}` });
    }
  }

  return Response.json({
    synced: results.filter((r) => r.status === "ok").length,
    total: products?.length ?? 0,
    results,
  });
}
