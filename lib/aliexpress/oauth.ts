// lib/aliexpress/oauth.ts
// Aizua — Gestión de tokens OAuth AliExpress
//
// FLUJO DE AUTORIZACIÓN (una sola vez):
// 1. Redirigir al usuario a: https://oauth.aliexpress.com/authorize?...
// 2. AliExpress redirige de vuelta con ?code=XXXX
// 3. Intercambiar code por access_token + refresh_token
// 4. Guardar tokens en Supabase (o .env para uso personal)
// 5. Refrescar automáticamente antes de que expire (cada ~30 días)

import { createClient } from "@supabase/supabase-js";

const ALI_AUTH_URL   = "https://api-sg.aliexpress.com/rest";
const ALI_OAUTH_URL  = "https://api-sg.aliexpress.com/oauth/authorize";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── PASO 1: Generar URL de autorización ──
// Redirige al propietario (Miguel) a AliExpress para autorizar la app
export function getAuthorizationUrl(): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id:     process.env.ALIEXPRESS_APP_KEY!,
    redirect_uri:  `${process.env.NEXT_PUBLIC_APP_URL}/api/ali-oauth`,
    state:         "aizua-admin",   // Protección CSRF
  });

  return `${ALI_OAUTH_URL}?${params.toString()}`;
}

// ── PASO 2: Intercambiar código por tokens ──
export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  // Token exchange via /sync with method=/auth/token/create + HMAC-SHA256 + epoch_ms timestamp
  const { createHmac } = await import("crypto");
  const ts = Date.now().toString();

  const params: Record<string, string> = {
    method:      "/auth/token/create",
    app_key:     process.env.ALIEXPRESS_APP_KEY!,
    code,
    sign_method: "sha256",
    timestamp:   ts,
  };

  const sorted = Object.entries(params).sort((a, b) => a[0].localeCompare(b[0]));
  const signStr = sorted.map(([k, v]) => `${k}${v}`).join("");
  const sign = createHmac("sha256", process.env.ALIEXPRESS_APP_SECRET!)
    .update(signStr).digest("hex").toUpperCase();
  params.sign = sign;

  const res = await fetch("https://api-sg.aliexpress.com/sync", {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    new URLSearchParams(params).toString(),
  });

  const text = await res.text();
  let data: Record<string, unknown>;
  try { data = JSON.parse(text); } catch { throw new Error(`OAuth parse error: ${text.slice(0, 300)}`); }
  if (data.error_response) throw new Error(`OAuth error: ${(data.error_response as Record<string, string>).msg}`);
  if (data.code && data.message) throw new Error(`OAuth error: ${data.message as string}`);

  // Response wraps in /auth/token/create_response
  const wrapper = (data as Record<string, Record<string, string>>)["/auth/token/create_response"]
    || (data as Record<string, Record<string, string>>).top_auth_token_create_response
    || data;
  let token: Record<string, string>;
  if (typeof wrapper === "object" && typeof (wrapper as Record<string, string>).token_result === "string") {
    token = JSON.parse((wrapper as Record<string, string>).token_result);
  } else {
    token = wrapper as unknown as Record<string, string>;
  }

  const accessToken  = token.access_token  || "";
  const refreshToken = token.refresh_token || "";
  // expire_time is Unix ms or seconds; detect by magnitude
  let expiresIn = 2592000; // default 30 days
  if (token.expire_time) {
    const et = Number(token.expire_time);
    expiresIn = et > 9999999999 ? Math.floor((et - Date.now()) / 1000) : et;
  }

  await supabase.from("ali_tokens").upsert({
    id:            "main",
    access_token:  accessToken,
    refresh_token: refreshToken,
    expires_at:    new Date(Date.now() + expiresIn * 1000).toISOString(),
    updated_at:    new Date().toISOString(),
  }, { onConflict: "id" });

  return { access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn };
}

// ── PASO 3: Refrescar token antes de que expire ──
export async function refreshAccessToken(): Promise<string> {
  // Obtener refresh_token de Supabase
  const { data: tokenRow } = await supabase
    .from("ali_tokens")
    .select("*")
    .eq("id", "main")
    .single();

  if (!tokenRow) throw new Error("No hay tokens guardados. Completa el flujo OAuth primero.");

  // Si el token aún es válido (>5 min), devolver el actual
  const expiresAt = new Date(tokenRow.expires_at).getTime();
  if (Date.now() < expiresAt - 5 * 60 * 1000) {
    return tokenRow.access_token;
  }

  // Refrescar
  const body = JSON.stringify({
    app_key:       process.env.ALIEXPRESS_APP_KEY!,
    app_secret:    process.env.ALIEXPRESS_APP_SECRET!,
    refresh_token: tokenRow.refresh_token,
  });

  const res = await fetch("https://api-sg.aliexpress.com/auth/token/refresh", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  if (!res.ok) throw new Error(`Refresh token error: ${res.status}`);
  const data = await res.json();

  // Guardar nuevo token
  await supabase.from("ali_tokens").upsert({
    id:            "main",
    access_token:  data.access_token,
    refresh_token: data.refresh_token || tokenRow.refresh_token,
    expires_at:    new Date(Date.now() + data.expires_in * 1000).toISOString(),
    updated_at:    new Date().toISOString(),
  }, { onConflict: "id" });

  console.log("[ali-oauth] Token refreshed successfully");
  return data.access_token;
}

// ── PASO 4: Obtener token válido (auto-refresca si necesario) ──
export async function getValidToken(): Promise<string> {
  // Primero intentar desde .env (para desarrollo o configuración inicial)
  if (process.env.ALI_ACCESS_TOKEN) {
    return process.env.ALI_ACCESS_TOKEN;
  }
  // Si no, obtener/refrescar desde Supabase
  return refreshAccessToken();
}
