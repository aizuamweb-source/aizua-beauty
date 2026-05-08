import { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://aizua-beauty.vercel.app";
const IS_PRODUCTION = process.env.VERCEL_ENV === "production" || !process.env.VERCEL_ENV;

export default function robots(): MetadataRoute.Robots {
  // En previews/staging de Vercel: bloquear todo crawleo para evitar duplicados en Google
  if (!IS_PRODUCTION) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/checkout/",
          "/confirmacion/",
          "/*/checkout/",
          "/*/confirmacion/",
          "/*/admin/",
        ],
      },
      // AI crawlers — explicitly allowed for GEO visibility (ChatGPT, Perplexity, Claude, etc.)
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },
      { userAgent: "OAI-SearchBot", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "anthropic-ai", allow: "/" },
      { userAgent: "Claude-Web", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "Googlebot", allow: "/" },
      { userAgent: "cohere-ai", allow: "/" },
      { userAgent: "Applebot-Extended", allow: "/" },
      { userAgent: "Bytespider", allow: "/" },
      { userAgent: "Meta-ExternalAgent", allow: "/" },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
