import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * GET /api/newsletter/baja?e=<email>&t=<token>
 *
 * POR QUE EXISTE (s257)
 * ---------------------
 * La newsletter usa el merge tag de baja de Brevo, que SOLO funciona en
 * campañas. El correo de aviso que se envía al detectar un pedido nuevo es
 * TRANSACCIONAL, así que ese tag no sirve ahí — y sin una baja que funcione de
 * verdad no se cumple el art. 21.2 de la LSSI, que exige poder oponerse tanto en
 * el momento de la recogida como en cada envío.
 *
 * POR QUE EL TOKEN NO ES UN HMAC
 * ------------------------------
 * El primer diseño firmaba el correo con un secreto compartido. Se probaron los
 * dos candidatos y NINGUNO lo es, verificado contra producción:
 *   - CRON_SECRET: cada proyecto de Vercel tiene el suyo (tech validaba, beauty no).
 *   - BREVO_API_KEY: también distinto por proyecto, porque Brevo admite varias
 *     claves para la MISMA cuenta y cada web tiene la suya. Eso es correcto y no
 *     hay que "arreglarlo".
 * Y hay un motivo más fuerte: si el secreto de firma fuera una credencial
 * rotable, rotarla dejaría MUERTOS todos los enlaces de baja ya enviados, sin
 * ningún aviso. Un enlace de baja tiene que sobrevivir a la rotación: es la única
 * vía del cliente para ejercer su derecho de oposición.
 *
 * Así que el token es aleatorio y vive en el propio contacto de Brevo (atributo
 * BAJA_TOKEN). Cada web lo valida con SU clave contra la misma cuenta. Sin
 * secreto compartido, sin tocar variables de entorno, y permite revocar un
 * enlace concreto — cosa que el HMAC no permitía.
 *
 * Se da de baja de TODAS las listas de marketing, no solo de una: alguien que
 * pulsa "baja" no está diciendo "quitadme de la lista 6", está diciendo "no
 * quiero más correos". Interpretarlo de forma estrecha es lo que genera
 * reclamaciones.
 */

const BREVO = "https://api.brevo.com/v3";
// Todas las listas de marketing. La #10 (clientes de TikTok) entra también:
// alimenta el nurture de AG-49, que también es comercial. La #7 (Clientes),
// #8 (Academy) y #9 (Consulting) igual: si alguna vez se les escribe es
// comercial, y una baja tiene que sacar de todas.
const LISTAS_MARKETING = [5, 6, 7, 8, 9, 10, 11, 12];

function pagina(titulo: string, cuerpo: string, ok: boolean, firma: string): NextResponse {
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${titulo}</title>
<style>
 body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#0F172A;color:#E2E8F0;
      display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;padding:24px}
 .c{max-width:520px;background:#1E293B;border-radius:14px;padding:36px;text-align:center}
 h1{margin:0 0 14px;font-size:22px;color:${ok ? "#4ADE80" : "#F87171"}}
 p{line-height:1.6;color:#CBD5E1;margin:0 0 10px}
 a{color:#38BDF8}
</style></head><body><div class="c">
 <h1>${titulo}</h1><p>${cuerpo}</p>
 <p style="margin-top:22px;font-size:13px;color:#94A3B8">AizuaLabs · <a href="https://aizualabs.com">aizualabs.com</a></p>
</div></body></html>`;
  return new NextResponse(html, {
    status: ok ? 200 : 400,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Diagnóstico que NO filtra valores: dice en qué punto falló, nunca un
      // secreto. Distingue "no ha llegado el deploy" de "esta web no puede leer
      // el contacto", que es la duda concreta que costó media hora el 24/08.
      "X-Baja-Firma": firma,
    },
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = (searchParams.get("e") ?? "").trim().toLowerCase();
  const token = (searchParams.get("t") ?? "").trim();

  const AYUDA = "Escríbenos a <a href='mailto:info@aizualabs.com'>info@aizualabs.com</a> y te damos de baja a mano.";
  const fallo = (t: string, c: string, f: string) => pagina(t, c, false, f);

  if (!email || !email.includes("@") || !token) {
    return fallo("Enlace incompleto", `Faltan datos en el enlace. ${AYUDA}`, "incompleto");
  }

  const key = process.env.BREVO_API_KEY ?? "";
  if (!key) {
    return fallo("No hemos podido procesarlo", `Ha habido un problema técnico. ${AYUDA}`, "sin-clave");
  }
  const H = { "api-key": key, "Content-Type": "application/json" };

  // 1) El token vive en el contacto. Se lee con la clave de ESTA web.
  let guardado = "";
  try {
    const r = await fetch(`${BREVO}/contacts/${encodeURIComponent(email)}`,
      // s265: `dynamic = "force-dynamic"` hace dinamica la RUTA pero NO
      // desactiva el Data Cache de los fetch de dentro, y ese cache PERSISTE
      // entre despliegues. Sin no-store, si la lectura de un contacto queda
      // cacheada y despues su token se regenera, al cliente le saldria
      // "enlace no valido" al intentar darse de baja — el peor momento
      // posible para fallar. Lo destapo la sonda de baja_operativa, que
      // devolvia 400 con un enlace que funcionaba.
      { headers: H, cache: "no-store" });
    if (r.status === 404) {
      // No está en Brevo: no recibe nada nuestro, así que lo que pedía ya se
      // cumple. Decirle "enlace inválido" aquí sería absurdo y le haría escribir.
      return pagina("Ya estás fuera",
        "Esa dirección no está en ninguna de nuestras listas, así que no vas a recibir correos comerciales nuestros.",
        true, "no-existe");
    }
    if (!r.ok) return fallo("No hemos podido procesarlo", `Ha habido un problema técnico. ${AYUDA}`, `brevo-${r.status}`);
    const j = await r.json();
    guardado = String(j?.attributes?.BAJA_TOKEN ?? "");
  } catch {
    return fallo("No hemos podido procesarlo", `Ha habido un problema técnico. ${AYUDA}`, "brevo-caido");
  }

  // Comparación en tiempo constante: no filtra el token por el tiempo de respuesta.
  const iguales =
    guardado.length > 0 &&
    token.length === guardado.length &&
    crypto.timingSafeEqual(Buffer.from(token), Buffer.from(guardado));
  if (!iguales) {
    return fallo("Enlace no válido", `Este enlace de baja no es correcto o ha caducado. ${AYUDA}`, "token");
  }

  // 2) Fuera de todas las listas de marketing.
  for (const id of LISTAS_MARKETING) {
    try {
      await fetch(`${BREVO}/contacts/lists/${id}/contacts/remove`, {
        method: "POST", headers: H, body: JSON.stringify({ emails: [email] }),
      });
    } catch { /* se sigue: una lista que falle no puede impedir la baja */ }
  }

  // 3) Y a la lista negra. Es lo único que garantiza que no vuelva a recibir nada
  //    aunque un agente lo re-añada mañana por error: quitarlo solo de las listas
  //    no impide que se le vuelva a meter.
  try {
    await fetch(`${BREVO}/contacts/${encodeURIComponent(email)}`, {
      method: "PUT", headers: H, body: JSON.stringify({ emailBlacklisted: true }),
    });
  } catch { /* la baja de listas ya está hecha */ }

  return pagina("Baja confirmada",
    `No volverás a recibir correos comerciales nuestros. Si fue un error, ${AYUDA.toLowerCase()}`,
    true, "ok");
}
