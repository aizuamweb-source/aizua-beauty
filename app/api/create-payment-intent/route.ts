// app/api/create-payment-intent/route.ts
// AizuaBeauty — Stripe Payment Intent con multi-divisa + validación server-side de shipping_countries

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// EUR → divisa destino (tasas aproximadas jun 2026)
const FX_RATES: Record<string, number> = {
  eur: 1.0,
  gbp: 0.86,
  usd: 1.09,
  aud: 1.65,
};

export async function POST(req: NextRequest) {
  try {
    const { items, shippingCost, currency = "eur", coupon, country } =
      await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items in cart" }, { status: 400 });
    }

    // ── Validación server-side: stock/active + shipping_countries por producto ──
    const productIds = items
      .map((i: { id?: number | string }) => i.id)
      .filter(Boolean);

    if (productIds.length > 0) {
      const { data: products } = await supabase
        .from("products")
        .select("id, name, shipping_countries, active, stock")
        .in("id", productIds);

      if (products) {
        // Disponibilidad real (stock AliExpress vía AG-16) — bloquea SIEMPRE,
        // sepamos o no el país (evita cobrar por algo que ya no se puede enviar).
        const unavailable = products.filter((p) => {
          if (p.active === false) return true;
          if (typeof p.stock === "number" && p.stock <= 0) return true;
          return false;
        });

        if (unavailable.length > 0) {
          const names = unavailable.map((p) => p.name).join(", ");
          return NextResponse.json(
            {
              error: `These products are out of stock: ${names}`,
              outOfStock: unavailable.map((p) => p.id),
            },
            { status: 400 }
          );
        }

        // shipping_countries — solo aplica si conocemos el país del comprador
        if (country) {
          const blocked = products.filter((p) => {
            const sc: string[] | null = p.shipping_countries;
            // null = sin datos = no bloquear (fail-open)
            if (sc === null) return false;
            return sc.length > 0 && !sc.includes(country);
          });

          if (blocked.length > 0) {
            const names = blocked.map((p) => p.name).join(", ");
            return NextResponse.json(
              {
                error: `These products cannot ship to ${country}: ${names}`,
                blocked: blocked.map((p) => p.id),
              },
              { status: 400 }
            );
          }
        }
      }
    }

    // ── Calcular amount en EUR (server-side, NUNCA confiar en el cliente) ────
    const subtotal = items.reduce(
      (sum: number, item: { price: number; qty: number }) =>
        sum + item.price * item.qty,
      0
    );

    const discount = coupon === "AIZUA10" ? subtotal * 0.1 : 0;
    const shipping = typeof shippingCost === "number" ? shippingCost : 0;
    const totalEur = subtotal - discount + shipping;

    // ── Aplicar tipo de cambio ────────────────────────────────────────────────
    const validCurrency = currency.toLowerCase() in FX_RATES
      ? currency.toLowerCase()
      : "eur";
    const rate = FX_RATES[validCurrency];
    const totalConverted = Math.round(totalEur * rate * 100); // Stripe usa centavos

    if (totalConverted < 50) {
      return NextResponse.json(
        { error: "Amount too small (minimum 0.50 in selected currency)" },
        { status: 400 }
      );
    }

    // ── Crear PaymentIntent con Stripe ────────────────────────────────────────
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalConverted,
      currency: validCurrency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        shop: "beauty",
        items: JSON.stringify(
          items.map((i: { id: number; name: string; qty: number }) => ({
            id: i.id,
            name: i.name,
            qty: i.qty,
          }))
        ),
        coupon: coupon || "none",
        country: country || "unknown",
        currency: validCurrency,
        fx_rate: String(rate),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalConverted,
      currency: validCurrency,
    });
  } catch (error) {
    console.error("[create-payment-intent] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
