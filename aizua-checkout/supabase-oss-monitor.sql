-- ============================================================
-- AIZUA — Supabase Schema: OSS Monitor (CLAUDE.md 🟠 URGENTE)
-- Acumulador de ventas B2C por país UE — Umbral OSS 10.000€/año
--
-- Contexto:
--   Si ventas B2C a consumidores de otros países UE (excluido España)
--   superan 10.000€/año → obligación de registrarse en el OSS.
--   Fuente de datos: tabla orders (shipping_address->>'country').
--   Alerta al 80% del umbral (8.000€).
--
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Dependencias: supabase-schema.sql (tabla orders)
-- ============================================================

-- ── TABLA: b2c_sales_by_country ────────────────────────────
-- Resumen anual de ventas B2C por país UE (excluido España).
-- Se actualiza vía función o cron. España (ES) no cuenta para OSS.

CREATE TABLE IF NOT EXISTS b2c_sales_by_country (
  id           UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  year         INTEGER NOT NULL,            -- Año fiscal (ej. 2026)
  country      TEXT    NOT NULL,            -- Código ISO 2: FR, IT, IE, DE...
  total_sales  DECIMAL(12,2) NOT NULL DEFAULT 0,  -- Euros acumulados ese año
  order_count  INTEGER NOT NULL DEFAULT 0,
  threshold    DECIMAL(12,2) NOT NULL DEFAULT 10000.00, -- Umbral OSS (€)
  alert_pct    INTEGER NOT NULL DEFAULT 80,  -- % del umbral para alertar
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (year, country)
);

CREATE INDEX IF NOT EXISTS idx_oss_year_country ON b2c_sales_by_country(year, country);

ALTER TABLE b2c_sales_by_country ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON b2c_sales_by_country
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ── FUNCIÓN: recalcular ventas B2C por país ────────────────
-- Lee directamente de orders y regenera b2c_sales_by_country.
-- Filtros: status IN (paid, shipped, delivered) + country != 'ES'
-- Llamar: SELECT refresh_b2c_sales_by_country();

CREATE OR REPLACE FUNCTION refresh_b2c_sales_by_country()
RETURNS TABLE (
  country      TEXT,
  year         INTEGER,
  total_sales  DECIMAL,
  order_count  BIGINT,
  pct_of_threshold NUMERIC
) LANGUAGE plpgsql AS $$
BEGIN
  -- Recalcular desde orders
  INSERT INTO b2c_sales_by_country (year, country, total_sales, order_count, last_updated)
  SELECT
    EXTRACT(YEAR FROM paid_at)::INTEGER                AS year,
    UPPER(shipping_address->>'country')                AS country,
    COALESCE(SUM(total), 0)                            AS total_sales,
    COUNT(*)                                           AS order_count,
    NOW()                                              AS last_updated
  FROM orders
  WHERE status IN ('paid', 'processing', 'shipped', 'delivered')
    AND paid_at IS NOT NULL
    AND UPPER(shipping_address->>'country') != 'ES'
    AND UPPER(shipping_address->>'country') IS NOT NULL
  GROUP BY 1, 2
  ON CONFLICT (year, country) DO UPDATE
    SET total_sales  = EXCLUDED.total_sales,
        order_count  = EXCLUDED.order_count,
        last_updated = NOW();

  -- Devolver resumen con % del umbral
  RETURN QUERY
  SELECT
    b.country,
    b.year,
    b.total_sales,
    b.order_count::BIGINT,
    ROUND((b.total_sales / b.threshold * 100), 1) AS pct_of_threshold
  FROM b2c_sales_by_country b
  WHERE b.year = EXTRACT(YEAR FROM NOW())::INTEGER
  ORDER BY b.total_sales DESC;
END;
$$;


-- ── FUNCIÓN: comprobar si se supera el umbral de alerta ────
-- Devuelve países que han superado el porcentaje de alerta.
-- Llamar: SELECT * FROM check_oss_threshold_alerts();

CREATE OR REPLACE FUNCTION check_oss_threshold_alerts()
RETURNS TABLE (
  country          TEXT,
  year             INTEGER,
  total_sales      DECIMAL,
  threshold        DECIMAL,
  alert_pct        INTEGER,
  pct_reached      NUMERIC,
  alert_triggered  BOOLEAN
) LANGUAGE sql STABLE AS $$
  SELECT
    country,
    year,
    total_sales,
    threshold,
    alert_pct,
    ROUND(total_sales / threshold * 100, 1) AS pct_reached,
    (total_sales >= threshold * alert_pct / 100.0) AS alert_triggered
  FROM b2c_sales_by_country
  WHERE year = EXTRACT(YEAR FROM NOW())::INTEGER
  ORDER BY total_sales DESC;
$$;


-- ── VISTA: estado OSS actual ───────────────────────────────
CREATE OR REPLACE VIEW oss_status_current AS
SELECT
  country,
  year,
  total_sales,
  threshold,
  alert_pct,
  ROUND(total_sales / threshold * 100, 1)          AS pct_reached,
  order_count,
  last_updated,
  CASE
    WHEN total_sales >= threshold             THEN 'OBLIGATORIO — Registrar OSS'
    WHEN total_sales >= threshold * alert_pct / 100.0 THEN 'ALERTA — Supera 80% umbral'
    ELSE 'OK'
  END AS estado,
  ROUND(threshold - total_sales, 2)               AS margen_restante
FROM b2c_sales_by_country
WHERE year = EXTRACT(YEAR FROM NOW())::INTEGER
ORDER BY total_sales DESC;


-- ── VISTA: histórico OSS por año ───────────────────────────
CREATE OR REPLACE VIEW oss_history AS
SELECT
  year,
  SUM(total_sales)                              AS total_eu_b2c,
  10000.00                                      AS threshold_global,
  ROUND(SUM(total_sales) / 10000 * 100, 1)     AS pct_global,
  COUNT(DISTINCT country)                       AS paises_activos,
  STRING_AGG(country || ':€' || total_sales::INTEGER, ' | ' ORDER BY total_sales DESC) AS detalle
FROM b2c_sales_by_country
GROUP BY year
ORDER BY year DESC;

-- ============================================================
-- RESUMEN
-- Tabla:     b2c_sales_by_country
-- Funciones: refresh_b2c_sales_by_country()
--            check_oss_threshold_alerts()
-- Vistas:    oss_status_current
--            oss_history
--
-- NOTA: El umbral OSS de 10.000€ es GLOBAL (suma de todos los
-- países UE excluido España), no por país individual.
-- Ver: CLAUDE.md Módulo 2 — Régimen OSS y umbral UE
-- ============================================================
