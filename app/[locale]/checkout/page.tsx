import { setRequestLocale } from "next-intl/server";
import CheckoutClient from "@/components/checkout/CheckoutClient";
import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

export default function CheckoutPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  setRequestLocale(locale);

  return <CheckoutClient locale={locale} />;
}
