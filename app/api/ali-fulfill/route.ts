// app/api/ali-fulfill/route.ts
// Aizua — Enviar pedido a AliExpress directamente (sin DSers)
// Llamado por webhook de Stripe vía n8n tras pago confirmado

import { NextRequest, NextResponse } from "next/server";
import { aliexpress } from "@/lib/aliexpress/client";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Mapeo ISO2 → nombre de país en inglés (requerido por AliExpress)
const COUNTRY_NAMES: Record<string, string> = {
  ES: "Spain", FR: "France", DE: "Germany", IT: "Italy", PT: "Portugal",
  GB: "United Kingdom", US: "United States", MX: "Mexico", BR: "Brazil",
  NL: "Netherlands", BE: "Belgium", PL: "Poland", SE: "Sweden", AR: "Argentina",
};

export async function POST(req: NextRequest) {
  try {
    const { orderId, paymentIntentId } = await req.json();

    // 1. Obtener pedido de Supabase
    const query = supabase.from("orders").select("*");
    const { data: order, error } = orderId
      ? await query.eq("id", orderId).single()
      : await query.eq("stripe_payment_intent_id", paymentIntentId).single();

    if (error || !order) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }
    if (order.status !== "paid") {
      return NextResponse.json({ error: `Estado del pedido: '${order.status}' (debe ser 'paid')` }, { status: 400 });
    }

    // 2. Obtener ali_product_id y sku de cada producto del pedido
    const productIds = order.items.map((i: { id: string }) => i.id);
    const { data: products } = await supabase
      .from("products")
      .select("id, ali_product_id, sku_list")
      .in("id", productIds);

    const productMap = Object.fromEntries(
      (products ?? []).map((p: { id: string; ali_product_id: string; sku_list: Array<{ sku_id: string }> }) => [p.id, p])
    );

    // 3. Construir dirección de envío para AliExpress
    const addr = order.shipping_address;
    const country = addr.country?.toUpperCase() ?? "ES";

    const shippingAddress = {
      contact_person:  order.customer_name,
      mobile_no:       addr.phone || "600000000",
      address:         addr.address,
      city:            addr.city,
      province:        addr.city,               // AliExpress requiere province, usamos city si no tenemos
      zip:             addr.postal,
      country:         COUNTRY_NAMES[country] ?? "Spain",
      phone_country:   country,
    };

    // 4. Construir line items con ali_product_id y sku_id
    const lineItems = order.items.map((item: { id: string; qty: number; variantIndex?: number }) => {
      const product = productMap[item.id];
      const skuId   = product?.sku_list?.[item.variantIndex ?? 0]?.sku_id ?? "";

      return {
        product_id: product?.ali_product_id,
        sku_id:     skuId,
        quantity:   item.qty,
      };
    });

    // 5. Crear pedido en AliExpress
    const aliOrder = await aliexpress.createOrder(
      lineItems,
      shippingAddress,
      "CAINIAO_STANDARD"  // Envío estándar con tracking
    );

    // 6. Actualizar Supabase
    await supabase.from("orders").update({
      status:        "processing",
      ali_order_id:  aliOrder.order_id,
      ali_status:    aliOrder.order_status,
      updated_at:    new Date().toISOString(),
    }).eq("id", order.id);

    // 7. Telegram
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: `✅ *PEDIDO ENVIADO A ALIEXPRESS*\n\n🛒 ${order.order_number}\n👤 ${order.customer_name}\n💰 €${order.total}\n🔑 AliExpress ID: ${aliOrder.order_id}`,
            parse_mode: "Markdown",
          }),
        }
      ).catch(console.error);
    }

    return NextResponse.json({
      success:      true,
      aliOrderId:   aliOrder.order_id,
      aliStatus:    aliOrder.order_status,
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error("[ali-fulfill] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
