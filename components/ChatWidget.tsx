"use client";

/**
 * ChatWidget — Aizüa Store
 * Widget flotante de soporte 24/7 con Claude API (Módulo 7.3 / Fase 3)
 *
 * Features:
 *  - Multiidioma: es / en / fr / it (detectado por prop locale)
 *  - Historial persistido en sessionStorage (se limpia al cerrar pestaña)
 *  - Indicador de escritura (typing dots)
 *  - Botón de escalado manual a email
 *  - Accesible: aria-labels, focus trap básico, keyboard close (Escape)
 */

import { useState, useEffect, useRef, useCallback } from "react";

// ── Traducciones ──────────────────────────────────────────
const T: Record<string, {
  title:        string;
  subtitle:     string;
  placeholder:  string;
  send:         string;
  welcome:      string;
  escalate:     string;
  escalateHref: string;
  error:        string;
  open:         string;
  close:        string;
  typing:       string;
}> = {
  es: {
    title:        "Soporte Aizüa",
    subtitle:     "Online · Responde en segundos",
    placeholder:  "Escribe tu pregunta...",
    send:         "Enviar",
    welcome:      "¡Hola! 👋 Soy el asistente de Aizüa Store. ¿En qué puedo ayudarte hoy?",
    escalate:     "Hablar con una persona",
    escalateHref: "mailto:aizuaweb@gmail.com",
    error:        "Error de conexión. Inténtalo de nuevo.",
    open:         "Abrir chat de soporte",
    close:        "Cerrar chat",
    typing:       "Escribiendo",
  },
  en: {
    title:        "Aizüa Support",
    subtitle:     "Online · Replies in seconds",
    placeholder:  "Type your question...",
    send:         "Send",
    welcome:      "Hi! 👋 I'm the Aizüa Store assistant. How can I help you today?",
    escalate:     "Talk to a person",
    escalateHref: "mailto:aizuaweb@gmail.com",
    error:        "Connection error. Please try again.",
    open:         "Open support chat",
    close:        "Close chat",
    typing:       "Typing",
  },
  fr: {
    title:        "Support Aizüa",
    subtitle:     "En ligne · Répond en secondes",
    placeholder:  "Écrivez votre question...",
    send:         "Envoyer",
    welcome:      "Bonjour! 👋 Je suis l'assistant Aizüa Store. Comment puis-je vous aider?",
    escalate:     "Parler à quelqu'un",
    escalateHref: "mailto:aizuaweb@gmail.com",
    error:        "Erreur de connexion. Réessayez.",
    open:         "Ouvrir le chat",
    close:        "Fermer le chat",
    typing:       "En train d'écrire",
  },
  it: {
    title:        "Supporto Aizüa",
    subtitle:     "Online · Risponde in secondi",
    placeholder:  "Scrivi la tua domanda...",
    send:         "Invia",
    welcome:      "Ciao! 👋 Sono l'assistente di Aizüa Store. Come posso aiutarti?",
    escalate:     "Parla con una persona",
    escalateHref: "mailto:aizuaweb@gmail.com",
    error:        "Errore di connessione. Riprova.",
    open:         "Apri la chat di supporto",
    close:        "Chiudi chat",
    typing:       "Sta scrivendo",
  },
};

// ── Tipos ─────────────────────────────────────────────────
type Message = {
  role:      "user" | "assistant";
  content:   string;
  escalated?: boolean;
};

const SESSION_KEY = "aizua_chat_history";
const MAX_HISTORY = 20; // mensajes guardados en sesión

// ── Componente principal ──────────────────────────────────
export default function ChatWidget({ locale = "es" }: { locale?: string }) {
  const t = T[locale] ?? T.es;

  const [isOpen,   setIsOpen]   = useState(false);
  const [input,    setInput]    = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLTextAreaElement>(null);

  // ── Cargar historial de sesión ────────────────────────
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      const saved: Message[] = raw ? JSON.parse(raw) : [];
      if (saved.length > 0) {
        setMessages(saved);
      } else {
        setMessages([{ role: "assistant", content: t.welcome }]);
      }
    } catch {
      setMessages([{ role: "assistant", content: t.welcome }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persistir historial en sessionStorage ─────────────
  useEffect(() => {
    if (messages.length === 0) return;
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages.slice(-MAX_HISTORY)));
    } catch { /* quota */ }
  }, [messages]);

  // ── Scroll al último mensaje ──────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Focus en input al abrir ───────────────────────────
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // ── Cerrar con Escape ─────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Enviar mensaje ────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError(null);

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    // Historial para el API (solo los últimos 10 pares)
    const history = messages
      .filter((m) => !m.escalated)
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history,
          locale,
          metadata: { page: window.location.pathname },
        }),
      });

      if (!res.ok) throw new Error("HTTP " + res.status);

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response, escalated: data.escalated },
      ]);
    } catch {
      setError(t.error);
      setMessages((prev) => prev.filter((m) => m !== userMsg));
      setInput(text); // restaurar input
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, locale, t.error]);

  // ── Enviar con Enter (Shift+Enter = nueva línea) ──────
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Estilos ───────────────────────────────────────────
  const TEAL    = "#00C9B1";
  const DARK    = "#07070F";
  const SURFACE = "#111118";
  const BORDER  = "rgba(255,255,255,0.08)";
  const FONT    = "system-ui, -apple-system, sans-serif";

  return (
    <>
      {/* ── PANEL DE CHAT ──────────────────────────────── */}
      {isOpen && (
        <div
          role="dialog"
          aria-label={t.title}
          style={{
            position:     "fixed",
            bottom:       "88px",
            right:        "24px",
            width:        "min(380px, calc(100vw - 32px))",
            height:       "min(560px, calc(100vh - 120px))",
            background:   DARK,
            border:       `1px solid ${BORDER}`,
            borderRadius: "20px",
            boxShadow:    "0 24px 64px rgba(0,0,0,0.6)",
            display:      "flex",
            flexDirection:"column",
            overflow:     "hidden",
            zIndex:       9999,
            fontFamily:   FONT,
          }}
        >
          {/* Header */}
          <div style={{
            background:     SURFACE,
            borderBottom:   `1px solid ${BORDER}`,
            padding:        "1rem 1.25rem",
            display:        "flex",
            alignItems:     "center",
            gap:            "0.75rem",
          }}>
            {/* Avatar */}
            <div style={{
              width: "38px", height: "38px",
              background: `linear-gradient(135deg, ${TEAL}, #008F7E)`,
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.1rem", flexShrink: 0,
            }}>
              🤖
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, color: "#fff", fontSize: "0.9rem" }}>{t.title}</p>
              <p style={{ margin: 0, fontSize: "0.73rem", color: TEAL }}>{t.subtitle}</p>
            </div>
            {/* Botón escalado */}
            <a
              href={t.escalateHref}
              title={t.escalate}
              style={{
                color: "#888", fontSize: "0.72rem", textDecoration: "none",
                background: "rgba(255,255,255,0.06)", padding: "0.3rem 0.6rem",
                borderRadius: "6px", whiteSpace: "nowrap",
              }}
            >
              ✉ {t.escalate}
            </a>
            {/* Cerrar */}
            <button
              onClick={() => setIsOpen(false)}
              aria-label={t.close}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#666", fontSize: "1.2rem", lineHeight: 1, padding: "0.2rem",
              }}
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "1rem",
            display: "flex", flexDirection: "column", gap: "0.75rem",
          }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div style={{
                  maxWidth:     "82%",
                  padding:      "0.65rem 0.9rem",
                  borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  background:   msg.role === "user" ? TEAL : SURFACE,
                  color:        msg.role === "user" ? "#fff" : "#ddd",
                  fontSize:     "0.85rem",
                  lineHeight:   1.55,
                 border:       msg.role === "assistant" ? `1px solid ${BORDER}` : "none",
                  whiteSpace:   "pre-wrap",
                  wordBreak:    "break-word",
                }}>
                  {msg.content}
                  {msg.escalated && (
                    <p style={{ margin: "0.4rem 0 0", fontSize: "0.72rem", color: "#aaa", borderTop: `1px solid ${BORDER}`, paddingTop: "0.35rem" }}>
                      📧 <a href={t.escalateHref} style={{ color: TEAL, textDecoration: "none" }}>{t.escalate}</a>
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{
                  background: SURFACE, border: `1px solid ${BORDER}`,
                  borderRadius: "14px 14px 14px 4px",
                  padding: "0.65rem 0.9rem", display: "flex", alignItems: "center", gap: "0.35rem",
                }}>
                  <span style={{ fontSize: "0.75rem", color: "#888" }}>{t.typing}</span>
                  {[0, 1, 2].map((n) => (
                    <span key={n} style={{
                      display: "inline-block", width: "5px", height: "5px",
                      background: TEAL, borderRadius: "50%",
                      animation: `chatDot 1.2s ease-in-out ${n * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "10px", padding: "0.6rem 0.9rem",
                color: "#f87171", fontSize: "0.8rem",
              }}>
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            borderTop:  `1px solid ${BORDER}`,
            padding:    "0.75rem",
            background: SURFACE,
            display:    "flex",
            gap:        "0.5rem",
            alignItems: "flex-end",
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={t.placeholder}
              rows={1}
              disabled={loading}
              style={{
                flex:        1,
                background:  "rgba(255,255,255,0.05)",
                border:      `1px solid ${BORDER}`,
                borderRadius:"10px",
                color:       "#fff",
                padding:     "0.6rem 0.8rem",
                fontSize:    "0.85rem",
                resize:      "none",
                outline:     "none",
                fontFamily:  FONT,
                lineHeight:  1.5,
                maxHeight:   "100px",
                overflowY:   "auto",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              aria-label={t.send}
              style={{
                background:   loading || !input.trim() ? "#333" : TEAL,
                border:       "none",
                borderRadius: "10px",
                color:        "#fff",
                cursor:       loading || !input.trim() ? "not-allowed" : "pointer",
                padding:      "0.6rem 0.9rem",
                fontSize:     "0.85rem",
                fontWeight:   700,
                transition:   "background 0.15s",
                whiteSpace:   "nowrap",
                flexShrink:   0,
              }}
            >
              {t.send} ↑
            </button>
          </div>
        </div>
      )}

      {/* ── BOTÓN FLOTANTE ─────────────────────────────── */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? t.close : t.open}
        className="chat-float-btn"
        style={{
          position:     "fixed",
          bottom:       "24px",
          right:        "24px",
          width:        "56px",
          height:       "56px",
          borderRadius: "50%",
          background:   `linear-gradient(135deg, ${TEAL}, #008F7E)`,
          border:       "none",
          cursor:       "pointer",
          boxShadow:    "0 4px 20px rgba(0,201,177,0.45)",
          display:      "flex",
          alignItems:   "center",
          justifyContent:"center",
          fontSize:     "1.5rem",
          zIndex:       10000,
          transition:   "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 28px rgba(0,201,177,0.6)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(0,201,177,0.45)";
        }}
      >
        {isOpen ? "×" : "💬"}
      </button>

      {/* ── Animación typing dots ──────────────────────── */}
      <style>{`
        @keyframes chatDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30%            { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </>
  );
}
