"use client";

import { useCart } from "@/lib/cart/CartContext";

export default function NavCartButton({ locale }: { locale: string }) {
  const { totalItems, toggleCart } = useCart();
  const isEs = locale === "es";

  return (
    <button
      onClick={toggleCart}
      style={{
        background: "#00C9B1",
        color: "#fff",
        textDecoration: "none",
        fontSize: "0.85rem",
        fontWeight: 700,
        letterSpacing: "0.06em",
        padding: "0.55rem 1.4rem",
        borderRadius: "8px",
        border: "none",
        cursor: "pointer",
      }}
    >
      {isEs ? `CARRITO (${totalItems})` : `CART (${totalItems})`}
    </button>
  );
}
