// lib/aliexpress/client.ts
// Aizua — AliExpress Dropshipping API Client
// Documentación: https://developers.aliexpress.com/en/doc.htm
// API Base: https://api-sg.aliexpress.com/sync
//
// REGISTRO GRATUITO:
// 1. developers.aliexpress.com → Create App
// 2. Categoría: "Dropshipping" o "Affiliate"
// 3. Aprobación: 3-7 días hábiles
// 4. Obtener: APP_KEY + APP_SECRET + acceso OAuth

import crypto from "crypto";

const ALI_API_URL = "https://api-sg.aliexpress.com/sync";
const ALI_AUTH_URL = "https://oauth.aliexpress.com/token";

// ── TIPOS ──
export type AliProduct = {
  product_id: string;
  subject: string;                  // Nombre del producto
  detail: string;                   // Descripción HTML
  image_url: string;                // Imagen principal
  image_urls: string[];             // Galería completa
  price_min: number;                // Precio mínimo (con variantes)
  price_max: number;
  sku_list: AliSku[];
  category_id: string;
  category_name: string;
  avg_star: number;                 // Rating 0-5
  review_count: number;
  ship_to_days: number;             // Días de envío estimados
  freight_list: AliFreight[];
  store_id: string;
  store_name: string;
};

export type AliSku = {
  sku_id: string;
  sku_attr: string;                 // e.g. "Color:Black;Size:XL"
  sku_price: number;
  sku_stock: boolean;
  sku_available_stock: number;
};

export type AliFreight = {
  freight_type: string;             // "CAINIAO_STANDARD", "AliExpress_Standard_Shipping"
  freight_amount: number;
  tracking_available: boolean;
  estimated_delivery_time: string;
};

export type AliOrderItem = {
  product_id: string;
  sku_id: string;
  quantity: number;
};

export type AliShippingAddress = {
  contact_person: string;
  mobile_no: string;
  address: string;
  city: string;
  province: string;
  zip: string;
  country: string;                  // ISO 2-letter: "ES", "FR", etc.
  phone_country: string;            // e.g. "34" para España
};

export type AliOrderResult = {
  order_id: string;
  order_status: string;
  total_amount: number;
  payment_url?: string;             // Para pagar en AliExpress (dropship manual)
};

// ── CLIENTE ──
class AliExpressClient {
  private appKey: string;
  private appSecret: string;
  private accessToken: string;

  constructor() {
    this.appKey    = process.env.ALI_APP_KEY!;
    this.appSecret = process.env.ALI_APP_SECRET!;
    this.accessToken = process.env.ALI_ACCESS_TOKEN!;
  }

  // ── FIRMA HMAC-MD5 (requerida por AliExpress en cada request) ──
  private sign(params: Record<string, string>): string {
    // 1. Ordenar parámetros alfabéticamente
    const sorted = Object.keys(params).sort().map(k => `${k}${params[k]}`).join("");
    // 2. Envolver con APP_SECRET y calcular HMAC-MD5
    const str = this.appSecret + sorted + this.appSecret;
    return crypto.createHash("md5").update(str).digest("hex").toUpperCase();
  }

  // ── REQUEST BASE ──
  private async call<T>(
    method: string,
    params: Record<string, string | number | object> = {}
  ): Promise<T> {
    const baseParams: Record<string, string> = {
      method,
      app_key:      this.appKey,
      session:      this.accessToken,
      timestamp:    new Date().toISOString().replace("T", " ").slice(0, 19),
      format:       "json",
      v:            "2.0",
      sign_method:  "md5",
      // Convertir parámetros complejos a JSON string
      ...Object.fromEntries(
        Object.entries(params).map(([k, v]) => [k, typeof v === "object" ? JSON.stringify(v) : String(v)])
      ),
    };

    baseParams.sign = this.sign(baseParams);

    const res = await fetch(ALI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(baseParams).toString(),
    });

    if (!res.ok) throw new Error(`AliExpress HTTP error: ${res.status}`);

    const data = await res.json();

    // La respuesta siempre viene en un wrapper con el nombre del método
    const responseKey = Object.keys(data)[0];
    const response = data[responseKey];

    if (response?.error_response || data?.error_response) {
      const err = response?.error_response || data?.error_response;
      throw new Error(`AliExpress API error: ${err.msg} (code: ${err.code})`);
    }

    return response as T;
  }

  // ════════════════════════════════════
  // PRODUCTOS
  // ════════════════════════════════════

  // Obtener detalle de producto por ID o URL
  async getProduct(productIdOrUrl: string): Promise<AliProduct> {
    const productId = this.extractProductId(productIdOrUrl);

    const res = await this.call<{ result: AliProduct }>(
      "aliexpress.ds.product.get",
      {
        product_id: productId,
        ship_to_country: "ES",        // País de destino para calcular envío
        target_currency: "EUR",
        target_language: "en",
      }
    );

    return res.result;
  }

  // Buscar productos (útil para catálogo admin)
  async searchProducts(
    keyword: string,
    options: { page?: number; pageSize?: number; minPrice?: number; maxPrice?: number } = {}
  ) {
    const res = await this.call<{
      result: { products: AliProduct[]; total_count: number; current_page: number };
    }>("aliexpress.ds.recommend.feed.get", {
      keywords:       keyword,
      page_no:        options.page ?? 1,
      page_size:      options.pageSize ?? 20,
      target_currency: "EUR",
      target_language: "en",
      ship_to_country: "ES",
      ...(options.minPrice && { min_price: options.minPrice }),
      ...(options.maxPrice && { max_price: options.maxPrice }),
    });

    return res.result;
  }

  // Sync: obtener precio y stock actualizado
  async syncProduct(productId: string): Promise<{ price: number; stock: number; skus: AliSku[] }> {
    const product = await this.getProduct(productId);
    return {
      price:  product.price_min,
      stock:  product.sku_list.reduce((s, sku) => s + sku.sku_available_stock, 0),
      skus:   product.sku_list,
    };
  }

  // ════════════════════════════════════
  // PEDIDOS (FULFILLMENT)
  // ════════════════════════════════════

  // Crear pedido en AliExpress (dropshipping directo)
  // IMPORTANTE: Necesitas saldo en tu cuenta AliExpress o tarjeta vinculada
  async createOrder(
    items: AliOrderItem[],
    shippingAddress: AliShippingAddress,
    logisticsType: string = "CAINIAO_STANDARD"
  ): Promise<AliOrderResult> {
    const res = await this.call<{ result: AliOrderResult }>(
      "aliexpress.ds.order.create",
      {
        param_place_order_request4_open_api_d_t_o: {
          out_order_id:   `AIZUA-${Date.now()}`,  // Tu referencia interna
          logistics_type: logisticsType,
          address: {
            contact_person:  shippingAddress.contact_person,
            mobile_no:       shippingAddress.mobile_no,
            address:         shippingAddress.address,
            city:            shippingAddress.city,
            province:        shippingAddress.province || shippingAddress.city,
            zip:             shippingAddress.zip,
            country:         shippingAddress.country,
            phone_country:   shippingAddress.phone_country || this.getPhoneCountry(shippingAddress.country),
          },
          product_items: items.map(item => ({
            product_id: item.product_id,
            sku_id:     item.sku_id,
            product_count: item.quantity,
          })),
        },
      }
    );

    return res.result;
  }

  // Obtener tracking de un pedido
  async getTracking(aliOrderId: string): Promise<{
    tracking_number: string;
    logistics_status: string;
    tracking_events: Array<{ event_time: string; event_description: string }>;
  }> {
    const res = await this.call<{
      result: {
        tracking_number: string;
        logistics_status: string;
        details: Array<{ event_time: string; event_description: string }>;
      };
    }>("aliexpress.ds.order.tracking.get", { order_id: aliOrderId });

    return {
      tracking_number:  res.result.tracking_number,
      logistics_status: res.result.logistics_status,
      tracking_events:  res.result.details,
    };
  }

  // Obtener estado de un pedido
  async getOrderStatus(aliOrderId: string) {
    const res = await this.call<{
      result: {
        order_id: string;
        order_status: string;  // PLACE_ORDER_SUCCESS, IN_CANCEL, WAIT_SELLER_SEND_GOODS, SHIPPED, FINISH
        product_list: Array<{ product_id: string; status: string }>;
      };
    }>("aliexpress.ds.order.get", { order_id: aliOrderId });

    return res.result;
  }

  // ════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════

  extractProductId(input: string): string {
    // URL formato: https://www.aliexpress.com/item/1234567890.html
    const urlMatch = input.match(/\/item\/(\d+)\.html/);
    if (urlMatch) return urlMatch[1];

    // URL formato corto: https://a.aliexpress.com/_m...
    // Solo números de 10+ dígitos
    const numMatch = input.match(/\b(\d{10,})\b/);
    if (numMatch) return numMatch[1];

    // Si ya es un ID numérico
    if (/^\d+$/.test(input)) return input;

    throw new Error(`No se pudo extraer el ID del producto de: ${input}`);
  }

  private getPhoneCountry(countryCode: string): string {
    const map: Record<string, string> = {
      ES: "34", FR: "33", DE: "49", IT: "39", PT: "351",
      GB: "44", US: "1",  MX: "52", BR: "55", AR: "54",
      NL: "31", BE: "32", PL: "48", SE: "46",
    };
    return map[countryCode] ?? "34";
  }
}

export const aliexpress = new AliExpressClient();
