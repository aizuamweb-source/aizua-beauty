/**
 * purchase-alert.ts — El aviso de que ENTRÓ DINERO, garantizado
 * ═════════════════════════════════════════════════════════════
 *
 * POR QUÉ EXISTE (medido el 08/09/2026)
 * ─────────────────────────────────────
 * En `app/api/webhook/route.ts`, TODO lo que pasa tras un cobro — Telegram,
 * email al cliente, Klaviyo, Brevo (retención), la fila de `transactions` y el
 * acumulador OSS — vivía dentro de un `if (order)`. Ese `order` sale de un
 * UPDATE sobre `orders` filtrando por `stripe_payment_intent_id`: si la fila no
 * existe (el pedido no se llegó a crear, o el id no casa), `order` es null,
 * **no se avisa de nada** y el handler devuelve 200, así que para Stripe el
 * evento quedó entregado. Un cobro real puede pasar en absoluto silencio.
 *
 * Y había un segundo silencio: `notifyNewOrder()` empieza con
 * `if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;` — sin las variables
 * no avisa Y no se queja.
 *
 * CÓMO SE GARANTIZA, y por qué no es solo "otro log"
 * ──────────────────────────────────────────────────
 * El aviso NO depende de encontrar el pedido: el hecho es que entró dinero, y
 * eso lo dice Stripe. Se envía por DOS vías (Telegram y email) y se devuelve
 * qué consiguió cada una. Si fallan LAS DOS, el webhook contesta 500 y
 * **Stripe reintenta el evento hasta 3 días** — la garantía la sostiene la
 * maquinaria de reintentos de Stripe, no nuestro `console.error`.
 *
 * Para que ese reintento sea seguro, este aviso va ANTES de los efectos no
 * idempotentes (email al cliente, Klaviyo, Brevo, `transactions`): si sale 500,
 * ninguno se ha ejecutado todavía y el reintento no duplica nada. El UPDATE de
 * `orders` sí puede ir antes porque es idempotente.
 *
 * Y cuando el cobro NO tiene pedido asociado lo dice en el propio mensaje: eso
 * no es un detalle técnico, es una incoherencia que hay que mirar.
 */

export type CobroDetectado = {
  paymentIntentId: string;
  importe: number;            // en euros, ya dividido
  moneda: string;
  emailCliente?: string | null;
  nombreCliente?: string | null;
  /** El pedido apareció en `orders`. Si es false, el mensaje lo destaca. */
  pedidoEncontrado: boolean;
  numeroPedido?: string | null;
  articulos?: Array<{ name?: string; qty?: number }> | null;
  /** De qué endpoint vino, para saber cuál de los dos webhooks está registrado. */
  via: string;
};

export type ResultadoAviso = { telegram: boolean; email: boolean };

function esc(v: unknown): string {
  return String(v ?? "");
}

async function porTelegram(marca: string, c: CobroDetectado): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return false;

  const lineas = [
    c.pedidoEncontrado
      ? `💰 COBRO — ${marca}`
      : `⚠️ COBRO SIN PEDIDO ASOCIADO — ${marca}`,
    `${c.importe.toFixed(2)} ${c.moneda.toUpperCase()}`,
    c.numeroPedido ? `Pedido #${esc(c.numeroPedido)}` : "",
    c.nombreCliente ? `Cliente: ${esc(c.nombreCliente)}` : "",
    c.emailCliente ? `Email: ${esc(c.emailCliente)}` : "",
    "",
    ...(c.articulos ?? []).map(a => `  • ${esc(a.name)} x${a.qty ?? 1}`),
    "",
    c.pedidoEncontrado
      ? ""
      : `No hay fila en 'orders' con este payment_intent. El dinero entró: revísalo en Stripe.`,
    `PaymentIntent: ${esc(c.paymentIntentId)}`,
    `via: ${esc(c.via)}`,
  ].filter(Boolean);

  try {
    // Sin parse_mode a propósito: los nombres de producto llevan '_', '*' y '('
    // y rompían Markdown — mismo bug ya corregido en AG-39, AG-45 y notifyNewOrder.
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chat,
        text: lineas.join("\n"),
        disable_web_page_preview: true,
      }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

async function porEmail(marca: string, c: CobroDetectado): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  // El aviso interno va SIEMPRE a la dirección del negocio, nunca a la del
  // cliente: son dos correos distintos con dos destinatarios distintos.
  const destino = process.env.ALERT_EMAIL || "info@aizualabs.com";
  if (!key) return false;

  const asunto = c.pedidoEncontrado
    ? `[${marca}] Cobro ${c.importe.toFixed(2)} ${c.moneda.toUpperCase()}${c.numeroPedido ? ` — #${c.numeroPedido}` : ""}`
    : `[${marca}] ⚠️ Cobro SIN pedido asociado — ${c.importe.toFixed(2)} ${c.moneda.toUpperCase()}`;

  const filas = [
    ["Importe", `${c.importe.toFixed(2)} ${c.moneda.toUpperCase()}`],
    ["Pedido", c.numeroPedido || "(sin número)"],
    ["Cliente", c.nombreCliente || "(sin nombre)"],
    ["Email", c.emailCliente || "(sin email)"],
    ["PaymentIntent", c.paymentIntentId],
    ["Endpoint", c.via],
  ];

  const html =
    `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head><body>` +
    `<h2>${c.pedidoEncontrado ? "Cobro" : "⚠️ Cobro sin pedido asociado"} — ${marca}</h2>` +
    (c.pedidoEncontrado
      ? ""
      : `<p><b>No hay fila en <code>orders</code> con este payment_intent.</b> El dinero entró igualmente: revísalo en Stripe.</p>`) +
    `<table cellpadding="6">` +
    filas.map(([k, v]) => `<tr><td><b>${k}</b></td><td>${esc(v)}</td></tr>`).join("") +
    `</table>` +
    ((c.articulos ?? []).length
      ? `<ul>${(c.articulos ?? []).map(a => `<li>${esc(a.name)} x${a.qty ?? 1}</li>`).join("")}</ul>`
      : "") +
    `</body></html>`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "AizuaLabs <info@aizualabs.com>",
        to: [destino],
        subject: asunto,
        html,
      }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

/**
 * Manda el aviso interno por las dos vías. Nunca lanza: devuelve qué consiguió,
 * y es el llamador quien decide (con un 500) si Stripe debe reintentar.
 */
export async function avisarCobro(marca: string, c: CobroDetectado): Promise<ResultadoAviso> {
  const [telegram, email] = await Promise.all([
    porTelegram(marca, c).catch(() => false),
    porEmail(marca, c).catch(() => false),
  ]);
  if (!telegram && !email) {
    console.error(
      `[purchase-alert] COBRO SIN AVISAR por ninguna vía · pi=${c.paymentIntentId} · ` +
      `${c.importe} ${c.moneda} · via=${c.via} — se devolverá 500 para que Stripe reintente`,
    );
  }
  return { telegram, email };
}
