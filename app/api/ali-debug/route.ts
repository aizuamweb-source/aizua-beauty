import { createHmac } from "crypto";

function signRequest(params: Record<string, string>, secret: string): string {
  const sorted = Object.keys(params).sort().map((k) => `${k}${params[k]}`).join("");
  return createHmac("sha256", secret).update(sorted).digest("hex").toUpperCase();
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (token !== process.env.SYNC_SECRET_TOKEN) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appKey = process.env.ALI_APP_KEY!;
  const appSecret = process.env.ALI_APP_SECRET!;
  const timestamp = String(Date.now());

  // Probar con el primer producto
  const itemId = "1005010064673487";

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

  const apiUrl = "https://api-sg.aliexpress.com/sync?" + new URLSearchParams(params).toString();

  try {
    const res = await fetch(apiUrl);
    const data = await res.json();
    // Devolver el response completo para ver la estructura
    return Response.json({ raw: data, params_used: { ...params, sign: "***", app_key: "***" } });
  } catch (err) {
    return Response.json({ error: String(err) });
  }
}
