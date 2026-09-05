import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import Link from "next/link";
import MainNav from "@/components/nav/MainNav";
import Footer from "@/components/nav/Footer";

// s280 — force-static. Esta pagina es texto fijo: no lee supabase, no hace
// fetch, no usa cookies() ni headers() ni searchParams (verificado). Sin
// declarar nada se renderizaba en el servidor en cada visita para devolver
// siempre lo mismo. Mismo criterio que las legales, ya aplicado en la s277.
export const dynamic = "force-static";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const isEs = params.locale === "es";
  const base = "https://beauty.aizualabs.com";
  const url = `${base}/${params.locale}/sobre-nosotros`;
  return {
    title: isEs
      ? "Sobre Nosotros — AizuaBeauty | Belleza & Accesorios desde Europa"
      : "About Us — AizuaBeauty | Beauty & Accessories from Europe",
    description: isEs
      ? "Somos AizuaBeauty, tienda de belleza y accesorios femeninos del ecosistema AizuaLabs. Seleccionamos producto uno a uno y enviamos desde España a toda la UE. Málaga."
      : "We are AizuaBeauty, the women's beauty and accessories store of the AizuaLabs ecosystem. We hand-pick every product and ship from Spain across the EU. Málaga.",
    keywords: isEs
      ? ["sobre aizuabeauty", "tienda belleza málaga", "accesorios mujer españa", "moda femenina", "belleza online europa"]
      : ["about aizuabeauty", "beauty store spain", "women's accessories EU", "women's fashion", "beauty online europe"],
    alternates: {
      canonical: `${base}/es/sobre-nosotros`,
      languages: {
        es:`${base}/es/sobre-nosotros`, en:`${base}/en/sobre-nosotros`,
        fr:`${base}/fr/sobre-nosotros`, de:`${base}/de/sobre-nosotros`,
        pt:`${base}/pt/sobre-nosotros`, it:`${base}/it/sobre-nosotros`,
        "x-default":`${base}/es/sobre-nosotros`,
      },
    },
    openGraph: {
      title: isEs ? "Sobre Nosotros — AizuaBeauty" : "About Us — AizuaBeauty",
      description: isEs
        ? "Belleza y accesorios femeninos seleccionados. Envío desde España y Europa."
        : "Curated women's beauty and accessories. Shipping from Spain and Europe.",
      url,
      type: "website",
    },
  };
}

const jsonLdOrg = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AizuaBeauty",
  url: "https://beauty.aizualabs.com",
  // 17/08/2026 — /logo.png era el logo de AizuaTec. Ver layout.tsx.
  logo: "https://beauty.aizualabs.com/logo-beauty.png",
  description:
    "Tienda online de belleza y accesorios femeninos: cuidado facial y capilar, joyería, bolsos y organizadores. Selección revisada producto a producto. Envío desde España y la UE.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Av. San Isidro 2",
    addressLocality: "Málaga",
    addressRegion: "Andalucía",
    postalCode: "29018",
    addressCountry: "ES",
  },
  geo: { "@type": "GeoCoordinates", latitude: 36.7213, longitude: -4.4214 },
  areaServed: [
    { "@type": "Country", name: "Spain" },
    { "@type": "Place", name: "European Union" },
  ],
  sameAs: [
    "https://aizualabs.com",
    "https://www.instagram.com/aizuabeauty",
    "https://www.tiktok.com/@aizuabeauty",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+34683405410",
    contactType: "customer service",
    availableLanguage: ["Spanish", "English"],
  },
  parentOrganization: {
    "@type": "Organization",
    name: "AizuaLabs",
    url: "https://aizualabs.com",
  },
};

const jsonLdAbout = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "Sobre Nosotros — AizuaBeauty",
  url: "https://beauty.aizualabs.com/es/sobre-nosotros",
  description: "Historia, misión y valores de AizuaBeauty.",
};

export default async function SobreNosotrosPage({
  params,
}: {
  params: { locale: string };
}) {
  setRequestLocale(params.locale);
  const isEs = params.locale === "es";

  const t = {
    eyebrow: isEs ? "NUESTRA HISTORIA" : "OUR STORY",
    heroTitle: isEs ? "Belleza sin humo de marketing" : "Beauty without the marketing smoke",
    heroSub: isEs
      ? "Producto revisado uno a uno y descrito tal cual es. Sin promesas que no podamos respaldar."
      : "Every product reviewed one by one and described as it is. No promises we can't back up.",
    missionTitle: isEs ? "Por qué existimos" : "Why we exist",
    missionText: isEs
      ? "La industria de la belleza está llena de promesas vacías y de fichas de producto que no dicen nada. Creamos AizuaBeauty para hacerlo al revés: seleccionamos cada referencia a mano, publicamos la información de composición y uso que da el fabricante, y no añadimos reclamos por nuestra cuenta. Si un dato no lo podemos respaldar, no lo escribimos."
      : "The beauty industry is full of empty promises and product pages that say nothing. We built AizuaBeauty the other way round: we hand-pick every reference, publish the composition and usage information the manufacturer provides, and add no claims of our own. If we can't back a fact up, we don't write it.",
    valuesTitle: isEs ? "Cómo trabajamos" : "How we work",
    values: isEs
      ? [
          { icon: "🔍", t: "Seleccionado a mano", d: "Cada referencia pasa una revisión previa de calidad, precio y coherencia con la marca antes de publicarse en tienda." },
          { icon: "📋", t: "Fichas honestas", d: "Publicamos la composición y el uso que indica el fabricante. Sin reclamos añadidos ni afirmaciones que no podamos respaldar." },
          { icon: "💬", t: "Atención 24/7", d: "Agente IA del ecosistema AizuaLabs para dudas de producto y pedidos, con escalación a persona en casos complejos." },
          { icon: "🇪🇺", t: "Envío desde Europa", d: "Envíos desde España y centros de distribución europeos. Tiempos reales, sin sorpresas aduaneras." },
        ]
      : [
          { icon: "🔍", t: "Hand-picked", d: "Every reference goes through a prior review of quality, price and brand fit before it is published in the store." },
          { icon: "📋", t: "Honest product pages", d: "We publish the composition and usage the manufacturer states. No added claims, nothing we can't back up." },
          { icon: "💬", t: "24/7 support", d: "An AI agent from the AizuaLabs ecosystem for product and order questions, escalating to a human for complex cases." },
          { icon: "🇪🇺", t: "Shipping from Europe", d: "Shipments from Spain and European distribution centers. Real timelines, no customs surprises." },
        ],
    ecosystemTitle: isEs ? "Parte de AizuaLabs" : "Part of AizuaLabs",
    ecosystemText: isEs
      ? "AizuaBeauty es la rama de belleza y moda del ecosistema AizuaLabs, nacido en Málaga. También operamos Aizüa Tech (gadgets tecnológicos), AizuaLabs Academy (cursos de IA) y AizuaLabs Consulting (consultoría de inteligencia artificial para empresas)."
      : "AizuaBeauty is the beauty and fashion branch of the AizuaLabs ecosystem, born in Málaga. We also operate Aizüa Tech (tech gadgets), AizuaLabs Academy (AI courses), and AizuaLabs Consulting (AI consulting for businesses).",
    ctaTitle: isEs ? "¿Tienes alguna pregunta?" : "Have a question?",
    ctaSub: isEs
      ? "Escríbenos sobre productos, composición, pedidos o envíos. Respondemos en menos de 24h."
      : "Write to us about products, composition, orders or shipping. We reply within 24h.",
    ctaBtn: isEs ? "Contactar →" : "Contact us →",
    shopBtn: isEs ? "Ver productos →" : "Browse products →",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdAbout) }} />
      <MainNav locale={params.locale} />

      <main style={{ paddingTop: "80px" }}>
        {/* HERO */}
        <section
          style={{
            background: "linear-gradient(135deg,#1a1a2e,#16213e)",
            padding: "80px 20px 70px",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: "780px", margin: "0 auto" }}>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "0.72rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#a78bfa",
                marginBottom: "16px",
              }}
            >
              {t.eyebrow}
            </div>
            <h1
              style={{
                fontSize: "clamp(2rem,5vw,3rem)",
                fontWeight: 800,
                color: "#fff",
                lineHeight: 1.15,
                marginBottom: "20px",
              }}
            >
              {t.heroTitle}
            </h1>
            <p
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: "1.2rem",
                maxWidth: "560px",
                margin: "0 auto",
                lineHeight: 1.6,
              }}
            >
              {t.heroSub}
            </p>
          </div>
        </section>

        {/* MISIÓN */}
        <section style={{ padding: "80px 20px" }}>
          <div style={{ maxWidth: "760px", margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, marginBottom: "20px", color: "#111827" }}>
              {t.missionTitle}
            </h2>
            <p style={{ fontSize: "1.05rem", color: "#4b5563", lineHeight: 1.75 }}>{t.missionText}</p>
          </div>
        </section>

        {/* VALORES */}
        <section style={{ background: "#f8f9fb", padding: "80px 20px" }}>
          <div style={{ maxWidth: "960px", margin: "0 auto" }}>
            <h2
              style={{
                fontSize: "clamp(1.4rem,3vw,2rem)",
                fontWeight: 800,
                marginBottom: "48px",
                textAlign: "center",
                color: "#111827",
              }}
            >
              {t.valuesTitle}
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                gap: "20px",
              }}
            >
              {t.values.map(({ icon, t: title, d }) => (
                <div
                  key={title}
                  style={{
                    background: "#fff",
                    borderRadius: "16px",
                    padding: "28px",
                    border: "1px solid rgba(0,0,0,0.06)",
                  }}
                >
                  <div style={{ fontSize: "2rem", marginBottom: "12px" }}>{icon}</div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "8px", color: "#111827" }}>
                    {title}
                  </h3>
                  <p style={{ fontSize: "0.88rem", color: "#6b7280", lineHeight: 1.6, margin: 0 }}>{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ECOSISTEMA */}
        <section style={{ padding: "80px 20px" }}>
          <div style={{ maxWidth: "760px", margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 800, marginBottom: "20px", color: "#111827" }}>
              {t.ecosystemTitle}
            </h2>
            <p style={{ fontSize: "1.05rem", color: "#4b5563", lineHeight: 1.75, marginBottom: "32px" }}>
              {t.ecosystemText}
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {[
                { label: "Aizüa Tech", href: "https://tech.aizualabs.com" },
                { label: "AizuaLabs Academy", href: "https://aiacademy.aizualabs.com" },
                { label: "AizuaLabs Consulting", href: "https://aizualabs.com" },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "100px",
                    border: "1px solid rgba(167,139,250,0.35)",
                    color: "#7c3aed",
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  {label} ↗
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section
          style={{
            background: "linear-gradient(135deg,#1a1a2e,#16213e)",
            padding: "80px 20px",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: "560px", margin: "0 auto" }}>
            <h2
              style={{
                fontSize: "clamp(1.5rem,3vw,2rem)",
                fontWeight: 800,
                color: "#fff",
                marginBottom: "16px",
              }}
            >
              {t.ctaTitle}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.6, marginBottom: "36px" }}>{t.ctaSub}</p>
            <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
              <a
                href="mailto:info@aizualabs.com"
                style={{
                  background: "#7c3aed",
                  color: "#fff",
                  padding: "14px 28px",
                  borderRadius: "100px",
                  fontWeight: 700,
                  textDecoration: "none",
                  fontSize: "0.95rem",
                }}
              >
                {t.ctaBtn}
              </a>
              <Link
                href={`/${params.locale}/tienda`}
                style={{
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "#fff",
                  padding: "14px 28px",
                  borderRadius: "100px",
                  fontWeight: 600,
                  textDecoration: "none",
                  fontSize: "0.95rem",
                }}
              >
                {t.shopBtn}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer locale={params.locale} />
    </>
  );
}
