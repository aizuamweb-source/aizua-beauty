import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * GET /api/newsletter/baja?e=<email>&t=<token>
 *
 * POR QUE EXISTE (s256)
 * ---------------------
 * La newsletter usa el merge tag `{{ unsubscribe }}` de Brevo, que SOLO funciona
 * en campañas. El correo de aviso que se envía al detectar un pedido nuevo es
 * TRANSACCIONAL, así que ese tag no sirve ahí — y sin una baja que funcione de
 * verdad no se cumple el art. 21.2 de la LSSI, que exige poder oponerse tanto en
 * el momento de la recogida como en cada envío.
 *
 * EL TOKEN NO ES DECORATIVO
 * -------------------------
 * Sin él, la URL sería `?e=cualquier@correo.com` y cualquiera podría dar de baja
 * a otro cambiando el parámetro. Es un HMAC del correo con un secreto del
 * servidor: no hace falta guardar nada y no se puede fabricar desde fuera.
 *
 * Se da de baja de TODAS las listas de marketing, no solo de una: alguien que
 * pulsa "baja" no está diciendo "quitadme de la lista 6", está diciendo "no
 * quiero más correos". Interpretarlo de forma estrecha es justo lo que genera
 * reclamaciones.
 */

const BREVO = "https://api.brevo.com/v3";
// Todas las listas de marketing. La #10 (clientes de TikTok) entra también:
// alimenta el nurture de AG-49, que también es comercial.
const LISTAS_MARKETING = [5, 6, 10, 11, 12];

function firma(email: string): string {
  // POR QUE BREVO_API_KEY Y NO CRON_SECRET (s256):
  // El primer intento firmaba con CRON_SECRET y funcionaba en tech... pero NO en
  // beauty, porque cada proyecto de Vercel tiene su propio CRON_SECRET. Un enlace
  // de baja que solo valida en una de las dos tiendas es peor que no tenerlo.
  // BREVO_API_KEY es forzosamente identico en todas las marcas (una sola cuenta
  // de Brevo, listas compartidas), asi que el token firmado por el agente vale en
  // cualquiera de ellas sin tocar ni una variable de entorno.
  const secreto = process.env.BREVO_API_KEY ?? process.env.CRON_SECRET ?? "";
  return crypto.createHmac("sha256", secreto)
    .update(email.trim().toLowerCase())
    .digest("hex")
    .slice(0, 32);
}

function pagina(titulo: string, cuerpo: string, ok: boolean): NextResponse {
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
 <p style="margin-top:22px;font-size:13px;color:#94A3B8">AizuaLabs · <a href="https://beauty.aizualabs.com">beauty.aizualabs.com</a></p>
</div></body></html>`;
  return new NextResponse(html, {
    status: ok ? 200 : 400,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Diagnostico sin filtrar valores: dice QUE variable se uso para firmar,
      // no su contenido. Sirve para distinguir "el deploy no ha llegado" de
      // "esta variable no esta puesta en este proyecto", que es exactamente la
      // duda que costo media hora el 24/08.
      "X-Baja-Firma": process.env.BREVO_API_KEY ? "brevo" : (process.env.CRON_SECRET ? "cron" : "ninguna"),
    },
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = (searchParams.get("e") ?? "").trim().toLowerCase();
  const token = (searchParams.get("t") ?? "").trim();

  if (!email || !email.includes("@")) {
    return pagina("Enlace incompleto", "Falta la dirección de correo. Escríbenos a info@aizualabs.com y te damos de baja a mano.", false);
  }
  // Comparación en tiempo constante: no filtra el token por el tiempo de respuesta.
  const esperado = firma(email);
  const iguales =
    token.length === esperado.length &&
    crypto.timingSafeEqual(Buffer.from(token), Buffer.from(esperado));
  if (!iguales) {
    return pagina("Enlace no válido", "Este enlace de baja no es correcto o ha caducado. Escríbenos a info@aizualabs.com y te damos de baja a mano.", false);
  }

  const key = process.env.BREVO_API_KEY ?? "";
  if (!key) {
    return pagina("No hemos podido procesarlo", "Ha habido un problema técnico. Escríbenos a info@aizualabs.com y te damos de baja a mano.", false);
  }
  const H = { "api-key": key, "Content-Type": "application/json" };

  // 1) Fuera de todas las listas de marketing.
  for (const id of LISTAS_MARKETING) {
    try {
      await fetch(`${BREVO}/contacts/lists/${id}/contacts/remove`, {
        method: "POST", headers: H, body: JSON.stringify({ emails: [email] }),
      });
    } catch { /* se sigue con las demás: una lista que falle no puede impedir la baja */ }
  }

  // 2) Y a la lista negra de Brevo. Esto es lo que de verdad garantiza que no
  //    vuelva a recibir nada aunque un agente lo re-añada por error mañana —
  //    quitarlo solo de las listas no impide que se le vuelva a meter.
  try {
    await fetch(`${BREVO}/contacts/${encodeURIComponent(email)}`, {
      method: "PUT", headers: H,
      body: JSON.stringify({ emailBlacklisted: true }),
    });
  } catch { /* la baja de listas ya está hecha */ }

  return pagina(
    "Baja confirmada",
    "No volverás a recibir correos comerciales nuestros. Si fue un error, escríbenos a " +
    "<a href='mailto:info@aizualabs.com'>info@aizualabs.com</a>.",
    true,
  );
}
