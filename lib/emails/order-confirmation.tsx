// lib/emails/order-confirmation.tsx
// Aizua — Email de confirmación de pedido
// Enviado automáticamente vía Resend tras pago exitoso (disparado por webhook)

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type OrderConfirmationProps = {
  to: string;
  orderNumber: string;
  customerName: string;
  items: Array<{ name: string; qty: number; price: number; emoji: string }>;
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress: {
    address: string;
    city: string;
    postal: string;
    country: string;
  };
  estimatedDelivery: string;
  lang?: string;
};

const translations: Record<string, Record<string, string>> = {
  es: {
    subject: "¡Tu pedido ha sido confirmado! 🌊",
    title: "Pedido confirmado",
    greeting: "¡Gracias por tu compra en Aizua!",
    orderNum: "Número de pedido",
    items: "Productos",
    shipping: "Envío",
    total: "Total",
    deliverTo: "Entrega en",
    estimated: "Entrega estimada",
    tracking: "Te enviaremos el número de seguimiento cuando el pedido sea despachado.",
    questions: "¿Alguna pregunta?",
    contact: "Escríbenos a aizuaweb@gmail.com",
    free: "Gratis",
  },
  en: {
    subject: "Your order has been confirmed! 🌊",
    title: "Order confirmed",
    greeting: "Thank you for your purchase at Aizua!",
    orderNum: "Order number",
    items: "Items",
    shipping: "Shipping",
    total: "Total",
    deliverTo: "Deliver to",
    estimated: "Estimated delivery",
    tracking: "We'll send you the tracking number once your order is dispatched.",
    questions: "Any questions?",
    contact: "Email us at aizuaweb@gmail.com",
    free: "Free",
  },
};

function getHtml(props: OrderConfirmationProps, t: Record<string, string>): string {
  const itemsHtml = props.items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #1A1A2E;color:#F0F0F0;font-size:14px;">
          ${item.emoji} ${item.name}
          ${item.qty > 1 ? `<span style="color:#5A5A72;font-size:12px;"> ×${item.qty}</span>` : ""}
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #1A1A2E;color:#F0F0F0;font-size:14px;text-align:right;font-weight:600;">
          €${(item.price * item.qty).toFixed(2)}
        </td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#07070F;font-family:'DM Sans',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07070F;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- HEADER -->
        <tr><td style="background:#0D0D1A;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;border-bottom:1px solid #1A1A2E;">
          <div style="font-size:32px;font-weight:900;letter-spacing:0.08em;color:#00C9B1;font-family:Arial,sans-serif;">AIZUA</div>
          <div style="font-size:13px;color:#5A5A72;margin-top:4px;">🌊 Premium Gadgets</div>
        </td></tr>

        <!-- SUCCESS BADGE -->
        <tr><td style="background:#0D0D1A;padding:32px 40px 24px;text-align:center;">
          <div style="display:inline-block;width:64px;height:64px;border-radius:50%;background:rgba(77,255,145,0.12);border:2px solid #4DFF91;line-height:64px;font-size:28px;margin-bottom:16px;">✓</div>
          <h1 style="color:#F0F0F0;font-size:28px;margin:0 0 8px;font-weight:700;">${t.title} ✓</h1>
          <p style="color:#5A5A72;font-size:15px;margin:0;">${t.greeting}</p>
        </td></tr>

        <!-- ORDER NUMBER -->
        <tr><td style="background:#0D0D1A;padding:0 40px 24px;">
          <div style="background:#111120;border:1px solid rgba(0,201,177,0.2);border-radius:10px;padding:16px 20px;text-align:center;">
            <div style="font-size:11px;color:#5A5A72;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:4px;">${t.orderNum}</div>
            <div style="font-size:20px;color:#00C9B1;font-weight:700;letter-spacing:0.05em;">${props.orderNumber}</div>
          </div>
        </td></tr>

        <!-- ITEMS -->
        <tr><td style="background:#0D0D1A;padding:0 40px 24px;">
          <div style="font-size:11px;color:#5A5A72;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:12px;">${t.items}</div>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${itemsHtml}
            <tr>
              <td style="padding:12px 0 4px;color:#5A5A72;font-size:13px;">${t.shipping}</td>
              <td style="padding:12px 0 4px;text-align:right;color:${props.shipping === 0 ? "#4DFF91" : "#F0F0F0"};font-size:13px;">${props.shipping === 0 ? t.free : `€${props.shipping.toFixed(2)}`}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#F0F0F0;font-size:16px;font-weight:700;border-top:1px solid #1A1A2E;">${t.total}</td>
              <td style="padding:8px 0;text-align:right;color:#00C9B1;font-size:22px;font-weight:800;border-top:1px solid #1A1A2E;">€${props.total.toFixed(2)}</td>
            </tr>
          </table>
        </td></tr>

        <!-- SHIPPING ADDRESS -->
        <tr><td style="background:#0D0D1A;padding:0 40px 32px;">
          <div style="font-size:11px;color:#5A5A72;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:8px;">${t.deliverTo}</div>
          <div style="background:#111120;border:1px solid #1A1A2E;border-radius:10px;padding:14px 18px;">
            <div style="color:#F0F0F0;font-size:14px;font-weight:600;">${props.customerName}</div>
            <div style="color:#5A5A72;font-size:13px;margin-top:4px;">${props.shippingAddress.address}, ${props.shippingAddress.postal} ${props.shippingAddress.city}, ${props.shippingAddress.country}</div>
          </div>
          <div style="margin-top:12px;font-size:13px;color:#5A5A72;">
            📦 <strong style="color:#F0F0F0;">${t.estimated}:</strong> ${props.estimatedDelivery}
          </div>
          <div style="margin-top:8px;font-size:12px;color:#5A5A72;">${t.tracking}</div>
        </td></tr>

        <!-- FOOTER -->
        <tr><td style="background:#040408;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;border-top:1px solid #1A1A2E;">
          <div style="font-size:13px;color:#5A5A72;">${t.questions} <a href="mailto:aizuaweb@gmail.com" style="color:#00C9B1;">${t.contact}</a></div>
          <div style="margin-top:12px;font-size:11px;color:#3A3A52;">© 2025 Aizua · Miguel Sáez · aizuaweb@gmail.com</div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendOrderConfirmation(props: OrderConfirmationProps) {
  const lang = props.lang || "es";
  const t = translations[lang] || translations.es;

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Aizua <onboarding@resend.dev>",
    to: props.to,
    subject: t.subject,
    html: getHtml(props, t),
  });

  if (error) {
    console.error("[sendOrderConfirmation] Resend error:", error);
    throw error;
  }

  return data;
}
