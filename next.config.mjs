import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const config = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.aliexpress.com" },
      { protocol: "https", hostname: "**.alicdn.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://connect.facebook.net https://analytics.tiktok.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self' https://api.stripe.com https://*.supabase.co https://api.resend.com https://api-sg.aliexpress.com https://api.anthropic.com https://api.brevo.com https://graph.facebook.com https://business-api.tiktok.com https://api.telegram.org",
              "frame-src https://js.stripe.com https://hooks.stripe.com",
            ].join("; "),
          },
        ],
      },
      {
        source: "/api/webhook",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
    ];
  },
  async redirects() {
    return [
      // Canonical redirect: aizua-beauty.vercel.app → beauty.aizualabs.com (301)
      // Prevents Vercel deployment URL from competing with canonical domain in Google
      {
        source: "/:path*",
        has: [{ type: "host", value: "aizua-beauty.vercel.app" }],
        destination: "https://beauty.aizualabs.com/:path*",
        permanent: true,
      },
      { source: "/", destination: "/es", permanent: false },
      { source: "/checkout", destination: "/es/checkout", permanent: false },
      // Blog sin locale → redirige a /es/blog/slug (evita 404 en GSC)
      { source: "/blog/:slug*", destination: "/es/blog/:slug*", permanent: true },
      // Redirigir /[locale]/tienda/[slug] → /[locale]/product/[slug] (301)
      // Evita 404 de bots/enlaces externos que usan la ruta de listado como detalle
      { source: "/:locale(es|en|fr|de|pt|it)/tienda/:slug+", destination: "/:locale/product/:slug", permanent: true },
      // Taxonomía beauty unificada (s131): slugs antiguos → slugs nuevos (301)
      { source: "/:locale(es|en|fr|de|pt|it)/coleccion/belleza", destination: "/:locale/coleccion/skincare", permanent: true },
      { source: "/:locale(es|en|fr|de|pt|it)/coleccion/bienestar", destination: "/:locale/coleccion/suplementos", permanent: true },
      { source: "/:locale(es|en|fr|de|pt|it)/coleccion/cuidado", destination: "/:locale/coleccion/corporal", permanent: true },
      { source: "/:locale(es|en|fr|de|pt|it)/coleccion/cabello", destination: "/:locale/coleccion/capilar", permanent: true },
      { source: "/:locale(es|en|fr|de|pt|it)/coleccion/joyeria", destination: "/:locale/coleccion/accesorios", permanent: true },
      { source: "/:locale(es|en|fr|de|pt|it)/coleccion/moda", destination: "/:locale/coleccion/accesorios", permanent: true },
      // /consulting vive en aizualabs.com — fuera del scope de beauty (301)
      { source: "/:locale(es|en|fr|de|pt|it)/consulting", destination: "https://aizualabs.com", permanent: true },
      // Producto renombrado (s189/s210): slug viejo enlazado desde blog 404aba — slug real cambió
      { source: "/:locale(es|en|fr|de|pt|it)/product/charm-gatito-peluche-colgante", destination: "/:locale/product/charm-gatito-peluche-colgante-cute-para-bolso", permanent: true },
      // Duplicado publicado consolidado (s189-b/s210): -v2 archivado en Supabase, -v5 es el canonical
      { source: "/:locale(es|en|fr|de|pt|it)/blog/22-productos-tendencia-que-no-puedes-perderte-en-julio-2026-v2", destination: "/:locale/blog/22-productos-tendencia-que-no-puedes-perderte-en-julio-2026-v5", permanent: true },

      // ── s229 · DESACTIVACIÓN DE LA MARCA EXTERNA DE COSMÉTICA ──────────────────
      // La landing de marca y los 5 posts monográficos quedaron archivados (no
      // borrados: ver DESACTIVACION_MARCA_COSMETICA_S229.md para revertir). Estos 301
      // evitan que el usuario vea un 404 y traspasan la autoridad al destino vivo.
      // RECUPERAR = borrar este bloque + reactivar en Supabase.
      { source: "/:locale(es|en|fr|de|pt|it)/ringana", destination: "/:locale/tienda", permanent: true },
      // 5 posts monográficos → post afín vivo del mismo tema
      { source: "/:locale(es|en|fr|de|pt|it)/blog/ringana-productos-opiniones-20260713", destination: "/:locale/blog/cosmetica-natural-sin-toxicos-20260710", permanent: true },
      { source: "/:locale(es|en|fr|de|pt|it)/blog/ringana-partner-ventajas-20260609", destination: "/:locale/blog/cosmetica-limpia-que-significa-20260618", permanent: true },
      { source: "/:locale(es|en|fr|de|pt|it)/blog/ringana-fresh-crema-hidratante-corporal", destination: "/:locale/blog/crema-corporal-hidratante-natural-20260704", permanent: true },
      { source: "/:locale(es|en|fr|de|pt|it)/blog/ringana-overnight-crema-noche-retinal", destination: "/:locale/blog/suero-antienvejecimiento-natural-20260628", permanent: true },
      { source: "/:locale(es|en|fr|de|pt|it)/blog/fresh-skin-perfection-ringana-crema-antiedad", destination: "/:locale/blog/cremas-naturales-piel-sensible-20260716", permanent: true },
      // Las 20 fichas de producto desactivadas estaban indexadas y en el sitemap (40 URLs
      // es+en). Sin este 301 quedarían 120 URLs (20 × 6 locales) devolviendo 404.
      // Destino /tienda: las colecciones de esas categorías se quedaron sin producto.
      { source: "/:locale(es|en|fr|de|pt|it)/product/:slug(adds-collagen|adds-glow|adds-omega|adds-vitamin-d|body-lotion|body-oil|body-scrub|fresh-cleanser|fresh-eye-cream|fresh-mask|fresh-moisturiser|fresh-serum|fresh-toner|hair-mask|hair-oil|hair-shampoo|perfume-alm|perfume-nuda|sport-shake|sun-cream-spf30)", destination: "/:locale/tienda", permanent: true },
      // Las imágenes de esas fichas salieron de public/ (a _assets_marca_desactivada_s229/).
      { source: "/ringana/:file*", destination: "/es/tienda", permanent: true },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
    ];
  },
  experimental: {
    optimizePackageImports: ["@stripe/stripe-js", "@supabase/supabase-js"],
  },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  compress: true,
  poweredByHeader: false,
};

export default withNextIntl(config);
