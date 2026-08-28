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

        // shipping_countries — tri-estado:
        //   null  = aún sin sondear      -> no bloquear (fail-open deliberado)
        //   []    = no se envía a NINGÚN país -> bloquear SIEMPRE
        //   [...] = bloquear si conocemos el país y no está en la lista
        //
        // 27/08/2026 — LA LISTA VACÍA NO SE BLOQUEABA, y se podía COBRAR.
        // La condición era `sc.length > 0 && !sc.includes(country)`, que con []
        // da false, y además todo el bloque colgaba de `if (country)`, así que
        // sin país conocido no se comprobaba nada. El front sí bloquea [] en la
        // ficha de producto, pero el carrito vive en localStorage: un artículo
        // añadido cuando aún tenía países sigue ahí cuando AG-16 lo deja en [],
        // y desde el carrito se va a /checkout sin volver a pasar por la ficha.
        // Mismo fallo, línea por línea, que el de la tienda tech.
        const sinEnvioNinguno = products.filter((p) => {
          const sc: string[] | null = p.shipping_countries;
          return Array.isArray(sc) && sc.length === 0;
        });
        if (sinEnvioNinguno.length > 0) {
          const names = sinEnvioNinguno.map((p) => p.name).join(", ");
          return NextResponse.json(
            {
              error: `These products are not available for shipping: ${names}`,
              blocked: sinEnvioNinguno.map((p) => p.id),
            },
            { status: 400 }
          );
        }

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

    // Códigos del 10% de bienvenida (s259).
    //
    // 🔴 POR QUÉ HAY DOS: los emails de nurture prometen WELCOME10 —34
    // apariciones entre las dos tiendas— y aquí solo se aceptaba AIZUA10, así
    // que quien seguía el email NO obtenía descuento. Los correos ya enviados no
    // se pueden reescribir, así que el checkout tiene que honrar lo prometido.
    // Se comparan en mayúsculas y sin espacios porque el código se teclea a mano
    // desde el email y llega como venga.
    //
    // Verificado que el 10% cabe en el margen de los 57 productos activos
    // (s259): el más ajustado deja +0,99 € netos tras descuento y pasarela. Si
    // se añade un producto de margen fino, AG-16 lo avisa al recalcular.
    const CUPONES_10 = ["WELCOME10", "AIZUA10"];
    const cuponNorm = String(coupon ?? "").trim().toUpperCase();
    const discount = CUPONES_10.includes(cuponNorm) ? subtotal * 0.1 : 0;
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
