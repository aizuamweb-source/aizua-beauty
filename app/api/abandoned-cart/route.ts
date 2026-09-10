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
// (Ya no hay constante de Brevo aqui: este endpoint envia por Resend — ver el
// comentario de sendAbandonedCartEmail para el motivo, que lo dio Brevo.)

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
 * ESTE CORREO SALE POR RESEND, NO POR BREVO — y no es un capricho (s293).
 *
 * 🔴 LO QUE PASABA, con el motivo dado por Brevo palabra por palabra:
 *   «Sending has been rejected because the sender you used
 *    noreply@beauty.aizualabs.com is not valid. Validate your sender or
 *    authenticate your domain»
 *
 * `beauty.aizualabs.com` esta verificado en RESEND (DKIM+SPF desde la s174),
 * NO en Brevo. Este endpoint mandaba por Brevo usando `RESEND_FROM_EMAIL` como
 * remitente: un dominio autenticado en un proveedor, enviado por el otro.
 * Brevo aceptaba la peticion —devolvia 2xx, asi que `res.ok` daba true y el
 * gate informaba «enviado»— y despues registraba el evento como `error`. O sea
 * que el correo NO llegaba y desde dentro no se notaba. Se vio preguntandole a
 * Brevo por sus eventos, no por el codigo de respuesta.
 *
 * POR QUE RESEND Y NO CAMBIAR EL REMITENTE AL APEX: el remitente de marca de
 * los correos al cliente es una decision de Miguel que dejo tomada en la s290
 * («el correo al cliente no se toca: es decision de marca»). Mandar por Resend
 * conserva `noreply@beauty.aizualabs.com` Y funciona hoy, sin tocar DNS ni
 * autenticar un dominio nuevo en Brevo.
 *
 * Y NO ES UN CAMINO NUEVO EN ESTE REPO: el correo de confirmacion de pedido y
 * el aviso de seguimiento de `ali-tracking` —los otros dos que escriben al
 * cliente— ya salen por Resend con esta misma variable, y llegan (verificado
 * `delivered` en la s290). El del carrito era el unico que iba por Brevo.
 *
 * ⚠️ La tienda tech NO se toca: su remitente es `noreply@aizualabs.com`, el
 * apex, que SI esta validado en Brevo — sus envios constan `delivered`. Lo
 * verificado no se toca.
 */
async function sendAbandonedCartEmail(row: AbandonedCartRow): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("[abandoned-cart] sin RESEND_API_KEY: no se puede enviar");
    return false;
  }

  const isEs = row.locale === "es";
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://beauty.aizualabs.com";
  const urlTienda = base + "/" + row.locale + "/tienda";

  const t = isEs
    ? {
        pre: "Tu selección sigue guardada",
        titulo: "Lo dejaste a medias",
        entradilla:
          "Hemos guardado tu carrito tal y como lo dejaste. Sigue disponible cuando quieras retomarlo.",
        articulos: "Tu selección",
        total: "Total",
        cta: "Retomar mi compra",
        envio: "Envío gratis \u00b7 14 días de devolución",
        ayuda: "Cualquier duda, responde a este correo o escríbenos a",
      }
    : {
        pre: "Your selection is still saved",
        titulo: "You left something behind",
        entradilla:
          "We saved your cart exactly as you left it. It is still available whenever you want to pick it back up.",
        articulos: "Your selection",
        total: "Total",
        cta: "Resume my order",
        envio: "Free shipping \u00b7 14-day returns",
        ayuda: "Any questions, reply to this email or write to",
      };

  // Los nombres de producto vienen de importaciones de AliExpress y se meten
  // dentro del HTML: sin escapar, un `&` o un `<` rompe el correo del cliente.
  const esc = (v: unknown) =>
    String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const filas = (row.items ?? [])
    .map((it) => {
      // La miniatura es OPCIONAL: no todos los carritos guardados traen
      // `image`, y un <img> con src vacio se pinta como un icono roto.
      const miniatura = it.image
        ? '<img src="' + esc(it.image) + '" width="56" height="56" alt="" style="display:block;width:56px;height:56px;border-radius:8px;object-fit:cover;background:#F5F1EC;" />'
        : '<div style="width:56px;height:56px;border-radius:8px;background:#F5E8EC;"></div>';
      return (
        '<tr>' +
        '<td width="56" style="padding:14px 0;border-bottom:1px solid #E5DFD8;vertical-align:top;">' + miniatura + '</td>' +
        '<td style="padding:14px 0 14px 14px;border-bottom:1px solid #E5DFD8;vertical-align:top;">' +
        '<div style="font-size:15px;color:#2C2C2C;line-height:1.4;">' + esc(it.name) + '</div>' +
        '<div style="font-size:13px;color:#6B6B6B;margin-top:3px;">' + it.qty + ' &times; ' + it.price.toFixed(2) + '&nbsp;&euro;</div>' +
        '</td>' +
        '<td style="padding:14px 0;border-bottom:1px solid #E5DFD8;text-align:right;vertical-align:top;white-space:nowrap;font-size:15px;color:#2C2C2C;font-weight:600;">' +
        (it.price * it.qty).toFixed(2) + '&nbsp;&euro;</td>' +
        '</tr>'
      );
    })
    .join("");

  const serif = "'Cormorant Garamond',Georgia,'Times New Roman',serif";
  const sans = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

  // Correo de tabla y estilos en linea: es lo que sobrevive a Gmail y Outlook.
  // Las tipografias NO se cargan de un CDN (la mayoria de clientes lo quitan):
  // Cormorant es un deseo y Georgia hace el trabajo real.
  const html =
    '<!DOCTYPE html><html lang="' + esc(row.locale) + '"><head>' +
    '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + esc(t.titulo) + '</title></head>' +
    '<body style="margin:0;padding:0;background:#FAF8F5;font-family:' + sans + ';color:#2C2C2C;">' +
    // Preencabezado: es la linea que la bandeja muestra junto al asunto. Sin
    // ella, el cliente de correo rellena ese hueco con el primer texto que
    // encuentre, que era el nombre del primer producto.
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0;">' + esc(t.entradilla) + '</div>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FAF8F5;padding:32px 16px;">' +
    '<tr><td align="center">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">' +

    '<tr><td style="padding:0 0 22px;text-align:center;">' +
    '<div style="font-family:' + serif + ';font-size:27px;letter-spacing:0.16em;color:#2C2C2C;text-transform:uppercase;">Aizua<span style="color:#C4748A;">Beauty</span></div>' +
    '<div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#6B6B6B;margin-top:7px;">' +
    (isEs ? 'Belleza &middot; Cuidado &middot; Accesorios' : 'Beauty &middot; Skincare &middot; Accessories') +
    '</div></td></tr>' +

    '<tr><td style="background:#FFFFFF;border:1px solid #E5DFD8;border-radius:14px;padding:38px 34px 30px;">' +
    '<div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#7BA05B;font-weight:600;">' + esc(t.pre) + '</div>' +
    '<h1 style="font-family:' + serif + ';font-size:31px;line-height:1.2;font-weight:400;color:#2C2C2C;margin:11px 0 0;">' + esc(t.titulo) + '</h1>' +
    '<div style="width:44px;height:2px;background:#C4748A;margin:17px 0 0;"></div>' +
    '<p style="font-size:15px;line-height:1.65;color:#6B6B6B;margin:17px 0 0;">' + esc(t.entradilla) + '</p>' +

    '<div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#6B6B6B;font-weight:600;margin:30px 0 0;">' + esc(t.articulos) + '</div>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:4px;">' +
    filas +
    '<tr><td colspan="2" style="padding:18px 0 0;font-family:' + serif + ';font-size:19px;color:#2C2C2C;">' + esc(t.total) + '</td>' +
    '<td style="padding:18px 0 0;text-align:right;white-space:nowrap;font-size:22px;font-weight:700;color:#C4748A;">' + row.total.toFixed(2) + '&nbsp;&euro;</td></tr>' +
    '</table>' +

    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:30px auto 0;">' +
    '<tr><td align="center" style="background:#7BA05B;border-radius:999px;">' +
    '<a href="' + esc(urlTienda) + '" style="display:inline-block;padding:14px 38px;font-size:14px;font-weight:600;letter-spacing:0.05em;color:#FFFFFF;text-decoration:none;">' + esc(t.cta) + '</a>' +
    '</td></tr></table>' +
    '<p style="font-size:12px;color:#6B6B6B;text-align:center;margin:15px 0 0;">' + esc(t.envio) + '</p>' +
    '</td></tr>' +

    '<tr><td style="padding:22px 10px 0;text-align:center;">' +
    '<p style="font-size:12px;line-height:1.6;color:#6B6B6B;margin:0;">' + esc(t.ayuda) +
    ' <a href="mailto:info@aizualabs.com" style="color:#5C8044;text-decoration:underline;">info@aizualabs.com</a></p>' +
    '<p style="font-size:11px;color:#A39D95;margin:11px 0 0;">AizuaBeauty &middot; M&aacute;laga, Espa&ntilde;a</p>' +
    '</td></tr>' +

    '</table></td></tr></table></body></html>';

  // Alternativa en texto plano, en el MISMO envio (no es un correo aparte).
  const texto = [
    t.titulo,
    "",
    t.entradilla,
    "",
    ...(row.items ?? []).map(
      (it) =>
        "- " + it.name + "  " + it.qty + " x " + it.price.toFixed(2) + " EUR  =  " +
        (it.price * it.qty).toFixed(2) + " EUR",
    ),
    "",
    t.total + ": " + row.total.toFixed(2) + " EUR",
    "",
    t.cta + ": " + urlTienda,
    "",
    t.ayuda + " info@aizualabs.com",
  ].join("\n");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL ?? "AizuaLabs Beauty <noreply@beauty.aizualabs.com>",
        to: [row.email],
        reply_to: [process.env.ALERT_EMAIL ?? "info@aizualabs.com"],
        // El asunto anterior ("carrito beauty") escribia la marca en minuscula
        // y en medio de la frase, como si fuera una categoria.
        subject: isEs
          ? "Tu selección sigue guardada en AizuaBeauty ✨"
          : "Your selection is still saved at AizuaBeauty ✨",
        html,
        text: texto,
      }),
    });
    if (!res.ok) {
      // El motivo se registra: un `false` mudo fue justo lo que oculto durante
      // meses que este correo no salia.
      console.error("[abandoned-cart] Resend rechazo el envio:", res.status, (await res.text()).slice(0, 300));
      return false;
    }
    return true;
  } catch (e) {
    console.error("[abandoned-cart] fallo de red enviando por Resend:", String(e));
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
