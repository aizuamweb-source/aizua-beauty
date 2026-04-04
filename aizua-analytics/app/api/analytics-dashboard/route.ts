// app/api/analytics-dashboard/route.ts
// Aizua — API del dashboard de analytics
// GET — devuelve todos los KPIs necesarios para el panel de control
// Llamado por el frontend cada 60 segundos para actualizar datos

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  // Solo accesible desde el propio servidor (admin)
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.SYNC_SECRET_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now   = new Date();
    const d7    = new Date(now.getTime() - 7  * 86400000).toISOString();
    const d30   = new Date(now.getTime() - 30 * 86400000).toISOString();
    const today = new Date(now.setHours(0,0,0,0)).toISOString();

    // ── QUERIES EN PARALELO ──
    const [
      { data: orders7d },
      { data: orders30d },
      { data: ordersToday },
      { data: topProducts },
      { count: totalSubs },
      { data: recentOrders },
      { data: lastReport },
    ] = await Promise.all([
      supabase.from("orders").select("total,customer_email,created_at").gte("created_at", d7).eq("status","completed"),
      supabase.from("orders").select("total,customer_email,created_at").gte("created_at", d30).eq("status","completed"),
      supabase.from("orders").select("total").gte("created_at", today).eq("status","completed"),
      supabase.from("orders")
        .select("items, total")
        .gte("created_at", d30)
        .eq("status","completed")
        .limit(500),
      supabase.from("newsletter_subscribers").select("id", { count:"exact" }).eq("active", true),
      supabase.from("orders").select("order_number,total,status,created_at").order("created_at", { ascending:false }).limit(8),
      supabase.from("analytics_reports").select("kpis,anomalies,ran_at").order("ran_at", { ascending:false }).limit(1),
    ]);

    // ── CALCULAR KPIs ──
    const calc = (orders: Array<{total: number; customer_email?: string}> | null) => {
      if (!orders?.length) return { gmv:0, count:0, aov:0, ltv:0 };
      const gmv    = orders.reduce((s,o) => s + o.total, 0);
      const count  = orders.length;
      const uniq   = new Set(orders.map(o => o.customer_email)).size || 1;
      return {
        gmv:   Math.round(gmv * 100) / 100,
        count,
        aov:   Math.round(gmv / count * 100) / 100,
        ltv:   Math.round(gmv / uniq * 100) / 100,
      };
    };

    const k7  = calc(orders7d);
    const k30 = calc(orders30d);
    const kt  = calc(ordersToday);

    // GMV diario para sparkline (últimos 7 días)
    const dailyGmv = Array.from({ length:7 }, (_, i) => {
      const day = new Date(Date.now() - (6-i) * 86400000);
      const dayStart = new Date(day.setHours(0,0,0,0)).toISOString();
      const dayEnd   = new Date(day.setHours(23,59,59,999)).toISOString();
      const dayOrders = (orders7d || []).filter(o => o.created_at >= dayStart && o.created_at <= dayEnd);
      return Math.round(dayOrders.reduce((s,o) => s + o.total, 0) * 100) / 100;
    });

    // Agrupar por producto (simplificado — usa el campo items JSONB)
    const productRevenue: Record<string, { revenue:number; units:number }> = {};
    for (const order of topProducts || []) {
      const items = Array.isArray(order.items) ? order.items : [];
      for (const item of items) {
        const key = item.name || item.product_name || "Unknown";
        if (!productRevenue[key]) productRevenue[key] = { revenue:0, units:0 };
        productRevenue[key].revenue += (item.price || 0) * (item.qty || 1);
        productRevenue[key].units   += item.qty || 1;
      }
    }

    const topProductsList = Object.entries(productRevenue)
      .sort((a,b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([name, data]) => ({
        name,
        revenue: Math.round(data.revenue * 100) / 100,
        units:   data.units,
      }));

    return NextResponse.json({
      success: true,
      updatedAt: new Date().toISOString(),
      kpis: {
        today:  kt,
        last7d: k7,
        last30d: k30,
        totalSubscribers: totalSubs || 0,
      },
      charts: {
        dailyGmv,
      },
      topProducts: topProductsList,
      recentOrders: (recentOrders || []).map(o => ({
        number:    o.order_number,
        total:     o.total,
        status:    o.status,
        createdAt: o.created_at,
      })),
      lastReport: lastReport?.[0] || null,
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
