// app/api/create-payment-intent/route.ts
// Aizua — Stripe Payment Intent
// Creates a PaymentIntent and returns the client_secret to the frontend

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: NextRequest) {
  try {
    const { items, shippingCost, currency = "eur", coupon } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items in cart" }, { status: 400 });
    }

    // Calculate amount server-side (NEVER trust client-side amounts)
    const subtotal = items.reduce(
      (sum: number, item: { price: number; qty: number }) =>
        sum + item.price * item.qty,
      0
    );

    // Apply coupon discount server-side
    const discount = coupon === "AIZUA10" ? subtotal * 0.1 : 0;
    const shipping = typeof shippingCost === "number" ? shippingCost : 0;
    const total = Math.round((subtotal - discount + shipping) * 100); // Stripe uses cents

    if (total < 50) {
      return NextResponse.json(
        { error: "Amount too small (minimum €0.50)" },
        { status: 400 }
      );
    }

    // Create PaymentIntent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency,
      automatic_payment_methods: {
        enabled: true, // Enables cards, Apple Pay, Google Pay automatically
      },
      metadata: {
        shop: "aizua",
        items: JSON.stringify(items.map((i: { id: number; name: string; qty: number }) => ({ id: i.id, name: i.name, qty: i.qty }))),
        coupon: coupon || "none",
      },
      // Stripe Tax — auto-calculate VAT based on customer location
      // Uncomment when Stripe Tax is configured in dashboard:
      // automatic_tax: { enabled: true },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: total,
    });
  } catch (error) {
    console.error("[create-payment-intent] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
