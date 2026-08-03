// s232: las fuentes vivían en app/layout.tsx como `export const`. Los ficheros de
// ruta del App Router solo admiten una lista blanca de exports (default, metadata,
// generateStaticParams, revalidate, dynamic…), así que exportar un NextFontWithVariable
// desde el layout raíz rompía el type-check con TS2344:
//   "Property 'cormorant' is incompatible with index signature.
//    Type 'NextFontWithVariable' is not assignable to type 'never'."
// No saltaba en Vercel porque next.config.mjs lleva typescript.ignoreBuildErrors: true.
//
// Este fichero NO es de ruta, así que queda fuera de esa lista blanca y puede exportar
// lo que quiera. app/layout.tsx lo importa por efecto lateral (`import "./fonts"`) para
// que el CSS de la fuente se siga atribuyendo al segmento raíz exactamente como antes;
// app/[locale]/layout.tsx importa las constantes y aplica sus `.variable` al <html>.
import { Cormorant_Garamond, Lato } from "next/font/google";

export const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

export const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-lato",
  display: "swap",
});
