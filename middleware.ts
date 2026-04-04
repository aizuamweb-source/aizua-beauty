// middleware.ts (raíz del proyecto)
// Aizua — Middleware: i18n routing + protección de rutas admin

import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { LOCALES, DEFAULT_LOCALE } from "./i18n/request";

// Middleware de internacionalización
const intlMiddleware = createMiddleware({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "always", // /es/tienda, /en/shop, etc.
  localeDetection: true,  // Detecta automáticamente el idioma del navegador
});

export default function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // ── Proteger rutas de admin ──
  // En el futuro cuando añadas panel admin real:
  // if (pathname.startsWith("/admin")) {
  //   const session = req.cookies.get("sb-session");
  //   if (!session) return NextResponse.redirect(new URL("/login", req.url));
  // }

  // ── Proteger endpoints de sync/webhook con token ──
  // Los endpoints /api/ali-sync y /api/ali-tracking se protegen internamente
  // No se necesita middleware aquí para ellos

  // ── Excluir rutas que no necesitan i18n ──
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Aplicar i18n routing al resto
  return intlMiddleware(req);
}

export const config = {
  matcher: [
    // Todas las rutas excepto archivos estáticos y _next
    "/((?!_next|_vercel|.*\\..*).*)",
  ],
};
