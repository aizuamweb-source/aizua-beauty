-- ============================================================
-- AIZUA — Supabase Schema: transactions (AizuaFinance)
-- Módulo 10 — Webhook Stripe → AizuaFinance
--
-- Tabla central de registro de ingresos y gastos.
-- Cada pago Stripe se registra automáticamente.
-- Base para Mod. 303, Mod. 130, y declaraciones LLC.
--
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS transactions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Origen del movimiento
  source          TEXT NOT NULL DEFAULT 'stripe_tienda',
  -- Valores: 'stripe_tienda' | 'stripe_academy' | 'stripe_consulting'
  --          'aliexpress_gasto' | 'manual'

  -- Tipo para clasificación fiscal (España)
  tipo            TEXT NOT NULL DEFAULT 'ingreso',
  -- Valores: 'ingreso' | 'gasto'

  -- Régimen fiscal (España autónomo)
  regimen         TEXT,
  -- Valores: 'RG' (Régimen General — tienda/consulting)
  --          'RE' (Recargo Equivalencia — si aplica)
  --          'LLC' (ingresos Aizua Brand LLC)
  --          NULL si no aplica

  -- Importe
  importe_eur     DECIMAL(10,2) NOT NULL,
  importe_orig    DECIMAL(10,2),   -- importe en moneda original (si es USD, GBP, etc.)
  moneda_orig     TEXT DEFAULT 'EUR',

  -- IVA (para el Mod. 303)
  iva_tipo        INTEGER DEFAULT 21,  -- porcentaje: 21, 10, 4, 0
  iva_importe     DECIMAL(10,2),       -- importe de IVA incluido en importe_eur
  base_imponible  DECIMAL(10,2),       -- importe_eur - iva_importe

  -- Relación con pedido
  order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
  stripe_pi_id    TEXT,                -- payment_intent_id de Stripe
  stripe_charge_id TEXT,               -- charge_id de Stripe (útil para reembolsos)

  -- Producto/SKU (opcional, para análisis de margen)
  sku_list        JSONB DEFAULT '[]',  -- [{ sku, name, qty, price }]

  -- Cliente
  customer_email  TEXT,
  customer_country TEXT,  -- ISO2 (para OSS y declaraciones)
  market          TEXT,   -- 'ES' | 'EU' | 'UK' | 'US' | 'LATAM'

  -- Descripción libre
  descripcion     TEXT,
  notas           TEXT,

  -- Trimestre fiscal (calculado automáticamente)
  año_fiscal      INTEGER,
  trimestre       INTEGER,  -- 1, 2, 3, 4

  -- Estado
  estado          TEXT NOT NULL DEFAULT 'confirmado',
  -- Valores: 'pendiente' | 'confirmado' | 'reembolsado' | 'disputado'

  -- Auditoría
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Índices ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tx_source        ON transactions(source);
CREATE INDEX IF NOT EXISTS idx_tx_tipo          ON transactions(tipo);
CREATE INDEX IF NOT EXISTS idx_tx_created       ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tx_year_quarter  ON transactions(año_fiscal, trimestre);
CREATE INDEX IF NOT EXISTS idx_tx_stripe_pi     ON transactions(stripe_pi_id);
CREATE INDEX IF NOT EXISTS idx_tx_order         ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_tx_country       ON transactions(customer_country);
CREATE INDEX IF NOT EXISTS idx_tx_estado        ON transactions(estado);

-- ── Trigger updated_at ────────────────────────────────────
CREATE TRIGGER tx_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── RLS ───────────────────────────────────────────────────
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Solo service_role puede leer/escribir (datos fiscales sensibles)
CREATE POLICY "Service role only" ON transactions
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ── FUNCIÓN: calcular base imponible + IVA ─────────────────
-- Se llama automáticamente al insertar con iva_tipo
CREATE OR REPLACE FUNCTION calculate_iva()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Solo calcular para ingresos con IVA
  IF NEW.tipo = 'ingreso' AND NEW.iva_tipo > 0 AND NEW.importe_eur IS NOT NULL THEN
    NEW.iva_importe    := ROUND(NEW.importe_eur * NEW.iva_tipo / (100 + NEW.iva_tipo), 2);
    NEW.base_imponible := NEW.importe_eur - NEW.iva_importe;
  ELSIF NEW.tipo = 'ingreso' AND (NEW.iva_tipo = 0 OR NEW.iva_tipo IS NULL) THEN
    NEW.iva_importe    := 0;
    NEW.base_imponible := NEW.importe_eur;
  END IF;

  -- Calcular trimestre fiscal automáticamente
  IF NEW.created_at IS NOT NULL THEN
    NEW.año_fiscal  := EXTRACT(YEAR FROM NEW.created_at)::INTEGER;
    NEW.trimestre   := CEIL(EXTRACT(MONTH FROM NEW.created_at) / 3.0)::INTEGER;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER tx_calculate_iva
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION calculate_iva();


-- ── VISTA: resumen por trimestre (Mod. 303) ───────────────
CREATE OR REPLACE VIEW finance_trimestral AS
SELECT
  año_fiscal,
  trimestre,
  source,
  regimen,
  COUNT(*)                                AS num_transacciones,
  SUM(CASE WHEN tipo = 'ingreso' AND estado != 'reembolsado' THEN base_imponible ELSE 0 END)   AS base_imponible_total,
  SUM(CASE WHEN tipo = 'ingreso' AND estado != 'reembolsado' THEN iva_importe ELSE 0 END)      AS iva_repercutido,
  SUM(CASE WHEN tipo = 'gasto'   AND estado != 'reembolsado' THEN importe_eur ELSE 0 END)      AS gastos_total,
  SUM(CASE WHEN tipo = 'ingreso' AND estado != 'reembolsado' THEN importe_eur ELSE 0 END)      AS ingresos_total,
  SUM(CASE WHEN estado = 'reembolsado' THEN importe_eur ELSE 0 END)                            AS reembolsos_total
FROM transactions
WHERE año_fiscal IS NOT NULL
GROUP BY año_fiscal, trimestre, source, regimen
ORDER BY año_fiscal DESC, trimestre DESC;


-- ── VISTA: resumen país (para OSS y declaraciones UE) ─────
CREATE OR REPLACE VIEW finance_por_pais AS
SELECT
  año_fiscal,
  customer_country,
  market,
  COUNT(*)                          AS num_pedidos,
  SUM(importe_eur)                  AS total_eur,
  SUM(base_imponible)               AS base_imponible,
  SUM(iva_importe)                  AS iva_total,
  MAX(created_at)                   AS ultimo_pedido
FROM transactions
WHERE tipo = 'ingreso'
  AND estado NOT IN ('reembolsado', 'disputado')
  AND año_fiscal IS NOT NULL
GROUP BY año_fiscal, customer_country, market
ORDER BY total_eur DESC;


-- ── FUNCIÓN: resumen fiscal para un período ──────────────
CREATE OR REPLACE FUNCTION finance_resumen(
  p_year      INTEGER,
  p_trimestre INTEGER DEFAULT NULL  -- NULL = año completo
)
RETURNS JSONB LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object(
    'año',              p_year,
    'trimestre',        p_trimestre,
    'ingresos_brutos',  COALESCE(SUM(CASE WHEN tipo='ingreso' AND estado!='reembolsado' THEN importe_eur END), 0),
    'base_imponible',   COALESCE(SUM(CASE WHEN tipo='ingreso' AND estado!='reembolsado' THEN base_imponible END), 0),
    'iva_repercutido',  COALESCE(SUM(CASE WHEN tipo='ingreso' AND estado!='reembolsado' THEN iva_importe END), 0),
    'gastos_deducibles',COALESCE(SUM(CASE WHEN tipo='gasto' THEN importe_eur END), 0),
    'reembolsos',       COALESCE(SUM(CASE WHEN estado='reembolsado' THEN importe_eur END), 0),
    'num_pedidos',      COUNT(CASE WHEN tipo='ingreso' THEN 1 END),
    'num_reembolsos',   COUNT(CASE WHEN estado='reembolsado' THEN 1 END)
  )
  FROM transactions
  WHERE año_fiscal = p_year
    AND (p_trimestre IS NULL OR trimestre = p_trimestre);
$$;

-- ============================================================
-- RESUMEN
-- Tabla: transactions
-- Vistas: finance_trimestral, finance_por_pais
-- Funciones: finance_resumen(year, trimestre?)
--            calculate_iva() [trigger automático]
--
-- Uso desde webhook:
--   INSERT INTO transactions (source, importe_eur, order_id,
--     stripe_pi_id, customer_email, customer_country, market, sku_list)
--   VALUES (...)
--
-- Siguiente paso: ejecutar en Supabase Dashboard
-- ============================================================
