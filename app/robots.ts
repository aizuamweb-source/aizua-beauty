import { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://aizua-beauty.vercel.app";

export default function robots(): MetadataRoute.Robots {
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
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
