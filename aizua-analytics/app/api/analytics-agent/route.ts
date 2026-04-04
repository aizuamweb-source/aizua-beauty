// app/api/analytics-agent/route.ts
// Aizua — Agente Analytics con Claude API
// Ejecutado por n8n cada día a las 8:00 AM
// Calcula KPIs desde Supabase, detecta anomalías, genera informe ejecutivo por Telegram

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase  = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── OBTENER KPIs DESDE SUPABASE ──
async function fetchKPIs(daysBack = 7) {
  const since = new Date(Date.now() - daysBack * 86400000).toISOString();
  const prevSince = new Date(Date.now() - daysBack * 2 * 86400000).toISOString();

  // Periodo actual
  const { data: currentOrders } = await supabase
    .from("orders")
    .select("total, created_at, status")
    .gte("created_at", since)
    .eq("status", "completed");

  // Periodo anterior (para comparar)
  const { data: prevOrders } = await supabase
    .from("orders")
    .select("total, created_at")
    .gte("created_at", prevSince)
    .lt("created_at", since)
    .eq("status", "completed");

  // Suscriptores nuevos
  const { count: newSubs } = await supabase
    .from("newsletter_subscribers")
    .select("id", { count: "exact" })
    .gte("created_at", since)
    .eq("active", true);

  // Tickets CRM
  const { count: tickets } = await supabase
    .from("crm_conversations")
    .select("id", { count: "exact" })
    .gte("created_at", since);

  const { count: escalated } = await supabase
    .from("crm_conversations")
    .select("id", { count: "exact" })
    .gte("created_at", since)
    .eq("status", "escalated");

  // Calcular KPIs
  const current = currentOrders || [];
  const prev    = prevOrders    || [];

  const gmv     = current.reduce((s, o) => s + o.total, 0);
  const gmvPrev = prev.reduce((s, o) => s + o.total, 0);
  const orders  = current.length;
  const aov     = orders > 0 ? gmv / orders : 0;
  const aovPrev = prev.length > 0 ? gmvPrev / prev.length : 0;

  // LTV: media de gasto por cliente único (simplificado)
  const uniqueEmails = new Set(current.map((o: { customer_email?: string }) => o.customer_email));
  const ltv = uniqueEmails.size > 0 ? gmv / uniqueEmails.size : 0;

  return {
    period:     `últimos ${daysBack} días`,
    gmv:        Math.round(gmv * 100) / 100,
    gmvPrev:    Math.round(gmvPrev * 100) / 100,
    gmvDelta:   gmvPrev > 0 ? ((gmv - gmvPrev) / gmvPrev * 100).toFixed(1) : null,
    orders,
    ordersPrev: prev.length,
    aov:        Math.round(aov * 100) / 100,
    aovPrev:    Math.round(aovPrev * 100) / 100,
    ltv:        Math.round(ltv * 100) / 100,
    newSubs:    newSubs || 0,
    tickets:    tickets || 0,
    escalated:  escalated || 0,
    crm_rate:   tickets ? Math.round(((tickets - (escalated || 0)) / tickets) * 100) : 100,
  };
}

// ── DETECTAR ANOMALÍAS ──
function detectAnomalies(kpis: ReturnType<typeof fetchKPIs> extends Promise<infer T> ? T : never): string[] {
  const alerts: string[] = [];

  if (kpis.gmvDelta !== null && parseFloat(kpis.gmvDelta) < -20)
    alerts.push(`⚠️ GMV bajó un ${Math.abs(parseFloat(kpis.gmvDelta))}% vs periodo anterior`);

  if (kpis.orders === 0)
    alerts.push("🚨 CRÍTICO: 0 pedidos en el periodo — revisar checkout y pasarela de pago");

  if (kpis.aov < 30)
    alerts.push(`⚠️ AOV muy bajo (€${kpis.aov}) — revisar precios o upsells`);

  if (kpis.escalated > 5)
    alerts.push(`⚠️ ${kpis.escalated} tickets escalados — revisar causas recurrentes`);

  if (kpis.crm_rate < 70)
    alerts.push(`⚠️ Tasa resolución CRM baja (${kpis.crm_rate}%) — revisar prompt del agente`);

  return alerts;
}

// ── GENERAR INFORME CON CLAUDE ──
async function generateReport(kpis: Awaited<ReturnType<typeof fetchKPIs>>, anomalies: string[]): Promise<string> {
  const response = await anthropic.messages.create({
    model:      "claude-sonnet-4-6",
    max_tokens: 400,
    system: `Eres el agente de analytics de Aizua. Genera informes ejecutivos breves, claros y accionables.
El informe irá en Telegram — máximo 280 palabras, usa emojis con moderación.
Tono: directo, sin florituras, orientado a decisiones.`,
    messages: [{
      role: "user",
      content: `KPIs de Aizua (${kpis.period}):
- GMV: €${kpis.gmv} (${kpis.gmvDelta ? (parseFloat(kpis.gmvDelta) > 0 ? "+" : "") + kpis.gmvDelta + "% vs periodo anterior" : "primer periodo"})
- Pedidos: ${kpis.orders} · AOV: €${kpis.aov}
- LTV estimado: €${kpis.ltv}
- Nuevos suscriptores: ${kpis.newSubs}
- Tickets CRM: ${kpis.tickets} · Escalados: ${kpis.escalated} · Resolución auto: ${kpis.crm_rate}%
${anomalies.length > 0 ? "\nALERTAS:\n" + anomalies.join("\n") : "Sin anomalías detectadas."}

Genera un informe ejecutivo conciso con: resumen del periodo, punto positivo destacado, y si hay alertas, una acción recomendada.`,
    }],
  });

  return response.content[0].type === "text" ? response.content[0].text : "Error generando informe";
}

// ── ENDPOINT ──
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.SYNC_SECRET_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { days = 7, sendTelegram = true } = await req.json().catch(() => ({}));

    const kpis      = await fetchKPIs(days);
    const anomalies = detectAnomalies(kpis);
    const report    = await generateReport(kpis, anomalies);

    // Guardar en Supabase
    await supabase.from("analytics_reports").insert({
      period_days: days,
      kpis:        kpis,
      anomalies:   anomalies,
      report_text: report,
      ran_at:      new Date().toISOString(),
    }).catch(console.error);

    // Enviar a Telegram
    if (sendTelegram && process.env.TELEGRAM_BOT_TOKEN) {
      const header =
        `📊 *INFORME EJECUTIVO AIZUA*\n` +
        `🗓️ ${new Date().toLocaleDateString("es-ES", { weekday:"long", day:"numeric", month:"long" })}\n\n`;

      const kpiBlock =
        `💰 GMV: €${kpis.gmv}${kpis.gmvDelta ? ` (${parseFloat(kpis.gmvDelta) > 0 ? "+" : ""}${kpis.gmvDelta}%)` : ""}\n` +
        `📦 Pedidos: ${kpis.orders} · AOV: €${kpis.aov}\n` +
        `📧 Nuevos subs: ${kpis.newSubs}\n` +
        `💬 CRM: ${kpis.crm_rate}% auto-resuelto\n\n`;

      const anomalyBlock = anomalies.length > 0
        ? `*ALERTAS:*\n${anomalies.join("\n")}\n\n`
        : "";

      await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id:    process.env.TELEGRAM_CHAT_ID,
            text:       header + kpiBlock + anomalyBlock + `_${report.slice(0, 280)}_`,
            parse_mode: "Markdown",
          }),
        }
      ).catch(console.error);
    }

    return NextResponse.json({ success: true, kpis, anomalies, report });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error("[analytics-agent]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
