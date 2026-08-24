/**
 * ✅ ESTA es la política de privacidad que se sirve en AizuaBeauty.
 *
 * Coexiste con app/[locale]/legal/[slug]/page.tsx, que también declara
 * "privacidad" en VALID_SLUGS. Gana esta (segmento estático sobre dinámico),
 * igual que en Aizua-store — verificado en producción con navegador real.
 *
 * ⚠️ Hubo un rato en que el sitio sirvió la versión de [slug] (4 secciones,
 * PCI-DSS): era un build RANCIO, no un cambio de precedencia. Si vuelves a ver
 * la otra, es el build, no el enrutado — no muevas el contenido de sitio.
 *
 * Mientras las dos rutas existan, las dos copias del texto legal pueden
 * divergir. Lo correcto es quitar "privacidad" de VALID_SLUGS y dejar solo
 * esta, pero eso es un cambio de enrutado que decide Miguel.
 *
 * ⚠️ El CUERPO de esta página es identico al de Aizua-store salvo la marca y el
 * dominio: se genero por sustitucion a proposito, para que las dos tiendas no
 * digan cosas distintas sobre el mismo tratamiento. Si cambias una, cambia la
 * otra.
 */

import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

const LOCALES = ["es", "en", "fr", "de", "pt", "it"] as const;
type Loc = (typeof LOCALES)[number];

const OG_LOCALE: Record<Loc, string> = {
  es: "es_ES", en: "en_US", fr: "fr_FR", de: "de_DE", pt: "pt_PT", it: "it_IT",
};

function pick(locale: string): Loc {
  return (LOCALES as readonly string[]).includes(locale) ? (locale as Loc) : "es";
}

/** Fila de lista con una parte en negrita y el resto normal. */
type Item = [negrita: string, resto: string];

interface Textos {
  metaTitle: string;
  metaDesc: string;
  h1: string;
  actualizado: string;
  s1: { h: string; p: string; nombre: string; actividad: string; actividadV: string; email: string; web: string };
  s2: { h: string; p: string; items: Item[] };
  s3: { h: string; thFin: string; thBase: string; rows: Array<[string, string]> };
  s4: { h: string; p: string; items: string[] };
  s5: { h: string; p: string; items: Item[]; nota: string };
  s6: { h: string; p: string; items: Item[]; ejercer: string; ejercerFin: string; reclamar: string; aepd: string };
  s7: { h: string; p: string; pB1: string; y: string; pB2: string; campos: string; items: Item[]; avisoB: string; avisoResto: string };
  s8: { h: string; p: string };
  s9: { h: string; p: string; link: string };
  s10: { h: string; p: string };
}

const T: Record<Loc, Textos> = {
  // ─────────────────────────────────────────────── ES (original, sin tocar)
  es: {
    metaTitle: "Política de Privacidad",
    metaDesc: "Política de privacidad de AizuaBeauty: qué datos personales recogemos, cómo los usamos y protegemos, y tus derechos de acceso y cancelación (RGPD).",
    h1: "Política de Privacidad",
    actualizado: "Última actualización: marzo 2026",
    s1: {
      h: "1. Responsable del tratamiento",
      p: "En cumplimiento del Reglamento (UE) 2016/679 del Parlamento Europeo (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD), te informamos de que el responsable del tratamiento de tus datos personales es:",
      nombre: "Nombre:", actividad: "Actividad:",
      actividadV: "Comercio electrónico y servicios de consultoría/formación",
      email: "Correo electrónico:", web: "Web:",
    },
    s2: {
      h: "2. Datos que recopilamos",
      p: "Recopilamos los siguientes tipos de datos personales:",
      items: [
        ["Datos de identificación:", "nombre, apellidos, dirección de envío."],
        ["Datos de contacto:", "dirección de correo electrónico, número de teléfono (opcional)."],
        ["Datos de pago:", "gestionados íntegramente por Stripe. No almacenamos datos de tarjeta."],
        ["Datos de navegación:", "dirección IP, tipo de navegador, páginas visitadas (cookies técnicas y analíticas)."],
        ["Datos del pedido:", "historial de compras, estado del envío, número de seguimiento."],
      ],
    },
    s3: {
      h: "3. Finalidad y base legal del tratamiento",
      thFin: "Finalidad", thBase: "Base legal (Art. 6 RGPD)",
      rows: [
        ["Gestión de pedidos y envíos", "Art. 6.1.b — Ejecución de contrato"],
        ["Atención al cliente y devoluciones", "Art. 6.1.b — Ejecución de contrato"],
        ["Cumplimiento de obligaciones fiscales", "Art. 6.1.c — Obligación legal"],
        ["Envío de comunicaciones comerciales (newsletter)", "Art. 6.1.a — Consentimiento"],
        ["Análisis de uso del sitio web", "Art. 6.1.f — Interés legítimo"],
      ],
    },
    s4: {
      h: "4. Plazo de conservación",
      p: "Conservamos tus datos durante el tiempo necesario para cumplir con la finalidad para la que fueron recogidos:",
      items: [
        "Datos de pedidos: 5 años (obligaciones fiscales y contables).",
        "Datos de newsletter: hasta que retires el consentimiento.",
        "Datos de navegación: según la política de cookies (máx. 13 meses).",
        "Datos de atención al cliente: 3 años desde la última interacción.",
      ],
    },
    s5: {
      h: "5. Destinatarios y transferencias internacionales",
      p: "Tus datos pueden ser comunicados a los siguientes terceros para el cumplimiento de los servicios contratados:",
      items: [
        ["Stripe Inc.", "(pasarela de pago) — transferencia internacional cubierta por cláusulas contractuales estándar."],
        ["Proveedores de logística", "— dirección de envío para entrega del pedido."],
        ["Brevo / Resend", "(email transaccional) — nombre y email para confirmaciones de pedido."],
        ["Vercel", "(hosting) — datos de navegación almacenados en servidores EU."],
        ["Supabase", "(base de datos) — datos de pedidos y clientes, servidores EU."],
      ],
      nota: "No vendemos ni cedemos tus datos personales a terceros para fines comerciales propios.",
    },
    s6: {
      h: "6. Tus derechos",
      p: "De acuerdo con el RGPD, tienes derecho a:",
      items: [
        ["Acceso:", "conocer qué datos personales tuyos tratamos."],
        ["Rectificación:", "corregir datos inexactos o incompletos."],
        ["Supresión («derecho al olvido»):", "solicitar la eliminación de tus datos."],
        ["Limitación:", "solicitar que limitemos el tratamiento de tus datos."],
        ["Portabilidad:", "recibir tus datos en formato estructurado y legible por máquina."],
        ["Oposición:", "oponerte al tratamiento basado en interés legítimo."],
        ["Retirar el consentimiento", "en cualquier momento, sin que afecte a la licitud del tratamiento previo."],
      ],
      ejercer: "Para ejercer cualquiera de estos derechos, escríbenos a",
      ejercerFin: "indicando tu nombre y tu solicitud. Responderemos en un plazo máximo de 30 días.",
      reclamar: "Si consideras que el tratamiento de tus datos no es conforme a la normativa, puedes presentar una reclamación ante la",
      aepd: "Agencia Española de Protección de Datos (AEPD)",
    },
    s7: {
      h: "7. Asistente conversacional con IA",
      p: "Esta web incorpora un asistente conversacional basado en inteligencia artificial. Cuando lo utilizas tratamos",
      pB1: "los mensajes de la conversación",
      pB2: "los datos de contacto que facilites voluntariamente",
      y: "y",
      campos: "(nombre, email, teléfono)",
      items: [
        ["Finalidad:", "atender tu consulta, darle seguimiento y, en su caso, preparar un presupuesto."],
        ["Base legal:", "la aplicación de medidas precontractuales a tu solicitud —escribir en el chat es esa solicitud— y nuestro interés legítimo en atender y dar seguimiento a las consultas recibidas (art. 6.1.b y 6.1.f RGPD). No se te pide consentimiento porque no es la base que aplica; puedes oponerte al tratamiento en cualquier momento."],
        ["Conservación:", "12 meses desde el último mensaje, salvo que derive en un pedido, en cuyo caso se aplican los plazos del apartado 4."],
        ["Encargados:", "el asistente se apoya en proveedores de modelos de lenguaje que actúan como encargados del tratamiento, algunos ubicados fuera del Espacio Económico Europeo, con las garantías del Capítulo V del RGPD (ver apartado 5)."],
        ["Sin decisiones automatizadas:", "el asistente informa y deriva a una persona; no adopta decisiones automatizadas con efectos jurídicos sobre ti (art. 22 RGPD)."],
      ],
      avisoB: "No introduzcas en el chat contraseñas, datos bancarios o de tarjeta, ni datos de salud u otras categorías especiales.",
      avisoResto: "El asistente tiene instrucciones de no solicitarlos ni tratarlos.",
    },
    s8: {
      h: "8. Seguridad",
      p: "Aplicamos medidas técnicas y organizativas adecuadas para proteger tus datos contra acceso no autorizado, pérdida o alteración. Los datos de pago son gestionados exclusivamente por Stripe (certificado PCI DSS), y nunca almacenamos información de tarjeta de crédito en nuestros sistemas.",
    },
    s9: {
      h: "9. Cookies",
      p: "Utilizamos cookies propias y de terceros. Para más información, consulta nuestra",
      link: "Política de Cookies",
    },
    s10: {
      h: "10. Modificaciones",
      p: "Nos reservamos el derecho a modificar esta Política de Privacidad para adaptarla a cambios legislativos o de negocio. Te informaremos de cambios significativos por email o mediante aviso visible en el Sitio. La versión vigente siempre estará disponible en esta página.",
    },
  },

  // ─────────────────────────────────────────────────────────────────── EN
  en: {
    metaTitle: "Privacy Policy",
    metaDesc: "AizuaBeauty privacy policy: what personal data we collect, how we use and protect it, and your rights of access and erasure (GDPR).",
    h1: "Privacy Policy",
    actualizado: "Last updated: March 2026",
    s1: {
      h: "1. Data controller",
      p: "In accordance with Regulation (EU) 2016/679 of the European Parliament (GDPR) and Spanish Organic Law 3/2018 (LOPDGDD, the Spanish data protection act), we inform you that the controller of your personal data is:",
      nombre: "Name:", actividad: "Activity:",
      actividadV: "E-commerce and consulting/training services",
      email: "Email:", web: "Website:",
    },
    s2: {
      h: "2. Data we collect",
      p: "We collect the following types of personal data:",
      items: [
        ["Identification data:", "first name, surname, shipping address."],
        ["Contact data:", "email address, phone number (optional)."],
        ["Payment data:", "handled entirely by Stripe. We do not store card details."],
        ["Browsing data:", "IP address, browser type, pages visited (technical and analytics cookies)."],
        ["Order data:", "purchase history, shipping status, tracking number."],
      ],
    },
    s3: {
      h: "3. Purpose and legal basis for processing",
      thFin: "Purpose", thBase: "Legal basis (GDPR Art. 6)",
      rows: [
        ["Order and shipping management", "Art. 6.1.b — Performance of a contract"],
        ["Customer service and returns", "Art. 6.1.b — Performance of a contract"],
        ["Compliance with tax obligations", "Art. 6.1.c — Legal obligation"],
        ["Sending commercial communications (newsletter)", "Art. 6.1.a — Consent"],
        ["Website usage analysis", "Art. 6.1.f — Legitimate interest"],
      ],
    },
    s4: {
      h: "4. Retention period",
      p: "We keep your data for as long as necessary to fulfil the purpose for which it was collected:",
      items: [
        "Order data: 5 years (tax and accounting obligations).",
        "Newsletter data: until you withdraw your consent.",
        "Browsing data: as set out in the cookie policy (max. 13 months).",
        "Customer service data: 3 years from the last interaction.",
      ],
    },
    s5: {
      h: "5. Recipients and international transfers",
      p: "Your data may be disclosed to the following third parties in order to provide the contracted services:",
      items: [
        ["Stripe Inc.", "(payment gateway) — international transfer covered by standard contractual clauses."],
        ["Logistics providers", "— shipping address for delivery of your order."],
        ["Brevo / Resend", "(transactional email) — name and email for order confirmations."],
        ["Vercel", "(hosting) — browsing data stored on EU servers."],
        ["Supabase", "(database) — order and customer data, EU servers."],
      ],
      nota: "We do not sell or disclose your personal data to third parties for their own commercial purposes.",
    },
    s6: {
      h: "6. Your rights",
      p: "Under the GDPR, you have the right to:",
      items: [
        ["Access:", "find out what personal data of yours we process."],
        ["Rectification:", "correct inaccurate or incomplete data."],
        ["Erasure (the “right to be forgotten”):", "request the deletion of your data."],
        ["Restriction:", "ask us to restrict the processing of your data."],
        ["Portability:", "receive your data in a structured, machine-readable format."],
        ["Objection:", "object to processing based on legitimate interest."],
        ["Withdraw your consent", "at any time, without affecting the lawfulness of processing carried out beforehand."],
      ],
      ejercer: "To exercise any of these rights, write to us at",
      ejercerFin: "stating your name and your request. We will reply within a maximum of 30 days.",
      reclamar: "If you believe the processing of your data does not comply with the applicable rules, you may lodge a complaint with the",
      aepd: "Spanish Data Protection Agency (AEPD)",
    },
    s7: {
      h: "7. AI conversational assistant",
      p: "This website includes a conversational assistant based on artificial intelligence. When you use it, we process",
      pB1: "the messages in the conversation",
      pB2: "any contact details you voluntarily provide",
      y: "and",
      campos: "(name, email, phone)",
      items: [
        ["Purpose:", "to handle your enquiry, follow up on it and, where applicable, prepare a quote."],
        ["Legal basis:", "the taking of steps at your request prior to entering into a contract — writing in the chat is that request — and our legitimate interest in handling and following up on the enquiries we receive (GDPR art. 6.1.b and 6.1.f). Consent is not requested because it is not the applicable basis; you may object to the processing at any time."],
        ["Retention:", "12 months from the last message, unless it leads to an order, in which case the periods in section 4 apply."],
        ["Processors:", "the assistant relies on language-model providers acting as data processors, some located outside the European Economic Area, with the safeguards set out in Chapter V of the GDPR (see section 5)."],
        ["No automated decision-making:", "the assistant informs you and hands over to a person; it does not take automated decisions producing legal effects concerning you (GDPR art. 22)."],
      ],
      avisoB: "Do not enter passwords, bank or card details, or health data or other special categories of data into the chat.",
      avisoResto: "The assistant is instructed not to request or process them.",
    },
    s8: {
      h: "8. Security",
      p: "We apply appropriate technical and organisational measures to protect your data against unauthorised access, loss or alteration. Payment data is handled exclusively by Stripe (PCI DSS certified), and we never store credit card information on our systems.",
    },
    s9: {
      h: "9. Cookies",
      p: "We use first-party and third-party cookies. For more information, see our",
      link: "Cookie Policy",
    },
    s10: {
      h: "10. Changes",
      p: "We reserve the right to amend this Privacy Policy to adapt it to legislative or business changes. We will inform you of significant changes by email or through a visible notice on the Site. The version in force will always be available on this page.",
    },
  },

  // ─────────────────────────────────────────────────────────────────── FR
  fr: {
    metaTitle: "Politique de confidentialité",
    metaDesc: "Politique de confidentialité d’AizuaBeauty : quelles données personnelles nous collectons, comment nous les utilisons et les protégeons, et vos droits d’accès et d’effacement (RGPD).",
    h1: "Politique de confidentialité",
    actualizado: "Dernière mise à jour : mars 2026",
    s1: {
      h: "1. Responsable du traitement",
      p: "Conformément au Règlement (UE) 2016/679 du Parlement européen (RGPD) et à la loi organique espagnole 3/2018 (LOPDGDD, loi espagnole sur la protection des données), nous vous informons que le responsable du traitement de vos données personnelles est :",
      nombre: "Nom :", actividad: "Activité :",
      actividadV: "Commerce électronique et services de conseil/formation",
      email: "Adresse e-mail :", web: "Site web :",
    },
    s2: {
      h: "2. Données que nous collectons",
      p: "Nous collectons les types de données personnelles suivants :",
      items: [
        ["Données d’identification :", "nom, prénom, adresse de livraison."],
        ["Données de contact :", "adresse e-mail, numéro de téléphone (facultatif)."],
        ["Données de paiement :", "entièrement gérées par Stripe. Nous ne conservons aucune donnée de carte."],
        ["Données de navigation :", "adresse IP, type de navigateur, pages visitées (cookies techniques et analytiques)."],
        ["Données de commande :", "historique d’achats, statut de l’expédition, numéro de suivi."],
      ],
    },
    s3: {
      h: "3. Finalité et base légale du traitement",
      thFin: "Finalité", thBase: "Base légale (art. 6 RGPD)",
      rows: [
        ["Gestion des commandes et des expéditions", "Art. 6.1.b — Exécution d’un contrat"],
        ["Service client et retours", "Art. 6.1.b — Exécution d’un contrat"],
        ["Respect des obligations fiscales", "Art. 6.1.c — Obligation légale"],
        ["Envoi de communications commerciales (newsletter)", "Art. 6.1.a — Consentement"],
        ["Analyse de l’utilisation du site web", "Art. 6.1.f — Intérêt légitime"],
      ],
    },
    s4: {
      h: "4. Durée de conservation",
      p: "Nous conservons vos données pendant la durée nécessaire à la finalité pour laquelle elles ont été collectées :",
      items: [
        "Données de commande : 5 ans (obligations fiscales et comptables).",
        "Données de newsletter : jusqu’au retrait de votre consentement.",
        "Données de navigation : selon la politique de cookies (13 mois max.).",
        "Données du service client : 3 ans à compter de la dernière interaction.",
      ],
    },
    s5: {
      h: "5. Destinataires et transferts internationaux",
      p: "Vos données peuvent être communiquées aux tiers suivants afin d’assurer les services souscrits :",
      items: [
        ["Stripe Inc.", "(plateforme de paiement) — transfert international couvert par des clauses contractuelles types."],
        ["Prestataires logistiques", "— adresse de livraison pour l’acheminement de votre commande."],
        ["Brevo / Resend", "(e-mail transactionnel) — nom et e-mail pour les confirmations de commande."],
        ["Vercel", "(hébergement) — données de navigation stockées sur des serveurs de l’UE."],
        ["Supabase", "(base de données) — données de commandes et de clients, serveurs de l’UE."],
      ],
      nota: "Nous ne vendons ni ne cédons vos données personnelles à des tiers pour leurs propres finalités commerciales.",
    },
    s6: {
      h: "6. Vos droits",
      p: "Conformément au RGPD, vous avez le droit :",
      items: [
        ["Accès :", "de savoir quelles données personnelles vous concernant nous traitons."],
        ["Rectification :", "de corriger des données inexactes ou incomplètes."],
        ["Effacement (« droit à l’oubli ») :", "de demander la suppression de vos données."],
        ["Limitation :", "de demander que nous limitions le traitement de vos données."],
        ["Portabilité :", "de recevoir vos données dans un format structuré et lisible par machine."],
        ["Opposition :", "de vous opposer au traitement fondé sur l’intérêt légitime."],
        ["Retirer votre consentement", "à tout moment, sans que cela affecte la licéité du traitement effectué auparavant."],
      ],
      ejercer: "Pour exercer l’un de ces droits, écrivez-nous à",
      ejercerFin: "en indiquant votre nom et votre demande. Nous répondrons dans un délai maximum de 30 jours.",
      reclamar: "Si vous estimez que le traitement de vos données n’est pas conforme à la réglementation, vous pouvez introduire une réclamation auprès de l’",
      aepd: "Agence espagnole de protection des données (AEPD)",
    },
    s7: {
      h: "7. Assistant conversationnel avec IA",
      p: "Ce site intègre un assistant conversationnel fondé sur l’intelligence artificielle. Lorsque vous l’utilisez, nous traitons",
      pB1: "les messages de la conversation",
      pB2: "les données de contact que vous fournissez volontairement",
      y: "et",
      campos: "(nom, e-mail, téléphone)",
      items: [
        ["Finalité :", "traiter votre demande, en assurer le suivi et, le cas échéant, préparer un devis."],
        ["Base légale :", "l’exécution de mesures précontractuelles à votre demande — écrire dans le chat constitue cette demande — et notre intérêt légitime à traiter et suivre les demandes reçues (art. 6.1.b et 6.1.f RGPD). Aucun consentement ne vous est demandé car ce n’est pas la base applicable ; vous pouvez vous opposer au traitement à tout moment."],
        ["Conservation :", "12 mois à compter du dernier message, sauf si la conversation aboutit à une commande, auquel cas les durées de la section 4 s’appliquent."],
        ["Sous-traitants :", "l’assistant s’appuie sur des fournisseurs de modèles de langage agissant en qualité de sous-traitants, certains situés hors de l’Espace économique européen, avec les garanties du chapitre V du RGPD (voir section 5)."],
        ["Aucune décision automatisée :", "l’assistant informe et transfère à une personne ; il ne prend pas de décisions automatisées produisant des effets juridiques à votre égard (art. 22 RGPD)."],
      ],
      avisoB: "Ne saisissez dans le chat ni mots de passe, ni données bancaires ou de carte, ni données de santé ou autres catégories particulières.",
      avisoResto: "L’assistant a pour instruction de ne pas les demander ni les traiter.",
    },
    s8: {
      h: "8. Sécurité",
      p: "Nous appliquons des mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, perte ou altération. Les données de paiement sont gérées exclusivement par Stripe (certifié PCI DSS) et nous ne conservons jamais d’informations de carte bancaire dans nos systèmes.",
    },
    s9: {
      h: "9. Cookies",
      p: "Nous utilisons des cookies propres et de tiers. Pour plus d’informations, consultez notre",
      link: "Politique de cookies",
    },
    s10: {
      h: "10. Modifications",
      p: "Nous nous réservons le droit de modifier la présente politique de confidentialité afin de l’adapter à des évolutions législatives ou commerciales. Nous vous informerons de tout changement significatif par e-mail ou par un avis visible sur le Site. La version en vigueur sera toujours disponible sur cette page.",
    },
  },

  // ─────────────────────────────────────────────────────────────────── DE
  de: {
    metaTitle: "Datenschutzerklärung",
    metaDesc: "Datenschutzerklärung von AizuaBeauty: welche personenbezogenen Daten wir erheben, wie wir sie verwenden und schützen, und deine Rechte auf Auskunft und Löschung (DSGVO).",
    h1: "Datenschutzerklärung",
    actualizado: "Letzte Aktualisierung: März 2026",
    s1: {
      h: "1. Verantwortlicher",
      p: "Gemäß der Verordnung (EU) 2016/679 des Europäischen Parlaments (DSGVO) und dem spanischen Organgesetz 3/2018 (LOPDGDD, spanisches Datenschutzgesetz) informieren wir dich darüber, dass der Verantwortliche für die Verarbeitung deiner personenbezogenen Daten ist:",
      nombre: "Name:", actividad: "Tätigkeit:",
      actividadV: "E-Commerce sowie Beratungs- und Schulungsdienstleistungen",
      email: "E-Mail:", web: "Website:",
    },
    s2: {
      h: "2. Welche Daten wir erheben",
      p: "Wir erheben die folgenden Arten personenbezogener Daten:",
      items: [
        ["Identifikationsdaten:", "Vorname, Nachname, Lieferadresse."],
        ["Kontaktdaten:", "E-Mail-Adresse, Telefonnummer (optional)."],
        ["Zahlungsdaten:", "vollständig von Stripe verarbeitet. Wir speichern keine Kartendaten."],
        ["Nutzungsdaten:", "IP-Adresse, Browsertyp, besuchte Seiten (technische und Analyse-Cookies)."],
        ["Bestelldaten:", "Kaufhistorie, Versandstatus, Sendungsnummer."],
      ],
    },
    s3: {
      h: "3. Zweck und Rechtsgrundlage der Verarbeitung",
      thFin: "Zweck", thBase: "Rechtsgrundlage (Art. 6 DSGVO)",
      rows: [
        ["Bestell- und Versandabwicklung", "Art. 6.1.b — Vertragserfüllung"],
        ["Kundenservice und Rückgaben", "Art. 6.1.b — Vertragserfüllung"],
        ["Erfüllung steuerlicher Pflichten", "Art. 6.1.c — Rechtliche Verpflichtung"],
        ["Versand kommerzieller Mitteilungen (Newsletter)", "Art. 6.1.a — Einwilligung"],
        ["Analyse der Website-Nutzung", "Art. 6.1.f — Berechtigtes Interesse"],
      ],
    },
    s4: {
      h: "4. Speicherdauer",
      p: "Wir speichern deine Daten so lange, wie es für den Zweck erforderlich ist, für den sie erhoben wurden:",
      items: [
        "Bestelldaten: 5 Jahre (steuer- und handelsrechtliche Pflichten).",
        "Newsletter-Daten: bis zum Widerruf deiner Einwilligung.",
        "Nutzungsdaten: gemäß der Cookie-Richtlinie (max. 13 Monate).",
        "Kundenservice-Daten: 3 Jahre ab der letzten Interaktion.",
      ],
    },
    s5: {
      h: "5. Empfänger und internationale Übermittlungen",
      p: "Deine Daten können zur Erbringung der beauftragten Leistungen an folgende Dritte weitergegeben werden:",
      items: [
        ["Stripe Inc.", "(Zahlungsdienstleister) — internationale Übermittlung auf Grundlage von Standardvertragsklauseln."],
        ["Logistikdienstleister", "— Lieferadresse zur Zustellung deiner Bestellung."],
        ["Brevo / Resend", "(Transaktions-E-Mail) — Name und E-Mail für Bestellbestätigungen."],
        ["Vercel", "(Hosting) — Nutzungsdaten auf EU-Servern gespeichert."],
        ["Supabase", "(Datenbank) — Bestell- und Kundendaten, EU-Server."],
      ],
      nota: "Wir verkaufen deine personenbezogenen Daten nicht und geben sie nicht für eigene kommerzielle Zwecke Dritter weiter.",
    },
    s6: {
      h: "6. Deine Rechte",
      p: "Nach der DSGVO hast du das Recht auf:",
      items: [
        ["Auskunft:", "zu erfahren, welche personenbezogenen Daten von dir wir verarbeiten."],
        ["Berichtigung:", "unrichtige oder unvollständige Daten korrigieren zu lassen."],
        ["Löschung („Recht auf Vergessenwerden“):", "die Löschung deiner Daten zu verlangen."],
        ["Einschränkung:", "die Einschränkung der Verarbeitung deiner Daten zu verlangen."],
        ["Datenübertragbarkeit:", "deine Daten in einem strukturierten, maschinenlesbaren Format zu erhalten."],
        ["Widerspruch:", "der auf einem berechtigten Interesse beruhenden Verarbeitung zu widersprechen."],
        ["Widerruf der Einwilligung", "jederzeit, ohne dass die Rechtmäßigkeit der vorherigen Verarbeitung berührt wird."],
      ],
      ejercer: "Um eines dieser Rechte auszuüben, schreibe uns an",
      ejercerFin: "und gib deinen Namen und dein Anliegen an. Wir antworten innerhalb von höchstens 30 Tagen.",
      reclamar: "Wenn du der Auffassung bist, dass die Verarbeitung deiner Daten nicht den Vorschriften entspricht, kannst du Beschwerde bei der",
      aepd: "spanischen Datenschutzbehörde (AEPD)",
    },
    s7: {
      h: "7. KI-Chatassistent",
      p: "Diese Website enthält einen auf künstlicher Intelligenz basierenden Chatassistenten. Wenn du ihn nutzt, verarbeiten wir",
      pB1: "die Nachrichten der Unterhaltung",
      pB2: "die Kontaktdaten, die du freiwillig angibst",
      y: "und",
      campos: "(Name, E-Mail, Telefon)",
      items: [
        ["Zweck:", "deine Anfrage zu bearbeiten, nachzuverfolgen und gegebenenfalls ein Angebot zu erstellen."],
        ["Rechtsgrundlage:", "die Durchführung vorvertraglicher Maßnahmen auf deine Anfrage — das Schreiben im Chat ist diese Anfrage — sowie unser berechtigtes Interesse an der Bearbeitung und Nachverfolgung eingehender Anfragen (Art. 6.1.b und 6.1.f DSGVO). Es wird keine Einwilligung eingeholt, da sie nicht die zutreffende Rechtsgrundlage ist; du kannst der Verarbeitung jederzeit widersprechen."],
        ["Speicherdauer:", "12 Monate ab der letzten Nachricht, es sei denn, es kommt zu einer Bestellung; dann gelten die Fristen aus Abschnitt 4."],
        ["Auftragsverarbeiter:", "der Assistent nutzt Anbieter von Sprachmodellen, die als Auftragsverarbeiter handeln, einige außerhalb des Europäischen Wirtschaftsraums, mit den Garantien des Kapitels V der DSGVO (siehe Abschnitt 5)."],
        ["Keine automatisierten Entscheidungen:", "der Assistent informiert und übergibt an einen Menschen; er trifft keine automatisierten Entscheidungen mit rechtlicher Wirkung für dich (Art. 22 DSGVO)."],
      ],
      avisoB: "Gib im Chat keine Passwörter, Bank- oder Kartendaten und keine Gesundheitsdaten oder andere besondere Datenkategorien ein.",
      avisoResto: "Der Assistent ist angewiesen, sie weder zu erfragen noch zu verarbeiten.",
    },
    s8: {
      h: "8. Sicherheit",
      p: "Wir setzen angemessene technische und organisatorische Maßnahmen ein, um deine Daten vor unbefugtem Zugriff, Verlust oder Veränderung zu schützen. Zahlungsdaten werden ausschließlich von Stripe (PCI-DSS-zertifiziert) verarbeitet; Kreditkartendaten speichern wir niemals in unseren Systemen.",
    },
    s9: {
      h: "9. Cookies",
      p: "Wir verwenden eigene Cookies und Cookies Dritter. Weitere Informationen findest du in unserer",
      link: "Cookie-Richtlinie",
    },
    s10: {
      h: "10. Änderungen",
      p: "Wir behalten uns das Recht vor, diese Datenschutzerklärung zu ändern, um sie an gesetzliche oder geschäftliche Entwicklungen anzupassen. Über wesentliche Änderungen informieren wir dich per E-Mail oder durch einen sichtbaren Hinweis auf der Website. Die jeweils geltende Fassung ist stets auf dieser Seite verfügbar.",
    },
  },

  // ─────────────────────────────────────────────────────────────────── PT
  pt: {
    metaTitle: "Política de Privacidade",
    metaDesc: "Política de privacidade da AizuaBeauty: que dados pessoais recolhemos, como os usamos e protegemos, e os seus direitos de acesso e apagamento (RGPD).",
    h1: "Política de Privacidade",
    actualizado: "Última atualização: março de 2026",
    s1: {
      h: "1. Responsável pelo tratamento",
      p: "Em cumprimento do Regulamento (UE) 2016/679 do Parlamento Europeu (RGPD) e da Lei Orgânica espanhola 3/2018 (LOPDGDD, lei espanhola de proteção de dados), informamos que o responsável pelo tratamento dos seus dados pessoais é:",
      nombre: "Nome:", actividad: "Atividade:",
      actividadV: "Comércio eletrónico e serviços de consultoria/formação",
      email: "Correio eletrónico:", web: "Site:",
    },
    s2: {
      h: "2. Dados que recolhemos",
      p: "Recolhemos os seguintes tipos de dados pessoais:",
      items: [
        ["Dados de identificação:", "nome, apelidos, endereço de entrega."],
        ["Dados de contacto:", "endereço de correio eletrónico, número de telefone (opcional)."],
        ["Dados de pagamento:", "geridos integralmente pela Stripe. Não armazenamos dados do cartão."],
        ["Dados de navegação:", "endereço IP, tipo de navegador, páginas visitadas (cookies técnicos e analíticos)."],
        ["Dados da encomenda:", "histórico de compras, estado do envio, número de seguimento."],
      ],
    },
    s3: {
      h: "3. Finalidade e base legal do tratamento",
      thFin: "Finalidade", thBase: "Base legal (art. 6 RGPD)",
      rows: [
        ["Gestão de encomendas e envios", "Art. 6.1.b — Execução de contrato"],
        ["Apoio ao cliente e devoluções", "Art. 6.1.b — Execução de contrato"],
        ["Cumprimento de obrigações fiscais", "Art. 6.1.c — Obrigação legal"],
        ["Envio de comunicações comerciais (newsletter)", "Art. 6.1.a — Consentimento"],
        ["Análise da utilização do site", "Art. 6.1.f — Interesse legítimo"],
      ],
    },
    s4: {
      h: "4. Prazo de conservação",
      p: "Conservamos os seus dados durante o tempo necessário para cumprir a finalidade para a qual foram recolhidos:",
      items: [
        "Dados de encomendas: 5 anos (obrigações fiscais e contabilísticas).",
        "Dados da newsletter: até retirar o consentimento.",
        "Dados de navegação: conforme a política de cookies (máx. 13 meses).",
        "Dados de apoio ao cliente: 3 anos desde a última interação.",
      ],
    },
    s5: {
      h: "5. Destinatários e transferências internacionais",
      p: "Os seus dados podem ser comunicados aos seguintes terceiros para a prestação dos serviços contratados:",
      items: [
        ["Stripe Inc.", "(plataforma de pagamento) — transferência internacional coberta por cláusulas contratuais-tipo."],
        ["Prestadores de logística", "— endereço de entrega para envio da encomenda."],
        ["Brevo / Resend", "(correio transacional) — nome e email para confirmações de encomenda."],
        ["Vercel", "(alojamento) — dados de navegação armazenados em servidores da UE."],
        ["Supabase", "(base de dados) — dados de encomendas e clientes, servidores da UE."],
      ],
      nota: "Não vendemos nem cedemos os seus dados pessoais a terceiros para finalidades comerciais próprias destes.",
    },
    s6: {
      h: "6. Os seus direitos",
      p: "De acordo com o RGPD, tem direito a:",
      items: [
        ["Acesso:", "saber que dados pessoais seus tratamos."],
        ["Retificação:", "corrigir dados inexatos ou incompletos."],
        ["Apagamento («direito a ser esquecido»):", "solicitar a eliminação dos seus dados."],
        ["Limitação:", "solicitar que limitemos o tratamento dos seus dados."],
        ["Portabilidade:", "receber os seus dados em formato estruturado e legível por máquina."],
        ["Oposição:", "opor-se ao tratamento baseado em interesse legítimo."],
        ["Retirar o consentimento", "em qualquer momento, sem afetar a licitude do tratamento anterior."],
      ],
      ejercer: "Para exercer qualquer destes direitos, escreva-nos para",
      ejercerFin: "indicando o seu nome e o seu pedido. Responderemos no prazo máximo de 30 dias.",
      reclamar: "Se considerar que o tratamento dos seus dados não está conforme a legislação, pode apresentar reclamação à",
      aepd: "Agência Espanhola de Proteção de Dados (AEPD)",
    },
    s7: {
      h: "7. Assistente conversacional com IA",
      p: "Este site integra um assistente conversacional baseado em inteligência artificial. Quando o utiliza, tratamos",
      pB1: "as mensagens da conversa",
      pB2: "os dados de contacto que facilite voluntariamente",
      y: "e",
      campos: "(nome, email, telefone)",
      items: [
        ["Finalidade:", "atender o seu pedido, dar-lhe seguimento e, se aplicável, preparar um orçamento."],
        ["Base legal:", "a aplicação de diligências pré-contratuais a seu pedido — escrever no chat é esse pedido — e o nosso interesse legítimo em atender e acompanhar os pedidos recebidos (art. 6.1.b e 6.1.f RGPD). Não lhe é pedido consentimento porque não é a base aplicável; pode opor-se ao tratamento em qualquer momento."],
        ["Conservação:", "12 meses desde a última mensagem, salvo se resultar numa encomenda, caso em que se aplicam os prazos do ponto 4."],
        ["Subcontratantes:", "o assistente apoia-se em fornecedores de modelos de linguagem que atuam como subcontratantes, alguns localizados fora do Espaço Económico Europeu, com as garantias do Capítulo V do RGPD (ver ponto 5)."],
        ["Sem decisões automatizadas:", "o assistente informa e encaminha para uma pessoa; não toma decisões automatizadas com efeitos jurídicos sobre si (art. 22 RGPD)."],
      ],
      avisoB: "Não introduza no chat palavras-passe, dados bancários ou de cartão, nem dados de saúde ou outras categorias especiais.",
      avisoResto: "O assistente tem instruções para não os solicitar nem tratar.",
    },
    s8: {
      h: "8. Segurança",
      p: "Aplicamos medidas técnicas e organizativas adequadas para proteger os seus dados contra acessos não autorizados, perda ou alteração. Os dados de pagamento são geridos exclusivamente pela Stripe (certificada PCI DSS) e nunca armazenamos informação de cartão de crédito nos nossos sistemas.",
    },
    s9: {
      h: "9. Cookies",
      p: "Utilizamos cookies próprios e de terceiros. Para mais informação, consulte a nossa",
      link: "Política de Cookies",
    },
    s10: {
      h: "10. Alterações",
      p: "Reservamo-nos o direito de alterar esta Política de Privacidade para a adaptar a mudanças legislativas ou de negócio. Informaremos de alterações significativas por email ou através de aviso visível no Site. A versão em vigor estará sempre disponível nesta página.",
    },
  },

  // ─────────────────────────────────────────────────────────────────── IT
  it: {
    metaTitle: "Informativa sulla privacy",
    metaDesc: "Informativa sulla privacy di AizuaBeauty: quali dati personali raccogliamo, come li usiamo e proteggiamo, e i tuoi diritti di accesso e cancellazione (GDPR).",
    h1: "Informativa sulla privacy",
    actualizado: "Ultimo aggiornamento: marzo 2026",
    s1: {
      h: "1. Titolare del trattamento",
      p: "In conformità al Regolamento (UE) 2016/679 del Parlamento europeo (GDPR) e alla legge organica spagnola 3/2018 (LOPDGDD, legge spagnola sulla protezione dei dati), ti informiamo che il titolare del trattamento dei tuoi dati personali è:",
      nombre: "Nome:", actividad: "Attività:",
      actividadV: "Commercio elettronico e servizi di consulenza/formazione",
      email: "Email:", web: "Sito web:",
    },
    s2: {
      h: "2. Dati che raccogliamo",
      p: "Raccogliamo i seguenti tipi di dati personali:",
      items: [
        ["Dati identificativi:", "nome, cognome, indirizzo di spedizione."],
        ["Dati di contatto:", "indirizzo email, numero di telefono (facoltativo)."],
        ["Dati di pagamento:", "gestiti interamente da Stripe. Non conserviamo dati della carta."],
        ["Dati di navigazione:", "indirizzo IP, tipo di browser, pagine visitate (cookie tecnici e analitici)."],
        ["Dati dell’ordine:", "cronologia degli acquisti, stato della spedizione, numero di tracciamento."],
      ],
    },
    s3: {
      h: "3. Finalità e base giuridica del trattamento",
      thFin: "Finalità", thBase: "Base giuridica (art. 6 GDPR)",
      rows: [
        ["Gestione di ordini e spedizioni", "Art. 6.1.b — Esecuzione del contratto"],
        ["Assistenza clienti e resi", "Art. 6.1.b — Esecuzione del contratto"],
        ["Adempimento degli obblighi fiscali", "Art. 6.1.c — Obbligo legale"],
        ["Invio di comunicazioni commerciali (newsletter)", "Art. 6.1.a — Consenso"],
        ["Analisi dell’utilizzo del sito web", "Art. 6.1.f — Legittimo interesse"],
      ],
    },
    s4: {
      h: "4. Periodo di conservazione",
      p: "Conserviamo i tuoi dati per il tempo necessario a soddisfare la finalità per cui sono stati raccolti:",
      items: [
        "Dati degli ordini: 5 anni (obblighi fiscali e contabili).",
        "Dati della newsletter: fino alla revoca del consenso.",
        "Dati di navigazione: secondo l’informativa sui cookie (max. 13 mesi).",
        "Dati di assistenza clienti: 3 anni dall’ultima interazione.",
      ],
    },
    s5: {
      h: "5. Destinatari e trasferimenti internazionali",
      p: "I tuoi dati possono essere comunicati ai seguenti terzi per l’erogazione dei servizi richiesti:",
      items: [
        ["Stripe Inc.", "(gateway di pagamento) — trasferimento internazionale coperto da clausole contrattuali tipo."],
        ["Fornitori logistici", "— indirizzo di spedizione per la consegna dell’ordine."],
        ["Brevo / Resend", "(email transazionale) — nome ed email per le conferme d’ordine."],
        ["Vercel", "(hosting) — dati di navigazione conservati su server UE."],
        ["Supabase", "(base di dati) — dati di ordini e clienti, server UE."],
      ],
      nota: "Non vendiamo né cediamo i tuoi dati personali a terzi per loro finalità commerciali.",
    },
    s6: {
      h: "6. I tuoi diritti",
      p: "In base al GDPR, hai diritto a:",
      items: [
        ["Accesso:", "sapere quali tuoi dati personali trattiamo."],
        ["Rettifica:", "correggere dati inesatti o incompleti."],
        ["Cancellazione («diritto all’oblio»):", "chiedere l’eliminazione dei tuoi dati."],
        ["Limitazione:", "chiedere che limitiamo il trattamento dei tuoi dati."],
        ["Portabilità:", "ricevere i tuoi dati in formato strutturato e leggibile da dispositivo automatico."],
        ["Opposizione:", "opporti al trattamento basato sul legittimo interesse."],
        ["Revocare il consenso", "in qualsiasi momento, senza pregiudicare la liceità del trattamento precedente."],
      ],
      ejercer: "Per esercitare uno di questi diritti, scrivici a",
      ejercerFin: "indicando il tuo nome e la tua richiesta. Risponderemo entro un massimo di 30 giorni.",
      reclamar: "Se ritieni che il trattamento dei tuoi dati non sia conforme alla normativa, puoi presentare reclamo all’",
      aepd: "Agenzia spagnola per la protezione dei dati (AEPD)",
    },
    s7: {
      h: "7. Assistente conversazionale con IA",
      p: "Questo sito integra un assistente conversazionale basato sull’intelligenza artificiale. Quando lo utilizzi trattiamo",
      pB1: "i messaggi della conversazione",
      pB2: "i dati di contatto che fornisci volontariamente",
      y: "e",
      campos: "(nome, email, telefono)",
      items: [
        ["Finalità:", "gestire la tua richiesta, darle seguito e, se del caso, preparare un preventivo."],
        ["Base giuridica:", "l’esecuzione di misure precontrattuali su tua richiesta — scrivere nella chat è quella richiesta — e il nostro legittimo interesse a gestire e dare seguito alle richieste ricevute (art. 6.1.b e 6.1.f GDPR). Non ti viene chiesto il consenso perché non è la base applicabile; puoi opporti al trattamento in qualsiasi momento."],
        ["Conservazione:", "12 mesi dall’ultimo messaggio, salvo che ne derivi un ordine, in tal caso si applicano i termini della sezione 4."],
        ["Responsabili del trattamento:", "l’assistente si avvale di fornitori di modelli linguistici che agiscono come responsabili del trattamento, alcuni situati fuori dallo Spazio economico europeo, con le garanzie del Capo V del GDPR (vedi sezione 5)."],
        ["Nessuna decisione automatizzata:", "l’assistente informa e passa a una persona; non adotta decisioni automatizzate con effetti giuridici nei tuoi confronti (art. 22 GDPR)."],
      ],
      avisoB: "Non inserire nella chat password, dati bancari o della carta, né dati sulla salute o altre categorie particolari.",
      avisoResto: "L’assistente ha istruzioni di non richiederli né trattarli.",
    },
    s8: {
      h: "8. Sicurezza",
      p: "Applichiamo misure tecniche e organizzative adeguate per proteggere i tuoi dati da accessi non autorizzati, perdita o alterazione. I dati di pagamento sono gestiti esclusivamente da Stripe (certificata PCI DSS) e non conserviamo mai informazioni sulle carte di credito nei nostri sistemi.",
    },
    s9: {
      h: "9. Cookie",
      p: "Utilizziamo cookie propri e di terze parti. Per maggiori informazioni, consulta la nostra",
      link: "Informativa sui cookie",
    },
    s10: {
      h: "10. Modifiche",
      p: "Ci riserviamo il diritto di modificare la presente informativa sulla privacy per adeguarla a cambiamenti legislativi o commerciali. Ti informeremo di modifiche significative via email o mediante avviso visibile sul Sito. La versione in vigore sarà sempre disponibile in questa pagina.",
    },
  },
};

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const base = "https://beauty.aizualabs.com";
  const l = pick(params.locale);
  const t = T[l];
  // El canonical y el OG apuntaban SIEMPRE a /es/legal/privacidad, en los seis
  // idiomas: la versión alemana se declaraba a sí misma como duplicado de la
  // española. Ahora cada idioma es canónico de su propia URL.
  const url = `${base}/${l}/legal/privacidad`;
  return {
    title: t.metaTitle,
    description: t.metaDesc,
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(LOCALES.map((x) => [x, `${base}/${x}/legal/privacidad`])),
        "x-default": `${base}/es/legal/privacidad`,
      },
    },
    // s236: sin openGraph propio, la pagina heredaba el del root layout ENTERO
    // salvo el campo url (Next.js no lo hereda ni lo infiere de metadataBase) —
    // Ahrefs lo marcaba "Open Graph tags incomplete". Se repite aqui type/
    // siteName/locale/images del root para no perderlos al declarar openGraph.
    openGraph: {
      title: t.metaTitle,
      description: t.metaDesc,
      url,
      type: "website",
      siteName: "AizuaBeauty",
      locale: OG_LOCALE[l],
      images: [{ url: `${base}/og-home.jpg`, width: 1200, height: 630, alt: "AizuaBeauty — Natural Beauty & Fashion" }],
    },
  };
}

export const dynamic = "force-dynamic";

const H2 = "text-xl font-semibold text-gray-800 mb-3";
const UL_DISC = "list-disc pl-5 space-y-1 text-sm";

function Negrita({ item }: { item: Item }) {
  return (
    <li>
      <strong>{item[0]}</strong> {item[1]}
    </li>
  );
}

export default async function PrivacidadPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const l = pick(params.locale);
  const t = T[l];

  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-700">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.h1}</h1>
      <p className="text-sm text-gray-400 mb-10">{t.actualizado}</p>

      <section className="mb-8">
        <h2 className={H2}>{t.s1.h}</h2>
        <p className="mb-2">{t.s1.p}</p>
        <ul className="list-none space-y-1 text-sm">
          <li><strong>{t.s1.nombre}</strong> Aizüa</li>
          <li><strong>{t.s1.actividad}</strong> {t.s1.actividadV}</li>
          <li><strong>{t.s1.email}</strong> info@aizualabs.com</li>
          <li><strong>{t.s1.web}</strong> https://beauty.aizualabs.com</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className={H2}>{t.s2.h}</h2>
        <p className="mb-2">{t.s2.p}</p>
        <ul className={UL_DISC}>
          {t.s2.items.map((it) => <Negrita key={it[0]} item={it} />)}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className={H2}>{t.s3.h}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2 border border-gray-200">{t.s3.thFin}</th>
                <th className="text-left p-2 border border-gray-200">{t.s3.thBase}</th>
              </tr>
            </thead>
            <tbody>
              {t.s3.rows.map(([fin, bas], i) => (
                <tr key={fin} className={i % 2 === 1 ? "bg-gray-50" : undefined}>
                  <td className="p-2 border border-gray-200">{fin}</td>
                  <td className="p-2 border border-gray-200">{bas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8">
        <h2 className={H2}>{t.s4.h}</h2>
        <p className="mb-2">{t.s4.p}</p>
        <ul className={UL_DISC}>
          {t.s4.items.map((x) => <li key={x}>{x}</li>)}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className={H2}>{t.s5.h}</h2>
        <p className="mb-2">{t.s5.p}</p>
        <ul className={UL_DISC}>
          {t.s5.items.map((it) => <Negrita key={it[0]} item={it} />)}
        </ul>
        <p className="mt-2 text-sm text-gray-500">{t.s5.nota}</p>
      </section>

      <section className="mb-8">
        <h2 className={H2}>{t.s6.h}</h2>
        <p className="mb-2">{t.s6.p}</p>
        <ul className={UL_DISC}>
          {t.s6.items.map((it) => <Negrita key={it[0]} item={it} />)}
        </ul>
        <p className="mt-2">
          {t.s6.ejercer}{" "}
          <a href="mailto:info@aizualabs.com" className="text-blue-600 underline">
            info@aizualabs.com
          </a>
          {" "}{t.s6.ejercerFin}
        </p>
        <p className="mt-2">
          {t.s6.reclamar}{" "}
          <a
            href="https://www.aepd.es"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            {t.s6.aepd}
          </a>
          .
        </p>
      </section>

      <section className="mb-8" id="asistente-ia">
        <h2 className={H2}>{t.s7.h}</h2>
        <p className="mb-2">
          {t.s7.p} <strong>{t.s7.pB1}</strong> {t.s7.y}{" "}
          <strong>{t.s7.pB2}</strong> {t.s7.campos}.
        </p>
        <ul className={UL_DISC}>
          {t.s7.items.map((it) => <Negrita key={it[0]} item={it} />)}
        </ul>
        <p className="mt-2 text-sm">
          <strong>{t.s7.avisoB}</strong> {t.s7.avisoResto}
        </p>
      </section>

      <section className="mb-8">
        <h2 className={H2}>{t.s8.h}</h2>
        <p>{t.s8.p}</p>
      </section>

      <section className="mb-8">
        <h2 className={H2}>{t.s9.h}</h2>
        <p>
          {t.s9.p}{" "}
          <a href={`/${l}/legal/cookies`} className="text-blue-600 underline">
            {t.s9.link}
          </a>
          .
        </p>
      </section>

      <section className="mb-8">
        <h2 className={H2}>{t.s10.h}</h2>
        <p>{t.s10.p}</p>
      </section>
    </main>
  );
}
