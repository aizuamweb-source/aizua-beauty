import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://aizua-store.vercel.app";
const LOCALES = ["es", "en", "fr"];

async function sendTelegram(msg: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text: msg, parse_mode: "HTML" }),
  });
}

interface AuditResult {
  url: string;
  has_title: boolean;
  title_length: number;
  has_meta_desc: boolean;
  meta_desc_length: number;
  has_h1: boolean;
  h1_count: number;
  images_without_alt: number;
  score: number;
  issues: string[];
}

async function auditPage(url: string): Promise<AuditResult> {
  const issues: string[] = [];
  let score = 100;

  let html = "";
  try {
    const res = await fetch(url, { headers: { "User-Agent": "AizuaLabs-SEO-Bot/1.0" } });
    html = await res.text();
  } catch {
    return { url, has_title: false, title_length: 0, has_meta_desc: false, meta_desc_length: 0, has_h1: false, h1_count: 0, images_without_alt: 0, score: 0, issues: ["fetch_failed"] };
  }

  // Title
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";
  const has_title = title.length > 0;
  const title_length = title.length;
  if (!has_title) { issues.push("missing_title"); score -= 25; }
  else if (title_length < 30) { issues.push("title_too_short"); score -= 10; }
  else if (title_length > 60) { issues.push("title_too_long"); score -= 5; }

  // Meta description
  const metaMatch = html.match(/<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']*)["\'][^>]*>/i) ||
    html.match(/<meta[^>]+content=["\']([^"\']*)["\'][^>]+name=["\']description["\'][^>]*>/i);
  const metaDesc = metaMatch ? metaMatch[1].trim() : "";
  const has_meta_desc = metaDesc.length > 0;
  const meta_desc_length = metaDesc.length;
  if (!has_meta_desc) { issues.push("missing_meta_desc"); score -= 20; }
  else if (meta_desc_length < 50) { issues.push("meta_desc_too_short"); score -= 8; }
  else if (meta_desc_length > 160) { issues.push("meta_desc_too_long"); score -= 5; }

  // H1
  const h1Matches = html.match(/<h1[^>]*>/gi) ?? [];
  const h1_count = h1Matches.length;
  const has_h1 = h1_count > 0;
  if (!has_h1) { issues.push("missing_h1"); score -= 20; }
  else if (h1_count > 1) { issues.push("multiple_h1"); score -= 10; }

  // Images without alt
  const imgMatches = html.match(/<img[^>]*>/gi) ?? [];
  const images_without_alt = imgMatches.filter(img => !img.match(/alt=["\'][^"\']+["\']/i)).length;
  if (images_without_alt > 0) { issues.push("images_missing_alt:" + images_without_alt); score -= Math.min(15, images_without_alt * 3); }

  return { url, has_title, title_length, has_meta_desc, meta_desc_length, has_h1, h1_count, images_without_alt, score: Math.max(0, score), issues };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("run") !== "true") {
    return NextResponse.json({ ok: true, info: "Use ?run=true to trigger SEO audit" });
  }

  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  if (auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Pages to audit
  const pagesToAudit: string[] = [];
  for (const locale of LOCALES) {
    pagesToAudit.push(BASE_URL + "/" + locale);
  }

  // Get 5 products to audit their pages
  const { data: products } = await supabase
    .from("products")
    .select("id, slug")
    .eq("active", true)
    .limit(5);

  for (const p of products ?? []) {
    if (p.slug) pagesToAudit.push(BASE_URL + "/es/productos/" + p.slug);
  }

  const results: AuditResult[] = [];
  let critical = 0;

  for (const url of pagesToAudit) {
    const result = await auditPage(url);
    results.push(result);
    if (result.score < 60) critical++;

    await supabase.from("seo_audit_logs").insert({
      url: result.url,
      score: result.score,
      issues: result.issues,
      data: result,
      audited_at: new Date().toISOString(),
    });
  }

  const avgScore = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
    : 0;

  // Telegram alert if critical issues
  const msg =
    "<b>AG-15 SEO Audit</b>\n" +
    "PÃ¡ginas auditadas: " + results.length + "\n" +
    "Score medio: " + avgScore + "/100\n" +
    (critical > 0 ? "â ï¸ PÃ¡ginas crÃ­ticas (<60): " + critical + "\n" : "â Sin pÃ¡ginas crÃ­ticas\n") +
    "\nPeores pÃ¡ginas:\n" +
    results
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
      .map(r => r.score + " â " + r.url.replace(BASE_URL, ""))
      .join("\n");

  await sendTelegram(msg);

  return NextResponse.json({ ok: true, audited: results.length, avg_score: avgScore, critical, results });
}
