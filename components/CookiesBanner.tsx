"use client";

// components/CookiesBanner.tsx
// Aizua — Banner de consentimiento de cookies (RGPD / Directiva ePrivacy)
// Se muestra en primera visita. Guarda preferencias en localStorage.
// Sirve a: Tienda + Academy + cualquier app Aizüa

import { useState, useEffect } from "react";
import Link from "next/link";

type CookieConsent = {
  essential: true;       // siempre true
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
};

const STORAGE_KEY = "aizua_cookie_consent";

function saveConsent(analytics: boolean, marketing: boolean) {
  const consent: CookieConsent = {
    essential: true,
    analytics,
    marketing,
    timestamp: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));

  // Disparar evento para que otros componentes (GA, Pixel) reaccionen
  window.dispatchEvent(new CustomEvent("aizua:cookie-consent", { detail: consent }));
}

export function getStoredConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function CookiesBanner({ locale = "es" }: { locale?: string }) {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) setVisible(true);
  }, []);

  if (!visible) return null;

  const t = locale === "es" ? {
    title:      "Usamos cookies",
    desc:       "Usamos cookies esenciales para que la tienda funcione, y opcionales para analítica y marketing. Puedes elegir qué aceptas.",
    essential:  "Esenciales (necesarias)",
    analytics:  "Analíticas (Google Analytics)",
    marketing:  "Marketing (Meta & TikTok Pixel)",
    customize:  "Personalizar",
    acceptAll:  "Aceptar todo",
    saveChoice: "Guardar mi elección",
    policy:     "Política de cookies",
  } : {
    title:      "We use cookies",
    desc:       "We use essential cookies to run the store, and optional ones for analytics and marketing. Choose what you accept.",
    essential:  "Essential (required)",
    analytics:  "Analytics (Google Analytics)",
    marketing:  "Marketing (Meta & TikTok Pixel)",
    customize:  "Customize",
    acceptAll:  "Accept all",
    saveChoice: "Save my choice",
    policy:     "Cookie policy",
  };

  const handleAcceptAll = () => {
    saveConsent(true, true);
    setVisible(false);
  };

  const handleSaveChoice = () => {
    saveConsent(analytics, marketing);
    setVisible(false);
  };

  return (
    <div style={{
      position: "fixed", bottom: "1.5rem", left: "1.5rem", right: "1.5rem",
      zIndex: 9999, maxWidth: "480px",
      background: "#fff",
      border: "1px solid #E8EAED",
      borderRadius: "16px",
      padding: "1.5rem",
      boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "1rem" }}>
        <span style={{ fontSize: "1.5rem" }}>🍪</span>
        <div>
          <div style={{ fontWeight: 800, color: "#1A1A2E", fontSize: "1rem", marginBottom: "0.4rem" }}>
            {t.title}
          </div>
          <p style={{ fontSize: "0.83rem", color: "#666", lineHeight: 1.6, margin: 0 }}>
            {t.desc}{" "}
            <Link href={`/${locale}/legal/cookies`} style={{ color: "#00C9B1", textDecoration: "none", fontWeight: 600 }}>
              {t.policy}
            </Link>
          </p>
        </div>
      </div>

      {/* Opciones expandidas */}
      {expanded && (
        <div style={{ margin: "1rem 0", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {/* Esenciales: siempre on */}
          <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "default" }}>
            <div style={{
              width: "36px", height: "20px", borderRadius: "10px",
              background: "#00C9B1", position: "relative", flexShrink: 0,
            }}>
              <div style={{ position: "absolute", right: "3px", top: "3px", width: "14px", height: "14px", borderRadius: "50%", background: "#fff" }} />
            </div>
            <div>
              <div style={{ fontSize: "0.83rem", fontWeight: 700, color: "#1A1A2E" }}>{t.essential}</div>
              <div style={{ fontSize: "0.75rem", color: "#999" }}>Siempre activas · No se pueden desactivar</div>
            </div>
          </label>

          {/* Analíticas */}
          <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }} onClick={() => setAnalytics(v => !v)}>
            <div style={{
              width: "36px", height: "20px", borderRadius: "10px",
              background: analytics ? "#00C9B1" : "#E8EAED",
              position: "relative", flexShrink: 0, transition: "background 0.2s",
            }}>
              <div style={{
                position: "absolute", top: "3px",
                left: analytics ? "unset" : "3px",
                right: analytics ? "3px" : "unset",
                width: "14px", height: "14px", borderRadius: "50%", background: "#fff",
                transition: "all 0.2s",
              }} />
            </div>
            <div style={{ fontSize: "0.83rem", fontWeight: 600, color: "#1A1A2E" }}>{t.analytics}</div>
          </label>

          {/* Marketing */}
          <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }} onClick={() => setMarketing(v => !v)}>
            <div style={{
              width: "36px", height: "20px", borderRadius: "10px",
              background: marketing ? "#00C9B1" : "#E8EAED",
              position: "relative", flexShrink: 0, transition: "background 0.2s",
            }}>
              <div style={{
                position: "absolute", top: "3px",
                left: marketing ? "unset" : "3px",
                right: marketing ? "3px" : "unset",
                width: "14px", height: "14px", borderRadius: "50%", background: "#fff",
                transition: "all 0.2s",
              }} />
            </div>
            <div style={{ fontSize: "0.83rem", fontWeight: 600, color: "#1A1A2E" }}>{t.marketing}</div>
          </label>
        </div>
      )}

      {/* Botones */}
      <div style={{ display: "flex", gap: "0.6rem", marginTop: expanded ? "0.5rem" : "0" }}>
        {!expanded ? (
          <>
            <button
              onClick={() => setExpanded(true)}
              style={{ flex: 1, padding: "0.6rem", borderRadius: "8px", border: "1px solid #E8EAED", background: "#fff", color: "#555", fontSize: "0.83rem", fontWeight: 600, cursor: "pointer" }}
            >
              {t.customize}
            </button>
            <button
              onClick={handleAcceptAll}
              style={{ flex: 2, padding: "0.6rem", borderRadius: "8px", border: "none", background: "#00C9B1", color: "#fff", fontSize: "0.83rem", fontWeight: 700, cursor: "pointer" }}
            >
              {t.acceptAll}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleAcceptAll}
              style={{ flex: 1, padding: "0.6rem", borderRadius: "8px", border: "none", background: "#00C9B1", color: "#fff", fontSize: "0.83rem", fontWeight: 700, cursor: "pointer" }}
            >
              {t.acceptAll}
            </button>
            <button
              onClick={handleSaveChoice}
              style={{ flex: 1, padding: "0.6rem", borderRadius: "8px", border: "1px solid #E8EAED", background: "#fff", color: "#555", fontSize: "0.83rem", fontWeight: 600, cursor: "pointer" }}
            >
              {t.saveChoice}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
