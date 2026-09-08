import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BREVO_API = "https://api.brevo.com/v3";

interface AbandonedCartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
}

interface AbandonedCartRow {
  id: string;
  email: string;
  items: AbandonedCartItem[];
  locale: string;
  total: number;
  created_at: string;
  reminder_sent_at?: string;
}

async function sendAbandonedCartEmail(row: AbandonedCartRow): Promise<boolean> {
  const isEs = row.locale === "es";
  const itemsList = row.items
    .map((i) => i.name + " x" + i.qty + " — " + i.price.toFixed(2) + "€")
    .join(", ");

  const emailPayload = {
    to: [{ email: row.email }],
    sender: {
      email: process.env.RESEND_FROM_EMAIL ?? "info@aizualabs.com",
      name: "AizuaBeauty",
    },
    subject: isEs ? "Olvidaste algo en tu carrito beauty ✨" : "You left something in your beauty cart ✨",
    htmlContent:
      "<p>" +
      (isEs ? "Hola, tienes artículos esperándote:" : "Hi, you have items waiting:") +
      "</p><p>" +
      itemsList +
      "</p><p><strong>Total: " +
      row.total.toFixed(2) +
      "€</strong></p><p><a href='" +
      (process.env.NEXT_PUBLIC_APP_URL ?? "https://beauty.aizualabs.com") +
      "/" +
      row.locale +
      "/tienda'>" +
      (isEs ? "Volver a la tienda" : "Return to store") +
      "</a></p>",
  };

  try {
    const res = await fetch(BREVO_API + "/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY ?? "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// POST /api/abandoned-cart — cron job that sends reminders for abandoned carts
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2h ago
    const { data: carts, error } = await supabase
      .from("abandoned_carts")
      .select("*")
      .lt("created_at", cutoff)
      .is("reminder_sent_at", null)
      .not("email", "is", null)
      .eq("store", "beauty")   // ← only beauty store carts
      .limit(50);

    if (error) throw error;

    let sent = 0;
    for (const cart of (carts as AbandonedCartRow[]) ?? []) {
      const ok = await sendAbandonedCartEmail(cart);
      if (ok) {
        await supabase
          .from("abandoned_carts")
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq("id", cart.id);
        sent++;
      }
    }

    return NextResponse.json({ ok: true, processed: carts?.length ?? 0, sent });
  } catch (err) {
    console.error("[abandoned-cart]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// GET /api/abandoned-cart?process=true — Vercel cron (daily 10:00)
// GET /api/abandoned-cart?email=x&data=y — save a cart from client
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // ── Cron: process abandoned carts ────────────────────────────────────────
  if (searchParams.get("process") === "true") {
    const auth = req.headers.get("authorization")?.replace("Bearer ", "");
    if (auth !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2h ago
      const { data: carts, error } = await supabase
        .from("abandoned_carts")
        .select("*")
        .lt("created_at", cutoff)
        .is("reminder_sent_at", null)
        .not("email", "is", null)
        .eq("store", "beauty")   // ← only beauty store carts
        .limit(50);

      if (error) throw error;

      let sent = 0;
      for (const cart of (carts as AbandonedCartRow[]) ?? []) {
        const ok = await sendAbandonedCartEmail(cart);
        if (ok) {
          await supabase
            .from("abandoned_carts")
            .update({ reminder_sent_at: new Date().toISOString() })
            .eq("id", cart.id);
          sent++;
        }
      }

      return NextResponse.json({ ok: true, processed: carts?.length ?? 0, sent });
    } catch (err) {
      console.error("[abandoned-cart cron]", err);
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  // ── Client: save a cart before checkout ──────────────────────────────────
  const email = searchParams.get("email");
  const cartData = searchParams.get("data");

  if (!email || !cartData) {
    return NextResponse.json({ error: "Missing email or data" }, { status: 400 });
  }

  try {
    const items: AbandonedCartItem[] = JSON.parse(decodeURIComponent(cartData));
    const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

    // 🔴 ESTO DEVOLVÍA {ok:true} Y NO ESCRIBÍA NADA. Medido el 08/09/2026
    // reproduciendo la llamada contra PostgREST: el upsert con
    // `onConflict: "email"` devuelve 400 con código 42P10 —"there is no unique
    // or exclusion constraint matching the ON CONFLICT specification"— porque
    // `public.abandoned_carts` es una VISTA sobre `store.abandoned_carts`, y una
    // vista no tiene restricciones únicas. El error no se comprobaba, así que el
    // endpoint contestaba ok:true con la tabla vacía: un verde falso perfecto.
    //
    // Se resuelve leyendo-y-escribiendo en vez de con ON CONFLICT: no hace falta
    // restricción y por tanto no hace falta tocar el esquema (un índice único
    // sobre la tabla base sería cambio de esquema, decisión de Miguel). Un
    // INSERT simple sobre la vista SÍ funciona — verificado, 201.
    const locale = req.headers.get("accept-language")?.startsWith("es") ? "es" : "en";

    const { data: previo, error: errLeer } = await supabase
      .from("abandoned_carts")
      .select("id")
      .eq("email", email)
      .limit(1)
      .maybeSingle();

    if (errLeer) {
      console.error("[abandoned-cart] no se pudo leer el carrito previo:", errLeer.message);
      return NextResponse.json({ ok: false, error: errLeer.message }, { status: 500 });
    }

    const fila = { email, items, total, locale, updated_at: new Date().toISOString() };
    const { error: errEscribir } = previo?.id
      ? await supabase.from("abandoned_carts").update(fila).eq("id", previo.id)
      : await supabase.from("abandoned_carts").insert(fila);

    // Y ahora el error se MIRA: sin esto volveríamos al ok:true que no escribe.
    if (errEscribir) {
      console.error("[abandoned-cart] no se pudo guardar el carrito:", errEscribir.message);
      return NextResponse.json({ ok: false, error: errEscribir.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, modo: previo?.id ? "actualizado" : "creado" });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
