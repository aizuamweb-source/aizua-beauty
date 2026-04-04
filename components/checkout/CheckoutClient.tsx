"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart/CartContext";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { pixelPurchase } from "@/lib/pixels";

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

const EU_COUNTRIES = [
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" },
  { code: "BG", name: "Bulgaria" },
  { code: "HR", name: "Croatia" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" },
  { code: "EE", name: "Estonia" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "GR", name: "Greece" },
  { code: "HU", name: "Hungary" },
  { code: "IE", name: "Ireland" },
  { code: "IT", name: "Italy" },
  { code: "LV", name: "Latvia" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MT", name: "Malta" },
  { code: "NL", name: "Netherlands" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "RO", name: "Romania" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "ES", name: "Spain" },
  { code: "SE", name: "Sweden" },
];

function CheckoutForm({
  locale,
  clientSecret,
  items,
  shippingCost,
  subtotal,
}: {
  locale: string;
  clientSecret: string;
  items: any[];
  shippingCost: number;
  subtotal: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { clearCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEs = locale === "es";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError(isEs ? "Cargando Stripe..." : "Loading Stripe...");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Confirm payment with Stripe
      const { error: confirmError, paymentIntent } =
        await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/${locale}/confirmacion`,
          },
          redirect: "if_required",
        });

      if (confirmError) {
        setError(confirmError.message || (isEs ? "Error de pago" : "Payment error"));
        setLoading(false);
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        // Create order in database
        const orderRes = await fetch("/api/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            customer: {
              firstName: (document.querySelector(
                'input[name="firstName"]'
              ) as HTMLInputElement)?.value,
              lastName: (document.querySelector(
                'input[name="lastName"]'
              ) as HTMLInputElement)?.value,
              email: (document.querySelector(
                'input[name="email"]'
              ) as HTMLInputElement)?.value,
              phone: (document.querySelector(
                'input[name="phone"]'
              ) as HTMLInputElement)?.value,
              address: (document.querySelector(
                'input[name="address"]'
              ) as HTMLInputElement)?.value,
              city: (document.querySelector(
                'input[name="city"]'
              ) as HTMLInputElement)?.value,
              postal: (document.querySelector(
                'input[name="postal"]'
              ) as HTMLInputElement)?.value,
              country: (document.querySelector(
                'select[name="country"]'
              ) as HTMLSelectElement)?.value,
            },
            items,
            shipping: { method: "standard", cost: shippingCost },
            totals: { subtotal, total: subtotal + shippingCost },
            locale,
            source: "tienda",
          }),
        });

        if (orderRes.ok) {
          // ── Pixel Purchase ──────────────────────────────────
          pixelPurchase({
            transactionId: paymentIntent.id,
            total:         subtotal + shippingCost,
            items: items.map((i) => ({
              id:    i.id,
              name:  i.name,
              price: i.price,
              qty:   i.qty,
            })),
          });
          clearCart();
          router.push(`/${locale}/confirmacion?payment_intent=${paymentIntent.id}`);
        } else {
          setError(isEs ? "Error al crear el pedido" : "Failed to create order");
        }
      }
    } catch (err) {
      setError(isEs ? "Error inesperado" : "Unexpected error");
      console.error(err);
    }

    setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.65rem 0.75rem",
    border: "1px solid #E8EAED",
    borderRadius: "8px",
    fontSize: "0.95rem",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.78rem",
    color: "#888",
    fontWeight: 600,
    marginBottom: "0.3rem",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* ── Sección: Datos de contacto ── */}
      <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1A1A2E", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 0.25rem", borderBottom: "1px solid #E8EAED", paddingBottom: "0.4rem" }}>
        {isEs ? "Datos de contacto" : "Contact details"}
      </p>

      {/* Nombre + Apellido */}
      <div className="form-row-2">
        <div>
          <label style={labelStyle}>{isEs ? "Nombre" : "First name"}</label>
          <input type="text" name="firstName" required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>{isEs ? "Apellido" : "Last name"}</label>
          <input type="text" name="lastName" required style={inputStyle} />
        </div>
      </div>

      {/* Email + Teléfono */}
      <div className="form-row-2">
        <div>
          <label style={labelStyle}>{isEs ? "Correo" : "Email"}</label>
          <input type="email" name="email" required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>{isEs ? "Teléfono" : "Phone"}</label>
          <input type="tel" name="phone" style={inputStyle} />
        </div>
      </div>

      {/* ── Sección: Dirección ── */}
      <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1A1A2E", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0.25rem 0 0.25rem", borderBottom: "1px solid #E8EAED", paddingBottom: "0.4rem" }}>
        {isEs ? "Dirección de envío" : "Shipping address"}
      </p>

      <div>
        <label style={labelStyle}>{isEs ? "Dirección" : "Address"}</label>
        <input type="text" name="address" required style={inputStyle} />
      </div>

      {/* Ciudad + CP */}
      <div className="form-row-2">
        <div>
          <label style={labelStyle}>{isEs ? "Ciudad" : "City"}</label>
          <input type="text" name="city" required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>{isEs ? "Código postal" : "Postal code"}</label>
          <input type="text" name="postal" required style={inputStyle} />
        </div>
      </div>

      <div>
        <label style={labelStyle}>{isEs ? "País" : "Country"}</label>
        <select name="country" required style={{ ...inputStyle, background: "#fff" }}>
          <option value="">{isEs ? "Selecciona un país" : "Select a country"}</option>
          {EU_COUNTRIES.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </div>

      {/* ── Pago ── */}
      <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1A1A2E", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0.25rem 0 0.25rem", borderBottom: "1px solid #E8EAED", paddingBottom: "0.4rem" }}>
        {isEs ? "Pago" : "Payment"}
      </p>

      <PaymentElement options={{ layout: "accordion" }} />

      {error && (
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            color: "#EF4444",
            padding: "0.75rem",
            borderRadius: "8px",
            fontSize: "0.9rem",
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !stripe || !elements}
        style={{
          width: "100%",
          padding: "1rem 1.5rem",
          background: loading ? "#00A896" : "#00C9B1",
          color: "#fff",
          border: "none",
          borderRadius: "10px",
          fontFamily: "var(--font-bebas)",
          fontSize: "1.3rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
          textShadow: "-1px -1px 0 rgba(0,0,0,0.35), 1px -1px 0 rgba(0,0,0,0.35), -1px 1px 0 rgba(0,0,0,0.35), 1px 1px 0 rgba(0,0,0,0.35)",
        }}
      >
        🔒 {loading ? (isEs ? "Procesando..." : "Processing...") : (isEs ? "PAGAR AHORA" : "PAY NOW")}
      </button>

      <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#AAA", margin: "0" }}>
        {isEs ? "Cifrado SSL · Procesado por Stripe" : "SSL encrypted · Powered by Stripe"}
      </p>
    </form>
  );
}

export default function CheckoutClient({ locale }: { locale: string }) {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);

  const isEs = locale === "es";
  const shippingCost: number = 0; // Free shipping
  const total = totalPrice - discount + shippingCost;

  const initPayment = React.useCallback(async () => {
    if (items.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setInitError(null);
    setClientSecret(null);
    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, shippingCost, coupon: coupon || undefined }),
      });
      const data = await res.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        if (coupon === "AIZUA10") setDiscount(totalPrice * 0.1);
      } else {
        setInitError(data.error || (isEs ? "Error al inicializar el pago." : "Payment initialization failed."));
      }
    } catch (err) {
      console.error(err);
      setInitError(isEs ? "Error de conexión. Inténtalo de nuevo." : "Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [items, coupon, totalPrice, isEs]);

  // Initialize payment intent
  React.useEffect(() => {
    initPayment();
  }, [initPayment]);

  if (items.length === 0) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#F8F9FB",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontFamily: "var(--font-bebas)",
              fontSize: "2rem",
              color: "#1A1A2E",
              marginBottom: "1rem",
            }}
          >
            {isEs ? "Carrito vacío" : "Empty cart"}
          </h1>
          <p style={{ color: "#666", marginBottom: "2rem" }}>
            {isEs ? "No hay artículos en tu carrito" : "There are no items in your cart"}
          </p>
          <Link
            href={`/${locale}/tienda`}
            style={{
              display: "inline-block",
              background: "#00C9B1",
              color: "#fff",
              textDecoration: "none",
              padding: "0.9rem 2rem",
              borderRadius: "10px",
              fontWeight: 700,
            }}
          >
            {isEs ? "Ir a la tienda" : "Go to shop"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8F9FB", paddingTop: "84px" }}>

      {/* ── Trust bar ── */}
      <div style={{ background: "#00C9B1", padding: "0.6rem 2rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: "2.5rem", flexWrap: "wrap" }}>
          {[
            { icon: "🔒", label: isEs ? "Pago 100% seguro" : "100% Secure payment" },
            { icon: "💳", label: "Visa · Mastercard · Amex" },
            { icon: "🛡️", label: isEs ? "Cifrado SSL" : "SSL Encrypted" },
            { icon: "↩️", label: isEs ? "14 días devolución" : "14-day returns" },
          ].map((item) => (
            <span key={item.label} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", fontWeight: 700, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.15)", whiteSpace: "nowrap" }}>
              {item.icon} {item.label}
            </span>
          ))}
        </div>
      </div>

      <div style={{ padding: "2rem 2.5rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <Link
          href={`/${locale}`}
          style={{
            color: "#00C9B1",
            textDecoration: "none",
            fontSize: "0.9rem",
            fontWeight: 600,
            marginBottom: "1.5rem",
            display: "inline-block",
          }}
        >
          ← {isEs ? "Volver" : "Back"}
        </Link>

        <h1
          style={{
            fontFamily: "var(--font-bebas)",
            fontSize: "2.2rem",
            color: "#1A1A2E",
            marginBottom: "1.5rem",
            letterSpacing: "0.05em",
          }}
        >
          {isEs ? "PAGO SEGURO" : "SECURE CHECKOUT"}
        </h1>

        <div className="checkout-grid">
          {/* Left: Form */}
          <div style={{ background: "#fff", padding: "2rem", borderRadius: "16px", border: "1px solid #E8EAED" }}>
            {!stripePromise ? (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <p style={{ color: "#EF4444", marginBottom: "1rem" }}>
                  {isEs ? "El sistema de pago no está configurado todavía." : "Payment system is not configured yet."}
                </p>
                <p style={{ color: "#888", fontSize: "0.9rem" }}>
                  {isEs ? "Por favor, vuelve a intentarlo más tarde." : "Please try again later."}
                </p>
              </div>
            ) : loading ? (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>⏳</div>
                <p style={{ color: "#666" }}>{isEs ? "Preparando el formulario de pago..." : "Loading payment form..."}</p>
              </div>
            ) : initError ? (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "10px", padding: "1.25rem", marginBottom: "1.5rem" }}>
                  <p style={{ color: "#EF4444", fontWeight: 600, marginBottom: "0.5rem" }}>
                    {isEs ? "No se pudo cargar el formulario de pago" : "Could not load payment form"}
                  </p>
                  <p style={{ color: "#999", fontSize: "0.85rem" }}>{initError}</p>
                </div>
                <button
                  onClick={initPayment}
                  style={{ background: "#00C9B1", color: "#fff", border: "none", borderRadius: "10px", padding: "0.75rem 2rem", fontWeight: 700, cursor: "pointer", fontSize: "0.95rem" }}
                >
                  {isEs ? "🔄 Reintentar" : "🔄 Retry"}
                </button>
              </div>
            ) : clientSecret ? (
              <Elements
                stripe={stripePromise}
                options={{ clientSecret, appearance: { theme: "stripe" } }}
              >
                <CheckoutForm
                  locale={locale}
                  clientSecret={clientSecret}
                  items={items}
                  shippingCost={shippingCost}
                  subtotal={totalPrice}
                />
              </Elements>
            ) : (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <p style={{ color: "#EF4444" }}>
                  {isEs ? "Error al cargar el formulario de pago. Inténtalo de nuevo." : "Error loading payment form. Please try again."}
                </p>
                <button onClick={initPayment} style={{ marginTop: "1rem", background: "#00C9B1", color: "#fff", border: "none", borderRadius: "8px", padding: "0.65rem 1.5rem", fontWeight: 700, cursor: "pointer" }}>
                  {isEs ? "Reintentar" : "Retry"}
                </button>
              </div>
            )}
          </div>

          {/* Right: Summary */}
          <div style={{ background: "#fff", padding: "2rem", borderRadius: "16px", border: "1px solid #E8EAED", height: "fit-content" }}>
            <h2
              style={{
                fontFamily: "var(--font-bebas)",
                fontSize: "1.5rem",
                color: "#1A1A2E",
                marginBottom: "1.5rem",
                letterSpacing: "0.05em",
              }}
            >
              {isEs ? "RESUMEN" : "SUMMARY"}
            </h2>

            {/* Items */}
            <div style={{ marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid #E8EAED" }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "1rem",
                    fontSize: "0.9rem",
                  }}
                >
                  <span style={{ color: "#666" }}>
                    {item.name} × {item.qty}
                  </span>
                  <span style={{ fontWeight: 600, color: "#1A1A2E" }}>
                    €{(item.price * item.qty).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="text"
                  placeholder={isEs ? "Código de descuento" : "Coupon code"}
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                  style={{
                    flex: 1,
                    padding: "0.5rem",
                    border: "1px solid #E8EAED",
                    borderRadius: "6px",
                    fontSize: "0.85rem",
                  }}
                />
                <button
                  onClick={() => {
                    if (coupon === "AIZUA10") {
                      setDiscount(totalPrice * 0.1);
                    } else {
                      setDiscount(0);
                    }
                  }}
                  style={{
                    background: "#F5F7FA",
                    border: "1px solid #E8EAED",
                    borderRadius: "6px",
                    padding: "0.5rem 1rem",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "#00C9B1",
                  }}
                >
                  {isEs ? "Aplicar" : "Apply"}
                </button>
              </div>
            </div>

            {/* Totals */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "#666" }}>
                <span>{isEs ? "Subtotal:" : "Subtotal:"}</span>
                <span>€{totalPrice.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "#00C9B1" }}>
                  <span>{isEs ? "Descuento:" : "Discount:"}</span>
                  <span>-€{discount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "#666" }}>
                <span>{isEs ? "Envío:" : "Shipping:"}</span>
                <span>{shippingCost === 0 ? (isEs ? "Gratis" : "Free") : `€${shippingCost.toFixed(2)}`}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: "1rem",
                  borderTop: "2px solid #E8EAED",
                  marginTop: "1rem",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "#1A1A2E",
                }}
              >
                <span>{isEs ? "Total:" : "Total:"}</span>
                <span>€{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
