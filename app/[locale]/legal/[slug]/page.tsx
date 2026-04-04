// app/[locale]/legal/[slug]/page.tsx
// Aizua — Páginas legales RGPD (privacidad, devoluciones, cookies, aviso-legal, terminos)
// Rutas: /es/legal/privacidad · /es/legal/devoluciones · /es/legal/cookies · /es/legal/aviso-legal
// Clean version with proper MainNav/Footer and no UTF-8 corruption

import { notFound } from "next/navigation";
import Link from "next/link";
import MainNav from "@/components/nav/MainNav";
import Footer from "@/components/nav/Footer";

export const dynamic = "force-static";

const VALID_SLUGS = ["privacidad", "devoluciones", "cookies", "aviso-legal", "terminos"];

type Params = { locale: string; slug: string };

export function generateStaticParams() {
  const locales = ["es", "en", "fr", "de", "pt", "it"];
  return locales.flatMap(locale => VALID_SLUGS.map(slug => ({ locale, slug })));
}

// ── ESTILOS base (light theme, coherente con la tienda) ──
const S = {
  page:    { minHeight: "100vh", background: "#F8F9FB", fontFamily: "system-ui, sans-serif" },
  wrap:    { maxWidth: "760px", margin: "0 auto", padding: "calc(84px + 2.5rem) 2rem 5rem" },
  tag:     { display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(0,201,177,0.1)", border: "1px solid rgba(0,201,177,0.3)", borderRadius: "100px", padding: "0.35rem 1rem", fontSize: "0.72rem", color: "#00A896", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "1rem" },
  h1:      { fontSize: "clamp(2.2rem, 6vw, 3.5rem)", fontWeight: 900, color: "#1A1A2E", lineHeight: 1.1, marginBottom: "1rem", letterSpacing: "-0.02em" },
  meta:    { display: "flex", gap: "2rem", padding: "1.25rem 0", borderTop: "1px solid #E8EAED", borderBottom: "1px solid #E8EAED", marginBottom: "2.5rem", flexWrap: "wrap" as const },
  metaL:   { fontSize: "0.7rem", color: "#999", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const },
  metaV:   { fontSize: "0.88rem", color: "#1A1A2E", fontWeight: 600, marginTop: "2px" },
  h2:      { fontSize: "1.35rem", fontWeight: 800, color: "#1A1A2E", margin: "2.5rem 0 0.75rem" },
  h3:      { fontSize: "1rem", fontWeight: 700, color: "#1A1A2E", margin: "1.5rem 0 0.5rem" },
  p:       { fontSize: "0.95rem", color: "#555", lineHeight: 1.8, marginBottom: "0.75rem" },
  box:     { background: "#fff", border: "1px solid #E8EAED", borderRadius: "12px", padding: "1.25rem 1.5rem", margin: "1.25rem 0" },
  teal:    { background: "rgba(0,201,177,0.08)", border: "1px solid rgba(0,201,177,0.25)", borderRadius: "10px", padding: "1rem 1.25rem", margin: "1rem 0" },
  warn:    { background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "10px", padding: "1rem 1.25rem", margin: "1rem 0" },
  step:    { display: "flex", gap: "1rem", background: "#fff", border: "1px solid #E8EAED", borderRadius: "12px", padding: "1.1rem 1.25rem", marginBottom: "0.75rem", alignItems: "flex-start" },
  stepN:   { width: "26px", height: "26px", borderRadius: "8px", background: "#00C9B1", color: "#fff", fontWeight: 800, fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  divider: { height: "1px", background: "#E8EAED", margin: "2rem 0" },
};

// ── CONTENIDO por slug ──
function getContent(slug: string, locale: string) {
  const isEs = locale === "es" || locale === "fr" || locale === "it" || locale === "de" || locale === "pt";
  const back = isEs ? "← Inicio" : "← Home";

  if (slug === "privacidad") return {
    tag: "🔒 RGPD · LOPDGDD · UE 2016/679",
    title: locale === "es" ? "Política de Privacidad" : "Privacy Policy",
    meta: [
      { l: "Actualización", v: "Marzo 2026" },
      { l: "Responsable", v: "Aizüa" },
      { l: "Marco legal", v: "RGPD UE 2016/679 · LOPDGDD" },
    ],
    back,
    body: <PrivacidadContent />,
  };

  if (slug === "devoluciones") return {
    tag: "↩️ DEVOLUCIONES · 14 DÍAS · UE 2011/83",
    title: locale === "es" ? "Política de Devoluciones" : "Returns Policy",
    meta: [
      { l: "Plazo desistimiento", v: "14 días naturales" },
      { l: "Gastos devolución", v: "A cargo del cliente" },
      { l: "Marco legal", v: "TRLGDCU · Dir. UE 2011/83" },
    ],
    back,
    body: <DevolucionesContent />,
  };

  if (slug === "cookies") return {
    tag: "🍪 POLÍTICA DE COOKIES · LSSICE",
    title: locale === "es" ? "Política de Cookies" : "Cookie Policy",
    meta: [
      { l: "Actualización", v: "Marzo 2026" },
      { l: "Marco legal", v: "RGPD · Directiva ePrivacy" },
      { l: "Consentimiento", v: "Granular por categoría" },
    ],
    back,
    body: <CookiesContent />,
  };

  if (slug === "aviso-legal") return {
    tag: "⚖️ AVISO LEGAL · LSSICE",
    title: locale === "es" ? "Aviso Legal" : "Legal Notice",
    meta: [
      { l: "Actualización", v: "Marzo 2026" },
      { l: "Jurisdicción", v: "España / UE" },
      { l: "Marco legal", v: "LSSICE · TRLGDCU" },
    ],
    back,
    body: <AvisoLegalContent />,
  };

  if (slug === "terminos") return {
    tag: "📋 TÉRMINOS Y CONDICIONES · LSSICE",
    title: locale === "es" ? "Términos y Condiciones" : "Terms & Conditions",
    meta: [
      { l: "Actualización", v: "Marzo 2026" },
      { l: "Jurisdicción", v: "España / UE" },
      { l: "Marco legal", v: "LSSICE · TRLGDCU" },
    ],
    back,
    body: <TerminosContent />,
  };

  return null;
}

// ── PÁGINA ──
export default function LegalPage({ params }: { params: Params }) {
  const { locale, slug } = params;
  if (!VALID_SLUGS.includes(slug)) notFound();
  const c = getContent(slug, locale);
  if (!c) notFound();

  const legalLinks = [
    { slug: "privacidad", label: "Privacidad" },
    { slug: "devoluciones", label: "Devoluciones" },
    { slug: "cookies", label: "Cookies" },
    { slug: "aviso-legal", label: "Aviso legal" },
    { slug: "terminos", label: "Términos" },
  ];

  return (
    <div style={S.page}>
      <MainNav locale={locale} />

      <div style={S.wrap}>
        {/* Nav secundaria entre páginas legales */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
          {legalLinks.map(l => (
            <Link key={l.slug} href={`/${locale}/legal/${l.slug}`} style={{
              fontSize: "0.78rem", fontWeight: 600, padding: "0.3rem 0.8rem",
              borderRadius: "6px", textDecoration: "none",
              background: l.slug === slug ? "#00C9B1" : "#fff",
              color: l.slug === slug ? "#fff" : "#666",
              border: "1px solid",
              borderColor: l.slug === slug ? "#00C9B1" : "#E8EAED",
            }}>
              {l.label}
            </Link>
          ))}
        </div>

        <div style={S.tag as React.CSSProperties}>{c.tag}</div>
        <h1 style={S.h1}>{c.title}</h1>

        <div style={S.meta}>
          {c.meta.map(m => (
            <div key={m.l}>
              <div style={S.metaL}>{m.l}</div>
              <div style={S.metaV}>{m.v}</div>
            </div>
          ))}
        </div>

        {c.body}
      </div>

      <Footer locale={locale} />
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ── CONTENIDOS ──
// ═══════════════════════════════════════════════════

function PrivacidadContent() {
  return (
    <>
      <div style={S.teal}>
        <p style={{ ...S.p, marginBottom: 0, color: "#007A6E" }}>
          <strong>Resumen:</strong> Solo recogemos los datos imprescindibles para gestionar tu pedido. No vendemos datos a terceros. Puedes ejercer tus derechos en cualquier momento escribiendo a <strong>privacidad@aizua.com</strong>.
        </p>
      </div>

      <h2 style={S.h2}>1. Responsable del tratamiento</h2>
      <div style={S.box}>
        <p style={S.p}><strong>Titular:</strong> Aizüa · Autónomo (nombre comercial)</p>
        <p style={S.p}><strong>NIF:</strong> Disponible bajo solicitud a través del email de contacto</p>
        <p style={S.p}><strong>Dirección:</strong> Málaga, España</p>
        <p style={{ ...S.p, marginBottom: 0 }}><strong>Email:</strong> aizuaweb@gmail.com</p>
      </div>

      <div style={S.divider} />
      <h2 style={S.h2}>2. Datos que recogemos y para qué</h2>
      <h3 style={S.h3}>Datos de pedido y envío</h3>
      <p style={S.p}>Nombre, dirección postal, teléfono y email. Imprescindibles para tramitar y entregar tu pedido (base legal: ejecución del contrato, Art. 6.1.b RGPD).</p>
      <h3 style={S.h3}>Datos de pago</h3>
      <p style={S.p}><strong>Aizua nunca almacena datos de tarjeta.</strong> Los pagos se procesan íntegramente a través de <strong>Stripe Inc.</strong>, pasarela certificada PCI-DSS nivel 1.</p>
      <h3 style={S.h3}>Datos de navegación (con tu consentimiento)</h3>
      <p style={S.p}>IP anonimizada y comportamiento de navegación mediante Google Analytics 4 y Meta/TikTok Pixel, solo si aceptas cookies analíticas y de marketing.</p>
      <div style={S.teal}>
        <p style={{ ...S.p, marginBottom: 0, color: "#007A6E" }}>
          <strong>Fulfillment:</strong> Para gestionar el envío compartimos los datos de entrega con nuestro proveedor logístico (AliExpress/CJDropshipping). La transferencia internacional está cubierta por el Art. 46 RGPD.
        </p>
      </div>

      <div style={S.divider} />
      <h2 style={S.h2}>3. Conservación de datos</h2>
      <div style={S.box}>
        <p style={S.p}>📦 <strong>Datos de pedido:</strong> 6 años (obligación contable — Código de Comercio)</p>
        <p style={S.p}>🧾 <strong>Datos fiscales:</strong> 4 años (Ley General Tributaria)</p>
        <p style={S.p}>📧 <strong>Newsletter:</strong> Hasta que retires el consentimiento + 1 año</p>
        <p style={{ ...S.p, marginBottom: 0 }}>📊 <strong>Analytics:</strong> 26 meses (configuración GA4 estándar)</p>
      </div>

      <div style={S.divider} />
      <h2 style={S.h2}>4. Tus derechos</h2>
      <p style={S.p}>Puedes ejercer los derechos de <strong>acceso, rectificación, supresión, limitación, portabilidad y oposición</strong> enviando un email a <strong>aizuaweb@gmail.com</strong>. Respondemos en máximo 30 días naturales. También puedes presentar reclamación ante la <strong>AEPD</strong> en www.aepd.es.</p>
    </>
  );
}

function DevolucionesContent() {
  return (
    <>
      <div style={S.teal}>
        <p style={{ ...S.p, marginBottom: 0, color: "#007A6E" }}>
          <strong>Resumen:</strong> Tienes <strong>14 días naturales</strong> desde la recepción para desistir. Los gastos de envío de devolución corren <strong>a cargo del cliente</strong> (art. 107.2 TRLGDCU). Reembolso en máximo <strong>14 días</strong> tras recibir el producto.
        </p>
      </div>

      <h2 style={S.h2}>1. Derecho de desistimiento</h2>
      <p style={S.p}>De conformidad con el Real Decreto Legislativo 1/2007 (TRLGDCU) y la Directiva europea 2011/83/UE, tienes derecho a desistir de tu compra en un plazo de <strong>14 días naturales</strong> desde la recepción del pedido, sin necesidad de justificación.</p>
      <div style={S.warn}>
        <p style={{ ...S.p, marginBottom: 0, color: "#92400E" }}>⚠️ Aizua no amplía el plazo más allá del mínimo legal. Si tienes cualquier incidencia, contacta dentro de ese periodo a <strong>aizuaweb@gmail.com</strong>.</p>
      </div>

      <div style={S.divider} />
      <h2 style={S.h2}>2. Proceso de devolución</h2>
      {[
        { n: "1", t: "Notificación dentro del plazo", d: "Envía tu solicitud a devoluciones@aizua.com con número de pedido, nombre y producto antes de que venzan los 14 días." },
        { n: "2", t: "Confirmación en 48h", d: "Te confirmamos por email la recepción y enviamos instrucciones de envío y dirección de devolución." },
        { n: "3", t: "Envío del producto", d: "Devuelve el producto en su estado original y embalaje, sin uso indebido, en máximo 14 días desde tu notificación." },
        { n: "4", t: "Inspección y reembolso", d: "Tras verificar el estado, reembolsamos el precio del artículo en máximo 14 días por el mismo método de pago." },
      ].map(s => (
        <div key={s.n} style={S.step}>
          <div style={S.stepN}>{s.n}</div>
          <div>
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1A1A2E", marginBottom: "0.25rem" }}>{s.t}</div>
            <div style={{ fontSize: "0.88rem", color: "#666", lineHeight: 1.6 }}>{s.d}</div>
          </div>
        </div>
      ))}

      <div style={S.divider} />
      <h2 style={S.h2}>3. Gastos de devolución</h2>
      <p style={S.p}>Conforme al artículo 107.2 del TRLGDCU, los <strong>gastos de envío de devolución son responsabilidad del cliente</strong>, al haberle informado de ello previamente.</p>
      <h3 style={S.h3}>Excepciones — Aizua asume los gastos cuando:</h3>
      <div style={S.box}>
        <p style={S.p}>✅ El producto llegó <strong>defectuoso o dañado</strong> durante el transporte</p>
        <p style={S.p}>✅ El producto recibido <strong>no corresponde</strong> a la descripción del pedido</p>
        <p style={{ ...S.p, marginBottom: 0 }}>✅ El producto presenta un <strong>defecto de fabricación</strong> dentro del periodo de garantía</p>
      </div>

      <div style={S.divider} />
      <h2 style={S.h2}>4. Exclusiones del derecho de desistimiento</h2>
      <div style={S.box}>
        <p style={S.p}>🚫 Productos con <strong>precinto de higiene roto</strong> una vez desprecintados</p>
        <p style={S.p}>🚫 Productos con signos evidentes de <strong>uso más allá de la comprobación</strong></p>
        <p style={{ ...S.p, marginBottom: 0 }}>🚫 Productos <strong>personalizados</strong> según especificaciones del cliente</p>
      </div>

      <div style={S.divider} />
      <h2 style={S.h2}>5. Garantía legal de conformidad</h2>
      <p style={S.p}>Todos los productos tienen <strong>garantía legal de 2 años</strong> desde la entrega (Art. 114 TRLGDCU · Directiva UE 2019/771). En caso de defecto: tienes derecho a reparación, sustitución, reducción de precio o reembolso completo.</p>
      <h3 style={S.h3}>Productos defectuosos</h3>
      <p style={S.p}>Contacta en <strong>aizuaweb@gmail.com</strong> en 48h desde la recepción, adjuntando fotos del producto y embalaje. Los gastos de devolución corren a nuestro cargo en este caso.</p>

      <div style={S.divider} />
      <h2 style={S.h2}>6. Resolución de conflictos</h2>
      <p style={S.p}>Plataforma de resolución de litigios en línea de la UE: <strong>ec.europa.eu/consumers/odr</strong></p>
    </>
  );
}

function CookiesContent() {
  return (
    <>
      <p style={S.p}>Esta web utiliza cookies propias y de terceros para mejorar tu experiencia y para fines analíticos y de marketing, siempre con tu consentimiento previo.</p>

      <h2 style={S.h2}>1. ¿Qué son las cookies?</h2>
      <p style={S.p}>Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo al visitar un sitio web. Permiten recordar tus preferencias y analizar el uso de la web.</p>

      <div style={S.divider} />
      <h2 style={S.h2}>2. Tipos de cookies que utilizamos</h2>

      <h3 style={S.h3}>🔒 Cookies esenciales (siempre activas)</h3>
      <div style={S.box}>
        <p style={S.p}><strong>Carrito de compra:</strong> Mantiene los productos añadidos al carrito durante tu visita. Duración: sesión.</p>
        <p style={{ ...S.p, marginBottom: 0 }}><strong>Preferencias de idioma:</strong> Recuerda el idioma seleccionado. Duración: 1 año.</p>
      </div>

      <h3 style={S.h3}>📊 Cookies analíticas (con consentimiento)</h3>
      <div style={S.box}>
        <p style={S.p}><strong>Google Analytics 4 (_ga, _ga_*):</strong> Estadísticas de uso anónimas para mejorar la experiencia. Duración: 26 meses.</p>
        <p style={{ ...S.p, marginBottom: 0 }}>Proveedor: Google Ireland Ltd · Política: policies.google.com/privacy</p>
      </div>

      <h3 style={S.h3}>🎯 Cookies de marketing (con consentimiento)</h3>
      <div style={S.box}>
        <p style={S.p}><strong>Meta Pixel (_fbp):</strong> Mide la efectividad de anuncios en Facebook e Instagram. Duración: 90 días.</p>
        <p style={S.p}><strong>TikTok Pixel (_ttp):</strong> Mide la efectividad de anuncios en TikTok. Duración: 13 meses.</p>
        <p style={{ ...S.p, marginBottom: 0 }}>Proveedor: Meta Platforms Ireland Ltd · TikTok Technology Ltd.</p>
      </div>

      <div style={S.divider} />
      <h2 style={S.h2}>3. Tu control sobre las cookies</h2>
      <p style={S.p}>Puedes modificar tu consentimiento en cualquier momento desde el <strong>panel de cookies</strong> accesible al pie de esta página. También puedes configurar tu navegador para rechazar todas las cookies, aunque esto puede afectar a la funcionalidad de la web.</p>
      <div style={S.teal}>
        <p style={{ ...S.p, marginBottom: 0, color: "#007A6E" }}>Las cookies esenciales no requieren consentimiento y no pueden desactivarse, ya que son necesarias para el funcionamiento básico de la tienda.</p>
      </div>

      <div style={S.divider} />
      <h2 style={S.h2}>4. Transferencias internacionales</h2>
      <p style={S.p}>Google Analytics y Meta Pixel pueden implicar transferencias de datos a EE.UU. Las mismas están amparadas por las Cláusulas Contractuales Tipo de la Comisión Europea (Art. 46 RGPD).</p>

      <div style={S.divider} />
      <h2 style={S.h2}>5. Más información</h2>
      <p style={S.p}>Para cualquier consulta sobre el uso de cookies: <strong>aizuaweb@gmail.com</strong></p>
    </>
  );
}

function AvisoLegalContent() {
  return (
    <>
      <h2 style={S.h2}>1. Datos identificativos del titular</h2>
      <div style={S.box}>
        <p style={S.p}><strong>Titular:</strong> Aizüa · Autónomo (nombre comercial)</p>
        <p style={S.p}><strong>NIF:</strong> Disponible bajo solicitud expresa a través del email de contacto</p>
        <p style={S.p}><strong>Domicilio fiscal:</strong> Málaga, España</p>
        <p style={S.p}><strong>Email:</strong> aizuaweb@gmail.com</p>
        <p style={{ ...S.p, marginBottom: 0 }}><strong>Actividad:</strong> Comercio electrónico de gadgets y electrónica de consumo (CNAE 4791 — Comercio al por menor por correspondencia o internet)</p>
      </div>
      <p style={S.p}>En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSICE).</p>

      <div style={S.divider} />
      <h2 style={S.h2}>2. Objeto y ámbito de aplicación</h2>
      <p style={S.p}>El presente aviso legal regula el uso del sitio web aizua-store.vercel.app (y dominio propio cuando esté activo), titularidad de Aizüa.</p>
      <p style={S.p}>El acceso y uso de este sitio web implica la aceptación expresa de las presentes condiciones.</p>

      <div style={S.divider} />
      <h2 style={S.h2}>3. Propiedad intelectual</h2>
      <p style={S.p}>Los contenidos de esta web (textos, imágenes, logotipos, diseño) son propiedad de Aizüa o de sus proveedores, y están protegidos por la legislación española e internacional sobre propiedad intelectual e industrial.</p>
      <p style={S.p}>Queda expresamente prohibida su reproducción, distribución o comunicación pública sin autorización expresa.</p>

      <div style={S.divider} />
      <h2 style={S.h2}>4. Exclusión de responsabilidad</h2>
      <p style={S.p}>Aizüa no se hace responsable de los daños que pudieran derivarse del uso de información contenida en esta web, ni de las interrupciones de servicio por causas ajenas a su control (fuerza mayor, fallos de terceros, etc.).</p>
      <p style={S.p}>Las imágenes de productos son meramente ilustrativas. Las especificaciones técnicas pueden variar según el fabricante.</p>

      <div style={S.divider} />
      <h2 style={S.h2}>5. Legislación aplicable y jurisdicción</h2>
      <p style={S.p}>Las presentes condiciones se rigen por la legislación española. Para la resolución de conflictos, las partes se someten a los Juzgados y Tribunales del domicilio del consumidor, de conformidad con la normativa de protección al consumidor.</p>
      <p style={S.p}>Plataforma europea de resolución de litigios en línea: <strong>ec.europa.eu/consumers/odr</strong></p>
    </>
  );
}

function TerminosContent() {
  return (
    <>
      <h2 style={S.h2}>1. Proceso de compra</h2>
      {[
        { n: "1", t: "Selección y carrito", d: "Añade productos al carrito. Los precios incluyen IVA según país de destino." },
        { n: "2", t: "Datos y pago", d: "Facilita dirección de envío y selecciona método de pago. La pasarela Stripe gestiona la transacción de forma segura." },
        { n: "3", t: "Confirmación por email", d: "Recibirás email de confirmación con número de pedido y plazos estimados. Esto constituye la aceptación del contrato." },
        { n: "4", t: "Envío y seguimiento", d: "Número de seguimiento enviado por email cuando el paquete sea despachado por el proveedor." },
        { n: "5", t: "Entrega", d: "Europa: 7-15 días hábiles. Resto del mundo: 10-25 días hábiles (estimaciones, pueden variar)." },
      ].map(s => (
        <div key={s.n} style={S.step}>
          <div style={S.stepN}>{s.n}</div>
          <div>
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1A1A2E", marginBottom: "0.25rem" }}>{s.t}</div>
            <div style={{ fontSize: "0.88rem", color: "#666", lineHeight: 1.6 }}>{s.d}</div>
          </div>
        </div>
      ))}

      <div style={S.divider} />
      <h2 style={S.h2}>2. Precios y fiscalidad</h2>
      <p style={S.p}>Precios en euros (€) con IVA incluido según destino. Para ventas fuera de la UE, los impuestos locales de importación corren a cargo del cliente.</p>
      <div style={S.teal}>
        <p style={{ ...S.p, marginBottom: 0, color: "#007A6E" }}>Aizüa está registrada en el régimen <strong>OSS</strong> de la AEAT para la liquidación del IVA en ventas a consumidores de la UE cuando supere el umbral de 10.000€/año en ventas intracomunitarias B2C.</p>
      </div>

      <div style={S.divider} />
      <h2 style={S.h2}>3. Disponibilidad y stock</h2>
      <p style={S.p}>Aizüa opera bajo modelo dropshipping. En caso de rotura de stock o problema con el proveedor que impida el envío, se notificará al cliente en un plazo máximo de 48h ofreciendo reembolso completo o producto alternativo.</p>

      <div style={S.divider} />
      <h2 style={S.h2}>4. Modificaciones</h2>
      <p style={S.p}>Aizüa se reserva el derecho a modificar estas condiciones en cualquier momento. Los cambios serán publicados en esta página y aplicarán a los pedidos realizados a partir de su publicación.</p>
    </>
  );
}
