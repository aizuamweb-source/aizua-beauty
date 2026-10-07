/**
 * pedido-desde-pago.ts — el pedido nace del PAGO, no del navegador (07/10/2026).
 *
 * POR QUÉ. El pedido solo se creaba desde el navegador (`/api/create-order`),
 * después de que el pago con tarjeta terminara sin salir de la página. Dos
 * consecuencias medidas:
 *   1. Con un método que saca al cliente de la web y lo devuelve (PayPal,
 *      Klarna, Amazon Pay, Bancontact…) el navegador vuelve a /confirmacion y
 *      nadie llama a create-order: se cobra y NO hay pedido (ni compra al
 *      proveedor ni correo). El webhook solo avisaba de «cobro sin pedido».
 *   2. Con tarjeta, si el aviso de Stripe llegaba ANTES que create-order, el
 *      webhook no encontraba el pedido y este se quedaba «pending» para siempre.
 *
 * AHORA. Antes de pagar, el navegador deja en el propio cobro de Stripe la
 * dirección de envío y el correo (`confirmParams.shipping` / `receipt_email`), y
 * el carrito ya iba en sus metadatos. Con eso, el webhook crea el pedido si no
 * existe. create-order sigue funcionando y es idempotente: el primero que llega
 * lo crea y el segundo recoge el que ya existe. Lo garantiza la base de datos:
 * `store.orders.stripe_payment_intent_id` es ÚNICO.
 *
 * El precio sale de la BD, como en create-payment-intent (nunca del navegador),
 * y el total es lo que Stripe cobró de verdad.
 */
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

const CUPONES_10 = ["WELCOME10", "AIZUA10"];
const CAMPOS = "id, order_number, customer_email, customer_name, items, subtotal, total, shipping_cost, shipping_address, locale, status";

export type PedidoPagado = {
  id: string; order_number: string; customer_email: string | null; customer_name: string | null;
  items: unknown; subtotal: number | null; total: number | null; shipping_cost: number | null;
  shipping_address: unknown; locale: string | null; status?: string | null;
};

export function numeroPedido(now = new Date()): string {
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `AZ-${dateStr}-${rand}`;
}

/** El pedido de este cobro, si ya existe. Lanza si la base no contesta: un error no es «no hay pedido». */
export async function pedidoDelPago(supabase: SupabaseClient, piId: string): Promise<PedidoPagado | null> {
  const { data, error } = await supabase.from("orders").select(CAMPOS).eq("stripe_payment_intent_id", piId).maybeSingle();
  if (error) throw new Error(`orders: ${error.message}`);
  return (data as PedidoPagado | null) ?? null;
}

/**
 * Crea el pedido de un cobro que ya se ha pagado, con los datos que lleva el
 * propio cobro. Si ya existía (o lo crea otro a la vez), devuelve ese.
 */
export async function crearPedidoDesdePago(
  supabase: SupabaseClient,
  pi: Stripe.PaymentIntent,
  opts: { store?: string } = {},
): Promise<PedidoPagado> {
  const previo = await pedidoDelPago(supabase, pi.id);
  if (previo) return previo;

  const md = pi.metadata ?? {};
  let carrito: { id: string; qty: number; name?: string }[] = [];
  try { carrito = JSON.parse(md.items || "[]"); } catch { carrito = []; }
  const ids = carrito.map(i => String(i.id)).filter(Boolean);
  if (!ids.length) throw new Error(`el cobro ${pi.id} no lleva carrito en sus metadatos`);

  const { data: productos, error: pErr } = await supabase
    .from("products").select("id, name, price, images, slug, aliexpress_id").in("id", ids);
  if (pErr || !productos) throw new Error(`products: ${pErr?.message ?? "sin respuesta"}`);
  const porId = new Map(productos.map(p => [String(p.id), p]));

  const items = carrito.map(i => {
    const p = porId.get(String(i.id));
    return {
      id: i.id,
      slug: p?.slug ?? null,
      name: i.name || p?.name || "",
      price: Number(p?.price ?? 0),
      image: Array.isArray(p?.images) ? p.images[0] ?? null : null,
      qty: Number(i.qty) || 1,
      aliexpress_product_id: p?.aliexpress_id ?? null,
    };
  });
  const subtotal = Math.round(items.reduce((s, i) => s + i.price * i.qty, 0) * 100) / 100;
  const cupon = String(md.coupon ?? "").trim().toUpperCase();
  const descuento = CUPONES_10.includes(cupon) ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
  const tasa = Number(md.fx_rate) > 0 ? Number(md.fx_rate) : 1;
  const total = Math.round((pi.amount / 100 / tasa) * 100) / 100;   // lo cobrado, en EUR

  const env = pi.shipping;
  const nombre = (env?.name || "").trim();
  const [firstName, ...resto] = nombre.split(/\s+/);
  const ahora = new Date().toISOString();
  const fila: Record<string, unknown> = {
    order_number: numeroPedido(),
    stripe_payment_intent_id: pi.id,
    status: "paid",
    paid_at: ahora,
    customer_email: pi.receipt_email || null,
    customer_name: nombre || null,
    customer_phone: env?.phone || null,
    shipping_address: {
      firstName: firstName || "", lastName: resto.join(" "),
      address: env?.address?.line1 || "", city: env?.address?.city || "",
      postal: env?.address?.postal_code || "", country: env?.address?.country || md.country || "",
    },
    items,
    shipping_method: "standard",
    shipping_cost: 0,
    subtotal,
    discount: descuento,
    coupon: cupon && cupon !== "NONE" ? cupon : null,
    total,
    currency: "EUR",
    locale: md.locale || "es",
    created_at: ahora,
    updated_at: ahora,
  };
  if (opts.store) fila.store = opts.store;

  const { data, error } = await supabase.from("orders").insert(fila).select(CAMPOS).single();
  if (!error && data) return data as PedidoPagado;
  // 23505: otro (create-order o un reintento del webhook) lo creó a la vez.
  if (error?.code === "23505") {
    const ya = await pedidoDelPago(supabase, pi.id);
    if (ya) return ya;
  }
  throw new Error(`no se pudo crear el pedido de ${pi.id}: ${error?.message ?? "sin respuesta"}`);
}
