import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/oss-monitor — returns b2c_sales_by_country summary
export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from("b2c_sales_by_country")
      .select("*")
      .order("total_revenue", { ascending: false })
      .limit(50);

    if (error) throw error;

    const thresholdEur = 10000;
    const ossAlerts = (data ?? []).filter(
      (row: { total_revenue: number; country_code: string }) =>
        row.total_revenue >= thresholdEur
    );

    return NextResponse.json({
      ok: true,
      summary: data ?? [],
      ossAlerts,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[oss-monitor]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
