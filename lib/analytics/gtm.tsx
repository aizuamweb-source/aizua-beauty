// lib/analytics/gtm.tsx
// Aizua — Google Tag Manager component
// Importar en app/layout.tsx — gestiona todos los píxeles desde un único sitio

import Script from "next/script";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID!;

// ── COMPONENTE HEAD (pegar dentro de <head>) ──
export function GTMScript() {
  if (!GTM_ID) return null;
  return (
    <Script
      id="gtm-script"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`,
      }}
    />
  );
}

// ── COMPONENTE NOSCRIPT (pegar al inicio de <body>) ──
export function GTMNoScript() {
  if (!GTM_ID) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}

// ── USO EN app/layout.tsx ──
/*
import { GTMScript, GTMNoScript } from "@/lib/analytics/gtm";

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <GTMScript />
      </head>
      <body>
        <GTMNoScript />
        {children}
      </body>
    </html>
  );
}
*/
