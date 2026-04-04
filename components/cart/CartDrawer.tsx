"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart/CartContext";

export default function CartDrawer({ locale }: { locale: string }) {
  const { items, totalPrice, isOpen, closeCart, removeItem, updateQty } = useCart();

  const isEs = locale === "es";

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={closeCart}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 99,
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          bottom: 0,
          width: "400px",
          maxWidth: "90vw",
          background: "#fff",
          zIndex: 100,
          boxShadow: "-4px 0 20px rgba(0,0,0,0.15)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.5rem 1.5rem",
            borderBottom: "1px solid #E8EAED",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-bebas)",
              fontSize: "1.5rem",
              color: "#1A1A2E",
              margin: 0,
              letterSpacing: "0.05em",
            }}
          >
            {isEs ? "TU CARRITO" : "YOUR CART"}
          </h2>
          <button
            onClick={closeCart}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: "#999",
              padding: "0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1rem 0",
          }}
        >
          {items.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "3rem 1.5rem",
                textAlign: "center",
                color: "#999",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🛒</div>
              <p style={{ margin: "0.5rem 0", fontSize: "0.95rem" }}>
                {isEs ? "Tu carrito está vacío" : "Your cart is empty"}
              </p>
              <Link
                href={`/${locale}/tienda`}
                onClick={closeCart}
                style={{
                  marginTop: "1rem",
                  color: "#00C9B1",
                  textDecoration: "none",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                }}
              >
                {isEs ? "Ir a la tienda" : "Continue shopping"}
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  gap: "1rem",
                  padding: "1rem 1.5rem",
                  borderBottom: "1px solid #F0F0F0",
                }}
              >
                {/* Image */}
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    background: "#F5F7FA",
                    borderRadius: "10px",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        padding: "0.5rem",
                      }}
                    />
                  ) : (
                    <Image
                      src="/logo.png"
                      alt="Aizua"
                      width={60}
                      height={24}
                      style={{ objectFit: "contain", opacity: 0.2 }}
                    />
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <h3
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      color: "#1A1A2E",
                      margin: "0 0 0.25rem",
                      lineHeight: 1.3,
                    }}
                  >
                    {item.name}
                  </h3>
                  <p
                    style={{
                      fontSize: "1rem",
                      fontWeight: 800,
                      color: "#00C9B1",
                      margin: "0.25rem 0 0.5rem",
                    }}
                  >
                    €{item.price.toFixed(2)}
                  </p>

                  {/* Quantity controls */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <button
                      onClick={() =>
                        updateQty(item.id, Math.max(1, item.qty - 1))
                      }
                      style={{
                        width: "28px",
                        height: "28px",
                        background: "#F5F7FA",
                        border: "1px solid #E8EAED",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        color: "#666",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      −
                    </button>
                    <span
                      style={{
                        width: "32px",
                        textAlign: "center",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                      }}
                    >
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      style={{
                        width: "28px",
                        height: "28px",
                        background: "#F5F7FA",
                        border: "1px solid #E8EAED",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        color: "#666",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      style={{
                        marginLeft: "auto",
                        background: "none",
                        border: "none",
                        color: "#EF4444",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                      }}
                    >
                      {isEs ? "Eliminar" : "Remove"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div
            style={{
              padding: "1.5rem",
              borderTop: "1px solid #E8EAED",
              background: "#F8F9FB",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "1.5rem",
                paddingBottom: "1rem",
                borderBottom: "1px solid #E8EAED",
              }}
            >
              <span style={{ color: "#666", fontSize: "0.9rem" }}>
                {isEs ? "Subtotal:" : "Subtotal:"}
              </span>
              <span
                style={{
                  fontWeight: 700,
                  color: "#1A1A2E",
                  fontSize: "1rem",
                }}
              >
                €{totalPrice.toFixed(2)}
              </span>
            </div>
            <Link
              href={`/${locale}/checkout`}
              onClick={closeCart}
              style={{
                display: "block",
                width: "100%",
                padding: "0.9rem 1.5rem",
                background: "#00C9B1",
                color: "#fff",
                textDecoration: "none",
                textAlign: "center",
                borderRadius: "10px",
                fontFamily: "var(--font-bebas)",
                fontSize: "1.1rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(0,201,177,0.3)",
              }}
            >
              {isEs ? "Ir al pago" : "Proceed to checkout"}
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
