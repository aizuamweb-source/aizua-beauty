// i18n/request.ts
// Aizua — Configuración next-intl

import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";

export const LOCALES = ["es", "en", "fr", "de", "pt", "it"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "es";

export const LOCALE_NAMES: Record<Locale, string> = {
  es: "Español",
  en: "English",
  fr: "Français",
  de: "Deutsch",
  pt: "Português",
  it: "Italiano",
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  es: "🇪🇸", en: "🇬🇧", fr: "🇫🇷",
  de: "🇩🇪", pt: "🇵🇹", it: "🇮🇹",
};

export const LOCALE_CURRENCIES: Record<Locale, string> = {
  es: "EUR", en: "USD", fr: "EUR",
  de: "EUR", pt: "EUR", it: "EUR",
};

export default getRequestConfig(async ({ requestLocale }) => {
  // next-intl v3.22+: requestLocale es una Promise<string | undefined>
  const locale = await requestLocale;

  // Validar que el locale es soportado
  if (!locale || !LOCALES.includes(locale as Locale)) notFound();

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});

// ── messages/es.json (ejemplo) ──
// {
//   "nav": { "home": "Inicio", "shop": "Tienda", "cart": "Carrito" },
//   "product": {
//     "addToCart": "Añadir al carrito",
//     "buyNow": "Comprar ahora",
//     "inStock": "En stock",
//     "reviews": "reseñas",
//     "freeShipping": "Envío gratis"
//   },
//   "checkout": {
//     "title": "Checkout seguro",
//     "contactInfo": "Información de contacto",
//     "shipping": "Envío",
//     "payment": "Pago"
//   }
// }
