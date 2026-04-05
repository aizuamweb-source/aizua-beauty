/**
 * social-config.ts — Mapa central de cuentas de redes sociales AizuaLabs
 * Usado por: Footer components, AG-13, AG-46, AG-47, content agents, SEO metadata
 * Actualizar aquí = se propaga a todo el sistema
 */

// TikTok por locale — aizua-store (gadgets/tech)
// Cuentas confirmadas: ES=@aizuatec, FR=@aizuatec_france, IT=@aizuatec_italy, IE/EN=@aizuatec_ireland
const TIKTOK_STORE: Record<string, string> = {
  es: "https://www.tiktok.com/@aizuatec",
  fr: "https://www.tiktok.com/@aizuatec_france",
  it: "https://www.tiktok.com/@aizuatec_italy",
  en: "https://www.tiktok.com/@aizuatec_ireland",
  de: "https://www.tiktok.com/@aizuatec",  // sin cuenta DE propia aún
  pt: "https://www.tiktok.com/@aizuatec",  // sin cuenta PT propia aún
  default: "https://www.tiktok.com/@aizuatec",
};

export const SOCIAL = {
  // ── Aizüa Store (gadgets/tech) ─────────────────────────────────────────
  aizuatec: {
    instagram:  "https://www.instagram.com/aizuatec/",
    tiktok:     TIKTOK_STORE,
    x:          "https://x.com/aizuatec",
    facebook:   "https://www.facebook.com/AizuaBrand",
  },

  // ── AizuaBeauty ────────────────────────────────────────────────────────
  beauty: {
    instagram:  "https://www.instagram.com/aizuabeauty/",
    tiktok:     { default: "https://www.tiktok.com/@aizuabeauty" },
    x:          "https://x.com/Aizuabrand",
    facebook:   "https://www.facebook.com/Aizuabeauty",
    pinterest:  "https://www.pinterest.com/aizuabeauty/",
  },

  // ── Sophie Marem (influencer IA AizuaBeauty) ──────────────────────────
  sophie: {
    instagram:  "https://www.instagram.com/sophie.marem/",
    x:          "https://x.com/MarenPatri40021",
    youtube:    "https://www.youtube.com/@sophiemarem",
  },

  // ── AizuaLabs (hub principal / Academy) ───────────────────────────────
  aizualabs: {
    instagram:  "https://www.instagram.com/aizualabs/",
    tiktok:     { default: "https://www.tiktok.com/@aizualabsacademy" },
    x:          "https://x.com/AizuaLabs",
    youtube:    "https://www.youtube.com/@AizuaLabs",
    linkedin:   "https://www.linkedin.com/company/aizuabrand/",
    pinterest:  "https://www.pinterest.com/aizualabs/",
    facebook:   "https://www.facebook.com/AizuaBrand",
  },

  // ── Consulting ─────────────────────────────────────────────────────────
  consulting: {
    tiktok:     { default: "https://www.tiktok.com/@aizualabsconsulting" },
    instagram:  "https://www.instagram.com/aizualabs/",  // comparte con labs
    linkedin:   "https://www.linkedin.com/company/aizuabrand/",
  },

  // ── EcommerceReal ──────────────────────────────────────────────────────
  ecommerce: {
    instagram:  "https://www.instagram.com/ecommercereal_oficial/",
    tiktok:     { default: "https://www.tiktok.com/@e_commerce_real" },
    x:          "https://x.com/ecommercereal10",
    facebook:   "https://www.facebook.com/Padrelibrepadreinversor",
  },

  // ── PadreLibre ─────────────────────────────────────────────────────────
  padrelibre: {
    instagram:  "https://www.instagram.com/padrelibrepadreinversor/",
    tiktok:     { default: "https://www.tiktok.com/@aizualabsacademy" },
    x:          "https://x.com/Padrelibre45623",
    facebook:   "https://www.facebook.com/Padrelibrepadreinversor",
  },
} as const;

/** Devuelve la URL de TikTok correcta según el locale del usuario */
export function getTikTokUrl(
  brand: "aizuatec" | "aizualabs" | "beauty" | "ecommerce" | "padrelibre" | "consulting",
  locale: string
): string {
  const tiktok = SOCIAL[brand].tiktok as Record<string, string>;
  return tiktok[locale] ?? tiktok.default ?? "";
}

/** Handles TikTok por marca (para AG-46/47) */
export const TIKTOK_HANDLES = {
  aizuatec:            { es: "@aizuatec", fr: "@aizuatec_france", it: "@aizuatec_italy", en: "@aizuatec_ireland" },
  beauty:              { default: "@aizuabeauty" },
  academy:             { default: "@aizualabsacademy" },
  ecommerce:           { default: "@e_commerce_real" },
  consulting:          { default: "@aizualabsconsulting" },
} as const;

/** Instagram handles por marca (para AG-46) */
export const INSTAGRAM_HANDLES = {
  aizuatec:   "@aizuatec",
  beauty:     "@aizuabeauty",
  sophie:     "@sophie.marem",
  aizualabs:  "@aizualabs",
  ecommerce:  "@ecommercereal_oficial",
  padrelibre: "@padrelibrepadreinversor",
} as const;

/** SVG icons como strings para usar en HTML estático (Academy) */
export const SOCIAL_ICONS = {
  instagram: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>`,
  tiktok: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/></svg>`,
  youtube: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
  pinterest: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>`,
  x: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.262 5.638L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  linkedin: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
  facebook: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
} as const;
