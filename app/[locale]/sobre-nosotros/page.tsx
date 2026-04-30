import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import Link from "next/link";
import MainNav from "@/components/nav/MainNav";
import Footer from "@/components/nav/Footer";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const isEs = params.locale === "es";
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://beauty.aizualabs.com";
  const url = `${base}/${params.locale}/sobre-nosotros`;
  return {
    title: isEs
      ? "Sobre Nosotros — AizuaBeauty | Cosmética Natural & Moda desde Europa"
      : "About Us — AizuaBeauty | Natural Beauty & Fashion from Europe",
    description: isEs
      ? "Somos AizuaBeauty, tu tienda de cosmética natural y moda consciente. Partner oficial Ringana en España. Productos sin tóxicos, con ingredientes naturales certificados. Parte del ecosistema AizuaLabs, Málaga."
      : "We are AizuaBeauty, your natural cosmetics and conscious fashion store. Official Ringana Partner in Spain. Toxin-free products with certified natural ingredients. Part of the AizuaLabs ecosystem, Málaga.",
    keywords: isEs
      ? ["sobre aizuabeauty", "cosmética natural málaga", "ringana partner españa", "moda consciente", "belleza natural europa"]
      : ["about aizuabeauty", "natural cosmetics spain", "ringana partner", "conscious fashion", "natural beauty europe"],
    alternates: {
      canonical: url,
      languages: {
        es: `${base}/es/sobre-nosotros`,
        en: `${base}/en/sobre-nosotros`,
        fr: `${base}/fr/sobre-nosotros`,
        de: `${base}/de/sobre-nosotros`,
      },
    },
    openGraph: {
      title: isEs ? "Sobre Nosotros — AizuaBeauty" : "About Us — AizuaBeauty",
      description: isEs
        ? "Cosmética natural sin tóxicos. Partner Ringana. Envío desde España y Europa."
        : "Toxin-free natural cosmetics. Ringana Partner. Shipping from Spain and Europe.",
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
  logo: "https://beauty.aizualabs.com/logo.png",
  description:
    "Tienda de cosmética natural y moda consciente. Partner oficial Ringana en España. Sin parabenos, sin siliconas, ingredientes de origen natural certificados. Envío desde España y la UE.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Málaga",
    addressRegion: "Andalucía",
    addressCountry: "ES",
  },
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
    heroTitle: isEs ? "Belleza sin compromiso con tu salud" : "Beauty without compromising your health",
    heroSub: isEs
      ? "Cosmética que funciona, sin los ingredientes que no quieres en tu piel."
      : "Cosmetics that work, without the ingredients you don't want on your skin.",
    missionTitle: isEs ? "Por qué existimos" : "Why we exist",
    missionText: isEs
      ? "La industria cosmética está llena de promesas vacías y listas de ingredientes imposibles de leer. Creamos AizuaBeauty para ofrecer una alternativa real: productos testados, fórmulas transparentes y, cuando encontramos algo verdaderamente bueno, como la línea Ringana, lo ponemos en el centro. Somos Partner oficial Ringana en España, lo que significa que accedes a sus productos frescos y sin conservantes directamente a través de nosotros."
      : "The cosmetics industry is full of empty promises and ingredient lists that are impossible to read. We created AizuaBeauty to offer a real alternative: tested products, transparent formulas, and when we find something truly good — like the Ringana line — we put it front and center. We are an official Ringana Partner in Spain, which means you can access their fresh, preservative-free products directly through us.",
    ringanaTitle: isEs ? "Por qué Ringana" : "Why Ringana",
    ringanaText: isEs
      ? "Ringana produce sus cosméticos frescos, por encargo, sin conservantes sintéticos. Cada producto tiene fecha de caducidad real porque está hecho con ingredientes vivos. No es marketing — es el único modelo que garantiza que lo que te pones en la piel no tiene meses de almacén encima."
      : "Ringana produces its cosmetics fresh, on demand, without synthetic preservatives. Each product has a real expiration date because it's made with living ingredients. It's not marketing — it's the only model that guarantees what you put on your skin hasn't been sitting in a warehouse for months.",
    valuesTitle: isEs ? "Cómo trabajamos" : "How we work",
    values: isEs
      ? [
          { icon: "🌿", t: "Natural de verdad", d: "Solo productos con ingredientes de origen natural verificado. Nada de 'natural' como reclamo de marketing sin respaldo." },
          { icon: "🧪", t: "Sin tóxicos", d: "Sin parabenos, sin siliconas, sin PEGs, sin fragancias sintéticas. Listas de ingredientes legibles por humanos." },
          { icon: "📦", t: "Fresco y bajo pedido", d: "Con Ringana, cada pedido se produce y envía en días. Sin meses de almacén. Caducidad real, no estética." },
          { icon: "🇪🇺", t: "Envío desde Europa", d: "Envíos desde España y centros de distribución europeos. Tiempos reales, sin sorpresas aduaneras." },
        ]
      : [
          { icon: "🌿", t: "Truly natural", d: "Only products with verified natural-origin ingredients. No 'natural' as a marketing claim without backing." },
          { icon: "🧪", t: "Toxin-free", d: "No parabens, no silicones, no PEGs, no synthetic fragrances. Human-readable ingredient lists." },
          { icon: "📦", t: "Fresh on demand", d: "With Ringana, each order is produced and shipped within days. No months in a warehouse. Real expiration dates, not cosmetic ones." },
          { icon: "🇪🇺", t: "Shipping from Europe", d: "Shipments from Spain and European distribution centers. Real timelines, no customs surprises." },
        ],
    ecosystemTitle: isEs ? "Parte de AizuaLabs" : "Part of AizuaLabs",
    ecosystemText: isEs
      ? "AizuaBeauty es la rama de belleza y moda del ecosistema AizuaLabs, nacido en Málaga. También operamos Aizüa Tech (gadgets tecnológicos), AizuaLabs Academy (cursos de IA) y AizuaLabs Consulting (consultoría de inteligencia artificial para empresas)."
      : "AizuaBeauty is the beauty and fashion branch of the AizuaLabs ecosystem, born in Málaga. We also operate Aizüa Tech (tech gadgets), AizuaLabs Academy (AI courses), and AizuaLabs Consulting (AI consulting for businesses).",
    ctaTitle: isEs ? "¿Tienes alguna pregunta?" : "Have a question?",
    ctaSub: isEs
      ? "Escríbenos sobre productos, pedidos o sobre cómo convertirte en Partner Ringana."
      : "Write to us about products, orders, or how to become a Ringana Partner.",
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

        {/* RINGANA */}
        <section style={{ background: "#f0fdf4", padding: "60px 20px" }}>
          <div style={{ maxWidth: "760px", margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <span style={{ fontSize: "1.5rem" }}>🌱</span>
              <h2 style={{ fontSize: "clamp(1.3rem,3vw,1.8rem)", fontWeight: 800, color: "#166534" }}>
                {t.ringanaTitle}
              </h2>
            </div>
            <p style={{ fontSize: "1.05rem", color: "#374151", lineHeight: 1.75 }}>{t.ringanaText}</p>
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
