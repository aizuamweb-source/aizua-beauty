-- ============================================================
-- AIZUA — Migración: historial de precios y rangos de PVP
-- Fase 4 — Agente de Precio
--
-- Añade a suppliers:
--   price_history  JSONB — registro automático de cambios de coste
--   min_pvp        DECIMAL — precio mínimo permitido (protege margen)
--   max_pvp        DECIMAL — precio máximo sugerido (evita sobreprecio)
--
-- Añade a sync_logs:
--   details        JSONB — desglose de alertas por SKU
-- ============================================================

-- ── Ampliar tabla suppliers ───────────────────────────────
ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS price_history  JSONB    NOT NULL DEFAULT '[]',
  -- Array de { date, old_cost, new_cost, change_pct }
  -- Se añade automáticamente con el trigger de abajo

  ADD COLUMN IF NOT EXISTS min_pvp        DECIMAL(10,2),
  -- Si no nulo: el Agente de Precio NO bajará el PVP de products por debajo de este valor
  ADD COLUMN IF NOT EXISTS max_pvp        DECIMAL(10,2);
  -- Si no nulo: el Agente de Precio NO subirá el PVP por encima de este valor

COMMENT ON COLUMN suppliers.price_history IS
  'Registro JSONB de cambios de coste. Formato: [{date, old_cost, new_cost, change_pct}]. '
  'Máx. 50 entradas (las más recientes). Gestionado automáticamente por el Agente de Precio.';

COMMENT ON COLUMN suppliers.min_pvp IS
  'PVP mínimo permitido para este proveedor. El Agente de Precio nunca bajará por debajo. '
  'Si null: sin límite inferior.';

COMMENT ON COLUMN suppliers.max_pvp IS
  'PVP máximo sugerido. Si el precio calculado supera este valor, se usa max_pvp. '
  'Evita precios excesivos que dañen conversión. Si null: sin límite superior.';

-- ── Función: añadir entrada al price_history ──────────────
-- Llamada desde el Agente de Precio cuando cost cambia > 5%.
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

  -- Obtener historial actual y añadir nueva entrada (máx. 50)
  SELECT COALESCE(price_history, '[]'::jsonb) INTO history
  FROM suppliers WHERE id = supplier_id;

  -- Mantener solo las últimas 49 + la nueva
  history := (
    SELECT jsonb_agg(e) FROM (
      SELECT e FROM jsonb_array_elements(history) e
      LIMIT 49
    ) sub
  ) || jsonb_build_array(new_entry);

  UPDATE suppliers SET price_history = history WHERE id = supplier_id;
END;
$$;

-- ── Ampliar sync_logs con detalle de alertas ──────────────
ALTER TABLE sync_logs
  ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';
-- Formato: { price_alerts: [...], margin_alerts: [...] }

COMMENT ON COLUMN sync_logs.details IS
  'Desglose de alertas del ciclo de sync. '
  'price_alerts: productos con variación de coste. margin_alerts: productos con margen bajo.';

-- ── Vista: historial de precios desplegado ────────────────
CREATE OR REPLACE VIEW supplier_price_history AS
SELECT
  s.id          AS supplier_id,
  s.slug,
  s.aliexpress_id,
  s.cost        AS current_cost,
  p.price       AS current_pvp,
  entry->>'date'                               AS change_date,
  (entry->>'old_cost')::DECIMAL                AS old_cost,
  (entry->>'new_cost')::DECIMAL                AS new_cost,
  (entry->>'change_pct')::DECIMAL              AS change_pct
FROM suppliers s
JOIN products  p ON p.id = s.product_id,
LATERAL jsonb_array_elements(s.price_history) AS entry
WHERE s.is_active = true
ORDER BY s.slug, (entry->>'date') DESC;

-- ============================================================
-- RESUMEN
-- Columnas añadidas a suppliers: price_history, min_pvp, max_pvp
-- Función: append_price_history(supplier_id, old_cost, new_cost)
-- Vista: supplier_price_history
-- Columna añadida a sync_logs: details JSONB
-- ============================================================
