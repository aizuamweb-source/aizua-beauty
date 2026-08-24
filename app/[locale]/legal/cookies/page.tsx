/**
 * Política de Cookies — AizuaBeauty, en los 6 idiomas de la tienda.
 *
 * ⚠️ GENERADA POR SUSTITUCION desde Aizua-store: el cuerpo en español de las dos
 * tiendas era IDENTICO (verificado con diff normalizando marca y dominio), solo
 * cambiaban los metadatos. Si tocas una, toca la otra — dos copias del mismo
 * texto legal en seis idiomas es garantizar que un día digan cosas distintas.
 *
 * El detalle del patrón y de las trampas está en el encabezado del fichero
 * equivalente de Aizua-store.
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

/** Fragmento de URL que cada proveedor usa para su versión localizada. */
const URLS: Record<Loc, { stripe: string; firefox: string; safari: string; edge: string; tiktok: string; google: string }> = {
  es: {
    stripe:  "https://stripe.com/es/privacy",
    firefox: "https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias",
    safari:  "https://support.apple.com/es-es/guide/safari/sfri11471/mac",
    edge:    "https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09",
    tiktok:  "https://www.tiktok.com/legal/page/eea/privacy-policy/es",
    google:  "https://policies.google.com/privacy?hl=es",
  },
  en: {
    stripe:  "https://stripe.com/privacy",
    firefox: "https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop",
    safari:  "https://support.apple.com/en-gb/guide/safari/sfri11471/mac",
    edge:    "https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09",
    tiktok:  "https://www.tiktok.com/legal/page/eea/privacy-policy/en",
    google:  "https://policies.google.com/privacy?hl=en",
  },
  fr: {
    stripe:  "https://stripe.com/fr/privacy",
    firefox: "https://support.mozilla.org/fr/kb/protection-renforcee-contre-pistage-firefox-ordinateur",
    safari:  "https://support.apple.com/fr-fr/guide/safari/sfri11471/mac",
    edge:    "https://support.microsoft.com/fr-fr/microsoft-edge/supprimer-les-cookies-dans-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09",
    tiktok:  "https://www.tiktok.com/legal/page/eea/privacy-policy/fr",
    google:  "https://policies.google.com/privacy?hl=fr",
  },
  de: {
    stripe:  "https://stripe.com/de/privacy",
    firefox: "https://support.mozilla.org/de/kb/verbesserter-schutz-aktivitatenverfolgung-desktop",
    safari:  "https://support.apple.com/de-de/guide/safari/sfri11471/mac",
    edge:    "https://support.microsoft.com/de-de/microsoft-edge/l%C3%B6schen-von-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09",
    tiktok:  "https://www.tiktok.com/legal/page/eea/privacy-policy/de",
    google:  "https://policies.google.com/privacy?hl=de",
  },
  pt: {
    stripe:  "https://stripe.com/pt/privacy",
    firefox: "https://support.mozilla.org/pt-PT/kb/protecao-melhorada-contra-rastreamento-firefox-computador",
    safari:  "https://support.apple.com/pt-pt/guide/safari/sfri11471/mac",
    edge:    "https://support.microsoft.com/pt-pt/microsoft-edge/eliminar-cookies-no-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09",
    tiktok:  "https://www.tiktok.com/legal/page/eea/privacy-policy/pt",
    google:  "https://policies.google.com/privacy?hl=pt",
  },
  it: {
    stripe:  "https://stripe.com/it/privacy",
    firefox: "https://support.mozilla.org/it/kb/protezione-antitracciamento-avanzata-firefox-desktop",
    safari:  "https://support.apple.com/it-it/guide/safari/sfri11471/mac",
    edge:    "https://support.microsoft.com/it-it/microsoft-edge/eliminare-i-cookie-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09",
    tiktok:  "https://www.tiktok.com/legal/page/eea/privacy-policy/it",
    google:  "https://policies.google.com/privacy?hl=it",
  },
};

interface Textos {
  metaTitle: string;
  metaDesc: string;
  h1: string;
  actualizado: string;
  thCookie: string;
  thFin: string;
  thDur: string;
  thPlataforma: string;
  /** Duraciones: prosa, se traducen. Los nombres de cookie, nunca. */
  dur: { sesion: string; anio1: string; min30: string; anios2: string; meses3: string; meses13: string; dias7: string };
  s1: { h: string; p: string };
  s2: {
    h: string;
    tecH: string; tecP: string; tecCarrito: string; tecIdioma: string;
    pagoH: string; pagoP: string; pagoFraude: string; pagoSesion: string;
    anaH: string; anaP: string; anaUser: string; anaSesion: string;
    mkH: string; mkP: string; mkMetaPixel: string; mkTiktokConv: string; mkMetaAds: string; mkTiktokClic: string;
  };
  s3: { h: string; p: string; stripe: string; stripeLink: string; ga: string; gaLink: string; meta: string; metaLink: string; tiktok: string; tiktokLink: string };
  s4: { h: string; p: string; nota: string };
  s5: { h: string; p: string };
  s6: { h: string; p: string };
  s7: { h: string; p: string };
}

const T: Record<Loc, Textos> = {
  es: {
    metaTitle: "Política de Cookies",
    metaDesc: "Política de cookies de AizuaBeauty: qué cookies propias y de terceros usamos, con qué finalidad y cómo puedes gestionarlas o rechazarlas.",
    h1: "Política de Cookies",
    actualizado: "Última actualización: marzo 2026",
    thCookie: "Cookie", thFin: "Finalidad", thDur: "Duración", thPlataforma: "Plataforma",
    dur: { sesion: "Sesión", anio1: "1 año", min30: "30 min", anios2: "2 años", meses3: "3 meses", meses13: "13 meses", dias7: "7 días" },
    s1: {
      h: "1. ¿Qué son las cookies?",
      p: "Las cookies son pequeños archivos de texto que los sitios web almacenan en tu dispositivo cuando los visitas. Permiten que el sitio recuerde tus preferencias, mantenga tu sesión activa y recopile información sobre cómo utilizas la página.",
    },
    s2: {
      h: "2. Cookies que utilizamos",
      tecH: "Cookies técnicas (necesarias)",
      tecP: "Son imprescindibles para el funcionamiento básico de la tienda. No requieren consentimiento.",
      tecCarrito: "Mantiene el carrito de compra activo",
      tecIdioma: "Recuerda el idioma seleccionado",
      pagoH: "Cookies de pago (Stripe)",
      pagoP: "Stripe utiliza cookies propias para garantizar la seguridad del proceso de pago y prevenir el fraude.",
      pagoFraude: "Detección de fraude en pagos",
      pagoSesion: "Identificador de sesión de pago",
      anaH: "Cookies analíticas (opcionales)",
      anaP: "Nos ayudan a entender cómo los usuarios interactúan con la tienda para mejorar la experiencia. Solo se activan con tu consentimiento.",
      anaUser: "Google Analytics — identificador de usuario",
      anaSesion: "Google Analytics — estado de sesión",
      mkH: "Cookies de marketing (opcionales)",
      mkP: "Utilizadas para mostrarte publicidad relevante en otras plataformas. Solo se activan con tu consentimiento.",
      mkMetaPixel: "Meta (Facebook/Instagram) Pixel",
      mkTiktokConv: "TikTok Pixel — seguimiento de conversiones",
      mkMetaAds: "Meta — publicidad personalizada",
      mkTiktokClic: "TikTok — identificador de clic en anuncio",
    },
    s3: {
      h: "3. Cookies de terceros",
      p: "Algunos servicios integrados en esta tienda pueden instalar sus propias cookies:",
      stripe: "— procesador de pagos.", stripeLink: "Política de privacidad de Stripe",
      ga: "— análisis de tráfico web.", gaLink: "Política de privacidad de Google",
      meta: "— publicidad y retargeting.", metaLink: "Política de privacidad de Meta",
      tiktok: "— publicidad y retargeting.", tiktokLink: "Política de privacidad de TikTok",
    },
    s4: {
      h: "4. Cómo gestionar las cookies",
      p: "Puedes controlar y eliminar las cookies desde la configuración de tu navegador:",
      nota: "Ten en cuenta que deshabilitar ciertas cookies puede afectar al funcionamiento de la tienda (por ejemplo, el carrito de compra).",
    },
    s5: {
      h: "5. Base legal",
      p: "El uso de cookies técnicas y de pago se basa en el interés legítimo y la necesidad contractual (art. 6.1.b y 6.1.f RGPD). Las cookies analíticas y de marketing requieren tu consentimiento explícito (art. 6.1.a RGPD), de acuerdo con el art. 22.2 de la LSSI.",
    },
    s6: {
      h: "6. Actualizaciones",
      p: "Esta política puede actualizarse para reflejar cambios en los servicios utilizados o en la normativa aplicable. Te recomendamos revisarla periódicamente.",
    },
    s7: {
      h: "7. Contacto",
      p: "Para cualquier consulta sobre el uso de cookies en esta tienda, puedes contactarnos en:",
    },
  },

  en: {
    metaTitle: "Cookie Policy",
    metaDesc: "AizuaBeauty cookie policy: which first-party and third-party cookies we use, for what purpose, and how you can manage or refuse them.",
    h1: "Cookie Policy",
    actualizado: "Last updated: March 2026",
    thCookie: "Cookie", thFin: "Purpose", thDur: "Duration", thPlataforma: "Platform",
    dur: { sesion: "Session", anio1: "1 year", min30: "30 min", anios2: "2 years", meses3: "3 months", meses13: "13 months", dias7: "7 days" },
    s1: {
      h: "1. What are cookies?",
      p: "Cookies are small text files that websites store on your device when you visit them. They allow the site to remember your preferences, keep your session active and collect information about how you use the page.",
    },
    s2: {
      h: "2. Cookies we use",
      tecH: "Technical cookies (necessary)",
      tecP: "These are essential for the basic operation of the store. They do not require consent.",
      tecCarrito: "Keeps your shopping cart active",
      tecIdioma: "Remembers the selected language",
      pagoH: "Payment cookies (Stripe)",
      pagoP: "Stripe uses its own cookies to secure the payment process and prevent fraud.",
      pagoFraude: "Payment fraud detection",
      pagoSesion: "Payment session identifier",
      anaH: "Analytics cookies (optional)",
      anaP: "They help us understand how users interact with the store so we can improve the experience. They are only enabled with your consent.",
      anaUser: "Google Analytics — user identifier",
      anaSesion: "Google Analytics — session state",
      mkH: "Marketing cookies (optional)",
      mkP: "Used to show you relevant advertising on other platforms. They are only enabled with your consent.",
      mkMetaPixel: "Meta (Facebook/Instagram) Pixel",
      mkTiktokConv: "TikTok Pixel — conversion tracking",
      mkMetaAds: "Meta — personalised advertising",
      mkTiktokClic: "TikTok — ad click identifier",
    },
    s3: {
      h: "3. Third-party cookies",
      p: "Some services integrated into this store may set their own cookies:",
      stripe: "— payment processor.", stripeLink: "Stripe privacy policy",
      ga: "— web traffic analysis.", gaLink: "Google privacy policy",
      meta: "— advertising and retargeting.", metaLink: "Meta privacy policy",
      tiktok: "— advertising and retargeting.", tiktokLink: "TikTok privacy policy",
    },
    s4: {
      h: "4. How to manage cookies",
      p: "You can control and delete cookies from your browser settings:",
      nota: "Please note that disabling certain cookies may affect how the store works (for example, the shopping cart).",
    },
    s5: {
      h: "5. Legal basis",
      p: "The use of technical and payment cookies is based on legitimate interest and contractual necessity (GDPR art. 6.1.b and 6.1.f). Analytics and marketing cookies require your explicit consent (GDPR art. 6.1.a), in accordance with art. 22.2 of the Spanish LSSI (information society services act).",
    },
    s6: {
      h: "6. Updates",
      p: "This policy may be updated to reflect changes in the services used or in the applicable rules. We recommend reviewing it periodically.",
    },
    s7: {
      h: "7. Contact",
      p: "For any questions about the use of cookies in this store, you can contact us at:",
    },
  },

  fr: {
    metaTitle: "Politique de cookies",
    metaDesc: "Politique de cookies d’AizuaBeauty : quels cookies propres et de tiers nous utilisons, dans quel but et comment vous pouvez les gérer ou les refuser.",
    h1: "Politique de cookies",
    actualizado: "Dernière mise à jour : mars 2026",
    thCookie: "Cookie", thFin: "Finalité", thDur: "Durée", thPlataforma: "Plateforme",
    dur: { sesion: "Session", anio1: "1 an", min30: "30 min", anios2: "2 ans", meses3: "3 mois", meses13: "13 mois", dias7: "7 jours" },
    s1: {
      h: "1. Qu’est-ce qu’un cookie ?",
      p: "Les cookies sont de petits fichiers texte que les sites web enregistrent sur votre appareil lorsque vous les visitez. Ils permettent au site de mémoriser vos préférences, de maintenir votre session active et de recueillir des informations sur votre utilisation de la page.",
    },
    s2: {
      h: "2. Cookies que nous utilisons",
      tecH: "Cookies techniques (nécessaires)",
      tecP: "Ils sont indispensables au fonctionnement de base de la boutique. Ils ne requièrent pas de consentement.",
      tecCarrito: "Maintient votre panier actif",
      tecIdioma: "Mémorise la langue sélectionnée",
      pagoH: "Cookies de paiement (Stripe)",
      pagoP: "Stripe utilise ses propres cookies pour garantir la sécurité du processus de paiement et prévenir la fraude.",
      pagoFraude: "Détection de la fraude au paiement",
      pagoSesion: "Identifiant de session de paiement",
      anaH: "Cookies analytiques (facultatifs)",
      anaP: "Ils nous aident à comprendre comment les utilisateurs interagissent avec la boutique afin d’améliorer l’expérience. Ils ne s’activent qu’avec votre consentement.",
      anaUser: "Google Analytics — identifiant d’utilisateur",
      anaSesion: "Google Analytics — état de la session",
      mkH: "Cookies marketing (facultatifs)",
      mkP: "Utilisés pour vous présenter des publicités pertinentes sur d’autres plateformes. Ils ne s’activent qu’avec votre consentement.",
      mkMetaPixel: "Meta (Facebook/Instagram) Pixel",
      mkTiktokConv: "TikTok Pixel — suivi des conversions",
      mkMetaAds: "Meta — publicité personnalisée",
      mkTiktokClic: "TikTok — identifiant de clic publicitaire",
    },
    s3: {
      h: "3. Cookies de tiers",
      p: "Certains services intégrés à cette boutique peuvent installer leurs propres cookies :",
      stripe: "— prestataire de paiement.", stripeLink: "Politique de confidentialité de Stripe",
      ga: "— analyse du trafic web.", gaLink: "Politique de confidentialité de Google",
      meta: "— publicité et reciblage.", metaLink: "Politique de confidentialité de Meta",
      tiktok: "— publicité et reciblage.", tiktokLink: "Politique de confidentialité de TikTok",
    },
    s4: {
      h: "4. Comment gérer les cookies",
      p: "Vous pouvez contrôler et supprimer les cookies depuis les paramètres de votre navigateur :",
      nota: "Notez que la désactivation de certains cookies peut affecter le fonctionnement de la boutique (par exemple, le panier).",
    },
    s5: {
      h: "5. Base légale",
      p: "L’utilisation des cookies techniques et de paiement repose sur l’intérêt légitime et la nécessité contractuelle (art. 6.1.b et 6.1.f RGPD). Les cookies analytiques et marketing requièrent votre consentement explicite (art. 6.1.a RGPD), conformément à l’art. 22.2 de la LSSI espagnole (loi sur les services de la société de l’information).",
    },
    s6: {
      h: "6. Mises à jour",
      p: "Cette politique peut être mise à jour pour refléter des changements dans les services utilisés ou dans la réglementation applicable. Nous vous recommandons de la consulter régulièrement.",
    },
    s7: {
      h: "7. Contact",
      p: "Pour toute question sur l’utilisation des cookies dans cette boutique, vous pouvez nous contacter à :",
    },
  },

  de: {
    metaTitle: "Cookie-Richtlinie",
    metaDesc: "Cookie-Richtlinie von AizuaBeauty: welche eigenen und Drittanbieter-Cookies wir verwenden, zu welchem Zweck und wie du sie verwalten oder ablehnen kannst.",
    h1: "Cookie-Richtlinie",
    actualizado: "Letzte Aktualisierung: März 2026",
    thCookie: "Cookie", thFin: "Zweck", thDur: "Dauer", thPlataforma: "Plattform",
    dur: { sesion: "Sitzung", anio1: "1 Jahr", min30: "30 Min.", anios2: "2 Jahre", meses3: "3 Monate", meses13: "13 Monate", dias7: "7 Tage" },
    s1: {
      h: "1. Was sind Cookies?",
      p: "Cookies sind kleine Textdateien, die Websites beim Besuch auf deinem Gerät speichern. Sie ermöglichen es der Website, deine Einstellungen zu speichern, deine Sitzung aktiv zu halten und Informationen darüber zu erfassen, wie du die Seite nutzt.",
    },
    s2: {
      h: "2. Cookies, die wir verwenden",
      tecH: "Technische Cookies (notwendig)",
      tecP: "Sie sind für den grundlegenden Betrieb des Shops unerlässlich und erfordern keine Einwilligung.",
      tecCarrito: "Hält deinen Warenkorb aktiv",
      tecIdioma: "Speichert die gewählte Sprache",
      pagoH: "Zahlungs-Cookies (Stripe)",
      pagoP: "Stripe verwendet eigene Cookies, um die Sicherheit des Zahlungsvorgangs zu gewährleisten und Betrug zu verhindern.",
      pagoFraude: "Betrugserkennung bei Zahlungen",
      pagoSesion: "Kennung der Zahlungssitzung",
      anaH: "Analyse-Cookies (optional)",
      anaP: "Sie helfen uns zu verstehen, wie Nutzer mit dem Shop interagieren, um das Erlebnis zu verbessern. Sie werden nur mit deiner Einwilligung aktiviert.",
      anaUser: "Google Analytics — Nutzerkennung",
      anaSesion: "Google Analytics — Sitzungsstatus",
      mkH: "Marketing-Cookies (optional)",
      mkP: "Werden verwendet, um dir relevante Werbung auf anderen Plattformen anzuzeigen. Sie werden nur mit deiner Einwilligung aktiviert.",
      mkMetaPixel: "Meta (Facebook/Instagram) Pixel",
      mkTiktokConv: "TikTok Pixel — Conversion-Tracking",
      mkMetaAds: "Meta — personalisierte Werbung",
      mkTiktokClic: "TikTok — Kennung des Anzeigenklicks",
    },
    s3: {
      h: "3. Cookies von Dritten",
      p: "Einige in diesem Shop eingebundene Dienste können eigene Cookies setzen:",
      stripe: "— Zahlungsdienstleister.", stripeLink: "Datenschutzerklärung von Stripe",
      ga: "— Analyse des Website-Verkehrs.", gaLink: "Datenschutzerklärung von Google",
      meta: "— Werbung und Retargeting.", metaLink: "Datenschutzerklärung von Meta",
      tiktok: "— Werbung und Retargeting.", tiktokLink: "Datenschutzerklärung von TikTok",
    },
    s4: {
      h: "4. Cookies verwalten",
      p: "Du kannst Cookies über die Einstellungen deines Browsers kontrollieren und löschen:",
      nota: "Bitte beachte, dass das Deaktivieren bestimmter Cookies die Funktion des Shops beeinträchtigen kann (zum Beispiel den Warenkorb).",
    },
    s5: {
      h: "5. Rechtsgrundlage",
      p: "Die Verwendung technischer und zahlungsbezogener Cookies beruht auf dem berechtigten Interesse und der vertraglichen Notwendigkeit (Art. 6.1.b und 6.1.f DSGVO). Analyse- und Marketing-Cookies erfordern deine ausdrückliche Einwilligung (Art. 6.1.a DSGVO), gemäß Art. 22.2 des spanischen LSSI (Gesetz über Dienste der Informationsgesellschaft).",
    },
    s6: {
      h: "6. Aktualisierungen",
      p: "Diese Richtlinie kann aktualisiert werden, um Änderungen bei den genutzten Diensten oder in den geltenden Vorschriften abzubilden. Wir empfehlen, sie regelmäßig zu prüfen.",
    },
    s7: {
      h: "7. Kontakt",
      p: "Bei Fragen zur Verwendung von Cookies in diesem Shop kannst du uns hier kontaktieren:",
    },
  },

  pt: {
    metaTitle: "Política de Cookies",
    metaDesc: "Política de cookies da AizuaBeauty: que cookies próprios e de terceiros usamos, com que finalidade e como pode geri-los ou recusá-los.",
    h1: "Política de Cookies",
    actualizado: "Última atualização: março de 2026",
    thCookie: "Cookie", thFin: "Finalidade", thDur: "Duração", thPlataforma: "Plataforma",
    dur: { sesion: "Sessão", anio1: "1 ano", min30: "30 min", anios2: "2 anos", meses3: "3 meses", meses13: "13 meses", dias7: "7 dias" },
    s1: {
      h: "1. O que são cookies?",
      p: "Os cookies são pequenos ficheiros de texto que os sites guardam no seu dispositivo quando os visita. Permitem que o site memorize as suas preferências, mantenha a sessão ativa e recolha informação sobre a forma como utiliza a página.",
    },
    s2: {
      h: "2. Cookies que utilizamos",
      tecH: "Cookies técnicos (necessários)",
      tecP: "São imprescindíveis para o funcionamento básico da loja. Não requerem consentimento.",
      tecCarrito: "Mantém o carrinho de compras ativo",
      tecIdioma: "Memoriza o idioma selecionado",
      pagoH: "Cookies de pagamento (Stripe)",
      pagoP: "A Stripe utiliza cookies próprios para garantir a segurança do processo de pagamento e prevenir fraude.",
      pagoFraude: "Deteção de fraude em pagamentos",
      pagoSesion: "Identificador da sessão de pagamento",
      anaH: "Cookies analíticos (opcionais)",
      anaP: "Ajudam-nos a compreender como os utilizadores interagem com a loja para melhorar a experiência. Só são ativados com o seu consentimento.",
      anaUser: "Google Analytics — identificador de utilizador",
      anaSesion: "Google Analytics — estado da sessão",
      mkH: "Cookies de marketing (opcionais)",
      mkP: "Utilizados para lhe mostrar publicidade relevante noutras plataformas. Só são ativados com o seu consentimento.",
      mkMetaPixel: "Meta (Facebook/Instagram) Pixel",
      mkTiktokConv: "TikTok Pixel — acompanhamento de conversões",
      mkMetaAds: "Meta — publicidade personalizada",
      mkTiktokClic: "TikTok — identificador de clique no anúncio",
    },
    s3: {
      h: "3. Cookies de terceiros",
      p: "Alguns serviços integrados nesta loja podem instalar os seus próprios cookies:",
      stripe: "— processador de pagamentos.", stripeLink: "Política de privacidade da Stripe",
      ga: "— análise de tráfego web.", gaLink: "Política de privacidade da Google",
      meta: "— publicidade e retargeting.", metaLink: "Política de privacidade da Meta",
      tiktok: "— publicidade e retargeting.", tiktokLink: "Política de privacidade da TikTok",
    },
    s4: {
      h: "4. Como gerir os cookies",
      p: "Pode controlar e eliminar os cookies nas configurações do seu navegador:",
      nota: "Tenha em conta que desativar certos cookies pode afetar o funcionamento da loja (por exemplo, o carrinho de compras).",
    },
    s5: {
      h: "5. Base legal",
      p: "A utilização de cookies técnicos e de pagamento baseia-se no interesse legítimo e na necessidade contratual (art. 6.1.b e 6.1.f RGPD). Os cookies analíticos e de marketing requerem o seu consentimento explícito (art. 6.1.a RGPD), de acordo com o art. 22.2 da LSSI espanhola (lei dos serviços da sociedade da informação).",
    },
    s6: {
      h: "6. Atualizações",
      p: "Esta política pode ser atualizada para refletir alterações nos serviços utilizados ou na legislação aplicável. Recomendamos que a consulte periodicamente.",
    },
    s7: {
      h: "7. Contacto",
      p: "Para qualquer questão sobre o uso de cookies nesta loja, pode contactar-nos em:",
    },
  },

  it: {
    metaTitle: "Informativa sui cookie",
    metaDesc: "Informativa sui cookie di AizuaBeauty: quali cookie propri e di terze parti utilizziamo, con quale finalità e come puoi gestirli o rifiutarli.",
    h1: "Informativa sui cookie",
    actualizado: "Ultimo aggiornamento: marzo 2026",
    thCookie: "Cookie", thFin: "Finalità", thDur: "Durata", thPlataforma: "Piattaforma",
    dur: { sesion: "Sessione", anio1: "1 anno", min30: "30 min", anios2: "2 anni", meses3: "3 mesi", meses13: "13 mesi", dias7: "7 giorni" },
    s1: {
      h: "1. Che cosa sono i cookie?",
      p: "I cookie sono piccoli file di testo che i siti web memorizzano sul tuo dispositivo quando li visiti. Consentono al sito di ricordare le tue preferenze, mantenere attiva la sessione e raccogliere informazioni su come utilizzi la pagina.",
    },
    s2: {
      h: "2. Cookie che utilizziamo",
      tecH: "Cookie tecnici (necessari)",
      tecP: "Sono indispensabili per il funzionamento di base del negozio. Non richiedono consenso.",
      tecCarrito: "Mantiene attivo il carrello",
      tecIdioma: "Ricorda la lingua selezionata",
      pagoH: "Cookie di pagamento (Stripe)",
      pagoP: "Stripe utilizza cookie propri per garantire la sicurezza del processo di pagamento e prevenire le frodi.",
      pagoFraude: "Rilevamento delle frodi nei pagamenti",
      pagoSesion: "Identificatore della sessione di pagamento",
      anaH: "Cookie analitici (facoltativi)",
      anaP: "Ci aiutano a capire come gli utenti interagiscono con il negozio per migliorare l’esperienza. Si attivano solo con il tuo consenso.",
      anaUser: "Google Analytics — identificatore utente",
      anaSesion: "Google Analytics — stato della sessione",
      mkH: "Cookie di marketing (facoltativi)",
      mkP: "Utilizzati per mostrarti pubblicità pertinente su altre piattaforme. Si attivano solo con il tuo consenso.",
      mkMetaPixel: "Meta (Facebook/Instagram) Pixel",
      mkTiktokConv: "TikTok Pixel — monitoraggio delle conversioni",
      mkMetaAds: "Meta — pubblicità personalizzata",
      mkTiktokClic: "TikTok — identificatore di clic sull’annuncio",
    },
    s3: {
      h: "3. Cookie di terze parti",
      p: "Alcuni servizi integrati in questo negozio possono installare i propri cookie:",
      stripe: "— gestore dei pagamenti.", stripeLink: "Informativa sulla privacy di Stripe",
      ga: "— analisi del traffico web.", gaLink: "Informativa sulla privacy di Google",
      meta: "— pubblicità e retargeting.", metaLink: "Informativa sulla privacy di Meta",
      tiktok: "— pubblicità e retargeting.", tiktokLink: "Informativa sulla privacy di TikTok",
    },
    s4: {
      h: "4. Come gestire i cookie",
      p: "Puoi controllare ed eliminare i cookie dalle impostazioni del tuo browser:",
      nota: "Tieni presente che disattivare alcuni cookie può influire sul funzionamento del negozio (per esempio, il carrello).",
    },
    s5: {
      h: "5. Base giuridica",
      p: "L’uso di cookie tecnici e di pagamento si basa sul legittimo interesse e sulla necessità contrattuale (art. 6.1.b e 6.1.f GDPR). I cookie analitici e di marketing richiedono il tuo consenso esplicito (art. 6.1.a GDPR), ai sensi dell’art. 22.2 della LSSI spagnola (legge sui servizi della società dell’informazione).",
    },
    s6: {
      h: "6. Aggiornamenti",
      p: "La presente informativa può essere aggiornata per riflettere modifiche nei servizi utilizzati o nella normativa applicabile. Ti consigliamo di consultarla periodicamente.",
    },
    s7: {
      h: "7. Contatti",
      p: "Per qualsiasi domanda sull’uso dei cookie in questo negozio, puoi contattarci a:",
    },
  },
};

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const base = "https://beauty.aizualabs.com";
  const l = pick(params.locale);
  const t = T[l];
  const url = `${base}/${l}/legal/cookies`;
  return {
    title: t.metaTitle,
    description: t.metaDesc,
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(LOCALES.map((x) => [x, `${base}/${x}/legal/cookies`])),
        "x-default": `${base}/es/legal/cookies`,
      },
    },
    // s236: ver nota en legal/privacidad/page.tsx — mismo fix, mismo motivo.
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
const H3 = "text-lg font-medium text-gray-800 mb-2 mt-4";
const TD = "border border-gray-200 px-3 py-2";
const TH = "border border-gray-200 px-3 py-2 text-left";
const A = "text-blue-600 underline";

/** Tabla de cookies. Los NOMBRES no se traducen nunca: son identificadores. */
function Tabla({ cols, rows }: { cols: [string, string, string]; rows: Array<[string, string, string]> }) {
  return (
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-sm border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-50">
            {cols.map((c) => <th key={c} className={TH}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map(([nombre, fin, dur]) => (
            <tr key={nombre}>
              <td className={`${TD} font-mono`}>{nombre}</td>
              <td className={TD}>{fin}</td>
              <td className={TD}>{dur}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function CookiesPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const l = pick(params.locale);
  const t = T[l];
  const u = URLS[l];
  const cols: [string, string, string] = [t.thCookie, t.thFin, t.thDur];

  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-700">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.h1}</h1>
      <p className="text-sm text-gray-400 mb-10">{t.actualizado}</p>

      <section className="mb-8">
        <h2 className={H2}>{t.s1.h}</h2>
        <p>{t.s1.p}</p>
      </section>

      <section className="mb-8">
        <h2 className={H2}>{t.s2.h}</h2>

        <h3 className={H3}>{t.s2.tecH}</h3>
        <p className="mb-3 text-sm">{t.s2.tecP}</p>
        <Tabla cols={cols} rows={[
          ["cart_session", t.s2.tecCarrito, t.dur.sesion],
          ["locale", t.s2.tecIdioma, t.dur.anio1],
        ]} />

        <h3 className={H3}>{t.s2.pagoH}</h3>
        <p className="mb-3 text-sm">{t.s2.pagoP}</p>
        <Tabla cols={cols} rows={[
          ["__stripe_mid", t.s2.pagoFraude, t.dur.anio1],
          ["__stripe_sid", t.s2.pagoSesion, t.dur.min30],
        ]} />

        <h3 className={H3}>{t.s2.anaH}</h3>
        <p className="mb-3 text-sm">{t.s2.anaP}</p>
        <Tabla cols={cols} rows={[
          ["_ga", t.s2.anaUser, t.dur.anios2],
          ["_ga_*", t.s2.anaSesion, t.dur.anios2],
        ]} />

        <h3 className={H3}>{t.s2.mkH}</h3>
        <p className="mb-3 text-sm">{t.s2.mkP}</p>
        <Tabla cols={[t.thCookie, t.thPlataforma, t.thDur]} rows={[
          ["_fbp", t.s2.mkMetaPixel, t.dur.meses3],
          ["_ttp", t.s2.mkTiktokConv, t.dur.meses13],
          ["fr", t.s2.mkMetaAds, t.dur.meses3],
          ["ttclid", t.s2.mkTiktokClic, t.dur.dias7],
        ]} />
      </section>

      <section className="mb-8">
        <h2 className={H2}>{t.s3.h}</h2>
        <p className="mb-3">{t.s3.p}</p>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>
            <strong>Stripe</strong> {t.s3.stripe}{" "}
            <a href={u.stripe} className={A} target="_blank" rel="noopener noreferrer">{t.s3.stripeLink}</a>
          </li>
          <li>
            <strong>Google Analytics</strong> {t.s3.ga}{" "}
            <a href={u.google} className={A} target="_blank" rel="noopener noreferrer">{t.s3.gaLink}</a>
          </li>
          <li>
            <strong>Meta (Facebook)</strong> {t.s3.meta}{" "}
            <a href="https://www.facebook.com/privacy/policy/" className={A} target="_blank" rel="noopener noreferrer">{t.s3.metaLink}</a>
          </li>
          <li>
            <strong>TikTok</strong> {t.s3.tiktok}{" "}
            <a href={u.tiktok} className={A} target="_blank" rel="noopener noreferrer">{t.s3.tiktokLink}</a>
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className={H2}>{t.s4.h}</h2>
        <p className="mb-3">{t.s4.p}</p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li><a href="https://support.google.com/chrome/answer/95647" className={A} target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
          <li><a href={u.firefox} className={A} target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
          <li><a href={u.safari} className={A} target="_blank" rel="noopener noreferrer">Apple Safari</a></li>
          <li><a href={u.edge} className={A} target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
        </ul>
        <p className="mt-3 text-sm text-gray-500">{t.s4.nota}</p>
      </section>

      <section className="mb-8">
        <h2 className={H2}>{t.s5.h}</h2>
        <p>{t.s5.p}</p>
      </section>

      <section className="mb-8">
        <h2 className={H2}>{t.s6.h}</h2>
        <p>{t.s6.p}</p>
      </section>

      <section>
        <h2 className={H2}>{t.s7.h}</h2>
        <p>
          {t.s7.p}{" "}
          <a href="mailto:info@aizualabs.com" className={A}>info@aizualabs.com</a>
        </p>
      </section>
    </main>
  );
}
