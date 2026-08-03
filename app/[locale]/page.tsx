import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import MainNav from "@/components/nav/MainNav";
import Footer from "@/components/nav/Footer";
import HeroSlider from "@/components/HeroSlider";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isEs = params.locale === "es";
  const base = "https://beauty.aizualabs.com";
  return {
    title: isEs
      ? "Belleza y Accesorios de Mujer desde Europa"
      : "Women's Beauty & Accessories from Europe",  // +template "| AizuaBeauty" = 60c/58c (antes 77c doble marca, s192)
    description: isEs
      ? "Belleza y accesorios femeninos seleccionados: cuidado facial, capilar, bolsos y joyería. Envío rápido desde España y Europa."
      : "Curated women's beauty and accessories: facial care, hair care, bags and jewellery. Fast shipping from Spain and Europe.",
    keywords: isEs
      ? ["belleza mujer", "cuidado facial", "moda femenina", "accesorios mujer", "joyería mujer", "bolsos mujer", "AizuaBeauty"]
      : ["women's beauty", "facial care", "women's fashion", "women's accessories", "women's jewellery", "women's bags", "AizuaBeauty"],
    openGraph: {
      title: isEs ? "AizuaBeauty — Belleza y Accesorios de Mujer" : "AizuaBeauty — Women's Beauty & Accessories",
      description: isEs
        ? "Belleza y accesorios femeninos. Envío desde Europa."
        : "Women's beauty and accessories. Ships from Europe.",
      url: `${base}/${params.locale}`,
      type: "website",
      locale: isEs ? "es_ES" : "en_GB",
      images: [{ url: `${base}/og-home.jpg`, width: 1200, height: 630, alt: "AizuaBeauty" }],
    },
    twitter: { card: "summary_large_image", title: "AizuaBeauty", description: isEs ? "Belleza y accesorios de mujer desde Europa." : "Women's beauty & accessories from Europe." },
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
// s229: el Data Cache de Next PERSISTE entre deploys y servia el resultado viejo de
// Supabase (mismo bug que s224 en merchant-feed): tras desactivar 20 productos, esta
// pagina seguia pintandolos con Age:0 y X-Vercel-Cache:MISS. force-no-store evita que
// la lectura de catalogo/contenido se cachee; el ISR de pagina (revalidate) se mantiene.
export const fetchCache = "force-no-store";


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

const REVIEWS = [
  { stars: 5, text: "El neceser de felpa llegó en 6 días. Muchísimo más bonito en persona que en fotos.", author: "Marta L.", flag: "🇪🇸", product: "Neceser Beauty" },
  { stars: 5, text: "Lieferung in 5 Tagen, alles sehr sorgfältig verpackt. Das Täschchen ist wunderschön.", author: "Nina H.", flag: "🇩🇪", product: "Beauty bag" },
  { stars: 5, text: "Le charm chaton pour mon sac est adorable et de très bonne qualité. Je recommande!", author: "Claire M.", flag: "🇫🇷", product: "Bag Charm" },
  { stars: 4, text: "Los pendientes y complementos llegaron perfectamente embalados. Excelente relación calidad-precio.", author: "Ana R.", flag: "🇪🇸", product: "Joyería" },
  { stars: 5, text: "Il charm gattino è esattamente come nelle foto. Spedizione velocissima!", author: "Giulia F.", flag: "🇮🇹", product: "Bag Charm" },
  { stars: 5, text: "Great packaging and speedy delivery. The kawaii bag charm is absolutely gorgeous!", author: "Emma K.", flag: "🇮🇪", product: "Beauty bag" },
];

export default async function HomePage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  setRequestLocale(locale);
  const [accesorios, complementos] = await Promise.all([getAccessoriosProducts(), getComplementosProducts()]);
  const isEs = locale === "es";

  const T = {
    hero_tag:       isEs ? "Belleza · Accesorios de Mujer" : "Beauty · Women's Accessories",
    hero_title1:    isEs ? "Belleza" : "Beauty that",
    hero_title2:    isEs ? "sin artificios" : "without the noise",
    hero_sub:       isEs ? "Cuidado facial, capilar y accesorios femeninos seleccionados. Todo desde Europa." : "Curated facial care, hair care and women's accessories. All from Europe.",
    cta_shop:       isEs ? "Ver tienda" : "Shop now",
    cta_secondary:  isEs ? "Leer el blog" : "Read the blog",
    featured_title: isEs ? "Destacados" : "Featured",
    reviews_title:  isEs ? "Lo que dicen nuestras clientas" : "What our customers say",
    trust1: isEs ? "Envío desde Europa" : "Shipped from Europe",
    trust2: isEs ? "Pago seguro" : "Secure payment",
    trust3: isEs ? "Devolución fácil" : "Easy returns",
    trust4: isEs ? "Soporte rápido" : "Fast support",
    trust5:      isEs ? "Selección revisada" : "Reviewed selection",
    acc_title:   isEs ? "Moda & Accesorios" : "Fashion & Accessories",
    acc_sub:     isEs ? "Accesorios femeninos seleccionados. Envío rápido desde España." : "Curated women's accessories. Fast shipping from Spain.",
    comp_title:  isEs ? "Complementos & Bienestar" : "Supplements & Wellness",
    comp_sub:    isEs ? "Complementos para tu rutina diaria de bienestar." : "Supplements for your daily wellness routine.",
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
        cta_shop:      T.cta_shop,
        cta_secondary: T.cta_secondary,
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
                const name = (locale === "es" ? product.name_es : product.name_en) || (typeof product.name === "object" ? product.name[locale] || product.name.es : product.name) || product.name_es;
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

      {/* ── SECCIÓN 2: COMPLEMENTOS (oculta si no hay productos) ── */}
      {complementos.length > 0 && (
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
                const name = (locale === "es" ? product.name_es : product.name_en) || (typeof product.name === "object" ? product.name[locale] || product.name.es : product.name) || product.name_es;
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
              <p style={{ color: "#9CA3AF", fontSize: "0.9rem", marginBottom: "1.25rem" }}>{isEs ? "Próximamente complementos de bienestar" : "Wellness supplements coming soon"}</p>
              <Link href={`/${locale}/tienda`} style={{ color: "#7BA05B", fontWeight: 700, fontSize: "0.85rem" }}>
                {isEs ? "Ver tienda completa →" : "View full store →"}
              </Link>
            </div>
          )}
        </div>
      </section>
      )}

      {/* ── SECCIÓN 3: CATEGORÍAS ──
          Sustituye a la sección Ringana (desactivada s229). Enlaza a las colecciones
          que tienen producto activo — sin fetch extra, se derive del catálogo ya cargado. */}
      {(() => {
        const CATS = isEs
          ? [
              { slug: "skincare",   label: "Skincare",       emoji: "🧴", desc: "Cuidado facial y labial" },
              { slug: "capilar",    label: "Capilar",         emoji: "💫", desc: "Cepillos y accesorios" },
              { slug: "bolsos",     label: "Bolsos",          emoji: "👜", desc: "Bolsos y neceseres" },
              { slug: "accesorios", label: "Accesorios",      emoji: "✨", desc: "Joyería y organizadores" },
            ]
          : [
              { slug: "skincare",   label: "Skincare",    emoji: "🧴", desc: "Facial and lip care" },
              { slug: "capilar",    label: "Hair care",   emoji: "💫", desc: "Brushes and accessories" },
              { slug: "bolsos",     label: "Bags",        emoji: "👜", desc: "Bags and pouches" },
              { slug: "accesorios", label: "Accessories", emoji: "✨", desc: "Jewellery and extras" },
            ];
        return (
          <section style={{ padding: "5rem 2.5rem", background: "#FAF8F5" }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                <div style={{ display: "inline-block", background: "#EAF2E4", color: "#5C8044", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", padding: "0.3rem 1rem", borderRadius: "20px", marginBottom: "0.75rem", textTransform: "uppercase" as const }}>
                  {isEs ? "Colecciones" : "Collections"}
                </div>
                <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(1.8rem,3.5vw,2.8rem)", fontWeight: 400, color: "#2C2C2C", margin: "0 0 0.5rem" }}>
                  {isEs ? "Explora por categoría" : "Browse by category"}
                </h2>
                <p style={{ color: "#6B6B6B", fontSize: "0.95rem", maxWidth: "480px", margin: "0 auto" }}>
                  {isEs ? "Belleza y accesorios femeninos seleccionados uno a uno." : "Women's beauty and accessories, curated one by one."}
                </p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
                {CATS.map((c) => (
                  <Link key={c.slug} href={`/${locale}/coleccion/${c.slug}`} style={{ textDecoration: "none" }}>
                    <div style={{
                      background: "#fff", border: "1px solid #EDE9E3", borderRadius: "16px",
                      padding: "2rem 1.5rem", textAlign: "center",
                      boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                    }}>
                      <div style={{ fontSize: "2.2rem", marginBottom: "0.75rem" }}>{c.emoji}</div>
                      <h3 style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.25rem", fontWeight: 500, color: "#2C2C2C", margin: "0 0 0.35rem" }}>{c.label}</h3>
                      <p style={{ fontSize: "0.82rem", color: "#6B6B6B", margin: "0 0 0.9rem" }}>{c.desc}</p>
                      <span style={{ fontSize: "0.78rem", color: "#7BA05B", fontWeight: 700 }}>{isEs ? "Ver →" : "View →"}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

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
                <p style={{ fontSize: "13px", color: "#444", lineHeight: 1.65, margin: 0, flexGrow: 1 }}>&quot;{r.text}&quot;</p>
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
            <span>{isEs ? "Belleza · Accesorios de mujer" : "Beauty · Women's accessories"}</span>
          </div>
          <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 400, letterSpacing: "-0.01em", lineHeight: 1.15, margin: "0 0 1.5rem", color: "#2C2C2C" }}>
            {isEs ? <>¿Qué es <em style={{ color: "#C4748A", fontStyle: "italic" }}>AizuaBeauty</em>?</> : <>What is <em style={{ color: "#C4748A", fontStyle: "italic" }}>AizuaBeauty</em>?</>}
          </h2>
          <div style={{ fontSize: "15.5px", lineHeight: 1.8, color: "#444" }}>
            {isEs ? (
              <>
                <p style={{ margin: "0 0 1rem" }}>
                  <strong style={{ color: "#2C2C2C" }}>AizuaBeauty</strong> es la tienda online de <strong style={{ color: "#2C2C2C" }}>cosmética natural y accesorios femeninos</strong> del ecosistema <strong style={{ color: "#2C2C2C" }}>AizuaLabs</strong>. Opera bajo el dominio <strong style={{ color: "#2C2C2C" }}>beauty.aizualabs.com</strong> con un catálogo propio: cuidado facial y capilar, joyería y complementos de belleza seleccionados, todo vendido directamente con envío desde Europa y pago seguro vía Stripe.
                </p>
                <p style={{ margin: "0 0 1rem" }}>
                  El catálogo crece cada semana: cuidado facial y capilar, joyería de acero, clips y accesorios para el cabello, bolsos y neceseres, herramientas de skincare. Enviamos a toda la Unión Europea con seguimiento, y todo pedido pasa por nuestro propio checkout — sin intermediarios ni redirecciones a terceros.
                </p>
                <p style={{ margin: "0" }}>
                  La operación se diferencia del retail tradicional en tres puntos: (1) <strong style={{ color: "#2C2C2C" }}>todos los productos pasan validación previa</strong> antes de publicarse en tienda (solo entra lo que cumple criterios de calidad, margen y coherencia con la marca); (2) la atención al cliente se cubre vía <strong style={{ color: "#2C2C2C" }}>agente IA</strong> del ecosistema AizuaLabs en horario 24/7, con escalación humana en pedidos complejos; (3) las fichas describen composición y uso real, sin reclamos terapéuticos. Pago seguro vía Stripe.
                </p>
              </>
            ) : (
              <>
                <p style={{ margin: "0 0 1rem" }}>
                  <strong style={{ color: "#2C2C2C" }}>AizuaBeauty</strong> is the <strong style={{ color: "#2C2C2C" }}>natural cosmetics and women&apos;s accessories</strong> online store of the <strong style={{ color: "#2C2C2C" }}>AizuaLabs</strong> ecosystem. It operates under <strong style={{ color: "#2C2C2C" }}>beauty.aizualabs.com</strong> with its own catalogue: facial and hair care, curated jewellery and beauty accessories — all sold directly, shipped from Europe, with secure Stripe checkout.
                </p>
                <p style={{ margin: "0 0 1rem" }}>
                  The catalogue grows weekly: facial and hair care, steel jewellery, hair clips and accessories, bags and pouches, skincare tools. Ships across the European Union with tracking, and every order goes through our own checkout — no intermediaries, no redirects to third parties.
                </p>
                <p style={{ margin: "0" }}>
                  The operation differs from traditional retail in three points: (1) <strong style={{ color: "#2C2C2C" }}>all products undergo prior validation</strong> before being published (only items meeting quality, margin and brand criteria are included); (2) customer support is provided via in-house <strong style={{ color: "#2C2C2C" }}>AI agent</strong> from the AizuaLabs ecosystem 24/7, with human escalation for complex orders; (3) product pages describe real composition and use, with no therapeutic claims. Secure Stripe payments.
                </p>
              </>
            )}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "2rem" }}>
            {[
              isEs ? "✓ Catálogo curado" : "✓ Curated catalogue",
              isEs ? "✓ Catálogo en crecimiento" : "✓ Growing catalogue",
              isEs ? "✓ 5 países EU" : "✓ 5 EU countries",
              isEs ? "✓ Envío con seguimiento" : "✓ Tracked shipping",
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
          "description": "Tienda online de belleza y moda femenina del ecosistema AizuaLabs. Catálogo curado de cuidado facial y capilar, joyería, bolsos y accesorios femeninos, con checkout propio. Envía a 5 países EU.",
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
            "Cuidado facial y labial",
            "Cuidado capilar y accesorios de peinado",
            "Moda femenina sin tallaje",
            "Joyería y accesorios femeninos",
            "Bolsos y neceseres",
            "Organizadores de maquillaje",
            "E-commerce de belleza en la UE"
          ],
          "sameAs": [
            "https://aizualabs.com",
            "https://www.instagram.com/aizuabeauty",
            "https://www.tiktok.com/@aizuabeauty"
          ]
        }) }} />
      </section>

      {/* ── FAQ GEO SECTION — FAQPage schema para ChatGPT/Perplexity/Google AI Overviews ── */}
      {(() => {
        const faqs = isEs ? [
          { q: "¿Qué vende AizuaBeauty?", a: "AizuaBeauty vende cosmética natural y accesorios femeninos: cuidado facial y capilar de formulación limpia, joyería, bolsos, neceseres y herramientas de skincare. Todo el catálogo se compra directamente en la web con checkout propio y pago seguro vía Stripe." },
          { q: "¿Dónde envía AizuaBeauty?", a: "AizuaBeauty envía a toda la Unión Europea: España, Francia, Italia, Alemania, Portugal, Irlanda y más países EU. El envío es gratuito en todos los pedidos." },
          { q: "¿Dónde veo la composición de un producto de AizuaBeauty?", a: "En la ficha de cada producto. Publicamos la información de composición y uso que facilita el fabricante, sin añadir reclamos por nuestra cuenta. Si te falta algún dato concreto antes de comprar, escríbenos a info@aizualabs.com y lo consultamos." },
          { q: "¿Cuánto tarda el envío de AizuaBeauty?", a: "El plazo de preparación es de 1 a 3 días hábiles. El tránsito es de 3 a 7 días hábiles adicionales, según el destino dentro de la Unión Europea." },
          { q: "¿Puedo devolver un producto de AizuaBeauty?", a: "Sí. Tienes 14 días naturales desde la recepción para devolver un artículo sin usar y en su embalaje original. Si el producto llega defectuoso o equivocado, escríbenos en los 15 días siguientes a la recepción y lo resolvemos caso por caso." },
        ] : [
          { q: "What does AizuaBeauty sell?", a: "AizuaBeauty sells natural cosmetics and women's accessories: clean-formulation facial and hair care, jewellery, bags, pouches and skincare tools. The entire catalogue is bought directly on the site through our own checkout with secure Stripe payments." },
          { q: "Where does AizuaBeauty ship?", a: "AizuaBeauty ships across the European Union: Spain, France, Italy, Germany, Portugal, Ireland and more EU countries. Shipping is free on all orders." },
          { q: "Where can I see a product's composition on AizuaBeauty?", a: "On each product page. We publish the composition and usage information provided by the manufacturer, without adding claims of our own. If a specific detail is missing before you buy, email us at info@aizualabs.com and we will check it." },
          { q: "How long does AizuaBeauty shipping take?", a: "Preparation time is 1–3 business days. Transit takes 3–7 additional business days, depending on the destination within the European Union." },
          { q: "Can I return an AizuaBeauty product?", a: "Yes. You have 14 calendar days from receipt to return an unused item in its original packaging. If a product arrives defective or incorrect, contact us within 15 days of receipt and we resolve it case by case." },
        ];
        const faqSchema = {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map(({ q, a }) => ({
            "@type": "Question",
            name: q,
            acceptedAnswer: { "@type": "Answer", text: a },
          })),
        };
        return (
          <section id="preguntas-frecuentes" style={{ background: "#fdf8f5", padding: "3.5rem 1.5rem" }}>
            <div style={{ maxWidth: 760, margin: "0 auto" }}>
              <h2 style={{ fontSize: "clamp(1.2rem,2.5vw,1.6rem)", fontWeight: 700, marginBottom: "2rem", textAlign: "center", color: "#2C2C2C", fontFamily: "var(--font-cormorant, serif)" }}>
                {isEs ? "Preguntas frecuentes" : "Frequently asked questions"}
              </h2>
              {faqs.map(({ q, a }) => (
                <details key={q} style={{ borderBottom: "1px solid #e8ddd5", padding: "1rem 0" }}>
                  <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: "1rem", color: "#2C2C2C", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {q} <span style={{ fontSize: "1.2rem", color: "#C9748F", flexShrink: 0, marginLeft: "1rem" }}>＋</span>
                  </summary>
                  <p style={{ margin: "0.75rem 0 0", color: "#5a4a45", lineHeight: 1.7, fontSize: "0.95rem" }}>{a}</p>
                </details>
              ))}
            </div>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
          </section>
        );
      })()}

      {/* FOOTER CTA */}
      <section style={{ background: "#2C2C2C", padding: "3.5rem 2.5rem", textAlign: "center" }}>
        <h3 style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(1.4rem,2.5vw,2rem)", fontWeight: 400, color: "#fff", margin: "0 0 0.75rem" }}>
          {isEs ? "Belleza consciente. Moda que dura." : "Conscious beauty. Fashion that lasts."}
        </h3>
        <div style={{ display: "flex", justifyContent: "center", gap: "2.5rem", flexWrap: "wrap" as const, marginTop: "2rem" }}>
          {[{ icon: "🌿", label: isEs ? "Selección curada" : "Curated picks" }, { icon: "🚚", label: isEs ? "Envío EU" : "EU Shipping" }, { icon: "↩️", label: isEs ? "Devolución fácil" : "Easy returns" }, { icon: "🔒", label: isEs ? "Pago seguro" : "Secure pay" }].map((b) => (
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
