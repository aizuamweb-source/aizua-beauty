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
  const active = searchParams.get("active"); // "true" | "false" | null
  const category = searchParams.get("category") ?? "";

  let query = supabase
    .from("products")
    .select("id, slug, name, name_es, name_en, price, compare_price, cost_price, active, stock, category, supplier, aliexpress_url, images, rating, review_count, store", { count: "exact" })
    .eq("store", "beauty")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) query = query.ilike("name", `%${search}%`);
  if (active !== null) query = query.eq("active", active === "true");
  if (category) query = query.eq("category", category);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ products: data, total: count ?? 0, page, limit });
}

export async function PATCH(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = await getAdminClient(cookieStore);
  if (!supabase) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  // Solo campos permitidos
  const allowed = ["price", "compare_price", "cost_price", "active", "stock", "name_es", "name_en", "category", "badge"];
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in updates) patch[key] = updates[key];
  }

  const { data, error } = await supabase
    .from("products")
    .update(patch)
    .eq("id", id)
    .eq("store", "beauty")
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}
