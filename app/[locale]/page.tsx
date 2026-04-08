import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import MainNav from "@/components/nav/MainNav";
import Footer from "@/components/nav/Footer";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isEs = params.locale === "es";
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://aizua-beauty.vercel.app";
  return {
    title: isEs
      ? "AizuaBeauty — Cosmética Natural y Moda Femenina desde Europa"
      : "AizuaBeauty — Natural Beauty & Women's Fashion from Europe",
    description: isEs
      ? "Cosmética natural Ringana certificada y moda femenina seleccionada. Sin conservantes artificiales. Envío rápido desde España y Europa."
      : "Certified natural Ringana cosmetics and curated women's fashion. No artificial preservatives. Fast shipping from Spain and Europe.",
    keywords: isEs
      ? ["cosmética natural", "Ringana", "moda femenina", "skincare natural", "sin parabenos", "cosmética Austria", "AizuaBeauty"]
      : ["natural cosmetics", "Ringana", "women's fashion", "natural skincare", "paraben-free", "Austrian cosmetics", "AizuaBeauty"],
    openGraph: {
      title: isEs ? "AizuaBeauty — Cosmética Natural y Moda Femenina" : "AizuaBeauty — Natural Beauty & Women's Fashion",
      description: isEs
        ? "Cosmética Ringana y moda femenina. Sin conservantes artificiales. Envío desde Europa."
        : "Ringana cosmetics and women's fashion. No artificial preservatives. Ships from Europe.",
      url: `${base}/${params.locale}`,
      type: "website",
      locale: isEs ? "es_ES" : "en_GB",
      images: [{ url: `${base}/og-home.jpg`, width: 1200, height: 630, alt: "AizuaBeauty" }],
    },
    twitter: { card: "summary_large_image", title: "AizuaBeauty", description: isEs ? "Cosmética natural y moda femenina desde Europa." : "Natural beauty & fashion from Europe." },
    alternates: {
      canonical: `${base}/${params.locale}`,
      languages: {
        "es": `${base}/es`,
        "en": `${base}/en`,
        "fr": `${base}/fr`,
        "de": `${base}/de`,
        "pt": `${base}/pt`,
        "it": `${base}/it`,
        "x-default": `${base}/es`,
      },
    },
  };
}

export const dynamic = "force-dynamic";

const RINGANA_URL = process.env.RINGANA_PARTNER_URL || "https://miguelsaez.ringana.com";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { fetch: (url: RequestInfo | URL, init?: RequestInit) => fetch(url, { ...init, cache: "no-store" }) } }
  );
}

async function getFeaturedProducts() {
  try {
    const { data } = await getSupabase()
      .from("products")
      .select("id, slug, name, name_es, name_en, price, compare_price, images, badge, rating, review_count, supplier, category")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .limit(8);
    if (data && data.length > 0) return data;
  } catch {}
  return [];
}

async function getRinganaProducts() {
  try {
    const { data } = await getSupabase()
      .from("products")
      .select("id, slug, name, name_es, name_en, price, images, ringana_url, badge")
      .eq("active", true)
      .eq("supplier", "ringana")
      .limit(6);
    if (data && data.length > 0) return data;
  } catch {}
  return [];
}

const REVIEWS = [
  { stars: 5, text: "La crema FRESH hidrata increíble. Mi piel nunca ha estado mejor.", author: "Marta L.", flag: "🇪🇸", product: "FRESH Moisturiser" },
  { stars: 5, text: "El pañuelo llegó en 3 días desde España. Calidad preciosa.", author: "Sophie K.", flag: "🇩🇪", product: "Pañuelo seda" },
  { stars: 5, text: "Les sérums Ringana sont vraiment naturels. Je recommande!", author: "Claire M.", flag: "🇫🇷", product: "ADDS Glow" },
  { stars: 5, text: "El bolso es exactamente como en las fotos. Material muy bueno.", author: "Ana R.", flag: "🇪🇸", product: "Bolso clutch" },
  { stars: 4, text: "El gorro balaclava es perfecto para el invierno, muy suave.", author: "Laura P.", flag: "🇮🇹", product: "Balaclava lana" },
  { stars: 5, text: "Atención al cliente excelente, me ayudaron con el pedido.", author: "Emma V.", flag: "🇬🇧", product: "Servicio" },
];

export default async function HomePage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  setRequestLocale(locale);
  const [featured, ringana] = await Promise.all([getFeaturedProducts(), getRinganaProducts()]);
  const isEs = locale === "es";

  const T = {
    hero_tag:       isEs ? "Cosmética Natural · Moda Femenina" : "Natural Beauty · Women's Fashion",
    hero_title1:    isEs ? "Belleza que" : "Beauty that",
    hero_title2:    isEs ? "nace natural" : "feels natural",
    hero_sub:       isEs ? "Skincare Ringana certificado y moda femenina seleccionada. Todo desde Europa." : "Certified Ringana skincare and curated women's fashion. All from Europe.",
    cta_shop:       isEs ? "Ver tienda" : "Shop now",
    cta_ringana:    isEs ? "Descubrir Ringana" : "Discover Ringana",
    featured_title: isEs ? "Destacados" : "Featured",
    ringana_title:  isEs ? "Cosmética Natural · Ringana" : "Natural Skincare · Ringana",
    ringana_sub:    isEs ? "Ingredientes puros, sin tóxicos. Certificado y enviado desde Austria." : "Pure ingredients, toxin-free. Certified and shipped from Austria.",
    ringana_cta:    isEs ? "Ver en Ringana →" : "View on Ringana →",
    reviews_title:  isEs ? "Lo que dicen nuestras clientas" : "What our customers say",
    trust1: isEs ? "Envío desde Europa" : "Shipped from Europe",
    trust2: isEs ? "Pago seguro" : "Secure payment",
    trust3: isEs ? "Devolución fácil" : "Easy returns",
    trust4: isEs ? "Soporte rápido" : "Fast support",
    trust5: isEs ? "Solo marcas naturales" : "Only natural brands",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FAF8F5", fontFamily: "var(--font-lato, sans-serif)" }}>
      <MainNav locale={locale} />

      {/* HERO */}
      <section style={{
        paddingTop: "110px", paddingBottom: "60px",
        padding: "110px 2.5rem 60px",
        background: "linear-gradient(155deg, #F5F0EA 0%, #FAF8F5 50%, #EAF2E4 100%)",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#7BA05B", display: "inline-block" }} />
            <span style={{ fontSize: "0.72rem", color: "#7BA05B", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const }}>
              {T.hero_tag}
            </span>
          </div>
          <h1 style={{
            fontFamily: "var(--font-cormorant, Georgia, serif)",
            fontSize: "clamp(2.4rem, 6vw, 4.2rem)",
            fontWeight: 300, lineHeight: 1.15, color: "#2C2C2C",
            margin: "0 0 0.5rem", letterSpacing: "-0.01em",
          }}>
            {T.hero_title1}{" "}
            <em style={{ fontStyle: "italic", color: "#7BA05B", fontWeight: 400 }}>{T.hero_title2}</em>
          </h1>
          <p style={{ color: "#6B6B6B", fontSize: "clamp(14px,1.6vw,17px)", lineHeight: 1.65, maxWidth: "520px", margin: "1rem auto 2rem" }}>
            {T.hero_sub}
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" as const }}>
            <Link href={`/${locale}/tienda`} style={{
              background: "#7BA05B", color: "#fff",
              padding: "0.85rem 2.2rem", borderRadius: "50px",
              fontWeight: 700, fontSize: "0.88rem", letterSpacing: "0.06em",
              textTransform: "uppercase" as const,
            }}>{T.cta_shop}</Link>
            <Link href={`/${locale}/ringana`} style={{
              background: "transparent", color: "#2C2C2C",
              border: "1.5px solid #EDE9E3", padding: "0.85rem 2.2rem", borderRadius: "50px",
              fontWeight: 700, fontSize: "0.88rem", letterSpacing: "0.06em",
              textTransform: "uppercase" as const,
            }}>{T.cta_ringana}</Link>
          </div>
          <div style={{ display: "flex", gap: "3rem", justifyContent: "center", marginTop: "3rem", flexWrap: "wrap" as const }}>
            {[{ num: "100%", label: "Natural" }, { num: "EU", label: isEs ? "Envío" : "Shipping" }, { num: "4.9★", label: isEs ? "Valoración" : "Rating" }].map((s) => (
              <div key={s.num} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-cormorant)", fontSize: "2rem", fontWeight: 600, color: "#7BA05B", lineHeight: 1 }}>{s.num}</div>
                <div style={{ fontSize: "0.7rem", color: "#6B6B6B", letterSpacing: "0.08em", marginTop: "3px", textTransform: "uppercase" as const }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST TICKER */}
      <section style={{ background: "#fff", borderTop: "1px solid #EDE9E3", borderBottom: "1px solid #EDE9E3" }} className="trust-ticker-wrap">
        <div className="trust-ticker-track">
          {[T.trust1, T.trust2, T.trust3, T.trust4, T.trust5, T.trust1, T.trust2, T.trust3, T.trust4, T.trust5].map((text, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
              <span className="trust-ticker-item">
                <span style={{ fontSize: "1.1rem" }}>{["🌿","🔒","↩️","💬","✨"][i % 5]}</span>
                <span>{text}</span>
              </span>
              <span className="trust-ticker-sep">·</span>
            </span>
          ))}
        </div>
      </section>

      {/* RINGANA SECTION */}
      <section style={{ padding: "5rem 2.5rem", background: "#FAF8F5" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div style={{ display: "inline-block", background: "#EAF2E4", color: "#5C8044", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", padding: "0.3rem 1rem", borderRadius: "20px", marginBottom: "0.75rem", textTransform: "uppercase" as const }}>
              Ringana Partner
            </div>
            <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(1.8rem,3.5vw,2.8rem)", fontWeight: 400, color: "#2C2C2C", margin: "0 0 0.5rem" }}>{T.ringana_title}</h2>
            <p style={{ color: "#6B6B6B", fontSize: "0.95rem", maxWidth: "480px", margin: "0 auto" }}>{T.ringana_sub}</p>
          </div>
          {ringana.length > 0 ? (
            <div className="store-products-grid">
              {ringana.map((p: any) => {
                const name = p.name_es || p.name_en || (typeof p.name === "object" ? p.name.es : p.name) || "";
                const img = p.images?.[0];
                const destUrl = p.ringana_url || RINGANA_URL;
                return (
                  <a key={p.id} href={destUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                    <div className="premium-card">
                      <div className="card-img-wrap">
                        {img ? <img src={img} alt={name} /> : <div style={{ fontSize: "3rem" }}>🌿</div>}
                        <span style={{ position: "absolute", top: "10px", right: "10px", background: "#EAF2E4", color: "#5C8044", fontSize: "0.6rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "4px" }}>RINGANA</span>
                      </div>
                      <div style={{ padding: "14px 16px 16px" }}>
                        <p style={{ fontSize: "13px", fontWeight: 700, color: "#2C2C2C", marginBottom: "6px", lineHeight: 1.3 }}>{name}</p>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "16px", fontWeight: 700, color: "#2C2C2C" }}>{p.price ? `€${p.price.toFixed(2)}` : ""}</span>
                          <span style={{ fontSize: "11px", color: "#7BA05B", fontWeight: 700 }}>{T.ringana_cta}</span>
                        </div>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "3rem 0" }}>
              <Link href={`/${locale}/ringana`} style={{
                display: "inline-flex", alignItems: "center", gap: "0.75rem",
                background: "#fff", border: "1.5px solid #EDE9E3",
                padding: "1.2rem 2.5rem", borderRadius: "12px",
                color: "#2C2C2C", fontWeight: 600, fontSize: "0.95rem",
                boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
              }}>
                <span style={{ fontSize: "1.5rem" }}>🌿</span>
                {isEs ? "Ver catálogo completo Ringana" : "View full Ringana catalogue"}
                <span style={{ color: "#7BA05B" }}>→</span>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* FEATURED FASHION */}
      {featured.filter((p: any) => p.supplier !== "ringana").length > 0 && (
        <section style={{ padding: "1rem 2.5rem 5rem", background: "#F5F1EC" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "2.5rem" }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 400, color: "#2C2C2C", margin: "0 0 0.4rem" }}>{T.featured_title}</h2>
                <div style={{ width: "40px", height: "2px", background: "#C4748A", borderRadius: "2px" }} />
              </div>
              <Link href={`/${locale}/tienda`} style={{ color: "#7BA05B", fontSize: "0.85rem", fontWeight: 700 }}>
                {isEs ? "Ver todo →" : "View all →"}
              </Link>
            </div>
            <div className="store-products-grid">
              {featured.filter((p: any) => p.supplier !== "ringana").slice(0, 8).map((product: any) => {
                const name = product.name_es || (typeof product.name === "object" ? product.name[locale] || product.name.es : product.name);
                const discount = product.compare_price ? Math.round((1 - product.price / product.compare_price) * 100) : null;
                return (
                  <Link key={product.id} href={`/${locale}/product/${product.slug}`} style={{ textDecoration: "none" }}>
                    <div className="premium-card">
                      <div className="card-img-wrap">
                        {product.images?.[0] ? <img src={product.images[0]} alt={name} /> : <div style={{ fontSize: "2.5rem" }}>👜</div>}
                        {product.badge && (
                          <span style={{ position: "absolute", top: "10px", left: "10px", background: "#C4748A", color: "#fff", fontSize: "0.62rem", fontWeight: 700, padding: "0.2rem 0.55rem", borderRadius: "5px" }}>{product.badge}</span>
                        )}
                      </div>
                      <div style={{ padding: "14px 16px 16px" }}>
                        <p style={{ fontSize: "13px", fontWeight: 700, color: "#2C2C2C", marginBottom: "4px", lineHeight: 1.3 }}>{name}</p>
                        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                          <div>
                            {product.compare_price && <span style={{ fontSize: "11px", color: "#9CA3AF", textDecoration: "line-through" }}>€{product.compare_price.toFixed(2)}</span>}
                            <div style={{ fontSize: "17px", fontWeight: 800, color: "#2C2C2C" }}>€{product.price.toFixed(2)}</div>
                          </div>
                          {discount && <span style={{ fontSize: "10px", fontWeight: 700, color: "#fff", background: "#C4748A", padding: "2px 6px", borderRadius: "4px" }}>-{discount}%</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* REVIEWS */}
      <section style={{ background: "#fff", padding: "5rem 2.5rem", borderTop: "1px solid #EDE9E3" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 400, color: "#2C2C2C", margin: "0 0 0.5rem" }}>{T.reviews_title}</h2>
          </div>
          <div className="reviews-grid-store">
            {REVIEWS.map((r, i) => (
              <div key={i} className="review-card-hover" style={{ background: "#FAF8F5", border: "1px solid #EDE9E3", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "10px", transition: "box-shadow 0.2s, transform 0.2s" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#D4A896", fontSize: "12px" }}>{"★".repeat(r.stars)}</span>
                  <span style={{ fontSize: "10px", color: "#7BA05B", fontWeight: 700, background: "#EAF2E4", padding: "2px 8px", borderRadius: "20px" }}>✓ {isEs ? "Verificado" : "Verified"}</span>
                </div>
                <p style={{ fontSize: "13px", color: "#444", lineHeight: 1.65, margin: 0, flexGrow: 1 }}>"{r.text}"</p>
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "10px", borderTop: "1px solid #EDE9E3" }}>
                  <span style={{ fontSize: "12px", color: "#6B6B6B" }}>{r.author} {r.flag}</span>
                  <span style={{ fontSize: "11px", color: "#C4748A", fontWeight: 600 }}>{r.product}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section style={{ background: "#2C2C2C", padding: "3.5rem 2.5rem", textAlign: "center" }}>
        <h3 style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(1.4rem,2.5vw,2rem)", fontWeight: 400, color: "#fff", margin: "0 0 0.75rem" }}>
          {isEs ? "Belleza consciente. Moda que dura." : "Conscious beauty. Fashion that lasts."}
        </h3>
        <div style={{ display: "flex", justifyContent: "center", gap: "2.5rem", flexWrap: "wrap" as const, marginTop: "2rem" }}>
          {[{ icon: "🌿", label: "100% Natural" }, { icon: "🚚", label: isEs ? "Envío EU" : "EU Shipping" }, { icon: "↩️", label: isEs ? "Devolución fácil" : "Easy returns" }, { icon: "🔒", label: isEs ? "Pago seguro" : "Secure pay" }].map((b) => (
            <div key={b.icon} style={{ textAlign: "center", color: "rgba(255,255,255,0.55)", fontSize: "12px" }}>
              <span style={{ fontSize: "26px", display: "block", marginBottom: "5px" }}>{b.icon}</span>
              {b.label}
            </div>
          ))}
        </div>
      </section>

      <Footer locale={locale} />
    </div>
  );
}
