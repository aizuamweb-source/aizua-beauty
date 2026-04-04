// next.config.ts
// Aizua — Configuración Next.js optimizada para producción

import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const config: NextConfig = {

  // ── IMÁGENES ──
  images: {
    remotePatterns: [
      // AliExpress CDN
      { protocol: "https", hostname: "**.aliexpress.com" },
      { protocol: "https", hostname: "**.alicdn.com" },
      // Cloudinary CDN (imágenes procesadas)
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Supabase Storage
      { protocol: "https", hostname: "**.supabase.co" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400, // 24h de caché en CDN
  },

  // ── HEADERS DE SEGURIDAD ──
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",           value: "DENY" },
          { key: "X-Content-Type-Options",    value: "nosniff" },
          { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://connect.facebook.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self' https://api.stripe.com https://*.supabase.co https://api.resend.com https://api-sg.aliexpress.com",
              "frame-src https://js.stripe.com https://hooks.stripe.com",
            ].join("; "),
          },
        ],
      },
      // Stripe webhook — necesita cuerpo raw, sin modificar
      {
        source: "/api/webhook",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
    ];
  },

  // ── REDIRECTS ──
  async redirects() {
    return [
      // Redirigir raíz a español por defecto
      { source: "/", destination: "/es", permanent: false },
      // Alias friendly para el checkout
      { source: "/checkout", destination: "/es/checkout", permanent: false },
    ];
  },

  // ── REWRITES (proxy de analytics para evitar adblockers) ──
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
    ];
  },

  // ── COMPILACIÓN ──
  experimental: {
    optimizePackageImports: ["@stripe/stripe-js", "@supabase/supabase-js"],
  },

  // ── TYPESCRIPT ──
  typescript: { ignoreBuildErrors: false },
  eslint:     { ignoreDuringBuilds: false },

  // ── COMPRESIÓN ──
  compress: true,

  // ── POWERED BY ──
  poweredByHeader: false, // Elimina el header "X-Powered-By: Next.js"
};

export default withNextIntl(config);
