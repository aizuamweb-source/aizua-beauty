// app/api/ads-agent/route.ts
// Aizua — Agente Ads con Claude API + Meta Marketing API
// Ejecutado por n8n cada día a las 8:00 AM
// Lógica: leer ROAS de cada campaña → decidir pausar/escalar/alertar → ejecutar

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase  = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const META_API   = "https://graph.facebook.com/v19.0";
const ADS_TOKEN  = process.env.META_ADS_TOKEN!;
const AD_ACCOUNT = process.env.META_AD_ACCOUNT_ID!; // act_XXXXXXXXXXXXXXXXXX

// ── UMBRALES DEL AGENTE (ajustables) ──
const THRESHOLDS = {
  ROAS_PAUSE:           1.5,   // Pausar si ROAS < 1.5x durante 3 días
  ROAS_SCALE:           3.0,   // Escalar si ROAS > 3x durante 3 días
  SCALE_INCREMENT:      0.20,  // Escalar presupuesto +20%
  MAX_DAILY_BUDGET:     200,   // Nunca escalar por encima de €200/día
  MIN_SPEND_TO_JUDGE:   15,    // No juzgar campañas con <€15 gastados
  APPROVAL_THRESHOLD:   50,    // Pedir aprobación humana si impacto >€50/día
  CTR_MIN:              0.008, // Alerta si CTR < 0.8%
  LEARNING_DAYS:        7,     // No tocar campañas en learning (<7 días)
};

type Campaign = {
  id:             string;
  name:           string;
  status:         string;
  daily_budget:   number;
  spend:          number;
  purchase_roas:  number;
  ctr:            number;
  impressions:    number;
  created_time:   string;
};

// ── LEER CAMPAÑAS DESDE META API ──
async function fetchCampaigns(): Promise<Campaign[]> {
  const fields = [
    "id", "name", "status", "daily_budget",
    "insights.date_preset(last_3d){spend,purchase_roas,ctr,impressions,actions}",
  ].join(",");

  const res = await fetch(
    `${META_API}/${AD_ACCOUNT}/campaigns?fields=${fields}&access_token=${ADS_TOKEN}`
  );
  if (!res.ok) throw new Error(`Meta API campaigns: ${res.status}`);

  const data = await res.json();
  if (data.error) throw new Error(`Meta API error: ${data.error.message}`);

  return (data.data || []).map((c: Record<string, unknown>) => {
    const insights = (c.insights as { data: Array<Record<string, unknown>> } | undefined)?.data?.[0] || {};
    const roas = (insights.purchase_roas as Array<{ value: string }> | undefined)?.[0]?.value;
    return {
      id:            c.id as string,
      name:          c.name as string,
      status:        c.status as string,
      daily_budget:  parseInt(c.daily_budget as string || "0") / 100, // Meta usa centavos
      spend:         parseFloat(insights.spend as string || "0"),
      purchase_roas: roas ? parseFloat(roas) : 0,
      ctr:           parseFloat(insights.ctr as string || "0") / 100,
      impressions:   parseInt(insights.impressions as string || "0"),
      created_time:  c.created_time as string,
    };
  });
}

// ── ACTUALIZAR PRESUPUESTO / ESTADO ──
async function updateCampaign(campaignId: string, params: {
  status?:       "ACTIVE" | "PAUSED";
  daily_budget?: number; // en euros
}) {
  const body: Record<string, string> = { access_token: ADS_TOKEN };
  if (params.status)       body.status       = params.status;
  if (params.daily_budget) body.daily_budget = String(Math.round(params.daily_budget * 100)); // a centavos

  const res = await fetch(`${META_API}/${campaignId}`, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    new URLSearchParams(body).toString(),
  });

  if (!res.ok) throw new Error(`Meta API update ${campaignId}: ${res.status}`);
  return res.json();
}

// ── DECISIÓN IA (Claude analiza y decide) ──
async function analyzeWithClaude(campaigns: Campaign[]): Promise<{
  decisions: Array<{ campaignId: string; action: string; reason: string; impact: string }>;
  summary: string;
}> {
  const campaignsText = campaigns.map(c =>
    `- "${c.name}": ROAS ${c.purchase_roas.toFixed(2)}x, Gasto €${c.spend}, Budget €${c.daily_budget}/día, CTR ${(c.ctr * 100).toFixed(2)}%, ${c.impressions.toLocaleString()} impresiones, Estado: ${c.status}`
  ).join("\n");

  const response = await anthropic.messages.create({
    model:      "claude-sonnet-4-6",
    max_tokens: 600,
    system: `Eres el agente de optimización de campañas publicitarias de Aizua.
Analiza el rendimiento de las campañas y decide acciones de optimización.
Responde SOLO en JSON válido.

UMBRALES:
- Pausar si: ROAS < ${THRESHOLDS.ROAS_PAUSE}x Y gasto > €${THRESHOLDS.MIN_SPEND_TO_JUDGE} Y campaña >7 días
- Escalar +20% si: ROAS > ${THRESHOLDS.ROAS_SCALE}x Y campaña activa Y budget actual < €${THRESHOLDS.MAX_DAILY_BUDGET}
- Alertar si: CTR < 0.8% O ROAS entre 1.5-2x (revisar creativo)
- No tocar si: gasto < €${THRESHOLDS.MIN_SPEND_TO_JUDGE} (datos insuficientes)

Formato de respuesta:
{
  "decisions": [
    {"campaignId": "ID", "action": "pause|scale|alert|none", "reason": "explicación breve", "impact": "€X/día"}
  ],
  "summary": "resumen ejecutivo de 1-2 frases para el informe de Telegram"
}`,
    messages: [{
      role: "user",
      content: `Campañas activas de Aizua (datos últimos 3 días):\n${campaignsText}\n\nDecide acciones de optimización.`,
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";
  try {
    return JSON.parse(text);
  } catch {
    return { decisions: [], summary: "Error analizando campañas" };
  }
}

// ── Auth helper ──────────────────────────────────────────
function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? "";
  const cron  = process.env.CRON_SECRET;
  const token = process.env.SYNC_SECRET_TOKEN;
  return (!!cron && auth === `Bearer ${cron}`) || (!!token && auth === `Bearer ${token}`);
}

/** GET — Vercel Cron (diario 08:00 UTC lunes-viernes) */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Reutilizar la misma lógica que POST
  return POST(req);
}

// ── ENDPOINT PRINCIPAL ──
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const executed = [], pending_approval = [], alerts = [];

  try {
    const campaigns = await fetchCampaigns();
    const { decisions, summary } = await analyzeWithClaude(campaigns);

    for (const decision of decisions) {
      const campaign = campaigns.find(c => c.id === decision.campaignId);
      if (!campaign) continue;

      const impactEuros = parseFloat(decision.impact?.replace(/[^0-9.]/g, "") || "0");
      const needsApproval = impactEuros > THRESHOLDS.APPROVAL_THRESHOLD;

      if (decision.action === "alert") {
        alerts.push({ campaign: campaign.name, reason: decision.reason });
        continue;
      }

      // Si el impacto es alto, pedir aprobación humana por Telegram
      if (needsApproval) {
        pending_approval.push(decision);
        await notifyTelegram(
          `⚡ *APROBACIÓN REQUERIDA — AGENTE ADS*\n\n` +
          `📣 ${campaign.name}\n` +
          `🎯 Acción: ${decision.action.toUpperCase()}\n` +
          `💡 Motivo: ${decision.reason}\n` +
          `💰 Impacto: ${decision.impact}\n\n` +
          `Responde:\n✅ /approve ${decision.campaignId}\n❌ /reject ${decision.campaignId}`
        );
        continue;
      }

      // Ejecutar automáticamente si impacto < umbral
      try {
        if (decision.action === "pause") {
          await updateCampaign(decision.campaignId, { status: "PAUSED" });
        } else if (decision.action === "scale") {
          const newBudget = Math.min(
            campaign.daily_budget * (1 + THRESHOLDS.SCALE_INCREMENT),
            THRESHOLDS.MAX_DAILY_BUDGET
          );
          await updateCampaign(decision.campaignId, { daily_budget: newBudget });
        }
        executed.push(decision);
      } catch (e) {
        console.error(`[ads-agent] Error ejecutando ${decision.action}:`, e);
      }
    }

    // Guardar log
    await supabase.from("ads_agent_logs").insert({
      executed:         executed.length,
      pending_approval: pending_approval.length,
      alerts:           alerts.length,
      summary,
      decisions:        JSON.stringify(decisions),
      ran_at:           new Date().toISOString(),
    }).then(() => null);

    // Informe diario Telegram
    const totalSpend   = campaigns.reduce((s, c) => s + c.spend, 0);
    const avgRoas      = campaigns.filter(c => c.purchase_roas > 0).reduce((s,c,_,a) => s + c.purchase_roas / a.length, 0);
    const estRevenue   = totalSpend * avgRoas;

    await notifyTelegram(
      `📊 *INFORME ADS DIARIO — AIZUA*\n\n` +
      `💰 Gasto total: €${totalSpend.toFixed(2)}\n` +
      `📈 ROAS medio: ${avgRoas.toFixed(1)}×\n` +
      `💵 Revenue estimado: €${estRevenue.toFixed(2)}\n\n` +
      `🤖 Acciones ejecutadas: ${executed.length}\n` +
      `⏳ Pendiente aprobación: ${pending_approval.length}\n` +
      `⚠️ Alertas: ${alerts.length}\n\n` +
      `_${summary}_`
    );

    return NextResponse.json({ success: true, executed: executed.length, pending_approval: pending_approval.length, alerts: alerts.length });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error("[ads-agent]", msg);
    await notifyTelegram(`❌ *ERROR AGENTE ADS*\n\n${msg}`);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function notifyTelegram(text: string) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) return;
  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text, parse_mode: "Markdown" }),
  }).then(() => null);
}

