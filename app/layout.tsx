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
  description: "Cosmética natural Ringana y moda femenina seleccionada. Entregas rápidas desde Europa.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://aizuabeauty.vercel.app"),
  openGraph: {
    type: "website",
    siteName: "AizuaBeauty",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  verification: {
    google: "pRCIVtnGCJCcCbg9mLj12-GnDipn2fDbY9ybGDw__5I",
  },
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
        {children}
        <Analytics />
      </body>
    </html>
  );
}
