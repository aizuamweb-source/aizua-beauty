-- ============================================================
-- AIZUA — Supabase Schema: Tabla Suppliers
-- Masterplan v2.1 — Fase 2 (Fulfillment automático)
--
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- Dependencias: supabase-schema.sql (tabla products)
-- ============================================================

-- ── TABLA: suppliers ──────────────────────────────────────
-- Mapea cada producto de la tienda a su proveedor en AliExpress.
-- Soporta proveedor principal + alternativo para resiliencia.
-- has_invoice (v2.1): indica si el proveedor emite factura válida
-- para deducción fiscal (IVA deducible en régimen general).

CREATE TABLE IF NOT EXISTS suppliers (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Relación con productos de la tienda
  product_id           UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  slug                 TEXT,                    -- slug del producto (referencia rápida)

  -- Datos AliExpress proveedor principal
  aliexpress_id        TEXT NOT NULL,           -- ID del producto en AliExpress
  variant_id           TEXT,                    -- ID de variante (color/talla)
  sku_attr             TEXT,                    -- atributos SKU ej: "14:200003528#Color:Black"
  store_id             TEXT,                    -- ID tienda AliExpress
  store_name           TEXT,                    -- nombre tienda AliExpress

  -- Costes (actualizados por el Agente de Precio semanalmente)
  cost                 DECIMAL(10,2) NOT NULL,  -- coste unidad en EUR
  shipping_cost        DECIMAL(10,2) DEFAULT 0, -- coste envío estándar
  shipping_days        INTEGER DEFAULT 15,       -- días estimados de entrega
  last_price_check     TIMESTAMPTZ,             -- última vez que se verificó el precio

  -- Proveedor alternativo (si el principal falla o tiene peor precio)
  alt_supplier_id      TEXT,                    -- aliexpress_id del proveedor alternativo
  alt_cost             DECIMAL(10,2),           -- coste del alternativo
  alt_store_id         TEXT,

  -- ── CAMPO v2.1 — Fiscalidad del proveedor ──────────────
  -- Si has_invoice = true: el proveedor emite factura con IVA.
  -- Importante para empresas en régimen general que quieren deducir.
  -- En recargo de equivalencia: no aplica (IVA ya en coste).
  has_invoice          BOOLEAN NOT NULL DEFAULT false,
  invoice_country      TEXT,    -- 'CN' | 'ES' | 'DE' | etc. (ISO 3166-1 alpha-2)
  -- Nota: proveedores CN normalmente no emiten factura deducible en España.
  -- Ringana/proveedores EU pueden emitir factura intracomunitaria.

  -- Métricas de fiabilidad (actualizar tras cada pedido)
  orders_placed        INTEGER DEFAULT 0,       -- pedidos realizados a este proveedor
  orders_ok            INTEGER DEFAULT 0,       -- pedidos completados OK
  avg_delivery_days    DECIMAL(5,1),            -- media real de días de entrega
  rating               DECIMAL(3,2),            -- rating AliExpress del proveedor

  -- Control
  is_active            BOOLEAN NOT NULL DEFAULT true,
  notes                TEXT,                    -- observaciones manuales
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ── ÍNDICES ───────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_product_main
  ON suppliers(product_id)
  WHERE is_active = true;                       -- un proveedor activo por producto

CREATE INDEX IF NOT EXISTS idx_suppliers_aliexpress_id ON suppliers(aliexpress_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_has_invoice    ON suppliers(has_invoice);
CREATE INDEX IF NOT EXISTS idx_suppliers_slug           ON suppliers(slug);

-- ── RLS ───────────────────────────────────────────────────
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Solo el service role puede leer/escribir (datos internos de costes)
CREATE POLICY "Service role full access" ON suppliers
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── TRIGGER updated_at ────────────────────────────────────
CREATE TRIGGER suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();  -- función ya creada en supabase-schema.sql

-- ── VISTA: margen por producto ────────────────────────────
-- Útil para el Agente de Precio y el dashboard de Business System.
CREATE OR REPLACE VIEW supplier_margins AS
SELECT
  s.product_id,
  s.slug,
  s.aliexpress_id,
  s.cost,
  s.shipping_cost,
  s.cost + s.shipping_cost                        AS total_cost,
  p.price                                          AS pvp,
  ROUND(
    ((p.price - (s.cost + s.shipping_cost)) / NULLIF(p.price, 0)) * 100, 1
  )                                                AS margin_pct,
  s.has_invoice,
  s.invoice_country,
  s.rating,
  s.avg_delivery_days,
  s.last_price_check,
  s.is_active
FROM suppliers s
JOIN products  p ON p.id = s.product_id
WHERE s.is_active = true;

-- ── FUNCIÓN: alerta de margen bajo ────────────────────────
-- Devuelve proveedores cuyo margen es inferior al umbral (default 15%).
-- Usada por el Agente de Precio para trigger de sourcing alternativo.
CREATE OR REPLACE FUNCTION suppliers_low_margin(min_margin_pct INTEGER DEFAULT 15)
RETURNS TABLE (
  product_id      UUID,
  slug            TEXT,
  aliexpress_id   TEXT,
  cost            DECIMAL,
  pvp             DECIMAL,
  margin_pct      NUMERIC,
  has_invoice     BOOLEAN,
  invoice_country TEXT
) LANGUAGE sql STABLE AS $$
  SELECT
    product_id, slug, aliexpress_id, cost, pvp, margin_pct, has_invoice, invoice_country
  FROM supplier_margins
  WHERE margin_pct < min_margin_pct
  ORDER BY margin_pct ASC;
$$;

-- ── COMENTARIOS de columna ────────────────────────────────
COMMENT ON COLUMN suppliers.has_invoice IS
  'TRUE si el proveedor puede emitir factura válida para deducción IVA. '
  'Relevante para actividades en régimen general. '
  'Añadido en masterplan v2.1 (20/03/2026).';

COMMENT ON COLUMN suppliers.invoice_country IS
  'País de emisión de la factura (ISO 3166-1 alpha-2). '
  'CN = sin factura deducible en ES. ES/EU = puede ser deducible.';

-- ============================================================
-- RESUMEN
-- Tabla: suppliers
-- Vista: supplier_margins
-- Función: suppliers_low_margin(min_margin_pct)
--
-- Campos clave v2.1:
--   has_invoice     BOOLEAN DEFAULT false
--   invoice_country TEXT (ISO 3166-1 alpha-2)
--
-- Siguiente paso (Miguel): ejecutar en Supabase Dashboard
-- ============================================================
