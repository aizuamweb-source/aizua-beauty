import type { Metadata } from "next";
import { Cormorant_Garamond, Lato } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-lato",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | AizuaBeauty",
    default: "AizuaBeauty — Natural Beauty & Fashion",
  },
  description: "Cosmética natural Ringana y moda femenina seleccionada. Bolsos, pañuelos y bisutería con envío desde Europa.",
  keywords: ["cosmética natural", "Ringana", "moda femenina", "bolsos", "bisutería", "pañuelos", "tienda online", "España"],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://aizua-beauty.vercel.app"),
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
    description: "Cosmética natural Ringana y moda femenina seleccionada. Envío desde Europa.",
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

const orgSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://aizua-beauty.vercel.app/#organization",
      name: "AizuaBeauty",
      url: "https://aizua-beauty.vercel.app",
      logo: "https://aizua-beauty.vercel.app/logo.png",
      contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: "info@aizualabs.com" },
    },
    {
      "@type": "WebSite",
      "@id": "https://aizua-beauty.vercel.app/#website",
      url: "https://aizua-beauty.vercel.app",
      name: "AizuaBeauty",
      publisher: { "@id": "https://aizua-beauty.vercel.app/#organization" },
      inLanguage: ["es", "en"],
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${cormorant.variable} ${lato.variable}`}>
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
        {children}
        <Analytics />
      </body>
    </html>
  );
}
