import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

async function getAdminClient(cookieStore: ReturnType<typeof cookies>) {
  const token = cookieStore.get("sb-admin-token")?.value;
  if (!token) return null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  return supabase;
}

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = await getAdminClient(cookieStore);
  if (!supabase) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;
  const offset = (page - 1) * limit;
  const search = searchParams.get("search") ?? "";
  const days = parseInt(searchParams.get("days") ?? "30");

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from("orders")
    .select("id, created_at, customer_name, customer_email, customer_country, total_amount, currency, status, items, stripe_checkout_session_id, store", { count: "exact" })
    .eq("store", "beauty")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) query = query.ilike("customer_email", `%${search}%`);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enriquecer items con aliexpress_url de los productos
  const orders = data ?? [];
  if (orders.length > 0) {
    const slugs = orders
      .flatMap((o) => (o.items as Array<{product_slug?: string}> ?? []).map((i) => i.product_slug))
      .filter(Boolean) as string[];

    if (slugs.length > 0) {
      const { data: products } = await supabase
        .from("products")
        .select("slug, aliexpress_url, name_es")
        .in("slug", [...new Set(slugs)]);

      const productMap = Object.fromEntries((products ?? []).map((p) => [p.slug, p]));
      for (const order of orders) {
        order.items = (order.items as Array<Record<string, unknown>> ?? []).map((item) => ({
          ...item,
          aliexpress_url: productMap[item.product_slug as string]?.aliexpress_url ?? null,
          product_name_es: productMap[item.product_slug as string]?.name_es ?? item.name ?? null,
        }));
      }
    }
  }

  return NextResponse.json({ orders, total: count ?? 0, page, limit });
}
