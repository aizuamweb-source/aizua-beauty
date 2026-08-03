import type { Metadata } from "next";
import "./globals.css";
import "./fonts";

export const metadata: Metadata = {
  title: {
    template: "%s | AizuaBeauty",
    default: "AizuaBeauty — Natural Beauty & Fashion",
  },
  description: "Belleza y moda femenina seleccionada. Bolsos, joyería y accesorios con envío desde Europa.",
  keywords: ["belleza mujer", "cuidado facial", "moda femenina", "bolsos", "joyería", "accesorios mujer", "tienda online", "España"],
  metadataBase: new URL("https://beauty.aizualabs.com"),
  openGraph: {
    type: "website",
    siteName: "AizuaBeauty",
    locale: "es_ES",
    images: [{ url: "/og-home.jpg", width: 1200, height: 630, alt: "AizuaBeauty — Natural Beauty & Fashion" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@aizualabs",
    title: "AizuaBeauty — Natural Beauty & Fashion",
    description: "Belleza y moda femenina seleccionada. Envío desde Europa.",
    images: ["/og-home.jpg"],
  },
  robots: {
    index: process.env.VERCEL_ENV === "production" || !process.env.VERCEL_ENV,
    follow: process.env.VERCEL_ENV === "production" || !process.env.VERCEL_ENV,
    googleBot: {
      index: process.env.VERCEL_ENV === "production" || !process.env.VERCEL_ENV,
      follow: process.env.VERCEL_ENV === "production" || !process.env.VERCEL_ENV,
      "max-image-preview": "large",
    },
  },
  verification: {
    google: "pRCIVtnGCJCcCbg9mLj12-GnDipn2fDbY9ybGDw__5I",
  },
};

// Root layout is transparent — html/body live in app/[locale]/layout.tsx
// so that lang={locale} is set correctly on every page.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
