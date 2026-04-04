-- ============================================================
-- AIZUA STORE — TODAS LAS MIGRACIONES PENDIENTES
-- Consolidado: 20 marzo 2026
--
-- INSTRUCCIONES:
--   1. Ir a https://supabase.com/dashboard/project/nxcnykpsooolxruwmifu/sql/new
--   2. Copiar TODO este archivo
--   3. Pegarlo en el SQL Editor
--   4. Pulsar "Run" (Ctrl+Enter)
--   5. Si hay errores de "already exists", es normal — ignorarlos
--
-- Este archivo ejecuta EN ORDEN:
--   1. supabase-aliexpress.sql (campos ali en products + orders)
--   2. supabase-daily-spend.sql (tabla daily_spend)
--   3. supabase-price-history.sql (price_history en suppliers)
--   4. supabase-content.sql (content_outputs + blog_posts)
--   5. supabase-product-candidates.sql (product_candidates)
--   6. supabase-oss-monitor.sql (b2c_sales_by_country)
--   7. supabase-orders-extend.sql (locale, source, market, entity)
--   8. supabase-finance.sql (transactions — AizuaFinance)
-- ============================================================

-- ████████████████████████████████████████████████████████████
-- 1. ALIEXPRESS — Campos en products + orders + tablas auxiliares
-- ████████████████████████████████████████████████████████████

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS ali_product_id  TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS ali_price       DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS margin_pct      INTEGER,
  ADD COLUMN IF NOT EXISTS shipping_days   INTEGER DEFAULT 15,
  ADD COLUMN IF NOT EXISTS sku_list        JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS store_id        TEXT,
  ADD COLUMN IF NOT EXISTS store_name      TEXT;

CREATE INDEX IF NOT EXISTS idx_products_ali_id ON products(ali_product_id);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS ali_order_id  TEXT,
  ADD COLUMN IF NOT EXISTS ali_status    TEXT,
  ADD COLUMN IF NOT EXISTS delivered_at  TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_ali_id ON orders(ali_order_id);

CREATE TABLE IF NOT EXISTS ali_tokens (
  id            TEXT PRIMARY KEY DEFAULT 'main',
  access_token  TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE ali_tokens ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Service role only" ON ali_tokens FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS sync_logs (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type      TEXT NOT NULL,
  synced    INTEGER DEFAULT 0,
  updated   INTEGER DEFAULT 0,
  alerts    INTEGER DEFAULT 0,
  errors    INTEGER DEFAULT 0,
  ran_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sync_logs_ran_at ON sync_logs(ran_at DESC);

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
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Anyone can read reviews" ON product_reviews FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Service role insert reviews" ON product_reviews FOR INSERT TO service_role WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ████████████████████████████████████████████████████████████
-- 2. DAILY SPEND — Límite gasto diario AliExpress
-- ████████████████████████████████████████████████████████████

CREATE TABLE IF NOT EXISTS daily_spend (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_eur   DECIMAL(10,2) NOT NULL DEFAULT 0,
  order_count  INTEGER NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_spend_date ON daily_spend(date);
ALTER TABLE daily_spend ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Service role only" ON daily_spend FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION increment_daily_spend(amount DECIMAL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO daily_spend (date, amount_eur, order_count, updated_at)
  VALUES (CURRENT_DATE, amount, 1, NOW())
  ON CONFLICT (date) DO UPDATE
    SET amount_eur  = daily_spend.amount_eur + EXCLUDED.amount_eur,
        order_count = daily_spend.order_count + 1,
        updated_at  = NOW();
END;
$$;


-- ████████████████████████████████████████████████████████████
-- 3. PRICE HISTORY — Historial de precios en suppliers
-- ████████████████████████████████████████████████████████████

ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS price_history  JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS min_pvp        DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS max_pvp        DECIMAL(10,2);

ALTER TABLE sync_logs
  ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';

CREATE OR REPLACE FUNCTION append_price_history(
  supplier_id  UUID,
  old_cost     DECIMAL,
  new_cost     DECIMAL
)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  change_pct DECIMAL;
  new_entry  JSONB;
  history    JSONB;
BEGIN
  change_pct := CASE WHEN old_cost > 0 THEN ROUND(((new_cost - old_cost) / old_cost) * 100, 2) ELSE 0 END;
  new_entry := jsonb_build_object(
    'date',       to_char(NOW(), 'YYYY-MM-DD'),
    'old_cost',   old_cost,
    'new_cost',   new_cost,
    'change_pct', change_pct
  );
  SELECT COALESCE(price_history, '[]'::jsonb) INTO history
  FROM suppliers WHERE id = supplier_id;
  history := (
    SELECT jsonb_agg(e) FROM (
      SELECT e FROM jsonb_array_elements(history) e LIMIT 49
    ) sub
  ) || jsonb_build_array(new_entry);
  UPDATE suppliers SET price_history = history WHERE id = supplier_id;
END;
$$;


-- ████████████████████████████████████████████████████████████
-- 4. CONTENT — content_outputs + blog_posts
-- ████████████████████████████████████████████████████████████

-- Asegurar que existe la función update_updated_at (usada por triggers)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS content_outputs (
  id           UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id   UUID    REFERENCES products(id) ON DELETE SET NULL,
  product_slug TEXT,
  content_type TEXT    NOT NULL,
  content      JSONB   NOT NULL,
  model        TEXT    DEFAULT 'claude-sonnet-4-5',
  prompt_hash  TEXT,
  tokens_used  INTEGER,
  status       TEXT    NOT NULL DEFAULT 'draft',
  channel      TEXT,
  published_at TIMESTAMPTZ,
  notes        TEXT,
  views        INTEGER DEFAULT 0,
  likes        INTEGER DEFAULT 0,
  saves        INTEGER DEFAULT 0,
  clicks       INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_product    ON content_outputs(product_id);
CREATE INDEX IF NOT EXISTS idx_content_type       ON content_outputs(content_type);
CREATE INDEX IF NOT EXISTS idx_content_status     ON content_outputs(status);
CREATE INDEX IF NOT EXISTS idx_content_created    ON content_outputs(created_at DESC);

DROP TRIGGER IF EXISTS content_updated_at ON content_outputs;
CREATE TRIGGER content_updated_at
  BEFORE UPDATE ON content_outputs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE content_outputs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Service role full access" ON content_outputs FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- blog_posts ya puede existir (creada por supabase-seo-content.sql)
CREATE TABLE IF NOT EXISTS blog_posts (
  id          UUID  DEFAULT gen_random_uuid() PRIMARY KEY,
  slug        TEXT  UNIQUE NOT NULL,
  title       JSONB NOT NULL,
  content     JSONB NOT NULL,
  keyword     TEXT,
  excerpt     JSONB,
  status      TEXT  DEFAULT 'draft',
  product_id  UUID  REFERENCES products(id) ON DELETE SET NULL,
  views       INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_status  ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_keyword ON blog_posts(keyword);

DROP TRIGGER IF EXISTS blog_updated_at ON blog_posts;
CREATE TRIGGER blog_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public read published" ON blog_posts FOR SELECT USING (status = 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Service role full access" ON blog_posts FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE VIEW content_pending_review AS
SELECT
  co.id, co.content_type, co.product_slug, co.status, co.channel, co.created_at,
  COALESCE(co.content->>'es', co.content->>'en', '') AS preview_es
FROM content_outputs co
WHERE co.status = 'draft'
ORDER BY co.created_at DESC;

CREATE OR REPLACE FUNCTION content_agent_stats()
RETURNS TABLE (content_type TEXT, total BIGINT, drafts BIGINT, approved BIGINT, published BIGINT)
LANGUAGE sql STABLE AS $$
  SELECT content_type, COUNT(*) AS total,
    COUNT(*) FILTER (WHERE status = 'draft') AS drafts,
    COUNT(*) FILTER (WHERE status = 'approved') AS approved,
    COUNT(*) FILTER (WHERE status = 'published') AS published
  FROM content_outputs GROUP BY content_type ORDER BY total DESC;
$$;


-- ████████████████████████████████████████████████████████████
-- 5. PRODUCT CANDIDATES — Pipeline productos ganadores
-- ████████████████████████████████████████████████████████████

CREATE TABLE IF NOT EXISTS product_candidates (
  id              UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  name            TEXT    NOT NULL,
  aliexpress_url  TEXT,
  aliexpress_id   TEXT,
  tiktok_url      TEXT,
  amazon_asin     TEXT,
  estimated_cost  DECIMAL(10,2),
  estimated_pvp   DECIMAL(10,2),
  estimated_margin_pct DECIMAL(5,2),
  shipping_days   INTEGER,
  has_invoice     BOOLEAN DEFAULT FALSE,
  has_invoice_note TEXT,
  tiktok_views    BIGINT,
  amazon_bsr      INTEGER,
  search_volume   INTEGER,
  competition     TEXT CHECK (competition IN ('low','medium','high')),
  score           INTEGER CHECK (score BETWEEN 0 AND 100),
  score_breakdown JSONB DEFAULT '{}',
  summary         TEXT,
  risks           TEXT,
  suggested_angle TEXT,
  target_markets  TEXT[] DEFAULT '{ES,FR,IT,IE}',
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','sourcing','live')),
  notes           TEXT,
  promoted_to     UUID REFERENCES products(id) ON DELETE SET NULL,
  source          TEXT,
  found_at        TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidates_status  ON product_candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_score   ON product_candidates(score DESC);
CREATE INDEX IF NOT EXISTS idx_candidates_created ON product_candidates(created_at DESC);

DROP TRIGGER IF EXISTS candidates_updated_at ON product_candidates;
CREATE TRIGGER candidates_updated_at
  BEFORE UPDATE ON product_candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE product_candidates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Service role full access" ON product_candidates FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE VIEW top_product_candidates AS
SELECT id, name, score, estimated_margin_pct, estimated_pvp, estimated_cost,
  shipping_days, has_invoice, competition, tiktok_views, summary, suggested_angle, source, found_at
FROM product_candidates WHERE status = 'pending' ORDER BY score DESC, found_at DESC;

CREATE OR REPLACE FUNCTION product_finder_stats()
RETURNS TABLE (status TEXT, total BIGINT, avg_score NUMERIC, avg_margin NUMERIC)
LANGUAGE sql STABLE AS $$
  SELECT status, COUNT(*) AS total, ROUND(AVG(score), 1) AS avg_score,
    ROUND(AVG(estimated_margin_pct), 1) AS avg_margin
  FROM product_candidates GROUP BY status ORDER BY total DESC;
$$;


-- ████████████████████████████████████████████████████████████
-- 6. OSS MONITOR — b2c_sales_by_country
-- ████████████████████████████████████████████████████████████

CREATE TABLE IF NOT EXISTS b2c_sales_by_country (
  id           UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  year         INTEGER NOT NULL,
  country      TEXT    NOT NULL,
  total_sales  DECIMAL(12,2) NOT NULL DEFAULT 0,
  order_count  INTEGER NOT NULL DEFAULT 0,
  threshold    DECIMAL(12,2) NOT NULL DEFAULT 10000.00,
  alert_pct    INTEGER NOT NULL DEFAULT 80,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (year, country)
);

CREATE INDEX IF NOT EXISTS idx_oss_year_country ON b2c_sales_by_country(year, country);

ALTER TABLE b2c_sales_by_country ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Service role full access" ON b2c_sales_by_country FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION refresh_b2c_sales_by_country()
RETURNS TABLE (country TEXT, year INTEGER, total_sales DECIMAL, order_count BIGINT, pct_of_threshold NUMERIC)
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO b2c_sales_by_country (year, country, total_sales, order_count, last_updated)
  SELECT
    EXTRACT(YEAR FROM paid_at)::INTEGER AS year,
    UPPER(shipping_address->>'country') AS country,
    COALESCE(SUM(total), 0) AS total_sales,
    COUNT(*) AS order_count,
    NOW() AS last_updated
  FROM orders
  WHERE status IN ('paid', 'processing', 'shipped', 'delivered')
    AND paid_at IS NOT NULL
    AND UPPER(shipping_address->>'country') != 'ES'
    AND UPPER(shipping_address->>'country') IS NOT NULL
  GROUP BY 1, 2
  ON CONFLICT (year, country) DO UPDATE
    SET total_sales = EXCLUDED.total_sales, order_count = EXCLUDED.order_count, last_updated = NOW();
  RETURN QUERY
  SELECT b.country, b.year, b.total_sales, b.order_count::BIGINT,
    ROUND((b.total_sales / b.threshold * 100), 1) AS pct_of_threshold
  FROM b2c_sales_by_country b
  WHERE b.year = EXTRACT(YEAR FROM NOW())::INTEGER
  ORDER BY b.total_sales DESC;
END;
$$;

CREATE OR REPLACE FUNCTION check_oss_threshold_alerts()
RETURNS TABLE (country TEXT, year INTEGER, total_sales DECIMAL, threshold DECIMAL, alert_pct INTEGER, pct_reached NUMERIC, alert_triggered BOOLEAN)
LANGUAGE sql STABLE AS $$
  SELECT country, year, total_sales, threshold, alert_pct,
    ROUND(total_sales / threshold * 100, 1) AS pct_reached,
    (total_sales >= threshold * alert_pct / 100.0) AS alert_triggered
  FROM b2c_sales_by_country
  WHERE year = EXTRACT(YEAR FROM NOW())::INTEGER
  ORDER BY total_sales DESC;
$$;

CREATE OR REPLACE VIEW oss_status_current AS
SELECT country, year, total_sales, threshold, alert_pct,
  ROUND(total_sales / threshold * 100, 1) AS pct_reached, order_count, last_updated,
  CASE
    WHEN total_sales >= threshold THEN 'OBLIGATORIO — Registrar OSS'
    WHEN total_sales >= threshold * alert_pct / 100.0 THEN 'ALERTA — Supera 80% umbral'
    ELSE 'OK'
  END AS estado,
  ROUND(threshold - total_sales, 2) AS margen_restante
FROM b2c_sales_by_country
WHERE year = EXTRACT(YEAR FROM NOW())::INTEGER
ORDER BY total_sales DESC;

CREATE OR REPLACE VIEW oss_history AS
SELECT year, SUM(total_sales) AS total_eu_b2c, 10000.00 AS threshold_global,
  ROUND(SUM(total_sales) / 10000 * 100, 1) AS pct_global,
  COUNT(DISTINCT country) AS paises_activos,
  STRING_AGG(country || ':€' || total_sales::INTEGER, ' | ' ORDER BY total_sales DESC) AS detalle
FROM b2c_sales_by_country GROUP BY year ORDER BY year DESC;


-- ████████████████████████████████████████████████████████████
-- 7. ORDERS EXTEND — locale, source, market, entity
-- ████████████████████████████████████████████████████████████

ALTER TABLE orders ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'es';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'tienda';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS market TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS entity TEXT DEFAULT 'autonomo';

CREATE OR REPLACE FUNCTION sync_order_market()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.shipping_address IS NOT NULL THEN
    NEW.market := UPPER(NEW.shipping_address->>'country');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_sync_market ON orders;
CREATE TRIGGER orders_sync_market
  BEFORE INSERT OR UPDATE OF shipping_address ON orders
  FOR EACH ROW EXECUTE FUNCTION sync_order_market();

CREATE INDEX IF NOT EXISTS idx_orders_locale  ON orders(locale);
CREATE INDEX IF NOT EXISTS idx_orders_market  ON orders(market);
CREATE INDEX IF NOT EXISTS idx_orders_source  ON orders(source);

-- Poblar market en pedidos existentes
UPDATE orders
SET market = UPPER(shipping_address->>'country')
WHERE market IS NULL
  AND shipping_address IS NOT NULL
  AND shipping_address->>'country' IS NOT NULL;


-- ████████████████████████████████████████████████████████████
-- 8. TRANSACTIONS — AizuaFinance (Mod. 303 / 130)
-- ████████████████████████████████████████████████████████████

CREATE TABLE IF NOT EXISTS transactions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source          TEXT NOT NULL DEFAULT 'stripe_tienda',
  tipo            TEXT NOT NULL DEFAULT 'ingreso',
  regimen         TEXT,
  importe_eur     DECIMAL(10,2) NOT NULL,
  importe_orig    DECIMAL(10,2),
  moneda_orig     TEXT DEFAULT 'EUR',
  iva_tipo        INTEGER DEFAULT 21,
  iva_importe     DECIMAL(10,2),
  base_imponible  DECIMAL(10,2),
  order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
  stripe_pi_id    TEXT,
  stripe_charge_id TEXT,
  sku_list        JSONB DEFAULT '[]',
  customer_email  TEXT,
  customer_country TEXT,
  market          TEXT,
  descripcion     TEXT,
  notas           TEXT,
  año_fiscal      INTEGER,
  trimestre       INTEGER,
  estado          TEXT NOT NULL DEFAULT 'confirmado',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tx_source        ON transactions(source);
CREATE INDEX IF NOT EXISTS idx_tx_tipo          ON transactions(tipo);
CREATE INDEX IF NOT EXISTS idx_tx_created       ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tx_year_quarter  ON transactions(año_fiscal, trimestre);
CREATE INDEX IF NOT EXISTS idx_tx_stripe_pi     ON transactions(stripe_pi_id);
CREATE INDEX IF NOT EXISTS idx_tx_order         ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_tx_country       ON transactions(customer_country);
CREATE INDEX IF NOT EXISTS idx_tx_estado        ON transactions(estado);

DROP TRIGGER IF EXISTS tx_updated_at ON transactions;
CREATE TRIGGER tx_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Service role only" ON transactions FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION calculate_iva()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.tipo = 'ingreso' AND NEW.iva_tipo > 0 AND NEW.importe_eur IS NOT NULL THEN
    NEW.iva_importe    := ROUND(NEW.importe_eur * NEW.iva_tipo / (100 + NEW.iva_tipo), 2);
    NEW.base_imponible := NEW.importe_eur - NEW.iva_importe;
  ELSIF NEW.tipo = 'ingreso' AND (NEW.iva_tipo = 0 OR NEW.iva_tipo IS NULL) THEN
    NEW.iva_importe    := 0;
    NEW.base_imponible := NEW.importe_eur;
  END IF;
  IF NEW.created_at IS NOT NULL THEN
    NEW.año_fiscal  := EXTRACT(YEAR FROM NEW.created_at)::INTEGER;
    NEW.trimestre   := CEIL(EXTRACT(MONTH FROM NEW.created_at) / 3.0)::INTEGER;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tx_calculate_iva ON transactions;
CREATE TRIGGER tx_calculate_iva
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION calculate_iva();

CREATE OR REPLACE VIEW finance_trimestral AS
SELECT año_fiscal, trimestre, source, regimen,
  COUNT(*) AS num_transacciones,
  SUM(CASE WHEN tipo = 'ingreso' AND estado != 'reembolsado' THEN base_imponible ELSE 0 END) AS base_imponible_total,
  SUM(CASE WHEN tipo = 'ingreso' AND estado != 'reembolsado' THEN iva_importe ELSE 0 END) AS iva_repercutido,
  SUM(CASE WHEN tipo = 'gasto' AND estado != 'reembolsado' THEN importe_eur ELSE 0 END) AS gastos_total,
  SUM(CASE WHEN tipo = 'ingreso' AND estado != 'reembolsado' THEN importe_eur ELSE 0 END) AS ingresos_total,
  SUM(CASE WHEN estado = 'reembolsado' THEN importe_eur ELSE 0 END) AS reembolsos_total
FROM transactions WHERE año_fiscal IS NOT NULL
GROUP BY año_fiscal, trimestre, source, regimen
ORDER BY año_fiscal DESC, trimestre DESC;

CREATE OR REPLACE VIEW finance_por_pais AS
SELECT año_fiscal, customer_country, market,
  COUNT(*) AS num_pedidos, SUM(importe_eur) AS total_eur,
  SUM(base_imponible) AS base_imponible, SUM(iva_importe) AS iva_total,
  MAX(created_at) AS ultimo_pedido
FROM transactions
WHERE tipo = 'ingreso' AND estado NOT IN ('reembolsado', 'disputado') AND año_fiscal IS NOT NULL
GROUP BY año_fiscal, customer_country, market
ORDER BY total_eur DESC;

CREATE OR REPLACE FUNCTION finance_resumen(p_year INTEGER, p_trimestre INTEGER DEFAULT NULL)
RETURNS JSONB LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object(
    'año', p_year, 'trimestre', p_trimestre,
    'ingresos_brutos', COALESCE(SUM(CASE WHEN tipo='ingreso' AND estado!='reembolsado' THEN importe_eur END), 0),
    'base_imponible', COALESCE(SUM(CASE WHEN tipo='ingreso' AND estado!='reembolsado' THEN base_imponible END), 0),
    'iva_repercutido', COALESCE(SUM(CASE WHEN tipo='ingreso' AND estado!='reembolsado' THEN iva_importe END), 0),
    'gastos_deducibles', COALESCE(SUM(CASE WHEN tipo='gasto' THEN importe_eur END), 0),
    'reembolsos', COALESCE(SUM(CASE WHEN estado='reembolsado' THEN importe_eur END), 0),
    'num_pedidos', COUNT(CASE WHEN tipo='ingreso' THEN 1 END),
    'num_reembolsos', COUNT(CASE WHEN estado='reembolsado' THEN 1 END)
  )
  FROM transactions
  WHERE año_fiscal = p_year AND (p_trimestre IS NULL OR trimestre = p_trimestre);
$$;


-- ████████████████████████████████████████████████████████████
-- FIN — Verificación
-- ████████████████████████████████████████████████████████████

-- Listar todas las tablas creadas para verificar:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
