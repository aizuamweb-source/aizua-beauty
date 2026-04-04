-- ============================================================
-- AIZUA — Supabase Schema: Adiciones para AliExpress Direct
-- Ejecutar DESPUÉS de supabase-schema.sql del checkout
-- ============================================================

-- ── ACTUALIZAR tabla products para AliExpress direct ──
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS ali_product_id  TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS ali_price       DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS margin_pct      INTEGER,
  ADD COLUMN IF NOT EXISTS shipping_days   INTEGER DEFAULT 15,
  ADD COLUMN IF NOT EXISTS sku_list        JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS store_id        TEXT,
  ADD COLUMN IF NOT EXISTS store_name      TEXT;

CREATE INDEX IF NOT EXISTS idx_products_ali_id ON products(ali_product_id);

-- ── ACTUALIZAR tabla orders para AliExpress direct ──
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS ali_order_id  TEXT,
  ADD COLUMN IF NOT EXISTS ali_status    TEXT,
  ADD COLUMN IF NOT EXISTS delivered_at  TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_ali_id ON orders(ali_order_id);

-- ── TABLA: tokens OAuth de AliExpress ──
CREATE TABLE IF NOT EXISTS ali_tokens (
  id            TEXT PRIMARY KEY DEFAULT 'main',
  access_token  TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Solo el service role puede leer tokens
ALTER TABLE ali_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON ali_tokens
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── TABLA: logs de sincronización ──
CREATE TABLE IF NOT EXISTS sync_logs (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type      TEXT NOT NULL,   -- 'aliexpress_sync' | 'tracking_poll'
  synced    INTEGER DEFAULT 0,
  updated   INTEGER DEFAULT 0,
  alerts    INTEGER DEFAULT 0,
  errors    INTEGER DEFAULT 0,
  ran_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_ran_at ON sync_logs(ran_at DESC);

-- ── TABLA: reviews de productos ──
CREATE TABLE IF NOT EXISTS product_reviews (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id    UUID REFERENCES products(id) ON DELETE CASCADE,
  order_id      UUID REFERENCES orders(id),
  customer_name TEXT NOT NULL,
  rating        INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  verified      BOOLEAN DEFAULT true,
  lang          TEXT DEFAULT 'es',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);

-- Clientes pueden leer reviews, solo service role puede insertar (verificadas)
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read reviews" ON product_reviews FOR SELECT USING (true);
CREATE POLICY "Service role insert reviews" ON product_reviews FOR INSERT TO service_role WITH CHECK (true);

-- ============================================================
-- RESUMEN DE VARIABLES DE ENTORNO A AÑADIR:
-- ALI_APP_KEY=       (de developers.aliexpress.com)
-- ALI_APP_SECRET=    (de developers.aliexpress.com)
-- ALI_ACCESS_TOKEN=  (opcional — se gestiona via OAuth en Supabase)
-- SYNC_SECRET_TOKEN= (token aleatorio para proteger endpoints de n8n)
-- ============================================================
