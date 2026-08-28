import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import MainNav from "@/components/nav/MainNav";
import Footer from "@/components/nav/Footer";

/**
 * Landing de partner — reescrita el 28/08/2026 (s271).
 *
 * QUÉ SUSTITUYE Y POR QUÉ
 * La versión anterior (648 líneas) era un CATÁLOGO: se anunciaba como «Tienda
 * partner oficial», listaba 85 productos con precios e incluía contenido propio
 * sobre ingredientes. La guía oficial de RINGANA para partners lo desaconseja
 * de forma explícita en dos puntos:
 *   · «crear un modelo propio» aparece bajo "EL ESTILO RINGANA NO ES…"
 *   · sobre producto e ingredientes: «no crees nada de elaboración propia.
 *     Para más detalles remite a www.ringana.com»
 * Eso explica, probablemente, por qué compliance@ nunca contestó a la petición
 * de autorizar la web: el caso se salía de su modelo.
 *
 * QUÉ HACE ESTA VERSIÓN
 * Recupera las impresiones que ya estaban ganadas (279/mes medidas en Search
 * Console para «ringana catálogo», «ringana productos y precios»…) y las
 * convierte en CONTACTO PROPIO por WhatsApp, en vez de mandarlas a Ringana.
 *
 * El motivo de ese cambio es económico y está medido: el partner shop
 * personalizado cuesta ~9 €/mes + impuestos y ahora mismo NO está activo, así
 * que `miguelsaez.ringana.com` redirige a `www.ringana.com` sin atribución —
 * verificado en vivo el 28/08. Cada visita enviada allí hoy es un cliente
 * regalado dos veces: sin comisión y con el contacto quedándose en su base de
 * datos, no en la nuestra.
 *
 * LÍMITES QUE NO HAY QUE CRUZAR AL EDITAR ESTO
 *   · Sin logo ni material gráfico de RINGANA (copyright, prohibido en su guía)
 *   · Sin precios ni catálogo propio
 *   · Sin contenido propio de ingredientes → se remite a ringana.com
 *   · Sin afirmaciones curativas, ni antes/después, ni recomendaciones para
 *     niños, embarazadas o lactancia
 *   · Sin llamarse «tienda oficial»: es un partner independiente
 *
 * QUIÉN FIRMA (decisión de Miguel, 28/08) — y por qué está redactado así
 * La firma es **Patricia Martínez**, que es quien lleva esta línea. Pero la
 * cuenta de partner de RINGANA está registrada a nombre de Miguel (el partner
 * shop muestra su nombre y el contacto es aizuaringanapartner@gmail.com), así
 * que la página dice que Patricia **asesora** y NO afirma que ella sea la socia
 * registrada. La diferencia no es cosmética: identificar mal a quién pertenece
 * la cuenta es justo lo que RINGANA vigila en sus normas de partner.
 * El aviso legal sigue diciendo «partner independiente» porque describe al
 * NEGOCIO que opera la página, que sí lo es — no a la persona que atiende.
 * NUNCA el nombre legal completo de nadie.
 */

const WA_NUM = "34683405410";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = params.locale;
  const isEs = locale === "es";
  const base = "https://beauty.aizualabs.com";
  // Los locales que no son es/en consolidan en /es/ringana: no hay contenido
  // propio por idioma y no tiene sentido inventar seis variantes.
  const canonical = isEs || locale === "en" ? `${base}/${locale}/ringana` : `${base}/es/ringana`;
  return {
    title: isEs
      ? "Ringana en Málaga — Asesoramiento personal sin compromiso"
      : "Ringana — Personal advice, no strings attached",
    description: isEs
      ? "¿Buscas el catálogo o los precios de Ringana? Te asesoro desde Málaga para elegir según tu piel y tu rutina, sin compromiso. Escríbeme por WhatsApp y te oriento."
      : "Looking for the Ringana catalogue or prices? I'll advise you from Málaga on what fits your skin and routine, no strings attached. Message me on WhatsApp.",
    keywords: isEs
      ? ["ringana catálogo", "ringana productos", "ringana precios", "ringana españa",
         "ringana partner", "ringana málaga", "asesoramiento ringana"]
      : ["ringana catalogue", "ringana products", "ringana prices", "ringana partner"],
    alternates: {
      canonical,
      languages: {
        es: `${base}/es/ringana`,
        en: `${base}/en/ringana`,
        "x-default": `${base}/es/ringana`,
      },
    },
    openGraph: {
      title: isEs ? "Ringana en Málaga — asesoramiento personal" : "Ringana — independent partner",
      description: isEs
        ? "Partner independiente en Málaga. Te oriento sobre qué producto Ringana encaja contigo."
        : "Independent partner in Málaga. I'll guide you on which Ringana product fits you.",
      url: canonical,
      type: "website",
    },
  };
}

export default function RinganaPartnerPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const isEs = params.locale === "es";

  const waText = encodeURIComponent(
    isEs
      ? "Hola Patricia, he llegado desde tu web y me interesa Ringana. ¿Me orientas?"
      : "Hi Patricia, I found your site and I'm interested in Ringana. Can you advise me?"
  );
  const waHref = `https://wa.me/${WA_NUM}?text=${waText}`;

  const t = isEs
    ? {
        h1: "Ringana: te ayudo a elegir, sin compromiso",
        intro:
          "Si has llegado buscando el catálogo o los precios de Ringana, esto te va a ahorrar tiempo: el catálogo completo y los precios oficiales están en la web de Ringana. Lo que yo aporto es lo otro — decirte qué encaja contigo y qué no, según tu piel, tu rutina y lo que ya usas.",
        quienH: "Quién te atiende",
        quien:
          "Soy Patricia Martínez y llevo esta línea desde Málaga. No soy Ringana ni hablo en su nombre: soy alguien que usa los productos y que te orienta de persona a persona, con lo bueno y lo malo.",
        comoH: "Cómo funciona",
        pasos: [
          "Me escribes por WhatsApp y me cuentas qué buscas (piel seca, rutina de noche, suplementos, deporte…).",
          "Te digo con franqueza qué te encaja, qué no, y si hay algo que no merece la pena para tu caso.",
          "Si decides comprar, el pedido se hace en Ringana: ellos cobran, envían y gestionan la garantía.",
        ],
        ctaH: "Escríbeme y te oriento",
        ctaSub: "Respondo yo, no un bot. Sin compromiso y sin listas de correo.",
        ctaBtn: "Preguntar por WhatsApp",
        detalleH: "¿Buscas la ficha técnica o los ingredientes?",
        detalle:
          "Esa información es de Ringana y está en su web oficial, siempre actualizada. Prefiero remitirte allí antes que copiarla aquí y que se quede desfasada.",
        detalleBtn: "Ver información oficial en ringana.com",
        legal:
          "Partner independiente de RINGANA. Esta página no es una tienda ni un sitio oficial de RINGANA, no vende productos y no está operada por la marca. Las compras se realizan en RINGANA. Los productos son cosmética y complementos alimenticios: no previenen, tratan ni curan enfermedades.",
      }
    : {
        h1: "Ringana: I'll help you choose, no strings attached",
        intro:
          "If you came looking for the Ringana catalogue or prices, this will save you time: the full catalogue and official prices are on Ringana's own site. What I add is the other part — telling you what fits you and what doesn't, based on your skin, your routine and what you already use.",
        quienH: "Who you'll be talking to",
        quien:
          "I'm Patricia Martínez and I run this side of things from Málaga. I'm not Ringana and I don't speak for them: I'm someone who uses the products and advises you person to person, warts and all.",
        comoH: "How it works",
        pasos: [
          "Message me on WhatsApp and tell me what you're after (dry skin, night routine, supplements, sport…).",
          "I'll tell you straight what fits, what doesn't, and what isn't worth it in your case.",
          "If you decide to buy, the order is placed at Ringana: they charge, ship and handle warranty.",
        ],
        ctaH: "Message me and I'll advise you",
        ctaSub: "You get me, not a bot. No commitment, no mailing lists.",
        ctaBtn: "Ask on WhatsApp",
        detalleH: "Looking for the datasheet or ingredients?",
        detalle:
          "That information belongs to Ringana and lives on their official site, always up to date. I'd rather send you there than copy it here and let it go stale.",
        detalleBtn: "See official info at ringana.com",
        legal:
          "Independent RINGANA partner. This page is not a shop nor an official RINGANA site, does not sell products and is not operated by the brand. Purchases are made at RINGANA. The products are cosmetics and food supplements: they do not prevent, treat or cure any disease.",
      };

  return (
    <>
      <MainNav locale={params.locale} />
      <main style={{ background: "#fff", color: "#1a1a1a" }}>
        {/* HERO */}
        <section
          style={{
            maxWidth: 780,
            margin: "0 auto",
            padding: "104px 1.5rem 2.5rem",
          }}
        >
          <p
            style={{
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontSize: "0.72rem",
              color: "#8a8a8a",
              marginBottom: "0.9rem",
            }}
          >
            {/* Se evita a propósito la etiqueta «partner independiente» aquí: la
                cuenta de partner no es de quien firma la página. Va solo en el
                aviso legal, donde describe al negocio y no a la persona. */}
            {isEs ? "Asesoramiento personal · Málaga" : "Personal advice · Málaga"}
          </p>
          <h1
            style={{
              fontSize: "clamp(1.7rem, 4.6vw, 2.6rem)",
              lineHeight: 1.18,
              margin: "0 0 1.1rem",
              fontWeight: 600,
            }}
          >
            {t.h1}
          </h1>
          <p style={{ fontSize: "1.04rem", lineHeight: 1.65, color: "#444", margin: 0 }}>
            {t.intro}
          </p>

          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer nofollow"
            style={{
              display: "inline-block",
              marginTop: "1.8rem",
              background: "#25D366",
              color: "#08310f",
              fontWeight: 700,
              padding: "0.95rem 1.7rem",
              borderRadius: 999,
              textDecoration: "none",
              fontSize: "1rem",
            }}
          >
            {t.ctaBtn}
          </a>
        </section>

        {/* QUIÉN SOY */}
        <section style={{ maxWidth: 780, margin: "0 auto", padding: "0 1.5rem 2.2rem" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 600, margin: "0 0 0.6rem" }}>
            {t.quienH}
          </h2>
          <p style={{ lineHeight: 1.65, color: "#444", margin: 0 }}>{t.quien}</p>
        </section>

        {/* CÓMO FUNCIONA */}
        <section style={{ maxWidth: 780, margin: "0 auto", padding: "0 1.5rem 2.2rem" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 600, margin: "0 0 0.9rem" }}>
            {t.comoH}
          </h2>
          <ol style={{ margin: 0, paddingLeft: "1.15rem", lineHeight: 1.7, color: "#444" }}>
            {t.pasos.map((p, i) => (
              <li key={i} style={{ marginBottom: "0.55rem" }}>
                {p}
              </li>
            ))}
          </ol>
        </section>

        {/* CTA */}
        <section style={{ maxWidth: 780, margin: "0 auto", padding: "0 1.5rem 2.4rem" }}>
          <div
            style={{
              border: "1px solid #ececec",
              borderRadius: 16,
              padding: "1.6rem 1.5rem",
              textAlign: "center",
            }}
          >
            <h2 style={{ fontSize: "1.15rem", fontWeight: 600, margin: "0 0 0.35rem" }}>
              {t.ctaH}
            </h2>
            <p style={{ color: "#666", fontSize: "0.93rem", margin: "0 0 1.2rem" }}>
              {t.ctaSub}
            </p>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer nofollow"
              style={{
                display: "inline-block",
                background: "#25D366",
                color: "#08310f",
                fontWeight: 700,
                padding: "0.9rem 1.7rem",
                borderRadius: 999,
                textDecoration: "none",
              }}
            >
              {t.ctaBtn}
            </a>
          </div>
        </section>

        {/* FICHA TÉCNICA → RINGANA. No se copia contenido suyo: se remite. */}
        <section style={{ maxWidth: 780, margin: "0 auto", padding: "0 1.5rem 2.6rem" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 600, margin: "0 0 0.6rem" }}>
            {t.detalleH}
          </h2>
          <p style={{ lineHeight: 1.65, color: "#444", margin: "0 0 1rem" }}>{t.detalle}</p>
          <a
            href="https://www.ringana.com/?lang=es"
            target="_blank"
            rel="noopener noreferrer nofollow"
            style={{ color: "#1a1a1a", fontWeight: 600, textDecoration: "underline" }}
          >
            {t.detalleBtn}
          </a>
        </section>

        {/* AVISO LEGAL */}
        <section style={{ maxWidth: 780, margin: "0 auto", padding: "0 1.5rem 4rem" }}>
          <p
            style={{
              fontSize: "0.79rem",
              lineHeight: 1.6,
              color: "#8a8a8a",
              borderTop: "1px solid #ececec",
              paddingTop: "1.1rem",
              margin: 0,
            }}
          >
            {t.legal}
          </p>
        </section>
      </main>
      <Footer locale={params.locale} />
    </>
  );
}
