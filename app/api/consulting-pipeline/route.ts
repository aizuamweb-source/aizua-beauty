/**
 * /api/consulting-pipeline — AG-18 Consulting Pipeline
 *
 * Gestiona el funnel de leads de consultoría:
 *  - Detecta leads nuevos (source='consulting') y alerta por Telegram
 *  - Envía follow-up automático por email (24h, 72h, 7d) vía Brevo
 *  - Marca leads fríos tras 7 días sin respuesta
 *  - Genera digest semanal del pipeline
 *
 * Endpoints:
 *  GET  /api/consulting-pipeline              → lista leads activos
 *  GET  /api/consulting-pipeline?process=true → procesa pipeline completo (Cron)
 *  POST /api/consulting-pipeline              → registrar nuevo lead manualmente
 *
 * Cron: lunes 09:00 UTC
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Tipos ──────────────────────────────────────────────────
type LeadStatus = "new" | "contacted" | "qualified" | "proposal" | "closed" | "cold" | "lost";

type ConsultingLead = {
  id: string;
  name: string;
  email: string;
  message: string;
  service?: string;
  budget?: string;
  status: LeadStatus;
  source: string;
  follow_up_count: number;
  last_follow_up_at?: string;
  created_at: string;
  updated_at: string;
};

// ── Auth ───────────────────────────────────────────────────
function isAuthorized(req: NextRequest): boolean {
  const auth  = req.headers.get("authorization") ?? "";
  const cron  = process.env.CRON_SECRET;
  const token = process.env.SYNC_SECRET_TOKEN;
  return (!!cron && auth === `Bearer ${cron}`) ||
         (!!token && auth === `Bearer ${token}`) ||
         (!cron && !token);
}

// ── Telegram ───────────────────────────────────────────────
async function sendTelegram(text: string): Promise<void> {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  }).catch(() => {});
}

// ── Brevo email ────────────────────────────────────────────
async function sendBrevoEmail(params: {
  to: string;
  toName: string;
  subject: string;
  body: string;
}): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return false;

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method:  "POST",
    headers: {
      "api-key":     apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender:   { name: "AizuaLabs ConsultorIA", email: "info@aizualabs.com" },
      to:       [{ email: params.to, name: params.toName }],
      subject:  params.subject,
      htmlContent: params.body,
    }),
  });

  return res.ok;
}

// ── Plantillas de follow-up ────────────────────────────────
function getFollowUpTemplate(lead: ConsultingLead, round: number): { subject: string; body: string } {
  const name = lead.name.split(" ")[0]; // primer nombre

  if (round === 1) {
    return {
      subject: `Re: Tu consulta a AizuaLabs — próximos pasos`,
      body: `
        <p>Hola ${name},</p>
        <p>Soy del equipo de <strong>AizuaLabs ConsultorIA</strong>. Vi tu mensaje y quería confirmar que lo hemos recibido.</p>
        <p>Normalmente respondemos en 24-48h laborables. Si tienes urgencia, puedes escribirnos directamente a <a href="mailto:info@aizualabs.com">info@aizualabs.com</a>.</p>
        <p>¿Hay algún detalle adicional que quieras compartir sobre tu proyecto?</p>
        <br>
        <p>Un saludo,<br><strong>Equipo AizuaLabs</strong><br>
        <a href="https://aizualabs-consulting.vercel.app">aizualabs-consulting.vercel.app</a></p>
      `,
    };
  }

  if (round === 2) {
    return {
      subject: `AizuaLabs — ¿Seguimos adelante con tu proyecto de IA?`,
      body: `
        <p>Hola ${name},</p>
        <p>Hace unos días nos contactaste sobre implementar IA en tu negocio. Quería asegurarme de que no se perdió tu mensaje.</p>
        <p>Si sigues interesado, podemos agendar una <strong>llamada de 30 minutos sin coste</strong> para entender tu caso y ver si podemos ayudarte.</p>
        <p>Responde a este email o reserva directamente en: <a href="https://aizualabs-consulting.vercel.app">aizualabs-consulting.vercel.app</a></p>
        <br>
        <p>Un saludo,<br><strong>Equipo AizuaLabs</strong></p>
      `,
    };
  }

  // Round 3 — último intento
  return {
    subject: `Última nota de AizuaLabs — ${name}`,
    body: `
      <p>Hola ${name},</p>
      <p>Te escribo por última vez sobre tu consulta de hace unos días.</p>
      <p>Entiendo que los tiempos cambian — si en algún momento quieres retomar la conversación sobre cómo la IA puede mejorar tu negocio, aquí estaremos.</p>
      <p>Puedes contactarnos cuando quieras en <a href="mailto:info@aizualabs.com">info@aizualabs.com</a>.</p>
      <br>
      <p>Un saludo,<br><strong>Equipo AizuaLabs</strong></p>
    `,
  };
}

// ── Procesar pipeline ──────────────────────────────────────
async function processPipeline(): Promise<{
  new_leads: number;
  follow_ups_sent: number;
  leads_cold: number;
  digest: string;
}> {
  const now    = new Date();
  const h24    = new Date(now.getTime() - 24  * 3600 * 1000).toISOString();
  const h72    = new Date(now.getTime() - 72  * 3600 * 1000).toISOString();
  const d7     = new Date(now.getTime() - 7   * 86400 * 1000).toISOString();
  const d14    = new Date(now.getTime() - 14  * 86400 * 1000).toISOString();

  let newLeads      = 0;
  let followUpsSent = 0;
  let leadsCold     = 0;

  // 1. Leads nuevos sin notificar (created > 10min, status='new', follow_up_count=0)
  const { data: freshLeads } = await supabase
    .from("crm_conversations")
    .select("*")
    .eq("source", "consulting")
    .eq("status", "new")
    .eq("follow_up_count", 0)
    .lt("created_at", new Date(now.getTime() - 10 * 60 * 1000).toISOString());

  for (const lead of (freshLeads ?? [])) {
    const msg = `🎯 *Nuevo lead Consulting*\n\n` +
      `👤 ${lead.name} (${lead.email})\n` +
      `📝 ${(lead.message ?? "").slice(0, 200)}\n` +
      `🕐 ${new Date(lead.created_at).toLocaleString("es-ES", { timeZone: "Europe/Madrid" })}`;
    await sendTelegram(msg);

    // Añadir a lista Brevo Consulting (#9)
    const brevoKey = process.env.BREVO_API_KEY;
    if (brevoKey) {
      await fetch("https://api.brevo.com/v3/contacts", {
        method:  "POST",
        headers: { "api-key": brevoKey, "Content-Type": "application/json" },
        body:    JSON.stringify({
          email:      lead.email,
          attributes: { FIRSTNAME: lead.name.split(" ")[0], LASTNAME: lead.name.split(" ").slice(1).join(" ") },
          listIds:    [parseInt(process.env.BREVO_LIST_CONSULTING ?? "9")],
          updateEnabled: true,
        }),
      }).catch(() => {});
    }

    await supabase
      .from("crm_conversations")
      .update({ follow_up_count: 1, last_follow_up_at: now.toISOString(), updated_at: now.toISOString() })
      .eq("id", lead.id);

    newLeads++;
  }

  // 2. Follow-up 1 → leads con 24h sin respuesta, follow_up_count=1
  const { data: f1Leads } = await supabase
    .from("crm_conversations")
    .select("*")
    .eq("source", "consulting")
    .eq("status", "new")
    .eq("follow_up_count", 1)
    .lt("last_follow_up_at", h24);

  for (const lead of (f1Leads ?? [])) {
    const tpl = getFollowUpTemplate(lead as ConsultingLead, 1);
    const ok  = await sendBrevoEmail({ to: lead.email, toName: lead.name, ...tpl });
    if (ok) {
      await supabase
        .from("crm_conversations")
        .update({ follow_up_count: 2, last_follow_up_at: now.toISOString(), status: "contacted", updated_at: now.toISOString() })
        .eq("id", lead.id);
      followUpsSent++;
    }
  }

  // 3. Follow-up 2 → 72h sin respuesta, follow_up_count=2
  const { data: f2Leads } = await supabase
    .from("crm_conversations")
    .select("*")
    .eq("source", "consulting")
    .eq("status", "contacted")
    .eq("follow_up_count", 2)
    .lt("last_follow_up_at", h72);

  for (const lead of (f2Leads ?? [])) {
    const tpl = getFollowUpTemplate(lead as ConsultingLead, 2);
    const ok  = await sendBrevoEmail({ to: lead.email, toName: lead.name, ...tpl });
    if (ok) {
      await supabase
        .from("crm_conversations")
        .update({ follow_up_count: 3, last_follow_up_at: now.toISOString(), updated_at: now.toISOString() })
        .eq("id", lead.id);
      followUpsSent++;
    }
  }

  // 4. Follow-up 3 → 7d sin respuesta, follow_up_count=3
  const { data: f3Leads } = await supabase
    .from("crm_conversations")
    .select("*")
    .eq("source", "consulting")
    .eq("status", "contacted")
    .eq("follow_up_count", 3)
    .lt("last_follow_up_at", d7);

  for (const lead of (f3Leads ?? [])) {
    const tpl = getFollowUpTemplate(lead as ConsultingLead, 3);
    const ok  = await sendBrevoEmail({ to: lead.email, toName: lead.name, ...tpl });
    if (ok) {
      await supabase
        .from("crm_conversations")
        .update({ follow_up_count: 4, last_follow_up_at: now.toISOString(), updated_at: now.toISOString() })
        .eq("id", lead.id);
      followUpsSent++;
    }
  }

  // 5. Marcar como cold → 14d sin respuesta tras 4 follow-ups
  const { data: coldLeads } = await supabase
    .from("crm_conversations")
    .select("id")
    .eq("source", "consulting")
    .in("status", ["new", "contacted"])
    .gte("follow_up_count", 4)
    .lt("last_follow_up_at", d14);

  for (const lead of (coldLeads ?? [])) {
    await supabase
      .from("crm_conversations")
      .update({ status: "cold", updated_at: now.toISOString() })
      .eq("id", lead.id);
    leadsCold++;
  }

  // 6. Digest semanal (solo lunes)
  const isMonday = now.getDay() === 1;
  let digest     = "";

  if (isMonday) {
    const { data: openLeads } = await supabase
      .from("crm_conversations")
      .select("name, email, status, follow_up_count, created_at")
      .eq("source", "consulting")
      .in("status", ["new", "contacted", "qualified", "proposal"])
      .order("created_at", { ascending: false });

    if (openLeads?.length) {
      const lines = openLeads.map(l =>
        `• ${l.name} (${l.status}) — F/U #${l.follow_up_count} — ${new Date(l.created_at).toLocaleDateString("es-ES")}`
      ).join("\n");

      digest = `📊 *Pipeline Consulting — Lunes ${now.toLocaleDateString("es-ES")}*\n\n` +
        `Total leads activos: ${openLeads.length}\n\n${lines}`;

      await sendTelegram(digest);
    }
  }

  // Notificación resumen si hubo actividad
  if (newLeads > 0 || followUpsSent > 0 || leadsCold > 0) {
    const summary = `🤝 *Consulting Pipeline*\n${now.toLocaleString("es-ES", { timeZone: "Europe/Madrid" })}\n\n` +
      `🆕 Nuevos leads: ${newLeads}\n` +
      `📧 Follow-ups enviados: ${followUpsSent}\n` +
      `🧊 Leads fríos: ${leadsCold}`;
    await sendTelegram(summary);
  }

  return { new_leads: newLeads, follow_ups_sent: followUpsSent, leads_cold: leadsCold, digest };
}

// ══════════════════════════════════════════════════════════
// HANDLERS
// ══════════════════════════════════════════════════════════

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);

  // Procesar pipeline (Cron / manual)
  if (searchParams.get("process") === "true" || searchParams.get("process") === "1") {
    const result = await processPipeline();
    return NextResponse.json({ success: true, ...result });
  }

  // Listar leads activos
  const status = searchParams.get("status") ?? "active";
  let query    = supabase
    .from("crm_conversations")
    .select("id, name, email, status, follow_up_count, created_at, last_follow_up_at, message")
    .eq("source", "consulting")
    .order("created_at", { ascending: false })
    .limit(50);

  if (status === "active") {
    query = query.in("status", ["new", "contacted", "qualified", "proposal"]);
  } else if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ leads: data ?? [], count: data?.length ?? 0 });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, email, message, service, budget } = await req.json();
    if (!name || !email || !message) {
      return NextResponse.json({ error: "name, email, message requeridos" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("crm_conversations")
      .insert({
        name,
        email,
        message,
        service:         service ?? null,
        budget:          budget  ?? null,
        source:          "consulting",
        status:          "new",
        follow_up_count: 0,
        created_at:      new Date().toISOString(),
        updated_at:      new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Notificar inmediatamente
    await sendTelegram(
      `🎯 *Nuevo lead Consulting (manual)*\n\n👤 ${name} (${email})\n📝 ${message.slice(0, 200)}`
    );

    return NextResponse.json({ success: true, lead: data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
