"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart/CartContext";
import { trackPurchase } from "@/components/AdsPixels";

function ConfirmacionContent({ locale }: { locale: string }) {
  const searchParams = useSearchParams();
  const paymentIntent = searchParams.get("payment_intent");
  const { clearCart } = useCart();

  useEffect(() => {
    if (paymentIntent) trackPurchase({ orderId: paymentIntent, value: 0, currency: "EUR" });
    clearCart();
  }, [clearCart]);

  const isEs = locale === "es";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8F9FB",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          border: "1px solid #E8EAED",
          padding: "3rem",
          maxWidth: "500px",
          textAlign: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        {/* Success Icon */}
        <div
          style={{
            width: "80px",
            height: "80px",
            background: "#F0FFFE",
            border: "2px solid #00C9B1",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 2rem",
            fontSize: "2.5rem",
          }}
        >
          ✓
        </div>

        <h1
          style={{
            fontFamily: "var(--font-bebas)",
            fontSize: "2.5rem",
            color: "#1A1A2E",
            margin: "0 0 1rem",
            letterSpacing: "0.05em",
          }}
        >
          {isEs ? "¡PEDIDO CONFIRMADO!" : "ORDER CONFIRMED!"}
        </h1>

        <p
          style={{
            color: "#666",
            fontSize: "1rem",
            lineHeight: 1.6,
            marginBottom: "2rem",
          }}
        >
          {isEs
            ? "Tu pedido ha sido confirmado y recibirás un email con los detalles. Gracias por tu compra."
            : "Your order has been confirmed and you'll receive an email with the details. Thank you for your purchase."}
        </p>

        {paymentIntent && (
          <div
            style={{
              background: "#F5F7FA",
              border: "1px solid #E8EAED",
              borderRadius: "10px",
              padding: "1.5rem",
              marginBottom: "2rem",
            }}
          >
            <p style={{ color: "#888", fontSize: "0.85rem", margin: "0 0 0.5rem" }}>
              {isEs ? "Número de pedido:" : "Order number:"}
            </p>
            <p
              style={{
                fontSize: "1.2rem",
                fontWeight: 700,
                color: "#00C9B1",
                margin: 0,
                fontFamily: "monospace",
              }}
            >
              {paymentIntent.substring(0, 20).toUpperCase()}...
            </p>
          </div>
        )}

        <p
          style={{
            color: "#888",
            fontSize: "0.9rem",
            marginBottom: "2rem",
          }}
        >
          {isEs
            ? "Te enviaremos actualizaciones de tu pedido por correo electrónico."
            : "We'll send you order updates via email."}
        </p>

        <Link
          href={`/${locale}`}
          style={{
            display: "inline-block",
            background: "#00C9B1",
            color: "#fff",
            textDecoration: "none",
            padding: "0.9rem 2rem",
            borderRadius: "10px",
            fontFamily: "var(--font-bebas)",
            fontSize: "1.1rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            boxShadow: "0 4px 16px rgba(0,201,177,0.3)",
          }}
        >
          {isEs ? "Volver a la tienda" : "Back to store"}
        </Link>
      </div>
    </div>
  );
}

export default function ConfirmacionPage({
  params,
}: {
  params: { locale: string };
}) {
  return (
    <Suspense fallback={null}>
      <ConfirmacionContent locale={params.locale} />
    </Suspense>
  );
}
