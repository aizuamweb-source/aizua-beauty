/**
 * AG-41 — AyudaT Facturas (Vercel Cloud)
 * Lee PDFs desde Google Drive Fiscal/YYYY/MM-Mes/Gastos/
 * y los sube a AyudaT. Corre el último día del mes.
 *
 * GET /api/ayudat-facturas             → cron (último día mes 23:00)
 * GET /api/ayudat-facturas?force=true  → forzar ejecución
 * GET /api/ayudat-facturas?month=2026-03 → mes específico
 *
 * Env vars necesarias:
 *   GOOGLE_SERVICE_ACCOUNT_B64  — base64 de service_account.json
 *   AYUDAT_JWT                  — Bearer token AyudaT
 *   TELEGRAM_BOT_TOKEN
 *   TELEGRAM_CHAT_ID
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSign } from "crypto";

// ─── Helpers Google JWT ───────────────────────────────────────────────────────

function base64url(data: string | Buffer): string {
  const buf = typeof data === "string" ? Buffer.from(data) : data;
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function getGoogleAccessToken(sa: Record<string, string>, scopes: string[]): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(JSON.stringify({
    iss: sa.client_email,
    scope: scopes.join(" "),
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  }));
  const signingInput = `${header}.${claim}`;
  const sign = createSign("RSA-SHA256");
  sign.update(signingInput);
  const signature = base64url(sign.sign(sa.private_key));
  const jwt = `${signingInput}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await res.json() as { access_token?: string; error?: string };
  if (!data.access_token) throw new Error(`Google token error: ${data.error}`);
  return data.access_token;
}

// ─── Helpers Google Drive ─────────────────────────────────────────────────────

const GDRIVE_MONTH_FOLDERS_2026: Record<number, string> = {
  1: "14ZA6skDILn6NNqH7jtXdODHfXnRVQ3Fs",
  2: "1J2BZRjyooen_cVojqsX6-nznDQv8E_Z_",
  3: "1n2aauuvqJWzHKN79V68oof9nSKkz9vJb",
};

const MONTH_NAMES_ES: Record<number, string> = {
  1: "01-Ene", 2: "02-Feb", 3: "03-Mar", 4: "04-Abr",
  5: "05-May", 6: "06-Jun", 7: "07-Jul", 8: "08-Ago",
  9: "09-Sep", 10: "10-Oct", 11: "11-Nov", 12: "12-Dic",
};

const GDRIVE_2026_FOLDER_ID = "18IDQmWzWNOw8IjbTJYzpxlmj4lFUunCb";

async function driveListFiles(token: string, folderId: string, mimeType?: string): Promise<any[]> {
  const q = mimeType
    ? `'${folderId}' in parents and mimeType = '${mimeType}' and trashed = false`
    : `'${folderId}' in parents and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,size,mimeType)&pageSize=100`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json() as { files?: any[] };
  return data.files ?? [];
}

async function driveDownloadFile(token: string, fileId: string): Promise<Buffer> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function getGastosFolderId(token: string, year: number, month: number): Promise<string | null> {
  // Obtener carpeta del mes
  let monthFolderId: string | null = null;
  if (year === 2026 && GDRIVE_MONTH_FOLDERS_2026[month]) {
    monthFolderId = GDRIVE_MONTH_FOLDERS_2026[month];
  } else {
    // Buscar dinámicamente
    const monthName = MONTH_NAMES_ES[month];
    const yearFolder = GDRIVE_2026_FOLDER_ID; // Ampliar si es necesario
    const items = await driveListFiles(token, yearFolder, "application/vnd.google-apps.folder");
    const match = items.find((f) => f.name === monthName);
    if (match) monthFolderId = match.id;
  }
  if (!monthFolderId) return null;

  // Buscar subcarpeta Gastos
  const subfolders = await driveListFiles(token, monthFolderId, "application/vnd.google-apps.folder");
  const gastos = subfolders.find((f) => f.name === "Gastos");
  return gastos?.id ?? null;
}

// ─── AyudaT Upload ────────────────────────────────────────────────────────────

const AYUDAT_BASE_URL = "https://ayudat.aonsolutions.net/ms/api";
const AYUDAT_DOMAIN_ID = "49365";

async function uploadToAyudaT(pdfBuffer: Buffer, filename: string, jwt: string): Promise<boolean> {
  // Estrategia 1: Mi nube (S3)
  try {
    const formData = new FormData();
    const blob = new Blob([pdfBuffer], { type: "application/pdf" });
    formData.append("file", blob, filename);

    const res = await fetch(`${AYUDAT_BASE_URL}/s3/?domain=${AYUDAT_DOMAIN_ID}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}` },
      body: formData,
    });
    if (res.status === 200 || res.status === 201) return true;
    console.warn(`AyudaT S3 status ${res.status}`);
  } catch (e) {
    console.warn("AyudaT S3 error:", e);
  }

  // Estrategia 2: Factura + adjunto
  try {
    const today = new Date().toISOString().split("T")[0];
    const r1 = await fetch(`${AYUDAT_BASE_URL}/invoice`, {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
      body: JSON.stringify({ type: "purchase", country: "ES", date: today, total: 0, reference: filename }),
    });
    if (!r1.ok) return false;
    const inv = await r1.json() as { id?: string };
    if (!inv.id) return false;

    const fd2 = new FormData();
    fd2.append("file", new Blob([pdfBuffer], { type: "application/pdf" }), filename);
    const r2 = await fetch(`${AYUDAT_BASE_URL}/invoice/${inv.id}/document`, {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}` },
      body: fd2,
    });
    return r2.ok;
  } catch (e) {
    console.error("AyudaT fallback error:", e);
    return false;
  }
}

// ─── Telegram ─────────────────────────────────────────────────────────────────

async function sendTelegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text, parse_mode: "HTML" }),
  }).catch(() => {});
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Auth
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Allow force param from manual browser call (no auth header)
    const { searchParams } = new URL(req.url);
    if (!searchParams.has("force") && !searchParams.has("month")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { searchParams } = new URL(req.url);
  const forceRun = searchParams.has("force");
  const monthParam = searchParams.get("month"); // YYYY-MM

  // Determinar mes objetivo
  const now = new Date();
  let targetYear = now.getFullYear();
  let targetMonth = now.getMonth() + 1;

  if (monthParam) {
    const [y, m] = monthParam.split("-").map(Number);
    if (y && m) { targetYear = y; targetMonth = m; }
  }

  // Verificar si es el último día del mes (salvo --force)
  if (!forceRun && !monthParam) {
    const lastDay = new Date(targetYear, targetMonth, 0).getDate();
    if (now.getDate() !== lastDay) {
      return NextResponse.json({
        skipped: true,
        reason: `Day ${now.getDate()} of ${lastDay}. Run on day ${lastDay} or use ?force=true`,
      });
    }
  }

  // Verificar env vars
  const saB64 = process.env.GOOGLE_SERVICE_ACCOUNT_B64;
  const ayudatJwt = process.env.AYUDAT_JWT;

  if (!saB64) {
    await sendTelegram("❌ <b>AG-41:</b> GOOGLE_SERVICE_ACCOUNT_B64 no configurado en Vercel");
    return NextResponse.json({ error: "GOOGLE_SERVICE_ACCOUNT_B64 not set" }, { status: 500 });
  }
  if (!ayudatJwt) {
    await sendTelegram("❌ <b>AG-41:</b> AYUDAT_JWT no configurado. Renovar en AyudaT → LocalStorage");
    return NextResponse.json({ error: "AYUDAT_JWT not set" }, { status: 500 });
  }

  // Supabase para tracking de IDs ya subidos
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const monthLabel = MONTH_NAMES_ES[targetMonth] ?? `${targetMonth}`;
  console.log(`AG-41: Procesando ${monthLabel} ${targetYear}`);

  try {
    // Obtener service account
    const sa = JSON.parse(Buffer.from(saB64, "base64").toString("utf-8"));

    // Google Drive token
    const driveToken = await getGoogleAccessToken(sa, ["https://www.googleapis.com/auth/drive.readonly"]);

    // Encontrar carpeta Gastos
    const gastosFolderId = await getGastosFolderId(driveToken, targetYear, targetMonth);
    if (!gastosFolderId) {
      const msg = `📭 AG-41: Sin carpeta Gastos para ${monthLabel} ${targetYear}`;
      await sendTelegram(msg);
      return NextResponse.json({ message: msg });
    }

    // Listar PDFs
    const driveFiles = await driveListFiles(driveToken, gastosFolderId, "application/pdf");
    if (driveFiles.length === 0) {
      const msg = `📭 AG-41: Sin PDFs en ${monthLabel} ${targetYear}`;
      await sendTelegram(msg);
      return NextResponse.json({ message: msg });
    }

    console.log(`AG-41: ${driveFiles.length} PDFs encontrados en Drive`);

    // Cargar IDs ya subidos desde sync_logs
    const { data: uploadedLogs } = await supabase
      .from("sync_logs")
      .select("details")
      .eq("agent", "ag41")
      .eq("status", "ok")
      .gte("created_at", `${targetYear}-${String(targetMonth).padStart(2, "0")}-01`);

    const uploadedDriveIds = new Set<string>(
      (uploadedLogs ?? []).map((l: any) => l.details?.drive_id).filter(Boolean)
    );

    // Procesar PDFs
    let uploaded = 0;
    let skipped = 0;
    let failed = 0;

    for (const file of driveFiles) {
      if (uploadedDriveIds.has(file.id)) {
        console.log(`  Skip (ya subido): ${file.name}`);
        skipped++;
        continue;
      }

      console.log(`  Procesando: ${file.name}`);
      const pdfBuffer = await driveDownloadFile(driveToken, file.id);
      const ok = await uploadToAyudaT(pdfBuffer, file.name, ayudatJwt);

      if (ok) {
        uploaded++;
        // Registrar en sync_logs
        await supabase.from("sync_logs").insert({
          agent: "ag41",
          action: "upload_ayudat",
          status: "ok",
          details: { drive_id: file.id, filename: file.name, month: `${targetYear}-${targetMonth}` },
        });
      } else {
        failed++;
        console.error(`  Error subiendo: ${file.name}`);
      }

      // Rate limiting
      await new Promise((r) => setTimeout(r, 500));
    }

    // Telegram report
    const icon = failed === 0 ? "✅" : "⚠️";
    const msg = [
      `${icon} <b>AG-41 AyudaT — ${monthLabel} ${targetYear}</b>`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `📤 Subidos: <b>${uploaded}</b>`,
      `↷ Omitidos (ya subidos): <b>${skipped}</b>`,
      `❌ Errores: <b>${failed}</b>`,
      uploaded > 0 ? `\n<i>Revisa en AyudaT → Facturación → A revisar</i>` : "",
    ].filter(Boolean).join("\n");

    await sendTelegram(msg);

    return NextResponse.json({ ok: true, uploaded, skipped, failed, month: `${targetYear}-${targetMonth}` });
  } catch (error: any) {
    const errMsg = `❌ AG-41 error: ${error?.message ?? "Unknown"}`;
    console.error(errMsg);
    await sendTelegram(`❌ <b>AG-41 AyudaT:</b> ${error?.message}`);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
