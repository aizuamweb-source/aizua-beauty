import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import MainNav from "@/components/nav/MainNav";
import Footer from "@/components/nav/Footer";
import HeroSlider from "@/components/HeroSlider";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isEs = params.locale === "es";
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://beauty.aizualabs.com";
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

export const revalidate = 3600; // ISR: cached page, low TTFB for crawlers

const RINGANA_URL = process.env.RINGANA_PARTNER_URL || "https://miguelsaez.ringana.com";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function getAccessoriosProducts() {
  try {
    const { data } = await getSupabase()
      .from("products")
      .select("id, slug, name, name_es, name_en, price, compare_price, images, badge, rating, review_count")
      .eq("active", true)
      .eq("store", "beauty")
      .neq("supplier", "ringana")
      .neq("category", "complementos")
      .order("sort_order", { ascending: true })
      .limit(8);
    return data ?? [];
  } catch { return []; }
}

async function getComplementosProducts() {
  try {
    const { data } = await getSupabase()
      .from("products")
      .select("id, slug, name, name_es, name_en, price, compare_price, images, badge, rating, review_count")
      .eq("active", true)
      .eq("store", "beauty")
      .neq("supplier", "ringana")
      .eq("category", "complementos")
      .order("sort_order", { ascending: true })
      .limit(8);
    return data ?? [];
  } catch { return []; }
}

async function getRinganaProducts() {
  try {
    const { data } = await getSupabase()
      .from("products")
      .select("id, slug, name, name_es, name_en, price, images, aliexpress_url, badge")
      .eq("active", true)
      .eq("supplier", "ringana")
      .limit(20);
    return data ?? [];
  } catch { return []; }
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
  const [accesorios, complementos, ringana] = await Promise.all([getAccessoriosProducts(), getComplementosProducts(), getRinganaProducts()]);
  const isEs = locale === "es";

  const T = {
    hero_tag:       isEs ? "Cosmética Natural · Moda Femenina" : "Natural Beauty · Women's Fashion",
    hero_title1:    isEs ? "Belleza" : "Beauty that",
    hero_title2:    isEs ? "en estado puro" : "feels natural",
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
    trust5:      isEs ? "Solo marcas naturales" : "Only natural brands",
    acc_title:   isEs ? "Moda & Accesorios" : "Fashion & Accessories",
    acc_sub:     isEs ? "Accesorios femeninos seleccionados. Envío rápido desde España." : "Curated women's accessories. Fast shipping from Spain.",
    comp_title:  isEs ? "Complementos & Bienestar" : "Supplements & Wellness",
    comp_sub:    isEs ? "Complementos naturales para tu rutina diaria de bienestar." : "Natural supplements for your daily wellness routine.",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FAF8F5", fontFamily: "var(--font-lato, sans-serif)" }}>
      <MainNav locale={locale} />

      {/* HERO SLIDER */}
      <HeroSlider locale={locale} T={{
        hero_tag:    T.hero_tag,
        hero_title1: T.hero_title1,
        hero_title2: T.hero_title2,
        hero_sub:    T.hero_sub,
        cta_shop:    T.cta_shop,
        cta_ringana: T.cta_ringana,
      }} />

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

      {/* ── SECCIÓN 1: ACCESORIOS ── */}
      <section style={{ padding: "5rem 2.5rem", background: "#FAF8F5" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "2.5rem" }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 400, color: "#2C2C2C", margin: "0 0 0.3rem" }}>{T.acc_title}</h2>
              <p style={{ color: "#6B6B6B", fontSize: "0.88rem", margin: 0 }}>{T.acc_sub}</p>
            </div>
            <Link href={`/${locale}/tienda`} style={{ color: "#7BA05B", fontSize: "0.85rem", fontWeight: 700, flexShrink: 0, marginLeft: "1rem" }}>
              {isEs ? "Ver todo →" : "View all →"}
            </Link>
          </div>
          {accesorios.length > 0 ? (
            <div className="store-products-grid">
              {accesorios.map((product: any) => {
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
          ) : (
            <div style={{ textAlign: "center", padding: "3rem 0", border: "1.5px dashed #EDE9E3", borderRadius: "16px", background: "#fff" }}>
              <p style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>👜</p>
              <p style={{ color: "#9CA3AF", fontSize: "0.9rem", marginBottom: "1.25rem" }}>{isEs ? "Próximamente nuevos accesorios" : "New accessories coming soon"}</p>
              <Link href={`/${locale}/tienda`} style={{ color: "#7BA05B", fontWeight: 700, fontSize: "0.85rem" }}>
                {isEs ? "Ver tienda completa →" : "View full store →"}
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── SECCIÓN 2: COMPLEMENTOS ── */}
      <section style={{ padding: "4rem 2.5rem 5rem", background: "#F5F1EC" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "2.5rem" }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 400, color: "#2C2C2C", margin: "0 0 0.3rem" }}>{T.comp_title}</h2>
              <p style={{ color: "#6B6B6B", fontSize: "0.88rem", margin: 0 }}>{T.comp_sub}</p>
            </div>
            <Link href={`/${locale}/tienda`} style={{ color: "#7BA05B", fontSize: "0.85rem", fontWeight: 700, flexShrink: 0, marginLeft: "1rem" }}>
              {isEs ? "Ver todo →" : "View all →"}
            </Link>
          </div>
          {complementos.length > 0 ? (
            <div className="store-products-grid">
              {complementos.map((product: any) => {
                const name = product.name_es || (typeof product.name === "object" ? product.name[locale] || product.name.es : product.name);
                const discount = product.compare_price ? Math.round((1 - product.price / product.compare_price) * 100) : null;
                return (
                  <Link key={product.id} href={`/${locale}/product/${product.slug}`} style={{ textDecoration: "none" }}>
                    <div className="premium-card">
                      <div className="card-img-wrap">
                        {product.images?.[0] ? <img src={product.images[0]} alt={name} /> : <div style={{ fontSize: "2.5rem" }}>💊</div>}
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
          ) : (
            <div style={{ textAlign: "center", padding: "3rem 0", border: "1.5px dashed #D4C4BC", borderRadius: "16px", background: "#FAF8F5" }}>
              <p style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🌿</p>
              <p style={{ color: "#9CA3AF", fontSize: "0.9rem", marginBottom: "1.25rem" }}>{isEs ? "Próximamente complementos naturales" : "Natural supplements coming soon"}</p>
              <Link href={`/${locale}/tienda`} style={{ color: "#7BA05B", fontWeight: 700, fontSize: "0.85rem" }}>
                {isEs ? "Ver tienda completa →" : "View full store →"}
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── SECCIÓN 3: COSMÉTICA NATURAL · RINGANA ── */}
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
                const destUrl = p.aliexpress_url || RINGANA_URL;
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

      {/* ── ABOUT AIZUABEAUTY (Wikipedia-style + Organization schema · GEO) ── */}
      <section id="que-es-aizuabeauty" style={{ background: "linear-gradient(180deg, #FDF6F0 0%, #F5EDE3 100%)", padding: "5rem 2.5rem", color: "#2C2C2C", position: "relative" }}>
        <div style={{ maxWidth: "780px", margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "7px 14px", border: "1px solid rgba(196,116,138,0.3)", background: "rgba(196,116,138,0.08)", borderRadius: "999px", fontFamily: "var(--font-lato)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#C4748A", marginBottom: "1.5rem" }}>
            <span>🌿</span>
            <span>{isEs ? "Cosmética natural · Moda femenina" : "Natural skincare · Women's fashion"}</span>
          </div>
          <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 400, letterSpacing: "-0.01em", lineHeight: 1.15, margin: "0 0 1.5rem", color: "#2C2C2C" }}>
            {isEs ? <>¿Qué es <em style={{ color: "#C4748A", fontStyle: "italic" }}>AizuaBeauty</em>?</> : <>What is <em style={{ color: "#C4748A", fontStyle: "italic" }}>AizuaBeauty</em>?</>}
          </h2>
          <div style={{ fontSize: "15.5px", lineHeight: 1.8, color: "#444" }}>
            {isEs ? (
              <>
                <p style={{ margin: "0 0 1rem" }}>
                  <strong style={{ color: "#2C2C2C" }}>AizuaBeauty</strong> es la tienda online de <strong style={{ color: "#2C2C2C" }}>cosmética natural y bienestar femenino</strong> del ecosistema <strong style={{ color: "#2C2C2C" }}>AizuaLabs</strong>. Opera bajo el dominio <strong style={{ color: "#2C2C2C" }}>beauty.aizualabs.com</strong> y combina dos líneas claramente diferenciadas: cosmética certificada del partner austríaco <strong style={{ color: "#2C2C2C" }}>Ringana</strong> (sin conservantes, fresca con fecha de caducidad real) y una selección curada de moda femenina y complementos de bienestar de mercado europeo.
                </p>
                <p style={{ margin: "0 0 1rem" }}>
                  El catálogo se compone de <strong style={{ color: "#2C2C2C" }}>20 productos Ringana</strong> (sérums, cremas, suplementos, deporte) y <strong style={{ color: "#2C2C2C" }}>14 productos curados no-Ringana</strong> (pañuelos, complementos, joyería sin tallaje, artículos de cabello). Envía a <strong style={{ color: "#2C2C2C" }}>5 países de la Unión Europea</strong>: España, Francia, Italia, Alemania e Irlanda. La cosmética Ringana se sirve directamente desde el partner; el resto, desde almacén UE con devolución a 14 días.
                </p>
                <p style={{ margin: "0" }}>
                  La operación se diferencia del retail tradicional en tres puntos: (1) <strong style={{ color: "#2C2C2C" }}>todos los productos pasan validación previa</strong> antes de publicarse en tienda (no se incluye nada que la fundadora no esté dispuesta a usar); (2) la atención al cliente se cubre vía <strong style={{ color: "#2C2C2C" }}>agente IA</strong> propio del ecosistema AizuaLabs en horario 24/7, con escalación humana en pedidos complejos; (3) la pestaña Ringana enlaza directamente al partner oficial — sin intermediación de precio. Pago seguro vía Stripe.
                </p>
              </>
            ) : (
              <>
                <p style={{ margin: "0 0 1rem" }}>
                  <strong style={{ color: "#2C2C2C" }}>AizuaBeauty</strong> is the <strong style={{ color: "#2C2C2C" }}>natural skincare and women's wellness</strong> online store of the <strong style={{ color: "#2C2C2C" }}>AizuaLabs</strong> ecosystem. It operates under <strong style={{ color: "#2C2C2C" }}>beauty.aizualabs.com</strong> and combines two clearly differentiated lines: certified cosmetics from the Austrian partner <strong style={{ color: "#2C2C2C" }}>Ringana</strong> (preservative-free, fresh with real expiry date) and a curated selection of women's fashion and wellness accessories from European market.
                </p>
                <p style={{ margin: "0 0 1rem" }}>
                  The catalog includes <strong style={{ color: "#2C2C2C" }}>20 Ringana products</strong> (serums, creams, supplements, sport) and <strong style={{ color: "#2C2C2C" }}>14 curated non-Ringana items</strong> (scarves, accessories, size-free jewelry, hair care). Ships to <strong style={{ color: "#2C2C2C" }}>5 European Union countries</strong>: Spain, France, Italy, Germany and Ireland. Ringana cosmetics ship directly from the partner; the rest, from EU warehouse with 14-day returns.
                </p>
                <p style={{ margin: "0" }}>
                  The operation differs from traditional retail in three points: (1) <strong style={{ color: "#2C2C2C" }}>all products undergo prior validation</strong> before being published (nothing is added that the founder wouldn't use); (2) customer support is provided via in-house <strong style={{ color: "#2C2C2C" }}>AI agent</strong> from the AizuaLabs ecosystem 24/7, with human escalation for complex orders; (3) the Ringana tab links directly to the official partner — no price intermediation. Secure Stripe payments.
                </p>
              </>
            )}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "2rem" }}>
            {[
              isEs ? "✓ 20 productos Ringana" : "✓ 20 Ringana products",
              isEs ? "✓ 14 productos curados" : "✓ 14 curated items",
              isEs ? "✓ 5 países EU" : "✓ 5 EU countries",
              isEs ? "✓ 100% natural certificada" : "✓ 100% certified natural",
              isEs ? "✓ Atención IA 24/7" : "✓ AI support 24/7",
            ].map((c, i) => (
              <span key={i} style={{ padding: "8px 14px", border: "1px solid rgba(196,116,138,0.25)", background: "rgba(255,255,255,0.6)", borderRadius: "999px", fontSize: "12.5px", fontWeight: 500, color: "#2C2C2C", fontFamily: "var(--font-lato)" }}>{c}</span>
            ))}
          </div>
        </div>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "OnlineStore",
          "@id": "https://beauty.aizualabs.com/#store",
          "name": "AizuaBeauty",
          "alternateName": "Aizua Beauty · AizuaLabs Beauty",
          "url": "https://beauty.aizualabs.com",
          "description": "Tienda online de cosmética natural y moda femenina del ecosistema AizuaLabs. Combina 20 productos Ringana (cosmética austríaca certificada, sin conservantes) con 14 productos curados de moda y bienestar. Envía a 5 países EU.",
          "parentOrganization": { "@type": "Organization", "name": "AizuaLabs", "url": "https://aizualabs.com" },
          "areaServed": [
            { "@type": "Country", "name": "Spain" },
            { "@type": "Country", "name": "France" },
            { "@type": "Country", "name": "Italy" },
            { "@type": "Country", "name": "Germany" },
            { "@type": "Country", "name": "Ireland" }
          ],
          "currenciesAccepted": "EUR",
          "paymentAccepted": "Credit Card, Stripe",
          "availableLanguage": ["es", "en", "fr", "de", "pt", "it"],
          "knowsAbout": [
            "Cosmética natural",
            "Skincare consciente",
            "Productos Ringana",
            "Moda femenina sin tallaje",
            "Bienestar femenino",
            "Sérums y cremas naturales",
            "Suplementos nutricionales",
            "Cosmética sin conservantes"
          ],
          "sameAs": [
            "https://aizualabs.com",
            "https://www.instagram.com/aizuabeauty",
            "https://www.tiktok.com/@aizuabeauty"
          ]
        }) }} />
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
