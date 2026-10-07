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
      ? "Belleza y Accesorios de Mujer"
      : "Women's Beauty & Accessories",  // +template "| AizuaBeauty". s357: «desde Europa» decía desde dónde se envía, y eso no consta
    description: isEs
      ? "Belleza y accesorios femeninos seleccionados: cuidado facial, capilar, bolsos y joyería. Envío gratis a 6 países de la UE, EE. UU. y Australia."
      : "Curated women's beauty and accessories: facial care, hair care, bags and jewellery. Free shipping to 6 EU countries, the US and Australia.",
    keywords: isEs
      ? ["belleza mujer", "cuidado facial", "moda femenina", "accesorios mujer", "joyería mujer", "bolsos mujer", "AizuaBeauty"]
      : ["women's beauty", "facial care", "women's fashion", "women's accessories", "women's jewellery", "women's bags", "AizuaBeauty"],
    openGraph: {
      title: isEs ? "AizuaBeauty — Belleza y Accesorios de Mujer" : "AizuaBeauty — Women's Beauty & Accessories",
      description: isEs
        ? "Belleza y accesorios femeninos. Envío gratis a 6 países de la UE, EE. UU. y Australia."
        : "Women's beauty and accessories. Free shipping to 6 EU countries, the US and Australia.",
      url: `${base}/${params.locale}`,
      type: "website",
      locale: isEs ? "es_ES" : "en_GB",
      images: [{ url: `${base}/og-home.jpg`, width: 1200, height: 630, alt: "AizuaBeauty" }],
    },
    twitter: { card: "summary_large_image", title: "AizuaBeauty", description: isEs ? "Belleza y accesorios de mujer con envío gratis a 6 países de la UE, EE. UU. y Australia." : "Women's beauty & accessories with free shipping to 6 EU countries, the US and Australia." },
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

// s280 — VENTANA A 6 h (estaba en 1 h). La ficha de producto ya esta en 24 h
// desde el 04/09, asi que un listado a 1 h no daba mas frescura real que la
// pagina a la que enlaza: solo pagaba mas renders. 6 h sigue siendo cuatro
// veces mas fresco que la ficha.
export const revalidate = 21600;
// s277: AQUI HABIA `export const fetchCache = "force-no-store"`, puesto en s229
// para que no se sirviera catalogo viejo desde el Data Cache. El comentario que
// lo acompanaba decia "el ISR de pagina (revalidate) se mantiene". NO se mantenia:
// force-no-store hace DINAMICA la ruta entera, asi que el `revalidate` de arriba
// quedaba muerto y esta pagina se renderizaba en el servidor EN CADA PETICION.
// Medido en produccion el 01/09: beauty devolvia `Cache-Control: private,
// no-cache, no-store` y `X-Vercel-Cache: MISS` en /es, /es/tienda y /es/blog,
// mientras tech.aizualabs.com —mismo codigo, sin esta linea— devolvia HIT/STALE.
// Con la cuota de Vercel al 98,9 % eso no es un detalle: cada visita y cada
// rastreador costaban una invocacion.
// Quitarla NO devuelve el bug de s229: sin fetchCache, los fetch de este segmento
// heredan el `revalidate` de arriba, o sea que el dato caduca igual. Si algun dia
// hace falta frescura inmediata tras un cambio, la herramienta es revalidatePath()
// bajo demanda, no apagar la cache de la pagina entera.


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

/* s357 (06/10/2026): aquí había REVIEWS, 6 testimonios escritos a mano con nombres,
   banderas y «Verificado» sin ningún pedido detrás. Son reseñas falsas (art. 27.8 de la
   Ley de Competencia Desleal) y se retiraron por decisión de Miguel. */

export default async function HomePage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  setRequestLocale(locale);
  const [accesorios, complementos] = await Promise.all([getAccessoriosProducts(), getComplementosProducts()]);
  const isEs = locale === "es";

  const T = {
    hero_tag:       isEs ? "Belleza · Accesorios de Mujer" : "Beauty · Women's Accessories",
    hero_title1:    isEs ? "Belleza" : "Beauty that",
    hero_title2:    isEs ? "sin artificios" : "without the noise",
    hero_sub:       isEs ? "Cuidado facial, capilar y accesorios femeninos seleccionados. Envío gratis a 8 países." : "Curated facial care, hair care and women's accessories. Free shipping to 8 countries.",
    cta_shop:       isEs ? "Ver tienda" : "Shop now",
    cta_secondary:  isEs ? "Leer el blog" : "Read the blog",
    featured_title: isEs ? "Destacados" : "Featured",
    reviews_title:  isEs ? "Compra con tranquilidad" : "Shop with peace of mind",
    trust1: isEs ? "Envío gratis a 8 países" : "Free shipping to 8 countries",
    trust2: isEs ? "Pago seguro" : "Secure payment",
    trust3: isEs ? "Devolución fácil" : "Easy returns",
    trust4: isEs ? "Soporte rápido" : "Fast support",
    trust5:      isEs ? "Selección revisada" : "Reviewed selection",
    acc_title:   isEs ? "Moda & Accesorios" : "Fashion & Accessories",
    acc_sub:     isEs ? "Accesorios femeninos seleccionados. Envío gratis a 8 países." : "Curated women's accessories. Free shipping to 8 countries.",
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

      {/* COMPRA CON TRANQUILIDAD (s357, 06/10/2026): aquí iban los 6 testimonios inventados.
          Se sustituyen por lo que cualquiera puede comprobar en los términos de la tienda. */}
      <section style={{ background: "#fff", padding: "5rem 2.5rem", borderTop: "1px solid #EDE9E3" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 400, color: "#2C2C2C", margin: "0 0 0.5rem" }}>{T.reviews_title}</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            {[
              { icon: "🚚", t: isEs ? "Envío gratis a 8 países" : "Free shipping to 8 countries",
                d: isEs ? "España, Portugal, Francia, Italia, Alemania, Irlanda, Estados Unidos y Australia, con seguimiento. Entrega en 7-20 días hábiles en España y 10-25 en el resto." : "Spain, Portugal, France, Italy, Germany, Ireland, the United States and Australia, with tracking. Delivery in 7–20 business days in Spain and 10–25 elsewhere." },
              { icon: "↩️", t: isEs ? "14 días para devolver" : "14 days to return",
                d: isEs ? "Desde que lo recibes, sin usar y en su embalaje original." : "From delivery, unused and in its original packaging." },
              { icon: "🔒", t: isEs ? "Pago seguro con Stripe" : "Secure payment with Stripe",
                d: isEs ? "No guardamos los datos de tu tarjeta." : "We never store your card details." },
              { icon: "💬", t: isEs ? "Te respondemos por chat" : "We answer by chat",
                d: isEs ? "A cualquier hora, y con una persona cuando hace falta." : "At any hour, with a person when it is needed." },
            ].map((b) => (
              <div key={b.t} style={{ background: "#FAF8F5", border: "1px solid #EDE9E3", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "24px" }} aria-hidden="true">{b.icon}</span>
                <strong style={{ fontSize: "15px", color: "#2C2C2C" }}>{b.t}</strong>
                <p style={{ fontSize: "13px", color: "#444", lineHeight: 1.6, margin: 0 }}>{b.d}</p>
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
                  <strong style={{ color: "#2C2C2C" }}>AizuaBeauty</strong> es la tienda online de <strong style={{ color: "#2C2C2C" }}>cuidado personal y accesorios femeninos</strong> del ecosistema <strong style={{ color: "#2C2C2C" }}>AizuaLabs</strong>. Opera bajo el dominio <strong style={{ color: "#2C2C2C" }}>beauty.aizualabs.com</strong> con un catálogo propio: cuidado facial y capilar, joyería y complementos de belleza seleccionados, todo vendido directamente, con envío gratis a cinco países de la UE y pago seguro vía Stripe.
                </p>
                <p style={{ margin: "0 0 1rem" }}>
                  El catálogo crece cada semana: cuidado facial y capilar, joyería de acero, clips y accesorios para el cabello, bolsos y neceseres, herramientas de skincare. Enviamos a España, Portugal, Francia, Italia, Alemania, Irlanda, Estados Unidos y Australia con seguimiento, y todo pedido pasa por nuestro propio checkout — sin intermediarios ni redirecciones a terceros.
                </p>
                <p style={{ margin: "0" }}>
                  La operación se diferencia del retail tradicional en tres puntos: (1) <strong style={{ color: "#2C2C2C" }}>todos los productos pasan validación previa</strong> antes de publicarse en tienda (solo entra lo que cumple criterios de calidad, margen y coherencia con la marca); (2) la atención al cliente se cubre vía <strong style={{ color: "#2C2C2C" }}>agente IA</strong> del ecosistema AizuaLabs en horario 24/7, con escalación humana en pedidos complejos; (3) las fichas describen composición y uso real, sin reclamos terapéuticos. Pago seguro vía Stripe.
                </p>
              </>
            ) : (
              <>
                <p style={{ margin: "0 0 1rem" }}>
                  <strong style={{ color: "#2C2C2C" }}>AizuaBeauty</strong> is the <strong style={{ color: "#2C2C2C" }}>personal care and women&apos;s accessories</strong> online store of the <strong style={{ color: "#2C2C2C" }}>AizuaLabs</strong> ecosystem. It operates under <strong style={{ color: "#2C2C2C" }}>beauty.aizualabs.com</strong> with its own catalogue: facial and hair care, curated jewellery and beauty accessories — all sold directly, with free shipping to five EU countries and secure Stripe checkout.
                </p>
                <p style={{ margin: "0 0 1rem" }}>
                  The catalogue grows weekly: facial and hair care, steel jewellery, hair clips and accessories, bags and pouches, skincare tools. Ships to Spain, Portugal, France, Italy, Germany, Ireland, the United States and Australia with tracking, and every order goes through our own checkout — no intermediaries, no redirects to third parties.
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
              isEs ? "✓ 8 países" : "✓ 8 countries",
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
          "description": "Tienda online de belleza y moda femenina del ecosistema AizuaLabs. Catálogo curado de cuidado facial y capilar, joyería, bolsos y accesorios femeninos, con checkout propio. Envía a 8 países (6 de la UE, Estados Unidos y Australia).",
          "parentOrganization": { "@type": "Organization", "name": "AizuaLabs", "url": "https://aizualabs.com" },
          "areaServed": [
            { "@type": "Country", "name": "Spain" },
            { "@type": "Country", "name": "France" },
            { "@type": "Country", "name": "Italy" },
            { "@type": "Country", "name": "Germany" },
            { "@type": "Country", "name": "Ireland" },
            { "@type": "Country", "name": "Portugal" },
            { "@type": "Country", "name": "United States" },
            { "@type": "Country", "name": "Australia" }
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
          { q: "¿Qué vende AizuaBeauty?", a: "AizuaBeauty vende cuidado personal y accesorios femeninos: cuidado facial y capilar, joyería, bolsos, neceseres y herramientas de skincare. Todo el catálogo se compra directamente en la web con checkout propio y pago seguro vía Stripe." },
          { q: "¿Dónde envía AizuaBeauty?", a: "AizuaBeauty envía a España, Portugal, Francia, Italia, Alemania, Irlanda, Estados Unidos y Australia. El envío es gratuito en todos los pedidos. Por ahora no enviamos al Reino Unido." },
          { q: "¿Dónde veo la composición de un producto de AizuaBeauty?", a: "En la ficha de cada producto. Publicamos la información de composición y uso que facilita el fabricante, sin añadir reclamos por nuestra cuenta. Si te falta algún dato concreto antes de comprar, escríbenos a info@aizualabs.com y lo consultamos." },
          { q: "¿Cuánto tarda el envío de AizuaBeauty?", a: "La preparación es de 1 a 3 días hábiles. El plazo total de entrega es de 7 a 20 días hábiles en España y de 10 a 25 en el resto (Portugal, Francia, Italia, Alemania, Irlanda, Estados Unidos y Australia)." },
          { q: "¿Hay aranceles o tasas de aduana?", a: "En los pedidos a Estados Unidos y Australia puede haber aranceles, impuestos de importación o tasas de aduana del país de destino. No están incluidos en el precio, corren a cargo del comprador y el transportista puede cobrarlos al entregar el paquete. En Estados Unidos ya no existe la exención para envíos de poco valor." },
          { q: "¿Puedo devolver un producto de AizuaBeauty?", a: "Sí. Tienes 14 días naturales desde la recepción para devolver un artículo sin usar y en su embalaje original; los gastos de envío de la devolución corren a cargo del comprador. Si el producto llega defectuoso o equivocado, escríbenos en los 15 días siguientes a la recepción y lo resolvemos caso por caso." },
        ] : [
          { q: "What does AizuaBeauty sell?", a: "AizuaBeauty sells personal care and women's accessories: facial and hair care, jewellery, bags, pouches and skincare tools. The entire catalogue is bought directly on the site through our own checkout with secure Stripe payments." },
          { q: "Where does AizuaBeauty ship?", a: "AizuaBeauty ships to Spain, Portugal, France, Italy, Germany, Ireland, the United States and Australia. Shipping is free on all orders. We do not currently ship to the United Kingdom." },
          { q: "Where can I see a product's composition on AizuaBeauty?", a: "On each product page. We publish the composition and usage information provided by the manufacturer, without adding claims of our own. If a specific detail is missing before you buy, email us at info@aizualabs.com and we will check it." },
          { q: "How long does AizuaBeauty shipping take?", a: "Preparation takes 1–3 business days. Total delivery time is 7–20 business days in Spain and 10–25 elsewhere (Portugal, France, Italy, Germany, Ireland, the United States and Australia)." },
          { q: "Are there customs duties or fees?", a: "Orders to the United States and Australia may be subject to customs duties, import taxes or customs fees in the destination country. They are not included in the price, are paid by the buyer, and the carrier may collect them on delivery. In the United States, the exemption for low-value shipments no longer applies." },
          { q: "Can I return an AizuaBeauty product?", a: "Yes. You have 14 calendar days from receipt to return an unused item in its original packaging; return shipping is paid by the buyer. If a product arrives defective or incorrect, contact us within 15 days of receipt and we resolve it case by case." },
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
