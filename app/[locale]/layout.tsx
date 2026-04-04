import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { LOCALES } from "@/i18n/request";
import { CartProvider } from "@/lib/cart/CartContext";
import PixelProvider from "@/components/PixelProvider";
import CookiesBanner from "@/components/CookiesBanner";
import ChatWidget from "@/components/ChatWidget";
import CartDrawer from "@/components/cart/CartDrawer";
import LeadPopup from "@/components/LeadPopup";
import { AdsPixels } from "@/components/AdsPixels";
import PostHogProvider from "@/components/PostHogProvider";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

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
  );
}
