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
