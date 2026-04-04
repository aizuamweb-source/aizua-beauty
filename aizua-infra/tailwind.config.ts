// tailwind.config.ts
// Aizua — Configuración Tailwind con tokens de diseño del sistema

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── COLORES DE AIZUA ──
      colors: {
        bg: {
          DEFAULT: "#07070F",
          2: "#0D0D1A",
          3: "#111120",
          4: "#080814",
        },
        teal: {
          DEFAULT: "#00C9B1",
          light:   "#00F5D4",
          faint:   "rgba(0,201,177,0.08)",
          border:  "rgba(0,201,177,0.18)",
        },
        aizua: {
          white:   "#F0F0F0",
          muted:   "#5A5A72",
          muted2:  "#3A3A52",
          border:  "rgba(255,255,255,0.07)",
          border2: "rgba(255,255,255,0.11)",
        },
        success: "#4DFF91",
        warning: "#F5A623",
        danger:  "#FF6B6B",
      },

      // ── TIPOGRAFÍA ──
      fontFamily: {
        display: ["Bebas Neue", "sans-serif"],
        body:    ["DM Sans", "system-ui", "sans-serif"],
      },

      // ── ANIMACIONES ──
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0,201,177,0.2)" },
          "50%":      { boxShadow: "0 0 40px rgba(0,201,177,0.4)" },
        },
      },
      animation: {
        "fade-up":    "fadeUp 0.35s ease forwards",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
      },

      // ── BACKDROP BLUR ──
      backdropBlur: { xs: "2px" },
    },
  },
  plugins: [],
};

export default config;
