/**
 * AG-19 — Fiscal 360 (Vercel Cloud)
 * Calcula estimaciones fiscales trimestrales leyendo desde AizuaFinance Google Sheets
 * y envía resumen por Telegram.
 *
 * GET /api/fiscal-360            → cron (1 Ene, 1 Abr, 1 Jul, 1 Oct)
 * GET /api/fiscal-360?run=true   → forzar ejecución
 * GET /api/fiscal-360?trim=2     → trimestre específico (1-4)
 *
 * No necesita Google service account — usa el Apps Script URL público de AizuaFinance.
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

// ─── Config ───────────────────────────────────────────────────────────────────

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxukqQQsTfJ9cnAmPHXxH6IoAgL654210pOaThzlJfzzHH9zFHSylRsPQSetHLSaln0/exec";

const ENTIDADES_GENERAL: Record<string, { nombre: string; ivaTipo: number }> = {
  consultoria: { nombre: "ConsultorIA", ivaTipo: 0.21 },
  academy: { nombre: "Academy", ivaTipo: 0.21 },
  kdp_es: { nombre: "Amazon KDP ES", ivaTipo: 0.04 },
};

const ENTIDADES_RECARGO: Record<string, { nombre: string }> = {
  aizuatec: { nombre: "AizuaTec" },
  aizuabeauty: { nombre: "AizuaBeauty" },
};

const FECHAS_LIMITE: Record<number, string> = {
  1: "20 Abril",
  2: "20 Julio",
  3: "20 Octubre",
  4: "30 Enero",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mesesTrimestre(q: number): number[] {
  return [(q - 1) * 3 + 1, (q - 1) * 3 + 2, (q - 1) * 3 + 3];
}

async function fetchSheetTab(tab: string): Promise<any[]> {
  try {
    const url = `${APPS_SCRIPT_URL}?tab=${encodeURIComponent(tab)}&action=read`;
    const res = await fetch(url, { signal: AbortSignal.timeout(25000) });
    if (!res.ok) return [];
    const data = await res.json() as { data?: any[] };
    return data.data ?? [];
  } catch (e) {
    console.warn(`Error fetch tab ${tab}:`, e);
    return [];
  }
}

function parseFecha(fechaStr: string): { year: number; month: number } | null {
  try {
    if (fechaStr.includes("/")) {
      const [d, m, y] = fechaStr.split("/").map(Number);
      return { year: y, month: m };
    } else if (fechaStr.includes("-")) {
      const parts = fechaStr.split("-").map(Number);
      if (parts.length === 3) {
        // Puede ser DD-MM-YYYY o YYYY-MM-DD
        if (parts[0] > 31) return { year: parts[0], month: parts[1] };
        return { year: parts[2], month: parts[1] };
      }
    }
  } catch {}
  return null;
}

function filtrarFilas(rows: any[], entidad: string, year: number, meses: number[]): any[] {
  return rows.filter((r) => {
    const ent = String(r.entidad ?? "").toLowerCase().trim();
    if (ent !== entidad.toLowerCase()) return false;
    const fechaStr = String(r.fecha ?? r.date ?? "");
    const f = parseFecha(fechaStr);
    return f && f.year === year && meses.includes(f.month);
  });
}

function sumaCol(rows: any[], col: string): number {
  return rows.reduce((acc, r) => {
    const v = String(r[col] ?? "0").replace("€", "").replace(",", ".").trim();
    return acc + (parseFloat(v) || 0);
  }, 0);
}

function calcularMod130(ingresos: number, gastos: number): {
  ingresos: number; gastos: number; base: number; cuota: number; aPagar: number;
} {
  const redGastos = gastos * 0.05;
  const base = Math.max(0, ingresos - gastos - redGastos);
  const cuota = base * 0.2;
  return {
    ingresos: Math.round(ingresos * 100) / 100,
    gastos: Math.round(gastos * 100) / 100,
    base: Math.round(base * 100) / 100,
    cuota: Math.round(cuota * 100) / 100,
    aPagar: Math.round(cuota * 100) / 100,
  };
}

function calcularMod303(ingresos: number, ivaTipo: number, ivaSoportado: number): {
  devengado: number; deducible: number; resultado: number; aIngresar: number;
} {
  const devengado = ingresos * ivaTipo;
  const resultado = devengado - ivaSoportado;
  return {
    devengado: Math.round(devengado * 100) / 100,
    deducible: Math.round(ivaSoportado * 100) / 100,
    resultado: Math.round(resultado * 100) / 100,
    aIngresar: Math.round(Math.max(0, resultado) * 100) / 100,
  };
}

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
  const { searchParams } = new URL(req.url);
  const forceRun = searchParams.has("run") || searchParams.has("force");
  const trimParam = searchParams.get("trim");

  // Auth
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (cronSecret && authHeader !== `Bearer ${cronSecret}` && !forceRun) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const currentQ = Math.ceil(month / 3);

  // Trimestre objetivo
  let targetQ = currentQ;
  if (trimParam) {
    const t = parseInt(trimParam);
    if (t >= 1 && t <= 4) targetQ = t;
  }

  // Si no es forzado, solo ejecutar el primer día de cada trimestre
  if (!forceRun) {
    const isFirstDayOfQuarter = [1, 4, 7, 10].includes(month) && now.getDate() === 1;
    if (!isFirstDayOfQuarter) {
      return NextResponse.json({ skipped: true, reason: "Not first day of quarter" });
    }
    // Calcular el trimestre anterior (el que acaba de terminar)
    targetQ = currentQ === 1 ? 4 : currentQ - 1;
  }

  const meses = mesesTrimestre(targetQ);
  console.log(`AG-19: Calculando T${targetQ}/${year} (meses ${meses.join(",")})`);

  // Fetch datos de Sheets
  const [ingresosRaw, gastosRaw] = await Promise.all([
    fetchSheetTab("Ingresos"),
    fetchSheetTab("Gastos"),
  ]);

  if (ingresosRaw.length === 0 && gastosRaw.length === 0) {
    const msg = "⚠️ <b>AG-19 Fiscal 360:</b> No se pudieron obtener datos de AizuaFinance Sheets";
    await sendTelegram(msg);
    return NextResponse.json({ error: "No data from Sheets" }, { status: 500 });
  }

  // Calcular por entidad
  interface EntidadResult {
    nombre: string; regimen: string;
    ingresos: number; gastos: number;
    mod130: ReturnType<typeof calcularMod130>;
    mod303: ReturnType<typeof calcularMod303> | null;
  }
  const resultados: Record<string, EntidadResult> = {};

  for (const [entId, ent] of Object.entries(ENTIDADES_GENERAL)) {
    const ingRows = filtrarFilas(ingresosRaw, entId, year, meses);
    const gtoRows = filtrarFilas(gastosRaw, entId, year, meses);
    const ingresos = sumaCol(ingRows, "importe_neto");
    const gastos = sumaCol(gtoRows, "importe_neto");
    const ivaSoportado = sumaCol(gtoRows, "iva");
    resultados[entId] = {
      nombre: ent.nombre,
      regimen: "general",
      ingresos,
      gastos,
      mod130: calcularMod130(ingresos, gastos),
      mod303: calcularMod303(ingresos, ent.ivaTipo, ivaSoportado),
    };
  }

  for (const [entId, ent] of Object.entries(ENTIDADES_RECARGO)) {
    const ingRows = filtrarFilas(ingresosRaw, entId, year, meses);
    const gtoRows = filtrarFilas(gastosRaw, entId, year, meses);
    const ingresos = sumaCol(ingRows, "importe_neto");
    const gastos = sumaCol(gtoRows, "importe_neto");
    resultados[entId] = {
      nombre: ent.nombre,
      regimen: "recargo_equivalencia",
      ingresos,
      gastos,
      mod130: calcularMod130(ingresos, gastos),
      mod303: null,
    };
  }

  // Totales
  const totalMod130 = Object.values(resultados).reduce((s, r) => s + r.mod130.aPagar, 0);
  const totalMod303 = Object.values(resultados).reduce(
    (s, r) => s + (r.mod303?.aIngresar ?? 0), 0
  );
  const totalIng = Object.values(resultados).reduce((s, r) => s + r.ingresos, 0);

  // Construir mensaje Telegram
  const lines = [
    `🧾 <b>Fiscal 360 — T${targetQ}/${year}</b>`,
    ``,
    `💰 Ingresos totales: <b>${totalIng.toFixed(2)}€</b>`,
    `📋 Mod.130 total: <b>${totalMod130.toFixed(2)}€</b>`,
    `📋 Mod.303 total: <b>${totalMod303.toFixed(2)}€</b>`,
    ``,
  ];

  for (const [, r] of Object.entries(resultados)) {
    const m130 = r.mod130.aPagar;
    const m303 = r.mod303?.aIngresar ?? 0;
    const emoji = r.ingresos > 0 ? "🟢" : "⚪";
    lines.push(
      `${emoji} <b>${r.nombre}:</b> ing=${r.ingresos.toFixed(0)}€ | 130=${m130.toFixed(0)}€ | 303=${m303.toFixed(0)}€`
    );
  }

  lines.push(``, `⏰ Fecha límite: <b>${FECHAS_LIMITE[targetQ] ?? "?"}</b>`);
  lines.push(`<i>Datos AizuaFinance · Estimación, verificar antes de presentar</i>`);

  const message = lines.join("\n");
  await sendTelegram(message);
  console.log(`AG-19: T${targetQ}/${year} completado. Mod.130=${totalMod130.toFixed(2)}€`);

  return NextResponse.json({
    ok: true,
    trimestre: targetQ,
    year,
    totales: { ingresos: totalIng, mod130: totalMod130, mod303: totalMod303 },
    resultados,
  });
}
