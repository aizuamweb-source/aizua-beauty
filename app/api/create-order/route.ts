// app/api/create-order/route.ts
// Aizua — Create Order in Supabase
// Called AFTER successful payment confirmation from Stripe Elements

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { pedidoDelPago } from "@/lib/pedido-desde-pago";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { paymentIntentId, customer, items, shipping, totals, locale, source } =
      await req.json();

    if (!paymentIntentId || !customer || !items) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 07/10/2026: idempotente. Si el aviso de pago de Stripe llegó antes y el
    // webhook ya creó el pedido desde el cobro (lib/pedido-desde-pago.ts), se
    // devuelve ese: ni se duplica ni se le dice al cliente que algo falló.
    const yaCreado = await pedidoDelPago(supabase, paymentIntentId);
    if (yaCreado) {
      return NextResponse.json({ success: true, orderNumber: yaCreado.order_number, orderId: yaCreado.id });
    }

    // Generate order number: AZ-YYYYMMDD-XXXXX
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const rand = Math.floor(Math.random() * 90000) + 10000;
    const orderNumber = `AZ-${dateStr}-${rand}`;

    // Enriquecer items con aliexpress_product_id (columna real: products.aliexpress_id).
    // Sin esto, el botón de compra 1-tap de Telegram (webhook + order-summary) no tiene
    // a dónde apuntar — el carrito solo guarda el UUID del producto, no su ID de AliExpress.
    const itemIds = items.map((i: { id: string }) => i.id).filter(Boolean);
    let aliMap: Record<string, string | null> = {};
    if (itemIds.length) {
      const { data: products } = await supabase
        .from("products")
        .select("id, aliexpress_id")
        .in("id", itemIds);
      aliMap = Object.fromEntries((products ?? []).map(p => [p.id, p.aliexpress_id]));
    }
    const itemsWithAli = items.map((i: { id: string }) => ({
      ...i,
      aliexpress_product_id: aliMap[i.id] ?? null,
    }));

    // Insert order into Supabase
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        stripe_payment_intent_id: paymentIntentId,
        status: "pending", // Will be updated to "paid" by webhook
        customer_email: customer.email,
        customer_name: `${customer.firstName} ${customer.lastName}`,
        customer_phone: customer.phone || null,
        shipping_address: {
          firstName: customer.firstName,
          lastName: customer.lastName,
          address: customer.address,
          city: customer.city,
          postal: customer.postal,
          country: customer.country,
        },
        items: itemsWithAli,
        shipping_method: shipping.method,
        shipping_cost: shipping.cost,
        subtotal: totals.subtotal,
        discount: totals.discount || 0,
        coupon: totals.coupon || null,
        total: totals.total,
        currency: "EUR",
        locale:   locale  || "es",
        // `source` se quitó el 07/10/2026: la columna no existe en store.orders y
        // hacía fallar TODAS las altas («Could not find the 'source' column»).
        store:    "beauty",
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .select()
      .single();

    if (error?.code === "23505") {
      // El webhook lo creó entre la comprobación de arriba y este insert.
      const ya = await pedidoDelPago(supabase, paymentIntentId);
      if (ya) return NextResponse.json({ success: true, orderNumber: ya.order_number, orderId: ya.id });
    }
    if (error) {
      console.error("[create-order] Supabase error:", error);
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      orderNumber,
      orderId: order.id,
    });
  } catch (error) {
    console.error("[create-order] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
