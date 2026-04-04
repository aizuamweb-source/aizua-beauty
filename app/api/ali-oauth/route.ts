// app/api/ali-oauth/route.ts
// Aizua — OAuth AliExpress: inicio + callback
//
// USAR UNA SOLA VEZ para autorizar tu app:
// Visitar: https://aizua.com/api/ali-oauth (o localhost:3000/api/ali-oauth)
// → Redirige a AliExpress → Autorizar → Vuelve con tokens guardados

import { NextRequest, NextResponse } from "next/server";
import { getAuthorizationUrl, exchangeCodeForTokens } from "@/lib/aliexpress/oauth";

// GET /api/ali-oauth → Inicia el flujo OAuth
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // ── CALLBACK: AliExpress nos redirige aquí con ?code=XXXX ──
  if (code) {
    if (state !== "aizua-admin") {
      return new NextResponse("Estado inválido — posible ataque CSRF", { status: 403 });
    }

    try {
      const tokens = await exchangeCodeForTokens(code);

      // Mostrar página de éxito con instrucciones
      return new NextResponse(`
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Aizua — AliExpress OAuth</title>
<style>body{font-family:system-ui;background:#07070F;color:#F0F0F0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;}
.card{background:#0D0D1A;border:1px solid rgba(0,201,177,0.3);border-radius:16px;padding:40px;max-width:560px;text-align:center;}
h1{color:#00C9B1;font-size:24px;margin-bottom:8px;}
p{color:#5A5A72;font-size:14px;margin:8px 0;}
.token{background:#111120;border:1px solid #1A1A2E;border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#00C9B1;word-break:break-all;margin:16px 0;text-align:left;}
.note{background:rgba(245,166,35,0.08);border:1px solid rgba(245,166,35,0.2);border-radius:8px;padding:12px;font-size:12px;color:#F5A623;margin-top:16px;}
</style></head>
<body><div class="card">
<div style="font-size:48px;margin-bottom:16px">✅</div>
<h1>Autorización completada</h1>
<p>Tokens guardados en Supabase. AliExpress API lista para usar.</p>
<div class="token">access_token: ${tokens.access_token.slice(0, 20)}...****</div>
<div class="note">
  ⚠️ Opcional: copia el access_token a ALI_ACCESS_TOKEN en .env.local para desarrollo local.<br><br>
  En producción, el token se auto-refresca automáticamente desde Supabase.
</div>
<p style="margin-top:24px">Expira en: ${Math.round(tokens.expires_in / 86400)} días</p>
</div></body>
</html>`, {
        headers: { "Content-Type": "text/html" },
      });

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      return new NextResponse(`Error OAuth: ${msg}`, { status: 500 });
    }
  }

  // ── Error de AliExpress ──
  if (error) {
    return new NextResponse(`AliExpress OAuth error: ${error}`, { status: 400 });
  }

  // ── INICIO: Redirigir a AliExpress para autorizar ──
  const authUrl = getAuthorizationUrl();
  return NextResponse.redirect(authUrl);
}
