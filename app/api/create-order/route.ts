// app/api/create-order/route.ts
// Aizua — Create Order in Supabase
// Called AFTER successful payment confirmation from Stripe Elements

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    // Generate order number: AZ-YYYYMMDD-XXXXX
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const rand = Math.floor(Math.random() * 90000) + 10000;
    const orderNumber = `AZ-${dateStr}-${rand}`;

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
        items: items,
        shipping_method: shipping.method,
        shipping_cost: shipping.cost,
        subtotal: totals.subtotal,
        discount: totals.discount || 0,
        coupon: totals.coupon || null,
        total: totals.total,
        currency: "EUR",
        locale:   locale  || "es",
        source:   source  || "tienda",
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .select()
      .single();

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
