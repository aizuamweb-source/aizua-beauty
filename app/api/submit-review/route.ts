// app/api/submit-review/route.ts
// Aizua — Enviar reseña de producto (solo compradores verificados)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { productId, orderId, customerName, rating, comment, lang } = await req.json();

    if (!productId || !rating || !comment?.trim()) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating debe ser entre 1 y 5" }, { status: 400 });
    }
    if (comment.length < 20) {
      return NextResponse.json({ error: "La reseña debe tener al menos 20 caracteres" }, { status: 400 });
    }

    // Verificar si el pedido existe y fue entregado (compra verificada)
    let verified = false;
    if (orderId) {
      const { data: order } = await supabase
        .from("orders")
        .select("id, status")
        .eq("id", orderId)
        .eq("status", "delivered")
        .single();
      verified = !!order;
    }

    // Evitar reseñas duplicadas por pedido
    if (orderId) {
      const { data: existing } = await supabase
        .from("product_reviews")
        .select("id")
        .eq("order_id", orderId)
        .eq("product_id", productId)
        .single();

      if (existing) {
        return NextResponse.json({ error: "Ya enviaste una reseña para este pedido" }, { status: 400 });
      }
    }

    // Insertar reseña
    const { data: review, error } = await supabase
      .from("product_reviews")
      .insert({
        product_id:    productId,
        order_id:      orderId ?? null,
        customer_name: customerName?.trim() || "Cliente verificado",
        rating:        parseInt(rating),
        comment:       comment.trim(),
        verified,
        lang:          lang ?? "es",
        created_at:    new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("[submit-review]", error);
      return NextResponse.json({ error: "Error guardando reseña" }, { status: 500 });
    }

    // Actualizar rating medio del producto
    const { data: allReviews } = await supabase
      .from("product_reviews")
      .select("rating")
      .eq("product_id", productId);

    if (allReviews && allReviews.length > 0) {
      const avgRating = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
      await supabase.from("products").update({
        rating:       Math.round(avgRating * 10) / 10,
        review_count: allReviews.length,
        updated_at:   new Date().toISOString(),
      }).eq("id", productId);
    }

    return NextResponse.json({ success: true, reviewId: review.id, verified });
  } catch (err) {
    console.error("[submit-review]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
