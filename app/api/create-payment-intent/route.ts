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

    // ── Validación server-side: precio + stock/active + shipping_countries ──
    const productIds = items
      .map((i: { id?: number | string }) => i.id)
      .filter(Boolean);

    // 02/09/2026 — EL PRECIO QUE SE COBRABA LO PONÍA EL NAVEGADOR.
    // El subtotal se calculaba con `item.price` del cuerpo de la petición y el
    // SELECT de al lado no traía `price`, así que nada lo contrastaba contra la
    // BD: una petición fabricada con price=0.01 se cobraba a 0,01 €. El
    // comentario "NUNCA confiar en el cliente" solo describía que la SUMA se
    // hacía en el servidor, no de dónde salía el precio unitario.
    //
    // Ahora el precio sale SIEMPRE de products.price, así que este bloque deja
    // de ser opcional: sin fila de producto no hay precio autorizado y no se
    // cobra. Antes, un artículo sin id hacía `productIds.length === 0` y se
    // saltaba la validación entera.
    if (productIds.length !== items.length) {
      return NextResponse.json(
        { error: "Invalid cart: every item must reference a product" },
        { status: 400 }
      );
    }

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, shipping_countries, active, stock")
      .in("id", productIds);

    // Fail closed. Antes un error de Supabase dejaba `products` a null y se
    // saltaba la validación ENTERA en silencio; ahora además significaría no
    // tener precio con el que cobrar. Mejor no cobrar que cobrar a ciegas.
    if (productsError || !products) {
      console.error(
        "[create-payment-intent] products lookup failed:",
        productsError
      );
      return NextResponse.json(
        { error: "Could not verify your cart. Please try again." },
        { status: 503 }
      );
    }

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

    // ── Importe: SIEMPRE el precio de la BD, nunca el del cuerpo ──────────
    // products.price es el precio de venta efectivo en EUR — el que muestra la
    // ficha y el que el carrito copiaba. compare_price es el tachado y
    // cost_price el coste interno: ninguno de los dos se cobra.
    const byId = new Map(products.map((p) => [String(p.id), p] as const));

    let subtotal = 0;
    const missingIds: string[] = [];
    let clientPriceMismatch = false;

    for (const item of items) {
      const dbProduct = byId.get(String(item.id));
      if (!dbProduct) {
        missingIds.push(String(item.id));
        continue;
      }

      const price = Number(dbProduct.price);
      if (!Number.isFinite(price) || price <= 0) {
        console.error(
          `[create-payment-intent] product ${dbProduct.id} has no usable price:`,
          dbProduct.price
        );
        return NextResponse.json(
          { error: "This product cannot be purchased right now." },
          { status: 409 }
        );
      }

      // qty también llega del cuerpo: una cantidad negativa o decimal manipula
      // el total igual que lo hacía el precio. El carrito real nunca las produce
      // (updateQty borra la línea con qty < 1).
      const qty = Number(item.qty);
      if (!Number.isInteger(qty) || qty < 1 || qty > 999) {
        return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
      }

      // Solo para MEDIR, no bloquea: el carrito vive en localStorage y guarda el
      // precio congelado del día en que se añadió el producto, así que puede
      // diferir del de la BD sin que nadie manipule nada. Se cobra el de la BD;
      // esto deja constancia de cuántas veces el usuario vio otro importe.
      const claimed = Number(item.price);
      if (Number.isFinite(claimed) && Math.abs(claimed - price) >= 0.01) {
        clientPriceMismatch = true;
        console.warn(
          `[create-payment-intent] price mismatch on ${dbProduct.id}: client ${claimed} vs db ${price}`
        );
      }

      subtotal += price * qty;
    }

    if (missingIds.length > 0) {
      return NextResponse.json(
        { error: "Some items are no longer available", unknownItems: missingIds },
        { status: 400 }
      );
    }

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
    // shippingCost llega del cuerpo. Hoy el checkout manda SIEMPRE 0 (ver
    // CheckoutClient: `const shippingCost: number = 0`), pero se aceptaba
    // cualquier número: uno NEGATIVO restaba del total y habría anulado por
    // completo el arreglo del precio. Se ignora lo que no sea finito y > 0.
    const shippingRaw = Number(shippingCost);
    const shipping =
      Number.isFinite(shippingRaw) && shippingRaw > 0 ? shippingRaw : 0;
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
      pricesUpdated: clientPriceMismatch,
    });
  } catch (error) {
    console.error("[create-payment-intent] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
