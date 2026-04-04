# 🌊 AIZUA — Integración AliExpress API Directa (GRATUITA)

> Sin DSers, sin mensualidades. API oficial de AliExpress para dropshipping.

---

## 📦 Archivos incluidos

```
aizua-aliexpress/
├── app/api/
│   ├── ali-oauth/route.ts      ← OAuth: autorizar app (una sola vez)
│   ├── ali-import/route.ts     ← Importar producto por URL
│   ├── ali-sync/route.ts       ← Sync automático precios y stock
│   ├── ali-fulfill/route.ts    ← Fulfillment directo (Stripe webhook → AliExpress)
│   └── ali-tracking/route.ts  ← Polling de tracking cada 12h (GET/POST, Vercel Cron)
├── lib/aliexpress/
│   ├── client.ts               ← Cliente API con firma HMAC-MD5
│   └── oauth.ts                ← Gestión de tokens OAuth
├── supabase-aliexpress.sql     ← Schema: products, orders, ali_tokens, sync_logs, reviews
├── supabase-suppliers.sql      ← Schema: tabla suppliers + vista margins + alertas (v2.1)
└── supabase-daily-spend.sql    ← Schema: daily_spend + RPC increment_daily_spend
```

---

## 🚀 Registro y Setup (una sola vez)

### Paso 1 — Crear cuenta de desarrollador (GRATIS)

```
1. Ir a: https://developers.aliexpress.com
2. Crear cuenta (puede ser con tu cuenta de AliExpress normal)
3. Dashboard → Create App
4. Nombre: "Aizua Store"
5. Categoría: "Dropshipping" o "Cross-border E-commerce"
6. Descripción: "Personal dropshipping store for EU/LATAM market"
7. Redirect URI: https://aizua.com/api/ali-oauth
   (o http://localhost:3000/api/ali-oauth para desarrollo)
8. Submit para revisión
⏱️ Aprobación: 3-7 días hábiles
```

### Paso 2 — Obtener credenciales

```
Una vez aprobada la app:
Dashboard → My Apps → Tu app → App Details
→ Copiar: APP KEY y APP SECRET
```

### Paso 3 — Variables de entorno

```env
# Añadir a .env.local:
ALI_APP_KEY=tu_app_key_aquí
ALI_APP_SECRET=tu_app_secret_aquí
SYNC_SECRET_TOKEN=genera_string_aleatorio_seguro_aquí
# ALI_ACCESS_TOKEN se gestiona automáticamente via OAuth
```

### Paso 4 — Ejecutar schemas en Supabase (en orden)

```sql
-- Supabase Dashboard → SQL Editor → ejecutar en este orden:
-- 1. aizua-checkout/supabase-schema.sql          (orders, products, base)
-- 2. aizua-aliexpress/supabase-aliexpress.sql    (ali_tokens, sync_logs, reviews)
-- 3. aizua-aliexpress/supabase-suppliers.sql     (suppliers, vistas, funciones)
-- 4. aizua-aliexpress/supabase-daily-spend.sql   (daily_spend + RPC)
-- 5. aizua-aliexpress/supabase-populate-aliexpress-ids.sql  (datos iniciales)
```

### Paso 5 — Autorizar la app (OAuth, una sola vez)

```
Con el servidor corriendo:
→ Visitar: http://localhost:3000/api/ali-oauth
→ Serás redirigido a AliExpress
→ Iniciar sesión y autorizar
→ Tokens guardados automáticamente en Supabase ✅
```

---

## 🔄 Flujos automatizados

### Importar producto

```
Admin pega URL → POST /api/ali-import
    ├── AliExpress API: obtiene título, imágenes, precio, SKUs, rating
    ├── Calcula precio de venta con markup (×3.5 default)
    ├── Redondeo psicológico: €39.99, €89.99
    ├── Guarda en Supabase (products table)
    ├── n8n async → Claude API traduce a ES/FR/DE/PT/IT
    └── n8n async → Sube imágenes a Cloudinary CDN
```

### Fulfillment automático (tras pago Stripe)

```
Stripe webhook → /api/webhook → POST /api/ali-fulfill (fire & forget)
    ├── Verifica límite diario gasto (daily_spend table)
    ├── Obtiene pedido de Supabase
    ├── Mapea productos → ali_product_id + sku_id (tabla suppliers)
    ├── Envía dirección de envío del cliente a AliExpress
    ├── AliExpress crea el pedido con el proveedor
    ├── Guarda ali_order_id en Supabase
    ├── Incrementa daily_spend (RPC atómico)
    └── Email confirmación al cliente (Resend multiidioma)
```

> ⚠️ **Sin n8n** desde v2.1. El fulfillment es nativo Next.js, sin dependencias externas.
> Límite diario configurable: `MAX_DAILY_SPEND_EUR` (default 300€).

### Tracking automático (Vercel Cron cada 12h)

```
Vercel Cron (GET /api/ali-tracking, schedule: 0 */12 * * *)
    ├── Lee todos los pedidos en "processing" o "shipped"
    ├── Consulta estado en AliExpress por ali_order_id
    ├── Si ENVIADO:
    │       ├── Obtiene tracking_number
    │       ├── Actualiza Supabase → "shipped"
    │       └── Email "¡En camino!" a cliente (Resend)
    └── Si ENTREGADO:
            ├── Actualiza Supabase → "delivered"
            └── (futura) solicitud de review (3 días después)
```

### Sync precios (Agente de Precio — semanal)

```
Cron semanal → POST /api/ali-sync
    ├── Lee productos activos con ali_product_id
    ├── Consulta precio y stock actualizado en AliExpress
    ├── Si cambió precio > 5% → alerta en Risk Log + Telegram
    ├── Si margen < 15% → suppliers_low_margin() → sourcing alternativo
    └── Registra log en sync_logs table
```

---

## 💰 Reglas de markup por categoría

| Categoría | Multiplicador | Ali €10 → Aizua |
|-----------|:---:|:---:|
| Audio | ×4.0 | **€39.99** |
| Wearables | ×4.2 | **€41.99** |
| Charging | ×4.5 | **€44.99** |
| Camera | ×3.8 | **€37.99** |
| Conectividad | ×4.0 | **€39.99** |
| Iluminación | ×4.5 | **€44.99** |
| General | ×3.5 | **€34.99** |

Para cambiar las reglas: editar `MARKUP` en `ali-import/route.ts`.

---

## ⚠️ Diferencia importante vs DSers

Con DSers, el pago a los proveedores de AliExpress es automático.
Con la API directa, tienes dos opciones:

**Opción A — Saldo en cuenta AliExpress (recomendado)**
Mantén saldo en tu cuenta → los pedidos se pagan automáticamente.
Recarga con tarjeta cuando el saldo baje de cierto umbral.

**Opción B — Revisar y pagar manualmente**
Para volúmenes bajos (< 20 pedidos/mes), puedes revisar cada pedido
en AliExpress.com y pagar con un clic. 5-10 min al día.

---

## 🧪 Testing

```bash
# 1. Probar importación (necesita credenciales reales o mock)
curl -X POST http://localhost:3000/api/ali-import \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.aliexpress.com/item/1234567890.html"}'

# 2. Probar sync manual
curl -X POST http://localhost:3000/api/ali-sync \
  -H "Authorization: Bearer tu_SYNC_SECRET_TOKEN"

# 3. Probar tracking manual
curl -X POST http://localhost:3000/api/ali-tracking \
  -H "Authorization: Bearer tu_SYNC_SECRET_TOKEN"
```

---

## 🔗 Endpoints y activación

| Endpoint | Disparador | Frecuencia |
|---|---|---|
| `/api/ali-sync` | Cron / manual | Semanal (Agente Precio) |
| `/api/ali-tracking` | Vercel Cron (`0 */12 * * *`) | Cada 12h |
| `/api/ali-fulfill` | Stripe webhook (`payment_intent.succeeded`) | Tiempo real |

## 🔒 Variables de entorno necesarias

```env
ALI_APP_KEY=            # developers.aliexpress.com
ALI_APP_SECRET=         # developers.aliexpress.com
ALI_ACCESS_TOKEN=       # gestionado via OAuth (tabla ali_tokens)
SYNC_SECRET_TOKEN=      # token aleatorio para endpoints internos
CRON_SECRET=            # Vercel Cron auth
MAX_DAILY_SPEND_EUR=300 # límite de gasto diario automático
RESEND_API_KEY=         # emails transaccionales
RESEND_FROM_EMAIL=      # noreply@aizua.es
TELEGRAM_BOT_TOKEN=     # alertas operativas
TELEGRAM_CHAT_ID=       # tu chat ID de Telegram
```

---

*Aizua AliExpress Direct v2.1 — Miguel Sáez — Marzo 2026*
