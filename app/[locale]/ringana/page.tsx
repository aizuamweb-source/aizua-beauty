import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import MainNav from "@/components/nav/MainNav";
import Footer from "@/components/nav/Footer";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isEs = params.locale === "es";
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://aizuabeauty.vercel.app";
  return {
    title: isEs
      ? "Ringana — Cosmética Natural 100% | AizuaBeauty Partner Oficial"
      : "Ringana — 100% Natural Cosmetics | AizuaBeauty Official Partner",
    description: isEs
      ? "Catálogo de cosmética Ringana: skincare FRESH, suplementos ADDS, corporal BODY, capilar HAIR y perfumes naturales. Sin conservantes artificiales. Partner oficial en España."
      : "Ringana cosmetics catalog: FRESH skincare, ADDS supplements, BODY care, HAIR care and natural perfumes. No artificial preservatives. Official partner in Spain.",
    keywords: isEs
      ? ["Ringana España", "cosmética natural Ringana", "FRESH Ringana", "ADDS colágeno", "comprar Ringana", "partner Ringana", "skincare sin conservantes"]
      : ["Ringana Spain", "natural Ringana cosmetics", "FRESH Ringana", "ADDS collagen", "buy Ringana", "Ringana partner", "preservative-free skincare"],
    openGraph: {
      title: isEs ? "Ringana — Cosmética 100% Natural | AizuaBeauty" : "Ringana — 100% Natural Cosmetics | AizuaBeauty",
      description: isEs
        ? "Partner oficial Ringana. Cosmética fresca sin conservantes artificiales, enviada desde Austria."
        : "Official Ringana partner. Fresh cosmetics with no artificial preservatives, shipped from Austria.",
      url: `${base}/${params.locale}/ringana`,
      type: "website",
    },
    alternates: {
      canonical: `${base}/${params.locale}/ringana`,
      languages: { "es": `${base}/es/ringana`, "en": `${base}/en/ringana` },
    },
  };
}

export const dynamic = "force-dynamic";

const RINGANA_BASE = process.env.RINGANA_PARTNER_URL || "https://miguelsaez.ringana.com";

// ─── Catálogo Ringana — descripciones neutras, sin claims de eficacia ─────────
// NOTA: Descripciones e imágenes oficiales pendientes de autorización escrita por Ringana.
// Hasta recibirla, se usan descripciones propias neutras sin reproducir contenido de ringana.com.
const RINGANA_CATALOG = [
  // ── FRESH Skincare ──────────────────────────────────────────────────────
  {
    id: "fresh-moisturiser",
    line: "FRESH",
    category: "skincare",
    name_es: "FRESH Crema Hidratante",
    name_en: "FRESH Moisturiser",
    desc_es: "Crema facial de la línea FRESH. Formulada con ingredientes de origen natural, sin conservantes artificiales. Enviada directamente desde Austria.",
    desc_en: "Facial cream from the FRESH line. Formulated with natural-origin ingredients, no artificial preservatives. Shipped directly from Austria.",
    price: 39.90,
    badge: null,
    emoji: "💧",
    tags_es: ["Sin conservantes", "Vegano", "Natural"],
    tags_en: ["No preservatives", "Vegan", "Natural"],
  },
  {
    id: "fresh-serum",
    line: "FRESH",
    category: "skincare",
    name_es: "FRESH Sérum",
    name_en: "FRESH Serum",
    desc_es: "Sérum concentrado de la línea FRESH. Base vegetal, sin parabenos ni sintéticos artificiales.",
    desc_en: "Concentrated serum from the FRESH line. Plant-based, free of parabens and artificial synthetics.",
    price: 54.90,
    badge: null,
    emoji: "✨",
    tags_es: ["Sin parabenos", "Vegano", "Concentrado"],
    tags_en: ["Paraben-free", "Vegan", "Concentrated"],
  },
  {
    id: "fresh-eye-cream",
    line: "FRESH",
    category: "skincare",
    name_es: "FRESH Contorno de Ojos",
    name_en: "FRESH Eye Cream",
    desc_es: "Crema para la zona del contorno de ojos, de la línea FRESH. Sin perfumes artificiales. Fórmula de origen natural.",
    desc_en: "Eye contour cream from the FRESH line. No artificial fragrances. Natural-origin formula.",
    price: 44.90,
    badge: null,
    emoji: "👁️",
    tags_es: ["Sin perfume artificial", "Vegano", "Natural"],
    tags_en: ["No artificial fragrance", "Vegan", "Natural"],
  },
  {
    id: "fresh-cleanser",
    line: "FRESH",
    category: "skincare",
    name_es: "FRESH Limpiador Facial",
    name_en: "FRESH Facial Cleanser",
    desc_es: "Limpiador facial de la línea FRESH. Sin sulfatos, formulado con activos vegetales. Sin conservantes artificiales.",
    desc_en: "Facial cleanser from the FRESH line. Sulfate-free, formulated with plant actives. No artificial preservatives.",
    price: 29.90,
    badge: null,
    emoji: "🫧",
    tags_es: ["Sin sulfatos", "Vegano", "Natural"],
    tags_en: ["Sulfate-free", "Vegan", "Natural"],
  },
  {
    id: "fresh-toner",
    line: "FRESH",
    category: "skincare",
    name_es: "FRESH Tónico Facial",
    name_en: "FRESH Facial Toner",
    desc_es: "Tónico de la línea FRESH con extractos botánicos. Sin alcohol sintético. Formulación natural, sin conservantes artificiales.",
    desc_en: "Toner from the FRESH line with botanical extracts. No synthetic alcohol. Natural formulation, no artificial preservatives.",
    price: 27.90,
    badge: null,
    emoji: "🌹",
    tags_es: ["Extractos botánicos", "Vegano", "Sin alcohol sint."],
    tags_en: ["Botanical extracts", "Vegan", "No synth. alcohol"],
  },
  {
    id: "fresh-mask",
    line: "FRESH",
    category: "skincare",
    name_es: "FRESH Mascarilla Facial",
    name_en: "FRESH Face Mask",
    desc_es: "Mascarilla facial de la línea FRESH. Formulada con arcilla y extractos vegetales. Sin conservantes artificiales.",
    desc_en: "Face mask from the FRESH line. Formulated with clay and plant extracts. No artificial preservatives.",
    price: 34.90,
    badge: null,
    emoji: "🌿",
    tags_es: ["Arcilla natural", "Vegano", "Natural"],
    tags_en: ["Natural clay", "Vegan", "Natural"],
  },
  // ── ADDS Supplements ────────────────────────────────────────────────────
  {
    id: "adds-collagen",
    line: "ADDS",
    category: "suplementos",
    name_es: "ADDS Colágeno Marino",
    name_en: "ADDS Marine Collagen",
    desc_es: "Complemento alimenticio de la línea ADDS con colágeno marino hidrolizado. Formato en polvo. Sin aditivos artificiales.",
    desc_en: "Food supplement from the ADDS line with hydrolyzed marine collagen. Powder format. No artificial additives.",
    price: 49.90,
    badge: null,
    emoji: "🐟",
    tags_es: ["Colágeno marino", "Sin aditivos", "Natural"],
    tags_en: ["Marine collagen", "No additives", "Natural"],
  },
  {
    id: "adds-glow",
    line: "ADDS",
    category: "suplementos",
    name_es: "ADDS Glow",
    name_en: "ADDS Glow",
    desc_es: "Complemento alimenticio de la línea ADDS. Contiene biotina, vitamina C y zinc. Formato en cápsulas. Vegano.",
    desc_en: "Food supplement from the ADDS line. Contains biotin, vitamin C and zinc. Capsule format. Vegan.",
    price: 38.90,
    badge: null,
    emoji: "💊",
    tags_es: ["Biotina + Vit.C + Zinc", "Vegano", "Natural"],
    tags_en: ["Biotin + Vit.C + Zinc", "Vegan", "Natural"],
  },
  {
    id: "adds-omega",
    line: "ADDS",
    category: "suplementos",
    name_es: "ADDS Omega 3 Vegetal",
    name_en: "ADDS Plant Omega 3",
    desc_es: "Complemento alimenticio de la línea ADDS. Omega-3 de origen vegetal (algas). Contiene DHA y EPA. Vegano.",
    desc_en: "Food supplement from the ADDS line. Plant-based omega-3 (algae). Contains DHA and EPA. Vegan.",
    price: 42.90,
    badge: null,
    emoji: "🌱",
    tags_es: ["Origen vegetal", "DHA + EPA", "Vegano"],
    tags_en: ["Plant-based", "DHA + EPA", "Vegan"],
  },
  {
    id: "adds-vitamin-d",
    line: "ADDS",
    category: "suplementos",
    name_es: "ADDS Vitamina D3 + K2",
    name_en: "ADDS Vitamin D3 + K2",
    desc_es: "Complemento alimenticio de la línea ADDS con vitamina D3 y K2 en base de aceite de oliva virgen. Vegano.",
    desc_en: "Food supplement from the ADDS line with vitamin D3 and K2 in a virgin olive oil base. Vegan.",
    price: 32.90,
    badge: null,
    emoji: "☀️",
    tags_es: ["D3 + K2", "Aceite oliva", "Vegano"],
    tags_en: ["D3 + K2", "Olive oil base", "Vegan"],
  },
  // ── BODY Care ───────────────────────────────────────────────────────────
  {
    id: "body-lotion",
    line: "BODY",
    category: "corporal",
    name_es: "BODY Loción Corporal",
    name_en: "BODY Lotion",
    desc_es: "Loción corporal de la línea BODY. Formulada con manteca de karité y aceite de argán. Sin conservantes artificiales.",
    desc_en: "Body lotion from the BODY line. Formulated with shea butter and argan oil. No artificial preservatives.",
    price: 31.90,
    badge: null,
    emoji: "🧴",
    tags_es: ["Karité + Argán", "Vegano", "Natural"],
    tags_en: ["Shea + Argan", "Vegan", "Natural"],
  },
  {
    id: "body-scrub",
    line: "BODY",
    category: "corporal",
    name_es: "BODY Exfoliante Corporal",
    name_en: "BODY Scrub",
    desc_es: "Exfoliante corporal de la línea BODY. Formulado con azúcar natural y aceites vegetales. Sin conservantes artificiales.",
    desc_en: "Body scrub from the BODY line. Formulated with natural sugar and vegetable oils. No artificial preservatives.",
    price: 28.90,
    badge: null,
    emoji: "🍬",
    tags_es: ["Azúcar natural", "Vegano", "Natural"],
    tags_en: ["Natural sugar", "Vegan", "Natural"],
  },
  {
    id: "body-oil",
    line: "BODY",
    category: "corporal",
    name_es: "BODY Aceite Seco",
    name_en: "BODY Dry Oil",
    desc_es: "Aceite seco corporal de la línea BODY. Mezcla de aceites botánicos. Sin conservantes artificiales. Apto durante el embarazo (consulta previa con tu médico).",
    desc_en: "Dry body oil from the BODY line. Blend of botanical oils. No artificial preservatives. Suitable during pregnancy (consult your doctor first).",
    price: 36.90,
    badge: null,
    emoji: "🌺",
    tags_es: ["Aceites botánicos", "Vegano", "Natural"],
    tags_en: ["Botanical oils", "Vegan", "Natural"],
  },
  // ── HAIR Care ───────────────────────────────────────────────────────────
  {
    id: "hair-shampoo",
    line: "HAIR",
    category: "capilar",
    name_es: "HAIR Champú Natural",
    name_en: "HAIR Natural Shampoo",
    desc_es: "Champú de la línea HAIR. Sin sulfatos ni siliconas. Formulado con activos vegetales. Sin conservantes artificiales.",
    desc_en: "Shampoo from the HAIR line. No sulfates or silicones. Formulated with plant actives. No artificial preservatives.",
    price: 26.90,
    badge: null,
    emoji: "💆",
    tags_es: ["Sin sulfatos", "Sin siliconas", "Natural"],
    tags_en: ["Sulfate-free", "Silicone-free", "Natural"],
  },
  {
    id: "hair-mask",
    line: "HAIR",
    category: "capilar",
    name_es: "HAIR Mascarilla Capilar",
    name_en: "HAIR Repair Mask",
    desc_es: "Mascarilla capilar de la línea HAIR. Formulada con keratina vegetal y aceite de argán. Sin conservantes artificiales.",
    desc_en: "Hair mask from the HAIR line. Formulated with plant keratin and argan oil. No artificial preservatives.",
    price: 33.90,
    badge: null,
    emoji: "⭐",
    tags_es: ["Keratina vegetal", "Argán", "Natural"],
    tags_en: ["Plant keratin", "Argan oil", "Natural"],
  },
  {
    id: "hair-oil",
    line: "HAIR",
    category: "capilar",
    name_es: "HAIR Aceite Capilar",
    name_en: "HAIR Shine Oil",
    desc_es: "Aceite capilar de la línea HAIR. Sin siliconas. Formulado con aceites vegetales. Sin conservantes artificiales.",
    desc_en: "Hair oil from the HAIR line. Silicone-free. Formulated with vegetable oils. No artificial preservatives.",
    price: 29.90,
    badge: null,
    emoji: "💫",
    tags_es: ["Sin siliconas", "Vegano", "Natural"],
    tags_en: ["Silicone-free", "Vegan", "Natural"],
  },
  // ── PERFUME ─────────────────────────────────────────────────────────────
  {
    id: "perfume-nuda",
    line: "PERFUME",
    category: "perfumes",
    name_es: "PERFUME Nuda",
    name_en: "PERFUME Nuda",
    desc_es: "Fragancia de la línea PERFUME de Ringana. Notas florales. Sin alcohol sintético. Formulación 100% natural.",
    desc_en: "Fragrance from the Ringana PERFUME line. Floral notes. No synthetic alcohol. 100% natural formulation.",
    price: 79.90,
    badge: null,
    emoji: "🌸",
    tags_es: ["Sin alcohol sint.", "Vegano", "100% Natural"],
    tags_en: ["No synth. alcohol", "Vegan", "100% Natural"],
  },
  {
    id: "perfume-alm",
    line: "PERFUME",
    category: "perfumes",
    name_es: "PERFUME Alm",
    name_en: "PERFUME Alm",
    desc_es: "Fragancia de la línea PERFUME de Ringana. Notas amaderadas. Sin alcohol sintético. Formulación 100% natural.",
    desc_en: "Fragrance from the Ringana PERFUME line. Woody notes. No synthetic alcohol. 100% natural formulation.",
    price: 82.90,
    badge: null,
    emoji: "🪵",
    tags_es: ["Sin alcohol sint.", "Vegano", "Unisex"],
    tags_en: ["No synth. alcohol", "Vegan", "Unisex"],
  },
  // ── SUN ─────────────────────────────────────────────────────────────────
  {
    id: "sun-cream-spf30",
    line: "SUN",
    category: "skincare",
    name_es: "SUN Crema Solar SPF30",
    name_en: "SUN Cream SPF30",
    desc_es: "Protector solar de la línea SUN de Ringana. Filtros minerales de origen natural. Water-resistant. Sin conservantes artificiales.",
    desc_en: "Sun cream from the Ringana SUN line. Natural mineral filters. Water-resistant. No artificial preservatives.",
    price: 37.90,
    badge: null,
    emoji: "🌞",
    tags_es: ["Filtros minerales", "Vegano", "Water-resistant"],
    tags_en: ["Mineral filters", "Vegan", "Water-resistant"],
  },
  // ── SPORT ───────────────────────────────────────────────────────────────
  {
    id: "sport-shake",
    line: "SPORT",
    category: "suplementos",
    name_es: "SPORT Proteína Vegetal",
    name_en: "SPORT Plant Protein",
    desc_es: "Complemento alimenticio de la línea SPORT. Proteína de guisante y arroz. Sin azúcar añadido, sin edulcorantes artificiales. Sabor cacao.",
    desc_en: "Food supplement from the SPORT line. Pea and rice protein. No added sugar, no artificial sweeteners. Cocoa flavor.",
    price: 46.90,
    badge: null,
    emoji: "💪",
    tags_es: ["Proteína vegetal", "Sin azúcar añadido", "Natural"],
    tags_en: ["Plant protein", "No added sugar", "Natural"],
  },
];

const CATEGORY_LABELS: Record<string, { es: string; en: string; icon: string }> = {
  skincare:    { es: "Skincare",    en: "Skincare",     icon: "✨" },
  corporal:    { es: "Corporal",    en: "Body Care",    icon: "🧴" },
  capilar:     { es: "Capilar",     en: "Hair Care",    icon: "💆" },
  suplementos: { es: "Suplementos", en: "Supplements",  icon: "💊" },
  perfumes:    { es: "Perfumes",    en: "Perfumes",     icon: "🌸" },
};

const WHY_RINGANA = [
  { icon: "🌿", en: "No Preservatives",  es: "Sin Conservantes",     descEn: "Fresh formulas — no artificial preservatives.", descEs: "Fórmulas frescas — sin conservantes artificiales." },
  { icon: "🔬", en: "Science-Backed",    es: "Formulación científica", descEn: "Dermatologically tested in Austria.",              descEs: "Testado dermatológicamente en Austria." },
  { icon: "🐇", en: "100% Vegan",        es: "100% Vegano",            descEn: "PETA certified. Never tested on animals.",         descEs: "Certificado PETA. Nunca testado en animales." },
  { icon: "♻️", en: "Eco Packaging",     es: "Packaging Eco",          descEn: "Refillable containers, recycled materials.",       descEs: "Envases recargables y materiales reciclados." },
];

export default async function RinganaPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  setRequestLocale(locale);
  const isEs = locale === "es";

  const T = {
    ad_disclosure: isEs
      ? "⚠️ Contenido publicitario. Soy partner oficial de Ringana. Al hacer clic en \"Comprar\" serás redirigido a la tienda oficial de Ringana (miguelsaez.ringana.com). Los precios son orientativos; el precio definitivo es el de la web oficial de Ringana."
      : "⚠️ Advertising content. I am an official Ringana partner. Clicking \"Buy\" redirects you to the official Ringana store (miguelsaez.ringana.com). Prices are indicative; the final price is on the official Ringana website.",
    supp_disclaimer: isEs
      ? "* Los complementos alimenticios no deben utilizarse como sustitutos de una dieta variada y equilibrada ni de un estilo de vida saludable."
      : "* Food supplements should not replace a varied and balanced diet or a healthy lifestyle.",
    badge:         isEs ? "Partner Oficial Ringana" : "Official Ringana Partner",
    title1:        isEs ? "Cosmética" : "Natural",
    title2:        isEs ? "100% Natural" : "Cosmetics",
    sub:           isEs
      ? "Fórmulas frescas, ingredientes de origen natural, sin conservantes artificiales. Fabricado y enviado desde Austria."
      : "Fresh formulas, natural-origin ingredients, no artificial preservatives. Made and shipped from Austria.",
    why_title:     isEs ? "¿Por qué Ringana?" : "Why Ringana?",
    catalog_title: isEs ? "Catálogo" : "Catalog",
    catalog_sub:   isEs ? "Productos enviados directamente desde Austria." : "Products shipped directly from Austria.",
    buy_btn:       isEs ? "Comprar en Ringana →" : "Buy on Ringana →",
    all_btn:       isEs ? "Ver catálogo completo en Ringana →" : "Browse full catalog on Ringana →",
    partner_note:  isEs
      ? "Soy partner oficial de Ringana. Al comprar a través de mi enlace me apoyas directamente, sin coste adicional para ti."
      : "I am an official Ringana partner. Buying through my link supports me at no extra cost to you.",
    partner_title: isEs ? "¿Te interesa ser partner?" : "Interested in becoming a partner?",
    partner_sub:   isEs
      ? "Ringana dispone de un programa de partnership. Si quieres más información, escríbeme."
      : "Ringana has a partnership program. Write to me if you'd like more information.",
    partner_cta:   isEs ? "Consultar →" : "Learn more →",
    prices_note:   isEs
      ? "Precios orientativos. El precio definitivo y la disponibilidad se confirman en la web oficial de Ringana."
      : "Indicative prices. Final price and availability are confirmed on Ringana's official website.",
  };

  const categories = Object.keys(CATEGORY_LABELS);
  const hasSupplements = RINGANA_CATALOG.some((p) => p.category === "suplementos");

  // JSON-LD structured data — ItemList + Organization
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        "name": isEs ? "Catálogo Ringana — AizuaBeauty" : "Ringana Catalog — AizuaBeauty",
        "description": isEs ? "Cosmética natural Ringana, partner oficial" : "Natural Ringana cosmetics, official partner",
        "numberOfItems": RINGANA_CATALOG.length,
        "itemListElement": RINGANA_CATALOG.map((p, i) => ({
          "@type": "ListItem",
          "position": i + 1,
          "item": {
            "@type": "Product",
            "name": isEs ? p.name_es : p.name_en,
            "description": isEs ? p.desc_es : p.desc_en,
            "brand": { "@type": "Brand", "name": "RINGANA" },
            "offers": {
              "@type": "Offer",
              "priceCurrency": "EUR",
              "price": p.price.toFixed(2),
              "availability": "https://schema.org/InStock",
              "url": RINGANA_BASE,
              "seller": { "@type": "Organization", "name": "RINGANA GmbH" },
            },
          },
        })),
      },
      {
        "@type": "Organization",
        "name": "AizuaBeauty",
        "url": process.env.NEXT_PUBLIC_APP_URL || "https://aizuabeauty.vercel.app",
        "description": isEs ? "Partner oficial de Ringana en España" : "Official Ringana partner in Spain",
      },
    ],
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FAF8F5", fontFamily: "var(--font-lato, sans-serif)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MainNav locale={locale} />

      {/* ── ADVERTISING DISCLOSURE (obligatorio por ley y normas Ringana) ── */}
      <div style={{
        background: "#FFFBEB", borderBottom: "1px solid #F5E6A0",
        padding: "0.75rem 2rem", textAlign: "center",
        marginTop: "80px", // altura del nav fijo
      }}>
        <p style={{ fontSize: "0.78rem", color: "#7A6000", margin: 0, lineHeight: 1.5 }}>
          {T.ad_disclosure}
        </p>
      </div>

      {/* ── HERO ── */}
      <section style={{
        padding: "3rem 2.5rem 3rem",
        background: "linear-gradient(155deg, #EAF2E4 0%, #FAF8F5 55%, #F5F0EA 100%)",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#7BA05B", display: "inline-block" }} />
            <span style={{ fontSize: "0.72rem", color: "#7BA05B", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const }}>
              {T.badge}
            </span>
          </div>
          <h1 style={{
            fontFamily: "var(--font-cormorant, Georgia, serif)",
            fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
            fontWeight: 300, lineHeight: 1.15, color: "#2C2C2C",
            margin: "0 0 0.5rem",
          }}>
            {T.title1}{" "}
            <em style={{ fontStyle: "italic", color: "#7BA05B", fontWeight: 400 }}>{T.title2}</em>
          </h1>
          <p style={{ color: "#6B6B6B", fontSize: "clamp(14px,1.5vw,16px)", lineHeight: 1.65, maxWidth: "520px", margin: "0.75rem auto 0" }}>
            {T.sub}
          </p>
        </div>
      </section>

      {/* ── WHY RINGANA ── */}
      <section style={{ padding: "3.5rem 2.5rem", background: "#fff" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <h2 style={{
            fontFamily: "var(--font-cormorant, Georgia, serif)",
            fontSize: "clamp(1.6rem, 3vw, 2.3rem)",
            fontWeight: 400, color: "#2C2C2C",
            textAlign: "center", marginBottom: "2.5rem",
          }}>
            {T.why_title}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px,1fr))", gap: "1.5rem" }}>
            {WHY_RINGANA.map((w) => (
              <div key={w.en} style={{ background: "#FAF8F5", border: "1px solid #EDE9E3", borderRadius: "14px", padding: "1.5rem", textAlign: "center" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.6rem" }}>{w.icon}</div>
                <h3 style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.15rem", fontWeight: 600, color: "#2C2C2C", marginBottom: "0.4rem" }}>
                  {isEs ? w.es : w.en}
                </h3>
                <p style={{ fontSize: "0.82rem", color: "#6B6B6B", lineHeight: 1.5, margin: 0 }}>
                  {isEs ? w.descEs : w.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARTNER NOTE ── */}
      <div style={{ background: "#EAF2E4", padding: "0.85rem 2rem", textAlign: "center", borderTop: "1px solid #C8DDB8", borderBottom: "1px solid #C8DDB8" }}>
        <p style={{ fontSize: "0.81rem", color: "#5C8044", margin: 0 }}>
          🌿 <strong>{isEs ? "Publicidad:" : "Ad:"}</strong> {T.partner_note}
        </p>
      </div>

      {/* ── CATALOG ── */}
      <section style={{ padding: "4rem 2.5rem", background: "#FAF8F5" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div style={{ display: "inline-block", background: "#EAF2E4", color: "#5C8044", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", padding: "0.3rem 1rem", borderRadius: "20px", marginBottom: "0.75rem", textTransform: "uppercase" as const }}>
              Ringana
            </div>
            <h2 style={{ fontFamily: "var(--font-cormorant, Georgia, serif)", fontSize: "clamp(1.7rem, 3.5vw, 2.5rem)", fontWeight: 400, color: "#2C2C2C", margin: "0 0 0.4rem" }}>
              {T.catalog_title}
            </h2>
            <p style={{ color: "#6B6B6B", fontSize: "0.88rem", maxWidth: "420px", margin: "0 auto" }}>
              {T.catalog_sub}
            </p>
          </div>

          {/* Category quick-nav */}
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "0.5rem", justifyContent: "center", marginBottom: "3rem" }}>
            {categories.map((cat) => {
              const info = CATEGORY_LABELS[cat];
              return (
                <a key={cat} href={`#cat-${cat}`} style={{
                  display: "inline-flex", alignItems: "center", gap: "0.4rem",
                  background: "#fff", border: "1px solid #EDE9E3", borderRadius: "30px",
                  padding: "0.4rem 1rem", fontSize: "0.78rem", fontWeight: 600, color: "#4A4A4A",
                  textDecoration: "none", letterSpacing: "0.03em",
                }}>
                  {info.icon} {isEs ? info.es : info.en}
                </a>
              );
            })}
          </div>

          {/* Products by category */}
          {categories.map((cat) => {
            const catProducts = RINGANA_CATALOG.filter((p) => p.category === cat);
            if (!catProducts.length) return null;
            const info = CATEGORY_LABELS[cat];
            return (
              <div key={cat} id={`cat-${cat}`} style={{ marginBottom: "4rem", scrollMarginTop: "100px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  <span style={{ fontSize: "1.5rem" }}>{info.icon}</span>
                  <h3 style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.5rem", fontWeight: 600, color: "#2C2C2C", margin: 0 }}>
                    {isEs ? info.es : info.en}
                  </h3>
                  <div style={{ flex: 1, height: "1px", background: "#EDE9E3" }} />
                </div>

                <div className="store-products-grid">
                  {catProducts.map((p) => {
                    const name = isEs ? p.name_es : p.name_en;
                    const desc = isEs ? p.desc_es  : p.desc_en;
                    const tags = isEs ? p.tags_es   : p.tags_en;
                    return (
                      <div key={p.id} className="premium-card">
                        <div className="card-img-wrap" style={{
                          background: "linear-gradient(135deg, #EAF2E4 0%, #F5F0EA 100%)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <span style={{ fontSize: "4rem" }}>{p.emoji}</span>
                          <span style={{
                            position: "absolute", top: "10px", right: "10px",
                            background: "#EAF2E4", color: "#5C8044",
                            fontSize: "0.6rem", fontWeight: 700, padding: "0.2rem 0.5rem",
                            borderRadius: "4px", textTransform: "uppercase" as const,
                          }}>
                            {p.line}
                          </span>
                        </div>

                        <div style={{ padding: "14px 16px 16px" }}>
                          <p style={{ fontSize: "0.68rem", color: "#7BA05B", fontWeight: 700, letterSpacing: "0.08em", marginBottom: "4px", textTransform: "uppercase" as const }}>
                            {p.line}
                          </p>
                          <p style={{ fontSize: "13.5px", fontWeight: 700, color: "#2C2C2C", marginBottom: "5px", lineHeight: 1.3 }}>{name}</p>
                          <p style={{ fontSize: "11.5px", color: "#7A7A7A", lineHeight: 1.5, marginBottom: "8px" }}>{desc}</p>

                          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "3px", marginBottom: "10px" }}>
                            {tags.map((t) => (
                              <span key={t} style={{ background: "#F0F7EC", color: "#5C8044", fontSize: "10px", fontWeight: 600, padding: "2px 7px", borderRadius: "20px" }}>
                                {t}
                              </span>
                            ))}
                          </div>

                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div>
                              <span style={{ fontSize: "16px", fontWeight: 700, color: "#2C2C2C" }}>
                                {isEs ? "Desde " : "From "}€{p.price.toFixed(2)}*
                              </span>
                            </div>
                            <a
                              href={`${RINGANA_BASE}`}
                              target="_blank"
                              rel="noopener noreferrer sponsored"
                              style={{
                                background: "#7BA05B", color: "#fff",
                                padding: "0.42rem 0.9rem", borderRadius: "20px",
                                fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.04em",
                                textDecoration: "none", textTransform: "uppercase" as const,
                                whiteSpace: "nowrap" as const,
                              }}
                            >
                              {T.buy_btn}
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Prices disclaimer */}
          <p style={{ fontSize: "0.78rem", color: "#9A9A9A", textAlign: "center", marginTop: "1rem", fontStyle: "italic" }}>
            * {T.prices_note}
          </p>

          {/* Supplement disclaimer */}
          {hasSupplements && (
            <p style={{ fontSize: "0.78rem", color: "#9A9A9A", textAlign: "center", marginTop: "0.5rem", fontStyle: "italic" }}>
              {T.supp_disclaimer}
            </p>
          )}

          {/* Bottom CTA */}
          <div style={{ textAlign: "center", marginTop: "2.5rem", paddingTop: "2rem", borderTop: "1px solid #EDE9E3" }}>
            <p style={{ color: "#6B6B6B", fontSize: "0.88rem", marginBottom: "1.25rem" }}>
              {isEs
                ? "Catálogo completo de más de 150 productos disponible en la tienda oficial de Ringana."
                : "Full catalog of 150+ products available at the official Ringana store."}
            </p>
            <a
              href={RINGANA_BASE}
              target="_blank"
              rel="noopener noreferrer sponsored"
              style={{
                display: "inline-block",
                border: "1.5px solid #7BA05B", color: "#7BA05B",
                padding: "0.85rem 2rem", borderRadius: "50px",
                fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.05em",
                textTransform: "uppercase" as const, textDecoration: "none",
              }}
            >
              {T.all_btn}
            </a>
          </div>
        </div>
      </section>

      {/* ── PARTNER CTA ── */}
      <section style={{
        padding: "4rem 2.5rem",
        background: "linear-gradient(135deg, #2C2C2C 0%, #3D3D3D 100%)",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: "540px", margin: "0 auto" }}>
          <div style={{ display: "inline-block", background: "rgba(123,160,91,0.2)", color: "#A8CC80", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", padding: "0.3rem 1rem", borderRadius: "20px", marginBottom: "1.25rem", textTransform: "uppercase" as const }}>
            Ringana Partner Program
          </div>
          <h2 style={{ fontFamily: "var(--font-cormorant, Georgia, serif)", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 400, color: "#FAF8F5", margin: "0 0 1rem" }}>
            {T.partner_title}
          </h2>
          <p style={{ color: "#B0B0B0", fontSize: "0.88rem", lineHeight: 1.65, marginBottom: "1.75rem" }}>
            {T.partner_sub}
          </p>
          <a
            href="mailto:aizuaringanapartner@gmail.com?subject=Ringana Partner"
            style={{
              display: "inline-block",
              background: "#7BA05B", color: "#fff",
              padding: "0.85rem 2rem", borderRadius: "50px",
              fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.05em",
              textTransform: "uppercase" as const, textDecoration: "none",
            }}
          >
            {T.partner_cta}
          </a>
        </div>
      </section>

      <Footer locale={locale} />
    </div>
  );
}
