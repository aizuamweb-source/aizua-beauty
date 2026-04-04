"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { pixelViewContent } from "@/lib/pixels";
import { useCart } from "@/lib/cart/CartContext";
import { getLocalizedName } from "@/lib/product-utils";

type UrgencyConfig = {
  show_timer?: boolean;
  show_stock?: boolean;
  show_volume?: boolean;
  stock_units?: number | null;
};

type Product = {
  id: string;
  slug: string;
  name: string | Record<string, string>;
  name_es?: string; name_en?: string; name_fr?: string;
  name_de?: string; name_pt?: string; name_it?: string;
  description: string | Record<string, string>;
  price: number;
  compare_price?: number;
  images: string[];
  badge?: string;
  rating: number;
  review_count: number;
  stock: number;
  category?: string;
  urgency_config?: UrgencyConfig | null;
};

type Upsell = {
  id: string;
  slug: string;
  name: string | Record<string, string>;
  name_es?: string; name_en?: string; name_fr?: string;
  name_de?: string; name_pt?: string; name_it?: string;
  price: number;
  images: string[];
  badge?: string;
};

type Review = {
  id: string;
  name: string;
  rating: number;
  title?: string;
  body: string;
  verified: boolean;
  created_at: string;
};

function getLocalizedText(field: string | Record<string, string> | null | undefined, locale: string): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field[locale] ?? field["en"] ?? Object.values(field)[0] ?? "";
}

export default function ProductClient({
  product,
  locale,
  upsells = [],
  reviews = [],
}: {
  product: Product;
  locale: string;
  upsells?: Upsell[];
  reviews?: Review[];
}) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [timeLeft, setTimeLeft] = useState("");
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    const total = product.images?.length ?? 1;
    if (diff > 50) setActiveImg(i => (i + 1) % total);
    else if (diff < -50) setActiveImg(i => (i - 1 + total) % total);
    touchStartX.current = null;
  };

  const { addItem, openCart } = useCart();

  const name = getLocalizedName(product as Record<string, unknown>, locale);
  const desc = getLocalizedText(product.description, locale);

  // Countdown to midnight (offer timer)
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(23, 59, 59, 999);
      const diff = midnight.getTime() - now.getTime();
      const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
      setTimeLeft(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Urgency config — read from DB, fallback to all-off
  const uc = product.urgency_config ?? {};
  const showTimer  = uc.show_timer  ?? false;
  const showStock  = uc.show_stock  ?? false;
  const showVolume = uc.show_volume ?? false;
  const stockUnits = uc.stock_units
    ?? (((product.id.charCodeAt(0) + product.id.charCodeAt(2)) % 12) + 3);

  // ── ViewContent — disparar al montar la página de producto ──
  useEffect(() => {
    pixelViewContent({
      id:       product.id,
      name,
      price:    product.price,
      category: product.category,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const discount = product.compare_price
    ? Math.round((1 - product.price / product.compare_price) * 100)
    : null;

  const handleAddToCart = () => {
    addItem({
      id:            product.id,
      slug:          product.slug,
      name,
      price:         product.price,
      compare_price: product.compare_price,
      image:         product.images?.[0] || "",
    }, qty);
    setAdded(true);
    openCart();
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div>

      {/* BREADCRUMB */}
      <div style={{ paddingTop: "84px", background: "#fff", borderBottom: "1px solid #E8EAED" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0.85rem 2.5rem", display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.82rem", color: "#999" }}>
          <Link href={`/${locale}`} style={{ color: "#999", textDecoration: "none" }}>{locale === "es" ? "Inicio" : "Home"}</Link>
          <span>/</span>
          <Link href={`/${locale}/tienda`} style={{ color: "#999", textDecoration: "none" }}>{locale === "es" ? "Tienda" : "Shop"}</Link>
          <span>/</span>
          <span style={{ color: "#333" }}>{name}</span>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "3rem 2.5rem" }} className="page-pad">
        <div className="product-detail-grid">

          {/* IMÁGENES */}
          <div>
            <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} style={{ background: "#fff", borderRadius: "16px", overflow: "hidden", aspectRatio: "1", marginBottom: "1rem", border: "1px solid #E8EAED", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", userSelect: "none" }}>
              {product.images?.[activeImg] ? (
                <img src={product.images[activeImg]} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <Image src="/logo.png" alt="Aizüa" width={140} height={56} style={{ objectFit: "contain", opacity: 0.2 }} />
              )}
            </div>
            {product.images?.length > 1 && (
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {product.images.slice(0, 5).map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} style={{ width: "68px", height: "68px", background: "#fff", border: i === activeImg ? "2px solid #00C9B1" : "1px solid #E8EAED", borderRadius: "10px", overflow: "hidden", cursor: "pointer", padding: 0 }}>
                    <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* INFO */}
          <div>
            {product.badge && (
              <span style={{ background: product.badge === "NEW" ? "#00C9B1" : product.badge === "HOT" ? "#FF6B35" : product.badge === "SALE" ? "#EF4444" : "#F59E0B", color: "#fff", fontSize: "0.72rem", fontWeight: 700, padding: "0.3rem 0.8rem", borderRadius: "6px", marginBottom: "1rem", display: "inline-block", letterSpacing: "0.08em" }}>
                {product.badge}
              </span>
            )}

            <h1 style={{ fontFamily: "var(--font-bebas)", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", color: "#1A1A2E", margin: "0.75rem 0 1rem", letterSpacing: "0.03em", lineHeight: 1.1 }}>
              {name}
            </h1>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <span style={{ color: "#F59E0B", fontSize: "1rem" }}>{"★".repeat(Math.round(product.rating || 5))}</span>
              <span style={{ color: "#888", fontSize: "0.875rem" }}>
                {product.rating?.toFixed(1)}{product.review_count > 0 ? ` (${product.review_count} ${locale === "es" ? "reseñas" : "reviews"})` : ""}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
              <span style={{ fontSize: "2.5rem", fontWeight: 800, color: "#1A1A2E" }}>
                €{product.price?.toFixed(2)}
              </span>
              {product.compare_price && (
                <span style={{ fontSize: "1.25rem", color: "#bbb", textDecoration: "line-through" }}>
                  €{product.compare_price.toFixed(2)}
                </span>
              )}
              {discount && (
                <span style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#EF4444", padding: "0.3rem 0.6rem", borderRadius: "6px", fontSize: "0.875rem", fontWeight: 700 }}>
                  -{discount}%
                </span>
              )}
            </div>

            {/* URGENCY TIMER — only when show_timer=true in DB */}
            {showTimer && timeLeft && (
              <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: "10px", padding: "0.65rem 1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.65rem" }}>
                <span>🔥</span>
                <span style={{ fontSize: "0.88rem", color: "#C2410C", fontWeight: 600 }}>
                  {locale === "es" ? "Oferta termina en:" : "Offer ends in:"}&nbsp;
                  <strong style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "0.04em" }}>{timeLeft}</strong>
                </span>
              </div>
            )}

            {/* STOCK WARNING — only when show_stock=true in DB */}
            {showStock && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", padding: "0.55rem 1rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>⚠️</span>
                <span style={{ fontSize: "0.85rem", color: "#DC2626", fontWeight: 600 }}>
                  {locale === "es"
                    ? `¡Solo quedan ${stockUnits} unidades!`
                    : `Only ${stockUnits} left in stock!`}
                </span>
              </div>
            )}

            {desc && (
              <div
                style={{ color: "#666", lineHeight: 1.75, marginBottom: "2rem", fontSize: "0.95rem" }}
                dangerouslySetInnerHTML={{ __html: desc }}
              />
            )}

            {/* Cantidad */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
              <span style={{ fontSize: "0.85rem", color: "#888", fontWeight: 600 }}>{locale === "es" ? "Cantidad:" : "Qty:"}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0", border: "1px solid #E8EAED", borderRadius: "8px", overflow: "hidden" }}>
                <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: "40px", height: "40px", background: "#fff", border: "none", color: "#333", cursor: "pointer", fontSize: "1.2rem", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                <span style={{ width: "44px", textAlign: "center", fontSize: "1rem", fontWeight: 700, color: "#1A1A2E", borderLeft: "1px solid #E8EAED", borderRight: "1px solid #E8EAED", lineHeight: "40px" }}>{qty}</span>
                <button onClick={() => setQty(qty + 1)} style={{ width: "40px", height: "40px", background: "#fff", border: "none", color: "#333", cursor: "pointer", fontSize: "1.2rem", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
              </div>
            </div>

            {/* VOLUME OFFER — only when show_volume=true in DB */}
            {showVolume && (
            <div style={{ background: "linear-gradient(135deg, #F0FFFE, #EEF2FF)", border: "1px solid #B2EDE7", borderRadius: "10px", padding: "0.7rem 1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span>🎁</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1A1A2E" }}>
                {locale === "es" ? "Compra 2 y llévate 1 de regalo" : "Buy 2, get 1 FREE"}
              </span>
              <span style={{ fontSize: "0.75rem", color: "#888", marginLeft: "auto" }}>
                {locale === "es" ? "se aplica al añadir" : "applied at checkout"}
              </span>
            </div>
            )}

            <button onClick={handleAddToCart} style={{ width: "100%", padding: "1rem 2rem", background: added ? "#00A896" : "#00C9B1", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-bebas)", letterSpacing: "0.1em", fontSize: "1.3rem", boxShadow: "0 4px 16px rgba(0,201,177,0.3)", transition: "all 0.2s" }}>
              {added
                ? (locale === "es" ? "✓ AÑADIDO AL CARRITO" : "✓ ADDED TO CART")
                : (locale === "es" ? "AÑADIR AL CARRITO" : "ADD TO CART")
              }
            </button>

            {/* DELIVERY ESTIMATE */}
            <div style={{ marginTop: "1.25rem", padding: "1rem 1.2rem", background: "#F5F7FA", borderRadius: "10px", border: "1px solid #E8EAED" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginBottom: "0.55rem" }}>
                <div style={{ fontSize: "0.88rem", color: "#555" }}>
                  ⏱ {locale === "es" ? "Preparación del pedido: 1-3 días hábiles" : "Order processing: 1-3 business days"}
                </div>
                <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1A1A2E" }}>
                  📦 {locale === "es" ? "Tiempo estimado de envío: 3-7 días hábiles" : "Estimated shipping time: 3-7 business days"}
                </div>
              </div>
              <div style={{ fontSize: "0.71rem", color: "#bbb", lineHeight: 1.45, borderTop: "1px solid #E8EAED", paddingTop: "0.45rem" }}>
                {locale === "es"
                  ? "* El plazo total de entrega es la suma de ambos plazos indicados. Puede variar según disponibilidad y destino."
                  : "* Total delivery time is the sum of both periods above. May vary depending on availability and destination."}
              </div>
            </div>

            {/* Garantías */}
            <div className="trust-grid">
              {[
                { icon: "🚚", text: locale === "es" ? "Envío gratis" : "Free shipping" },
                { icon: "🔒", text: locale === "es" ? "Pago seguro" : "Secure payment" },
                { icon: "↩️", text: locale === "es" ? "14 días devolución" : "14-day returns" },
              ].map((item) => (
                <div key={item.text} style={{ background: "#F5F7FA", border: "1px solid #E8EAED", borderRadius: "10px", padding: "0.75rem", textAlign: "center" }}>
                  <div style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>{item.icon}</div>
                  <div style={{ fontSize: "0.72rem", color: "#666", fontWeight: 600 }}>{item.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* UPSELLS */}
        {upsells.length > 0 && (
          <div style={{ marginTop: "5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
              <h2 style={{ fontFamily: "var(--font-bebas)", fontSize: "2rem", letterSpacing: "0.05em", color: "#1A1A2E", margin: 0 }}>
                {locale === "es" ? "TAMBIÉN TE PUEDE INTERESAR" : "YOU MAY ALSO LIKE"}
              </h2>
              <div style={{ flex: 1, height: "1px", background: "#E8EAED" }} />
            </div>
            <div className="upsells-grid">
              {upsells.map((u) => (
                <Link key={u.id} href={`/${locale}/product/${u.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{ background: "#fff", border: "1px solid #E8EAED", borderRadius: "14px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                    <div style={{ aspectRatio: "1", background: "#F5F7FA", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {u.images?.[0] ? (
                        <img src={u.images[0]} alt={getLocalizedName(u as Record<string, unknown>, locale)} style={{ width: "100%", height: "100%", objectFit: "contain", padding: "0.75rem" }} />
                      ) : (
                        <Image src="/logo.png" alt="Aizüa" width={80} height={32} style={{ objectFit: "contain", opacity: 0.2 }} />
                      )}
                    </div>
                    <div style={{ padding: "1rem" }}>
                      <p style={{ fontSize: "0.88rem", color: "#333", marginBottom: "0.4rem", fontWeight: 600, lineHeight: 1.3 }}>{getLocalizedName(u as Record<string, unknown>, locale)}</p>
                      <p style={{ fontWeight: 800, color: "#1A1A2E", fontSize: "1.1rem" }}>€{u.price?.toFixed(2)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* RESEÑAS */}
        {reviews.length > 0 && (
          <div style={{ marginTop: "5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
              <h2 style={{ fontFamily: "var(--font-bebas)", fontSize: "2rem", letterSpacing: "0.05em", color: "#1A1A2E", margin: 0 }}>
                {locale === "es" ? "RESEÑAS DE CLIENTES" : "CUSTOMER REVIEWS"}
              </h2>
              <div style={{ flex: 1, height: "1px", background: "#E8EAED" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {reviews.map((r) => (
                <div key={r.id} style={{ background: "#fff", border: "1px solid #E8EAED", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ fontWeight: 700, color: "#1A1A2E" }}>{r.name}</span>
                      {r.verified && (
                        <span style={{ fontSize: "0.7rem", background: "#F0FFFE", color: "#00A896", padding: "0.2rem 0.6rem", borderRadius: "4px", fontWeight: 700, border: "1px solid #B2EDE7" }}>
                          {locale === "es" ? "Verificado" : "Verified"}
                        </span>
                      )}
                    </div>
                    <span style={{ color: "#F59E0B" }}>{"★".repeat(r.rating)}</span>
                  </div>
                  <p style={{ color: "#555", fontSize: "0.92rem", lineHeight: 1.65, margin: 0 }}>{r.body}</p>
                  <p style={{ color: "#bbb", fontSize: "0.75rem", marginTop: "0.75rem" }}>
                    {new Date(r.created_at).toLocaleDateString(locale)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
