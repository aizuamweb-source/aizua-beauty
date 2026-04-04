"use client";

/**
 * /admin/content — Agente de Contenido — Panel de revisión
 * Acceso: solo con SYNC_SECRET_TOKEN en localStorage ("aizua_admin_token")
 * Permite: ver drafts, generar nuevo contenido, aprobar/rechazar, copiar al portapapeles
 */

import { useState, useEffect, useCallback } from "react";

// ── Tipos ─────────────────────────────────────────────────
type ContentOutput = {
  id:           string;
  content_type: string;
  product_slug: string | null;
  status:       string;
  channel:      string | null;
  created_at:   string;
  tokens_used:  number | null;
  content:      Record<string, string>;
};

type Stats = { content_type: string; total: number; drafts: number; approved: number; published: number }[];

// ── Paleta ────────────────────────────────────────────────
const TEAL = "#00C9B1";
const DARK = "#07070F";
const S    = "#111118";
const BDR  = "rgba(255,255,255,0.08)";
const FONT = "system-ui, -apple-system, sans-serif";

const TYPE_LABELS: Record<string, string> = {
  tiktok_script:       "🎬 TikTok/Reels",
  social_post:         "📸 Instagram/Facebook",
  product_description: "🛍️ Descripción producto",
  blog_article:        "📝 Blog SEO",
  email_subject:       "📧 Email carrito",
  kdp_chapter:         "📚 Capítulo KDP",
  academy_module:      "🎓 Módulo Academy",
};

const STATUS_COLOR: Record<string, string> = {
  draft:     "#F59E0B",
  approved:  TEAL,
  published: "#10B981",
  rejected:  "#EF4444",
};

export default function ContentAdminPage({ params }: { params: { locale: string } }) {
  const { locale } = params;

  const [token,       setToken]       = useState("");
  const [authed,      setAuthed]      = useState(false);
  const [outputs,     setOutputs]     = useState<ContentOutput[]>([]);
  const [stats,       setStats]       = useState<Stats>([]);
  const [loading,     setLoading]     = useState(false);
  const [generating,  setGenerating]  = useState(false);
  const [filterType,  setFilterType]  = useState("all");
  const [filterStatus,setFilterStatus]= useState("draft");
  const [expanded,    setExpanded]    = useState<string | null>(null);
  const [copied,      setCopied]      = useState<string | null>(null);
  const [feedback,    setFeedback]    = useState<{ msg: string; ok: boolean } | null>(null);
  const [genLocale,   setGenLocale]   = useState<"es" | "en">("es");

  // ── Auth ───────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("aizua_admin_token");
    if (saved) { setToken(saved); setAuthed(true); }
  }, []);

  function login() {
    localStorage.setItem("aizua_admin_token", token);
    setAuthed(true);
  }

  // ── Fetch outputs ──────────────────────────────────────
  const fetchOutputs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: filterStatus, limit: "30" });
      if (filterType !== "all") params.set("type", filterType);

      const [outRes, statsRes] = await Promise.all([
        fetch(`/api/content-agent?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/content-agent?stats=1`,   { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const outData   = await outRes.json();
      const statsData = await statsRes.json();
      setOutputs(outData.outputs  ?? []);
      setStats(  statsData.stats  ?? []);
    } finally {
      setLoading(false);
    }
  }, [token, filterType, filterStatus]);

  useEffect(() => { if (authed) fetchOutputs(); }, [authed, fetchOutputs]);

  // ── Batch semanal manual ───────────────────────────────
  async function runBatch() {
    setGenerating(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/content-agent", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ batch: true }),
      });
      const data = await res.json();
      setFeedback({ msg: `✅ Batch completado: ${data.generated} guiones generados`, ok: true });
      fetchOutputs();
    } catch {
      setFeedback({ msg: "❌ Error al ejecutar batch", ok: false });
    } finally {
      setGenerating(false);
    }
  }

  // ── Generar contenido individual ───────────────────────
  async function generateOne(slug: string, name: string, price: number, productId: string) {
    setGenerating(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/content-agent", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: "tiktok_script",
          params: {
            productName: name,
            price,
            productId,
            productSlug: slug,
            locales: [genLocale],
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ msg: `✅ Guión generado para ${name}`, ok: true });
        fetchOutputs();
      } else {
        setFeedback({ msg: `❌ ${data.error}`, ok: false });
      }
    } finally {
      setGenerating(false);
    }
  }

  // ── Aprobar / Rechazar ─────────────────────────────────
  async function updateStatus(id: string, status: string) {
    const res = await fetch("/api/content-agent", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) fetchOutputs();
  }

  // ── Copiar al portapapeles ─────────────────────────────
  function copyContent(id: string, text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  // ── Pantalla de login ──────────────────────────────────
  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: DARK, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
        <div style={{ background: S, border: `1px solid ${BDR}`, borderRadius: "16px", padding: "2.5rem", width: "360px", textAlign: "center" }}>
          <p style={{ color: TEAL, fontWeight: 700, fontSize: "1.1rem", marginBottom: "1.5rem" }}>🤖 Agente Contenido</p>
          <input
            type="password"
            placeholder="SYNC_SECRET_TOKEN"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${BDR}`, borderRadius: "8px", color: "#fff", padding: "0.7rem 1rem", fontSize: "0.9rem", outline: "none", boxSizing: "border-box", marginBottom: "1rem" }}
          />
          <button onClick={login} style={{ width: "100%", background: TEAL, border: "none", borderRadius: "8px", color: "#fff", padding: "0.75rem", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem" }}>
            Entrar
          </button>
        </div>
      </div>
    );
  }

  // ── Dashboard ──────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: DARK, fontFamily: FONT, color: "#ddd" }}>
      {/* Header */}
      <div style={{ background: S, borderBottom: `1px solid ${BDR}`, padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, color: TEAL, fontSize: "1.2rem", fontWeight: 700 }}>🤖 Agente de Contenido</h1>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "#666" }}>Genera, revisa y aprueba guiones TikTok/IG · Blog · KDP · Academy</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <select value={genLocale} onChange={(e) => setGenLocale(e.target.value as "es" | "en")}
            style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BDR}`, borderRadius: "8px", color: "#ddd", padding: "0.5rem 0.75rem", fontSize: "0.82rem" }}>
            <option value="es">🇪🇸 Español</option>
            <option value="en">🇬🇧 English</option>
          </select>
          <button onClick={runBatch} disabled={generating}
            style={{ background: generating ? "#333" : TEAL, border: "none", borderRadius: "8px", color: "#fff", padding: "0.6rem 1.2rem", fontWeight: 700, cursor: generating ? "not-allowed" : "pointer", fontSize: "0.85rem" }}>
            {generating ? "Generando..." : "⚡ Batch TikTok (Top 5)"}
          </button>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div style={{ margin: "1rem 2rem 0", padding: "0.75rem 1rem", borderRadius: "10px", background: feedback.ok ? "rgba(0,201,177,0.12)" : "rgba(239,68,68,0.12)", border: `1px solid ${feedback.ok ? TEAL : "#ef4444"}`, color: feedback.ok ? TEAL : "#f87171", fontSize: "0.85rem" }}>
          {feedback.msg}
        </div>
      )}

      {/* Stats */}
      {stats.length > 0 && (
        <div style={{ padding: "1rem 2rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {stats.map((s) => (
            <div key={s.content_type} style={{ background: S, border: `1px solid ${BDR}`, borderRadius: "10px", padding: "0.75rem 1rem", minWidth: "160px" }}>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "#888" }}>{TYPE_LABELS[s.content_type] ?? s.content_type}</p>
              <p style={{ margin: "0.25rem 0 0", fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>{s.total}</p>
              <p style={{ margin: 0, fontSize: "0.72rem", color: "#666" }}>{s.drafts} draft · {s.approved} ok · {s.published} pub</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div style={{ padding: "0 2rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BDR}`, borderRadius: "8px", color: "#ddd", padding: "0.45rem 0.75rem", fontSize: "0.82rem" }}>
          <option value="draft">Pendientes</option>
          <option value="approved">Aprobados</option>
          <option value="published">Publicados</option>
          <option value="rejected">Rechazados</option>
          <option value="all">Todos</option>
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BDR}`, borderRadius: "8px", color: "#ddd", padding: "0.45rem 0.75rem", fontSize: "0.82rem" }}>
          <option value="all">Todos los tipos</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button onClick={fetchOutputs} style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BDR}`, borderRadius: "8px", color: "#ddd", padding: "0.45rem 0.9rem", cursor: "pointer", fontSize: "0.82rem" }}>
          ↺ Actualizar
        </button>
      </div>

      {/* Lista de outputs */}
      <div style={{ padding: "0.5rem 2rem 3rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {loading && <p style={{ color: "#666", fontSize: "0.85rem" }}>Cargando...</p>}
        {!loading && outputs.length === 0 && (
          <div style={{ background: S, border: `1px solid ${BDR}`, borderRadius: "12px", padding: "2rem", textAlign: "center" }}>
            <p style={{ color: "#555", margin: 0 }}>No hay contenido {filterStatus === "draft" ? "pendiente de revisión" : `en estado "${filterStatus}"`}.</p>
            <p style={{ color: "#444", fontSize: "0.82rem", marginTop: "0.5rem" }}>Usa "Batch TikTok" para generar guiones automáticamente.</p>
          </div>
        )}

        {outputs.map((out) => {
          const isExpanded = expanded === out.id;
          const text = out.content?.[locale] ?? out.content?.es ?? out.content?.en ?? "";
          const preview = text.slice(0, 120) + (text.length > 120 ? "…" : "");
          const date = new Date(out.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

          return (
            <div key={out.id} style={{ background: S, border: `1px solid ${BDR}`, borderRadius: "12px", overflow: "hidden" }}>
              {/* Card header */}
              <div style={{ padding: "0.85rem 1.1rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.78rem", color: "#888" }}>{TYPE_LABELS[out.content_type] ?? out.content_type}</span>
                {out.product_slug && <span style={{ background: "rgba(255,255,255,0.06)", borderRadius: "6px", padding: "0.2rem 0.5rem", fontSize: "0.72rem", color: "#aaa" }}>{out.product_slug}</span>}
                <span style={{ background: STATUS_COLOR[out.status] + "22", border: `1px solid ${STATUS_COLOR[out.status]}44`, color: STATUS_COLOR[out.status], borderRadius: "6px", padding: "0.2rem 0.6rem", fontSize: "0.72rem", fontWeight: 700 }}>{out.status}</span>
                {out.channel && <span style={{ fontSize: "0.72rem", color: "#666" }}>#{out.channel}</span>}
                <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: "#555" }}>{date}</span>
                {out.tokens_used && <span style={{ fontSize: "0.7rem", color: "#444" }}>{out.tokens_used} tokens</span>}
              </div>

              {/* Preview / contenido */}
              <div style={{ padding: "0 1.1rem 0.85rem" }}>
                <p style={{ margin: 0, fontSize: "0.83rem", color: "#aaa", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {isExpanded ? text : preview}
                </p>
                {text.length > 120 && (
                  <button onClick={() => setExpanded(isExpanded ? null : out.id)}
                    style={{ background: "none", border: "none", color: TEAL, cursor: "pointer", fontSize: "0.78rem", padding: "0.25rem 0", marginTop: "0.25rem" }}>
                    {isExpanded ? "Ver menos ▲" : "Ver completo ▼"}
                  </button>
                )}
              </div>

              {/* Acciones */}
              <div style={{ borderTop: `1px solid ${BDR}`, padding: "0.6rem 1.1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button onClick={() => copyContent(out.id, text)}
                  style={{ background: copied === out.id ? "rgba(0,201,177,0.15)" : "rgba(255,255,255,0.06)", border: `1px solid ${BDR}`, borderRadius: "7px", color: copied === out.id ? TEAL : "#aaa", padding: "0.35rem 0.8rem", cursor: "pointer", fontSize: "0.78rem" }}>
                  {copied === out.id ? "✓ Copiado" : "📋 Copiar"}
                </button>
                {out.status === "draft" && (
                  <>
                    <button onClick={() => updateStatus(out.id, "approved")}
                      style={{ background: "rgba(0,201,177,0.12)", border: `1px solid ${TEAL}44`, borderRadius: "7px", color: TEAL, padding: "0.35rem 0.8rem", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700 }}>
                      ✓ Aprobar
                    </button>
                    <button onClick={() => updateStatus(out.id, "rejected")}
                      style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "7px", color: "#f87171", padding: "0.35rem 0.8rem", cursor: "pointer", fontSize: "0.78rem" }}>
                      ✕ Rechazar
                    </button>
                  </>
                )}
                {out.status === "approved" && (
                  <button onClick={() => updateStatus(out.id, "published")}
                    style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "7px", color: "#10B981", padding: "0.35rem 0.8rem", cursor: "pointer", fontSize: "0.78rem" }}>
                    🚀 Marcar publicado
                  </button>
                )}
                {/* Idiomas disponibles */}
                <div style={{ marginLeft: "auto", display: "flex", gap: "0.35rem" }}>
                  {Object.keys(out.content).filter((l) => out.content[l]).map((l) => (
                    <span key={l} style={{ background: "rgba(255,255,255,0.05)", borderRadius: "5px", padding: "0.2rem 0.4rem", fontSize: "0.7rem", color: "#666" }}>{l}</span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
