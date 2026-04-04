# 🌊 AIZUA — Checkout Stripe — Guía de Integración

## Archivos incluidos

```
aizua-checkout/
├── app/api/
│   ├── create-payment-intent/route.ts   ← Crea PaymentIntent en Stripe
│   ├── webhook/route.ts                 ← Recibe eventos de Stripe
│   └── create-order/route.ts            ← Guarda pedido en Supabase
├── lib/
│   ├── stripe.ts                        ← Cliente Stripe + tipos + apariencia
│   └── emails/order-confirmation.tsx    ← Email HTML de confirmación (Resend)
├── supabase-schema.sql                  ← Schema completo de base de datos
└── .env.example                         ← Todas las variables de entorno
```

---

## 🚀 Setup en 5 pasos

### 1. Instalar dependencias
```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js @supabase/supabase-js resend
```

### 2. Copiar archivos al proyecto Next.js
Pega cada archivo en la ruta indicada dentro de tu proyecto Next.js de Aizua.

### 3. Configurar variables de entorno
```bash
cp .env.example .env.local
# Edita .env.local con tus claves reales
```

### 4. Crear tablas en Supabase
```
Supabase Dashboard → SQL Editor → New Query
→ Pega el contenido de supabase-schema.sql → Run
```

### 5. Registrar el webhook en Stripe
```
Stripe Dashboard → Developers → Webhooks → Add endpoint
URL: https://aizua.vercel.app/api/webhook
Events: payment_intent.succeeded, payment_intent.payment_failed, charge.dispute.created
→ Copia el Signing Secret → pega en STRIPE_WEBHOOK_SECRET
```

---

## 🧪 Testing local

```bash
# 1. Iniciar Next.js
npm run dev

# 2. En otra terminal — Stripe CLI para webhooks locales
stripe listen --forward-to localhost:3000/api/webhook

# 3. Simular pago exitoso
stripe trigger payment_intent.succeeded
```

### Tarjetas de prueba Stripe
| Número | Resultado |
|--------|-----------|
| 4242 4242 4242 4242 | ✅ Pago exitoso |
| 4000 0025 0000 3155 | 🔐 Requiere 3D Secure |
| 4000 0000 0000 9995 | ❌ Tarjeta rechazada |

Fecha: cualquier fecha futura · CVC: cualquier 3 dígitos

---

## 💳 Flujo completo

```
Usuario hace clic en "Pagar"
    │
    ▼
POST /api/create-payment-intent
    │  Calcula precio en servidor (seguro)
    │  Crea PaymentIntent en Stripe
    │  Devuelve clientSecret
    │
    ▼
Stripe Elements recoge datos de tarjeta
    │  stripe.confirmPayment({ clientSecret })
    │  Stripe procesa el pago directamente
    │
    ▼  (pago exitoso)
POST /api/create-order
    │  Guarda pedido en Supabase con status "pending"
    │  Devuelve orderNumber
    │
    ▼
Stripe envía webhook → POST /api/webhook
    │  Verifica firma cryptográfica
    │  Actualiza status a "paid" en Supabase
    │  Dispara n8n → DSers fulfillment
    │  Dispara n8n → Email de confirmación (Resend)
    │
    ▼
Usuario ve pantalla de éxito con orderNumber
```

---

## 🔒 Seguridad implementada

- ✅ Precio calculado **siempre en servidor** (nunca confiar en cliente)
- ✅ Firma cryptográfica Stripe en cada webhook
- ✅ Service Role Key solo en API Routes (nunca en cliente)
- ✅ ANON Key pública solo para operaciones permitidas por RLS
- ✅ Stripe PCI-DSS nivel 1 (datos de tarjeta nunca tocan tu servidor)
- ✅ 3D Secure automático con `automatic_payment_methods`

---

## 🌍 IVA automático con Stripe Tax

Cuando estés listo para activar el cálculo automático de IVA:

1. Activar Stripe Tax en Dashboard → Tax
2. Registrar tu número de IVA español
3. Descomentar en `create-payment-intent/route.ts`:
```typescript
automatic_tax: { enabled: true },
```

Stripe calculará automáticamente el IVA correcto para cada país de la UE. 

---

*Aizua Checkout v1.0 — Miguel Sáez — Junio 2025*
