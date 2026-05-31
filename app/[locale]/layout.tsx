import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { LOCALES } from "@/i18n/request";
import { CartProvider } from "@/lib/cart/CartContext";
import PixelProvider from "@/components/PixelProvider";
import CookiesBanner from "@/components/CookiesBanner";
import ChatWidget from "@/components/ChatWidget";
import CartDrawer from "@/components/cart/CartDrawer";
import LeadPopup from "@/components/LeadPopup";
import { AdsPixels } from "@/components/AdsPixels";
import PostHogProvider from "@/components/PostHogProvider";
import { cormorant, lato } from "../layout";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://beauty.aizualabs.com";

const orgSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Organization", "Store"],
      "@id": `${SITE_URL}/#organization`,
      name: "AizuaBeauty",
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      description: "Cosmética natural Ringana y moda femenina seleccionada. Sérum, cremas y accesorios con envío desde Europa.",
      contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: "info@aizualabs.com", availableLanguage: ["Spanish", "English"] },
      sameAs: ["https://aizualabs.com", "https://twitter.com/AizuaLabs", "https://www.instagram.com/aizuabeauty"],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "AizuaBeauty",
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: ["es", "en"],
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/es/tienda?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  if (!LOCALES.includes(locale as never)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  return (
    <html lang={locale} className={`${cormorant.variable} ${lato.variable}`}>
      <body
        style={{
          background: "#FAF8F5",
          color: "#2C2C2C",
          margin: 0,
          fontFamily: "var(--font-lato, sans-serif)",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
        <NextIntlClientProvider messages={messages} locale={locale}>
          <PostHogProvider>
            <CartProvider>
              <PixelProvider />
              {children}
              <CartDrawer locale={locale} />
              <ChatWidget locale={locale} />
              <CookiesBanner locale={locale} />
              <LeadPopup locale={locale} />
              <AdsPixels />
            </CartProvider>
          </PostHogProvider>
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
