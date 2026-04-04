-- ============================================================
-- AIZUA — Supabase: extensión tabla orders (multi-mercado)
--
-- Añade campos necesarios para:
--   - Envío de emails en el idioma correcto del cliente
--   - Separación fiscal por entidad (autónomo vs LLC)
--   - Tracking de canal de venta (tienda / tiktok / amazon)
--   - Filtrado por mercado para análisis por país
--
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Prerequisito: supabase-schema.sql ya aplicado
-- ============================================================

-- ── Idioma del cliente (para emails multiidioma) ───────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'es';
  -- 'es' | 'en' | 'fr' | 'it' | 'de' | 'pt'

-- ── Canal de venta ─────────────────────────────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'tienda';
  -- 'tienda' | 'tiktok' | 'amazon' | 'manual'

-- ── Mercado (país del comprador, para OSS y análisis) ──────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS market TEXT;
  -- 'ES' | 'FR' | 'IT' | 'IE' | 'DE' | 'US' ...
  -- Se puebla automáticamente desde shipping_address->>'country'

-- ── Entidad fiscal que gestiona el pedido ─────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS entity TEXT DEFAULT 'autonomo';
  -- 'autonomo' (ventas EU B2C) | 'llc' (ventas USA)

-- ── Actualizar market automáticamente al insertar/actualizar
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

-- ── Índice para filtros por mercado/locale ─────────────────
CREATE INDEX IF NOT EXISTS idx_orders_locale  ON orders(locale);
CREATE INDEX IF NOT EXISTS idx_orders_market  ON orders(market);
CREATE INDEX IF NOT EXISTS idx_orders_source  ON orders(source);

-- ── COMENTARIOS ────────────────────────────────────────────
COMMENT ON COLUMN orders.locale  IS 'Idioma del cliente: es|en|fr|it — para emails multiidioma';
COMMENT ON COLUMN orders.source  IS 'Canal de venta: tienda|tiktok|amazon|manual';
COMMENT ON COLUMN orders.market  IS 'País ISO-2 del comprador — se sync desde shipping_address';
COMMENT ON COLUMN orders.entity  IS 'Entidad fiscal: autonomo (EU) | llc (USA)';

-- ============================================================
-- TAMBIÉN: poblar market en pedidos existentes
-- ============================================================
UPDATE orders
SET market = UPPER(shipping_address->>'country')
WHERE market IS NULL
  AND shipping_address IS NOT NULL
  AND shipping_address->>'country' IS NOT NULL;
