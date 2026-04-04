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

const ALI_AUTH_URL   = "https://oauth.aliexpress.com/token";
const ALI_OAUTH_URL  = "https://oauth.aliexpress.com/authorize";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── PASO 1: Generar URL de autorización ──
// Redirige al propietario (Miguel) a AliExpress para autorizar la app
export function getAuthorizationUrl(): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id:     process.env.ALI_APP_KEY!,
    redirect_uri:  `${process.env.NEXT_PUBLIC_APP_URL}/api/ali-oauth/callback`,
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
  const params = new URLSearchParams({
    grant_type:    "authorization_code",
    code,
    client_id:     process.env.ALI_APP_KEY!,
    client_secret: process.env.ALI_APP_SECRET!,
    redirect_uri:  `${process.env.NEXT_PUBLIC_APP_URL}/api/ali-oauth/callback`,
  });

  const res = await fetch(ALI_AUTH_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    params.toString(),
  });

  if (!res.ok) throw new Error(`OAuth error: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(`OAuth error: ${data.error_description}`);

  // Guardar en Supabase para uso persistente
  await supabase.from("ali_tokens").upsert({
    id:            "main",
    access_token:  data.access_token,
    refresh_token: data.refresh_token,
    expires_at:    new Date(Date.now() + data.expires_in * 1000).toISOString(),
    updated_at:    new Date().toISOString(),
  }, { onConflict: "id" });

  return data;
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
  const params = new URLSearchParams({
    grant_type:    "refresh_token",
    refresh_token: tokenRow.refresh_token,
    client_id:     process.env.ALI_APP_KEY!,
    client_secret: process.env.ALI_APP_SECRET!,
  });

  const res = await fetch(ALI_AUTH_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    params.toString(),
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
