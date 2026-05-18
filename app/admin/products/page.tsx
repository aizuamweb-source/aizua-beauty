import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import ProductsClient from "./ProductsClient";

async function verifyAdmin(): Promise<boolean> {
  const token = cookies().get("sb-admin-token")?.value;
  if (!token) return false;
  try {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: { user }, error } = await sb.auth.getUser(token);
    return !error && !!user;
  } catch { return false; }
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string; active?: string; category?: string };
}) {
  const valid = await verifyAdmin();
  if (!valid) redirect("/admin/login");

  const page = parseInt(searchParams.page ?? "1");
  const search = searchParams.search ?? "";
  const active = searchParams.active ?? "";
  const category = searchParams.category ?? "";

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Fetch products server-side for initial render
  let query = sb
    .from("products")
    .select("id, slug, name, name_es, name_en, price, compare_price, cost_price, active, stock, category, supplier, aliexpress_url, images, rating, review_count", { count: "exact" })
    .eq("store", "beauty")
    .order("created_at", { ascending: false })
    .range((page - 1) * 20, page * 20 - 1);

  if (search) query = query.ilike("name", `%${search}%`);
  if (active === "true") query = query.eq("active", true);
  if (active === "false") query = query.eq("active", false);
  if (category) query = query.eq("category", category);

  const { data: products, count } = await query;

  // Get distinct categories
  const { data: catRows } = await sb
    .from("products")
    .select("category")
    .eq("store", "beauty")
    .not("category", "is", null);
  const categories = [...new Set((catRows ?? []).map((r) => r.category).filter(Boolean))].sort();

  // Stats
  const { count: totalActive } = await sb.from("products").select("*", { count: "exact", head: true }).eq("store", "beauty").eq("active", true);
  const { count: totalInactive } = await sb.from("products").select("*", { count: "exact", head: true }).eq("store", "beauty").eq("active", false);

  return (
    <ProductsClient
      initialProducts={products ?? []}
      totalCount={count ?? 0}
      page={page}
      initialSearch={search}
      initialActive={active}
      initialCategory={category}
      categories={categories}
      stats={{ active: totalActive ?? 0, inactive: totalInactive ?? 0 }}
    />
  );
}
