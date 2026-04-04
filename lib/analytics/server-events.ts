// lib/analytics/server-events.ts
// Aizua — Conversiones server-side (Conversions API)
// Dispara eventos de compra desde el servidor vía Meta CAPI y TikTok Events API
// Más fiable que el píxel de navegador (bypassa adblockers, iOS 14+, etc.)
// Se llama desde app/api/webhook/route.ts tras confirmar el pago de Stripe

import crypto from "crypto";

// ── META CONVERSIONS API ──
export async function sendMetaConversion(params: {
  eventName:     string;   // "Purchase"
  eventId:       string;   // ID único para deduplicar con el píxel browser
  value:         number;
  currency:      string;
  email?:        string;   // PII — se hashea con SHA-256 antes de enviar
  phone?:        string;
  firstName?:    string;
  city?:         string;
  countryCode?:  string;
  orderNumber?:  string;
  clientIp?:     string;
  userAgent?:    string;
}) {
  const pixelId  = process.env.META_PIXEL_ID;
  const token    = process.env.META_CAPI_TOKEN;
  if (!pixelId || !token) return;

  // Hash SHA-256 de datos PII (requerido por Meta)
  const hash = (v: string) => crypto.createHash("sha256").update(v.trim().toLowerCase()).digest("hex");

  const userData: Record<string, string> = {};
  if (params.email)       userData.em  = hash(params.email);
  if (params.phone)       userData.ph  = hash(params.phone.replace(/\D/g, ""));
  if (params.firstName)   userData.fn  = hash(params.firstName);
  if (params.city)        userData.ct  = hash(params.city);
  if (params.countryCode) userData.country = hash(params.countryCode.toLowerCase());
  if (params.clientIp)    userData.client_ip_address = params.clientIp;
  if (params.userAgent)   userData.client_user_agent = params.userAgent;

  const payload = {
    data: [{
      event_name:        params.eventName,
      event_time:        Math.floor(Date.now() / 1000),
      event_id:          params.eventId,        // Deduplicación con píxel browser
      action_source:     "website",
      user_data:         userData,
      custom_data: {
        value:           params.value,
        currency:        params.currency,
        order_id:        params.orderNumber,
      },
    }],
    test_event_code:     process.env.META_TEST_EVENT_CODE || undefined,
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${token}`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      }
    );
    const data = await res.json();
    if (data.error) console.error("[meta-capi] Error:", data.error.message);
    else console.log("[meta-capi] Sent:", params.eventName, "events_received:", data.events_received);
  } catch (e) {
    console.error("[meta-capi] Fetch error:", e);
  }
}

// ── TIKTOK EVENTS API ──
export async function sendTikTokConversion(params: {
  eventName:   string;   // "CompletePayment"
  eventId:     string;
  value:       number;
  currency:    string;
  email?:      string;
  phone?:      string;
  orderNumber?: string;
}) {
  const pixelId = process.env.TIKTOK_PIXEL_ID;
  const token   = process.env.TIKTOK_CAPI_TOKEN;
  if (!pixelId || !token) return;

  const hash = (v: string) => crypto.createHash("sha256").update(v.trim().toLowerCase()).digest("hex");

  const payload = {
    pixel_code: pixelId,
    event:      params.eventName,
    event_id:   params.eventId,
    timestamp:  new Date().toISOString(),
    context: {
      user: {
        ...(params.email && { email: hash(params.email) }),
        ...(params.phone && { phone_number: hash(params.phone.replace(/\D/g, "")) }),
      },
    },
    properties: {
      value:      params.value,
      currency:   params.currency,
      order_id:   params.orderNumber,
      content_type: "product",
    },
  };

  try {
    const res = await fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token":  token,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.code !== 0) console.error("[tiktok-capi] Error:", data.message);
    else console.log("[tiktok-capi] Sent:", params.eventName);
  } catch (e) {
    console.error("[tiktok-capi] Fetch error:", e);
  }
}

// ── FUNCIÓN COMBINADA — llamar desde webhook de Stripe ──
// Dispara Meta CAPI + TikTok Events API simultáneamente
export async function trackPurchaseServerSide(order: {
  id:          string;
  orderNumber: string;
  total:       number;
  customerEmail?: string;
  customerName?:  string;
  shippingAddress?: { city?: string; country?: string; phone?: string };
}) {
  const eventId = `purchase_${order.id}`; // Mismo ID que el píxel browser para deduplicar

  await Promise.allSettled([
    sendMetaConversion({
      eventName:   "Purchase",
      eventId,
      value:       order.total,
      currency:    "EUR",
      email:       order.customerEmail,
      phone:       order.shippingAddress?.phone,
      firstName:   order.customerName?.split(" ")[0],
      city:        order.shippingAddress?.city,
      countryCode: order.shippingAddress?.country,
      orderNumber: order.orderNumber,
    }),
    sendTikTokConversion({
      eventName:   "CompletePayment",
      eventId,
      value:       order.total,
      currency:    "EUR",
      email:       order.customerEmail,
      phone:       order.shippingAddress?.phone,
      orderNumber: order.orderNumber,
    }),
  ]);
}
