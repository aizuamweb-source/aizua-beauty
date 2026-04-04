// lib/stripe.ts
// Aizua — Stripe Client + Server utilities

import { loadStripe, Stripe } from "@stripe/stripe-js";

// ── CLIENT SIDE ──
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

// ── PAYMENT METHODS CONFIG ──
// Controls which payment methods appear in the Stripe Elements UI
export const STRIPE_APPEARANCE = {
  theme: "night" as const,
  variables: {
    colorPrimary: "#00C9B1",
    colorBackground: "#111120",
    colorText: "#F0F0F0",
    colorDanger: "#FF6B6B",
    fontFamily: "DM Sans, system-ui, sans-serif",
    spacingUnit: "4px",
    borderRadius: "10px",
    colorIcon: "#5A5A72",
  },
  rules: {
    ".Input": {
      border: "1px solid rgba(255,255,255,0.12)",
      boxShadow: "none",
      backgroundColor: "#111120",
    },
    ".Input:focus": {
      border: "1px solid #00C9B1",
      boxShadow: "0 0 0 3px rgba(0,201,177,0.1)",
    },
    ".Label": {
      color: "#5A5A72",
      fontWeight: "600",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      fontSize: "12px",
    },
  },
};

// ── SUPPORTED CURRENCIES ──
export const CURRENCY_BY_COUNTRY: Record<string, string> = {
  ES: "eur", FR: "eur", DE: "eur", IT: "eur", PT: "eur",
  GB: "gbp",
  US: "usd", CA: "cad", AU: "aud",
  MX: "mxn", BR: "brl",
  JP: "jpy",
};

export const getCurrencyForCountry = (country: string): string =>
  CURRENCY_BY_COUNTRY[country] ?? "eur";

// ── TYPES ──
export type CartItem = {
  id: number;
  name: string;
  price: number;
  qty: number;
  emoji: string;
  variant?: string;
};

export type ShippingOption = {
  id: string;
  label: string;
  detail: string;
  price: number;
};

export type CustomerInfo = {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  postal: string;
  country: string;
  phone?: string;
};

export type OrderTotals = {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  coupon?: string;
};
