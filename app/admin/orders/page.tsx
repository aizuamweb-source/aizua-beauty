import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import OrdersClient from "./OrdersClient";

async function verifyAdmin(): Promise<boolean> {
  const token = cookies().get("sb-admin-token")?.value;
  if (!token) return false;
  try {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: { user }, error } = await sb.auth.getUser(token);
    return !error && !!user;
  } catch { return false; }
}

type OrderItem = {
  name?: string;
  product_slug?: string;
  quantity?: number;
  price?: number;
  aliexpress_url?: string | null;
  product_name_es?: string | null;
};

type Order = {
  id: string;
  created_at: string;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_country?: string | null;
  total_amount: number;
  currency?: string;
  status?: string | null;
  items?: OrderItem[] | null;
  stripe_checkout_session_id?: string | null;
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string; days?: string };
}) {
  const valid = await verifyAdmin();
  if (!valid) redirect("/admin/login");

  const page = parseInt(searchParams.page ?? "1");
  const search = searchParams.search ?? "";
  const days = parseInt(searchParams.days ?? "30");
  const limit = 20;

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  let query = sb
    .from("orders")
    .select("id, created_at, customer_name, customer_email, customer_country, total_amount, currency, status, items, stripe_checkout_session_id", { count: "exact" })
    .eq("store", "beauty")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (search) query = query.ilike("customer_email", `%${search}%`);

  const { data: rawOrders, count } = await query;
  const orders: Order[] = rawOrders ?? [];

  // Enrich with aliexpress_url
  const slugs = orders
    .flatMap((o) => (o.items ?? []).map((i) => (i as OrderItem).product_slug))
    .filter(Boolean) as string[];

  if (slugs.length > 0) {
    const { data: products } = await sb
      .from("products")
      .select("slug, aliexpress_url, name_es")
      .in("slug", [...new Set(slugs)]);
    const productMap = Object.fromEntries((products ?? []).map((p) => [p.slug, p]));
    for (const order of orders) {
      order.items = (order.items ?? []).map((item) => ({
        ...(item as OrderItem),
        aliexpress_url: productMap[(item as OrderItem).product_slug ?? ""]?.aliexpress_url ?? null,
        product_name_es: productMap[(item as OrderItem).product_slug ?? ""]?.name_es ?? null,
      }));
    }
  }

  // Stats
  const { count: totalOrders } = await sb.from("orders").select("*", { count: "exact", head: true }).eq("store", "beauty").gte("created_at", since);
  const { data: revenueRows } = await sb.from("orders").select("total_amount").eq("store", "beauty").gte("created_at", since);
  const totalRevenue = (revenueRows ?? []).reduce((sum, r) => sum + (r.total_amount ?? 0), 0);

  return (
    <OrdersClient
      orders={orders}
      totalCount={count ?? 0}
      page={page}
      days={days}
      initialSearch={search}
      stats={{ orders: totalOrders ?? 0, revenue: totalRevenue }}
    />
  );
}
