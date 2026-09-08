import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// TABLA PROPIA DE BEAUTY (s290). Este endpoint escribia en
// `public.abandoned_carts`, que es una vista sobre `store.abandoned_carts`:
// los carritos de las dos tiendas caian en la misma tabla, indexados por
// email y sin columna que dijera de que marca eran, asi que el cron de cada
// repo -- que lee la tabla entera sin filtro -- habria mandado el
// recordatorio con la marca equivocada. Ahora va a
// `public.beauty_abandoned_carts` -> `beauty.abandoned_carts`, siguiendo el
// patron que el proyecto ya usa con beauty_orders.
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

/**
 * Brevo exige en `sender.email` una direccion DESNUDA. `RESEND_FROM_EMAIL` vale
 * "AizuaLabs Beauty <noreply@beauty.aizualabs.com>" —formato de Resend, con el
 * nombre delante—, asi que pasarla tal cual le mandaba a Brevo una cadena que no
 * es una direccion. Medido el 08/09/2026: la variable es asi en los 4 proyectos.
 */
function remitenteBrevo(nombre: string): { email: string; name: string } {
  const crudo = process.env.RESEND_FROM_EMAIL ?? "info@aizualabs.com";
  const entre = crudo.match(/<([^>]+)>/);
  return { email: (entre ? entre[1] : crudo).trim(), name: nombre };
}

async function sendAbandonedCartEmail(row: AbandonedCartRow): Promise<boolean> {
  const isEs = row.locale === "es";
  const itemsList = row.items
    .map((i) => i.name + " x" + i.qty + " — " + i.price.toFixed(2) + "€")
    .join(", ");

  const emailPayload = {
    to: [{ email: row.email }],
    sender: remitenteBrevo("AizuaBeauty"),
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
// El handler POST se ha ELIMINADO (s291). Era un SEGUNDO emisor sin aprobacion,
// copia literal del de `?process=true`, y nadie lo llamaba: comprobado con grep
// sobre los dos repos de tienda, el Business System y los vercel.json.
//
// 🔴 Y DE PASO, UN FALLO QUE HABRIA HECHO QUE ESTO NO FUNCIONARA NUNCA: las dos
// consultas llevaban `.eq("store", "beauty")` y `beauty.abandoned_carts` NO
// TIENE columna `store` — medido contra information_schema el 08/09/2026, sus
// columnas son id, session_id, email, items, total, locale, reminder_sent_at,
// created_at, updated_at. PostgREST habria devuelto error de columna inexistente
// y el endpoint un 500 en cada pasada. El filtro sobraba: la separacion por
// marca ya la da la TABLA (beauty tiene la suya desde la s290), que es
// precisamente por lo que se creo.

const VENTANA_HORAS = 2;

/** Carritos que llevan >2 h parados, con email y sin recordatorio enviado. */
async function carritosPendientes() {
  const cutoff = new Date(Date.now() - VENTANA_HORAS * 60 * 60 * 1000).toISOString();
  return supabase
    .from("beauty_abandoned_carts")
    .select("*")
    .lt("created_at", cutoff)
    .is("reminder_sent_at", null)
    .not("email", "is", null)
    .limit(50);
}

// GET /api/abandoned-cart?process=true — PROPONE (no envia). Lo llama el gate.
// GET /api/abandoned-cart?send=<id>    — envia UN carrito ya aprobado en Telegram.
// GET /api/abandoned-cart?email=x&data=y — guarda un carrito desde el front.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // ── PROPONER: lista lo que TOCARIA enviar, y no envia nada ───────────────
  //
  // 🔴 ANTES DE LA s291 ESTA RAMA ENVIABA, y `local_crons_runner` la dispara
  // TODOS LOS DIAS ("Abandoned Cart", every_days=1): un carrito capturado por la
  // tarde salia con su correo al cliente en menos de 24 h sin que Miguel pulsara
  // nada. La regla es suya y es literal: "todo lo que salga por ahora tengo que
  // dar yo el visto bueno por telegram".
  //
  // Ahora es de solo lectura. Quien envia es `?send=<id>`, y a ese solo lo llama
  // `product_approver.py` despues del ✅.
  if (searchParams.get("process") === "true") {
    const auth = req.headers.get("authorization")?.replace("Bearer ", "");
    if (auth !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { data: carts, error } = await carritosPendientes();
      if (error) throw error;

      const pendientes = ((carts as AbandonedCartRow[]) ?? []).map((c) => ({
        id: c.id,
        email: c.email,
        total: c.total,
        locale: c.locale,
        created_at: c.created_at,
        articulos: (c.items ?? []).map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
      }));

      return NextResponse.json({
        ok: true,
        modo: "propuesta",
        marca: "AizuaBeauty",
        pendientes,
        sent: 0,
        nota: "Propuesta, no envio. El envio va por ?send=<id> tras aprobacion en Telegram.",
      });
    } catch (err) {
      console.error("[abandoned-cart propuesta]", err);
      return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
    }
  }

  // ── ENVIAR UNO: solo tras el ✅ en Telegram ──────────────────────────────
  const idAEnviar = searchParams.get("send");
  if (idAEnviar) {
    const auth = req.headers.get("authorization")?.replace("Bearer ", "");
    if (auth !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { data: cart, error } = await supabase
        .from("beauty_abandoned_carts")
        .select("*")
        .eq("id", idAEnviar)
        .maybeSingle();

      if (error) throw error;
      if (!cart) {
        return NextResponse.json({ ok: false, error: "carrito no encontrado" }, { status: 404 });
      }
      // Idempotencia: un doble tap en Telegram no manda dos correos.
      if ((cart as AbandonedCartRow).reminder_sent_at) {
        return NextResponse.json({ ok: true, ya_enviado: true, enviado: false });
      }

      const ok = await sendAbandonedCartEmail(cart as AbandonedCartRow);
      if (!ok) {
        return NextResponse.json({ ok: false, error: "Brevo rechazo el envio" }, { status: 502 });
      }

      // El sello va DESPUES del envio confirmado: al reves, un fallo de Brevo
      // dejaria el carrito marcado como avisado sin que el cliente reciba nada.
      const { error: errSello } = await supabase
        .from("beauty_abandoned_carts")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", idAEnviar);
      if (errSello) {
        console.error("[abandoned-cart] enviado pero no sellado:", errSello.message);
      }

      return NextResponse.json({ ok: true, enviado: true, sellado: !errSello });
    } catch (err) {
      console.error("[abandoned-cart send]", err);
      return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
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
      .from("beauty_abandoned_carts")
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
      ? await supabase.from("beauty_abandoned_carts").update(fila).eq("id", previo.id)
      : await supabase.from("beauty_abandoned_carts").insert(fila);

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
