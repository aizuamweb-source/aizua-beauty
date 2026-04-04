// lib/emails/order-confirmation.ts
// Aizua — Email de confirmación de pedido (multiidioma)
// Enviado al cliente justo después de que el pago es confirmado por Stripe

type OrderItem = {
  name: string;
  price: number;
  qty: number;
  emoji?: string;
  variant?: string;
};

type ShippingAddress = {
  firstName?: string;
  lastName?: string;
  address: string;
  city: string;
  postal: string;
  country: string;
};

type Order = {
  order_number: string;
  customer_name: string;
  customer_email: string;
  items: OrderItem[];
  shipping_address: ShippingAddress;
  subtotal: number;
  discount: number;
  shipping_cost: number;
  total: number;
  currency?: string;
};

// Strings traducidos por idioma
const i18n: Record<string, Record<string, string>> = {
  es: {
    subject:       "Tu pedido {order} ha sido confirmado ✓",
    title:         "¡Pedido confirmado!",
    subtitle:      "Gracias por tu compra. Estamos preparando tu pedido.",
    order_label:   "Pedido",
    items_title:   "Resumen de tu pedido",
    shipping_title:"Dirección de envío",
    subtotal:      "Subtotal",
    discount:      "Descuento",
    shipping:      "Envío",
    total:         "Total",
    delivery_note: "Entrega estimada en 7-15 días hábiles.",
    footer:        "¿Alguna duda? Escríbenos a hola@aizua.com",
    qty:           "x",
  },
  en: {
    subject:       "Your order {order} is confirmed ✓",
    title:         "Order Confirmed!",
    subtitle:      "Thanks for your purchase. We're getting your order ready.",
    order_label:   "Order",
    items_title:   "Your order summary",
    shipping_title:"Shipping address",
    subtotal:      "Subtotal",
    discount:      "Discount",
    shipping:      "Shipping",
    total:         "Total",
    delivery_note: "Estimated delivery in 7-15 business days.",
    footer:        "Any questions? Contact us at hola@aizua.com",
    qty:           "x",
  },
  fr: {
    subject:       "Votre commande {order} est confirmée ✓",
    title:         "Commande confirmée !",
    subtitle:      "Merci pour votre achat. Nous préparons votre commande.",
    order_label:   "Commande",
    items_title:   "Récapitulatif de votre commande",
    shipping_title:"Adresse de livraison",
    subtotal:      "Sous-total",
    discount:      "Réduction",
    shipping:      "Livraison",
    total:         "Total",
    delivery_note: "Livraison estimée sous 7-15 jours ouvrés.",
    footer:        "Des questions ? Écrivez-nous à hola@aizua.com",
    qty:           "x",
  },
  it: {
    subject:       "Il tuo ordine {order} è confermato ✓",
    title:         "Ordine confermato!",
    subtitle:      "Grazie per il tuo acquisto. Stiamo preparando il tuo ordine.",
    order_label:   "Ordine",
    items_title:   "Riepilogo del tuo ordine",
    shipping_title:"Indirizzo di spedizione",
    subtotal:      "Subtotale",
    discount:      "Sconto",
    shipping:      "Spedizione",
    total:         "Totale",
    delivery_note: "Consegna stimata in 7-15 giorni lavorativi.",
    footer:        "Domande? Scrivici a hola@aizua.com",
    qty:           "x",
  },
};

// Inferir idioma desde el país de envío
function localeFromCountry(country: string): string {
  const map: Record<string, string> = { ES: "es", FR: "fr", IT: "it" };
  return map[country?.toUpperCase()] ?? "en";
}

export function buildOrderConfirmationEmail(order: Order): { subject: string; html: string } {
  const locale = localeFromCountry(order.shipping_address?.country);
  const t = i18n[locale] ?? i18n.es;
  const currency = order.currency ?? "EUR";
  const fmt = (n: number) => `${currency === "EUR" ? "€" : "$"}${n.toFixed(2)}`;

  const subject = t.subject.replace("{order}", order.order_number);

  const itemRows = order.items.map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #1A1A2E;color:#C0C0D0;font-size:14px;">
        ${item.emoji ? `<span style="margin-right:6px;">${item.emoji}</span>` : ""}${item.name}
        ${item.variant ? `<span style="color:#5A5A72;font-size:12px;"> · ${item.variant}</span>` : ""}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #1A1A2E;color:#5A5A72;font-size:13px;text-align:center;">${t.qty}${item.qty}</td>
      <td style="padding:10px 0;border-bottom:1px solid #1A1A2E;color:#00C9B1;font-size:14px;text-align:right;font-weight:700;">${fmt(item.price * item.qty)}</td>
    </tr>
  `).join("");

  const addr = order.shipping_address;
  const fullName = addr.firstName && addr.lastName
    ? `${addr.firstName} ${addr.lastName}`
    : order.customer_name;

  const html = `<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#07070F;font-family:system-ui,-apple-system,sans-serif;">
<table width="100%" style="padding:40px 20px;"><tr><td align="center">
<table width="560" style="background:#0D0D1A;border-radius:16px;overflow:hidden;max-width:100%;">

  <!-- Header -->
  <tr><td style="padding:24px 36px;text-align:center;border-bottom:1px solid #1A1A2E;">
    <div style="font-size:28px;font-weight:900;color:#00C9B1;letter-spacing:-0.5px;font-family:Arial Black,Arial,sans-serif;">AIZUA</div>
  </td></tr>

  <!-- Hero -->
  <tr><td style="padding:32px 36px 20px;text-align:center;">
    <div style="font-size:48px;margin-bottom:12px;">✅</div>
    <h1 style="color:#F0F0F0;font-size:24px;font-weight:800;margin:0 0 8px;">${t.title}</h1>
    <p style="color:#5A5A72;font-size:14px;margin:0;">${t.subtitle}</p>
  </td></tr>

  <!-- Order number badge -->
  <tr><td style="padding:0 36px 24px;">
    <div style="background:#111120;border-radius:10px;padding:12px 20px;text-align:center;">
      <span style="font-size:11px;font-weight:700;letter-spacing:0.15em;color:#5A5A72;text-transform:uppercase;">${t.order_label} </span>
      <span style="font-size:16px;font-weight:800;color:#00C9B1;font-family:monospace;">${order.order_number}</span>
    </div>
  </td></tr>

  <!-- Items -->
  <tr><td style="padding:0 36px 24px;">
    <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;color:#5A5A72;text-transform:uppercase;margin-bottom:12px;">${t.items_title}</div>
    <table width="100%" style="border-collapse:collapse;">
      ${itemRows}
    </table>

    <!-- Totals -->
    <table width="100%" style="margin-top:16px;border-collapse:collapse;">
      ${order.discount > 0 ? `
      <tr>
        <td style="padding:4px 0;color:#5A5A72;font-size:13px;">${t.subtotal}</td>
        <td style="padding:4px 0;color:#5A5A72;font-size:13px;text-align:right;">${fmt(order.subtotal)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#5A5A72;font-size:13px;">${t.discount}</td>
        <td style="padding:4px 0;color:#5A5A72;font-size:13px;text-align:right;">-${fmt(order.discount)}</td>
      </tr>` : ""}
      <tr>
        <td style="padding:4px 0;color:#5A5A72;font-size:13px;">${t.shipping}</td>
        <td style="padding:4px 0;color:#5A5A72;font-size:13px;text-align:right;">${order.shipping_cost > 0 ? fmt(order.shipping_cost) : "—"}</td>
      </tr>
      <tr>
        <td style="padding:10px 0 4px;color:#F0F0F0;font-size:15px;font-weight:700;border-top:1px solid #1A1A2E;">${t.total}</td>
        <td style="padding:10px 0 4px;color:#00C9B1;font-size:18px;font-weight:800;text-align:right;border-top:1px solid #1A1A2E;">${fmt(order.total)}</td>
      </tr>
    </table>
  </td></tr>

  <!-- Shipping address -->
  <tr><td style="padding:0 36px 24px;">
    <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;color:#5A5A72;text-transform:uppercase;margin-bottom:10px;">${t.shipping_title}</div>
    <div style="background:#111120;border-radius:10px;padding:14px 18px;color:#C0C0D0;font-size:13px;line-height:1.6;">
      <strong>${fullName}</strong><br>
      ${addr.address}<br>
      ${addr.city}, ${addr.postal}<br>
      ${addr.country}
    </div>
  </td></tr>

  <!-- Delivery note -->
  <tr><td style="padding:0 36px 32px;text-align:center;">
    <p style="color:#5A5A72;font-size:13px;margin:0;">${t.delivery_note}</p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:20px 36px;border-top:1px solid #1A1A2E;text-align:center;">
    <p style="color:#3A3A52;font-size:11px;margin:0;">${t.footer}</p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;

  return { subject, html };
}
