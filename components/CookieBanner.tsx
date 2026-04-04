"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface CookieBannerProps {
  locale: string;
}

const COOKIE_KEY = "aizua_cookie_consent";

const texts: Record<string, { message: string; accept: string; reject: string; policy: string }> = {
  es: {
    message:
      "Usamos cookies propias y de terceros para mejorar tu experiencia y analizar el tráfico. Puedes aceptar todas las cookies o rechazar las no esenciales.",
    accept: "Aceptar todas",
    reject: "Solo esenciales",
    policy: "Política de cookies",
  },
  en: {
    message:
      "We use our own and third-party cookies to improve your experience and analyze traffic. You can accept all cookies or reject non-essential ones.",
    accept: "Accept all",
    reject: "Essential only",
    policy: "Cookie policy",
  },
  fr: {
    message:
      "Nous utilisons des cookies propres et tiers pour améliorer votre expérience et analyser le trafic. Vous pouvez accepter tous les cookies ou refuser les non essentiels.",
    accept: "Tout accepter",
    reject: "Essentiels uniquement",
    policy: "Politique cookies",
  },
  it: {
    message:
      "Utilizziamo cookie propri e di terze parti per migliorare la tua esperienza e analizzare il traffico. Puoi accettare tutti i cookie o rifiutare quelli non essenziali.",
    accept: "Accetta tutti",
    reject: "Solo essenziali",
    policy: "Cookie policy",
  },
};

export default function CookieBanner({ locale }: CookieBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_KEY, "all");
    setVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem(COOKIE_KEY, "essential");
    setVisible(false);
  };

  if (!visible) return null;

  const t = texts[locale] ?? texts["es"];
  const policyHref = `/${locale}/legal/cookies`;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "#1a1a2e",
        color: "#f0f0f0",
        padding: "16px 24px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "12px",
        boxShadow: "0 -2px 16px rgba(0,0,0,0.3)",
      }}
    >
      <p style={{ flex: 1, minWidth: "220px", margin: 0, fontSize: "14px", lineHeight: "1.5" }}>
        {t.message}{" "}
        <Link href={policyHref} style={{ color: "#a78bfa", textDecoration: "underline" }}>
          {t.policy}
        </Link>
        .
      </p>
      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
        <button
          onClick={handleReject}
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            border: "1px solid #6b7280",
            background: "transparent",
            color: "#d1d5db",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          {t.reject}
        </button>
        <button
          onClick={handleAccept}
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
            background: "#7c3aed",
            color: "#fff",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          {t.accept}
        </button>
      </div>
    </div>
  );
}
