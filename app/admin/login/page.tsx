"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push("/admin/products");
      } else {
        const data = await res.json();
        setError(data.error || "Credenciales incorrectas");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", background: "#f8f4f1", padding: "24px",
    }}>
      <div style={{
        background: "white", borderRadius: "14px", border: "1px solid #e8ddd5",
        padding: "40px 36px", width: "100%", maxWidth: "380px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>🌸</div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1a0a0a" }}>AizuaBeauty Admin</h1>
          <p style={{ fontSize: "13px", color: "#9b7a69", marginTop: "4px" }}>Acceso restringido</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#6b4c3b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="admin@aizualabs.com"
              style={{
                width: "100%", padding: "10px 14px", border: "1px solid #e8ddd5",
                borderRadius: "8px", fontSize: "14px", color: "#2d1f1f", outline: "none",
              }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#6b4c3b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              style={{
                width: "100%", padding: "10px 14px", border: "1px solid #e8ddd5",
                borderRadius: "8px", fontSize: "14px", color: "#2d1f1f", outline: "none",
              }}
            />
          </div>

          {error && (
            <div style={{
              background: "#fde8e8", color: "#8b1a1a", borderRadius: "8px",
              padding: "10px 14px", fontSize: "13px", marginBottom: "16px",
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "12px", background: loading ? "#9b7a69" : "#1a0a0a",
              color: "white", border: "none", borderRadius: "8px", fontSize: "14px",
              fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", transition: "background 0.15s",
            }}
          >
            {loading ? "Accediendo..." : "Entrar →"}
          </button>
        </form>
      </div>
    </div>
  );
}
