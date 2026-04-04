-- ============================================================
-- AIZUA — Supabase Schema: system_health (v2.1 ítem 10)
-- Registro de cada ejecución del weekly_maintenance
--
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── TABLA: system_health ──────────────────────────────────
-- Un registro por cada ejecución del weekly_maintenance.
-- Escrito por master_runner.py vía REST API de Supabase.

CREATE TABLE IF NOT EXISTS system_health (
  id               SERIAL PRIMARY KEY,
  fecha            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Resultados de backup_repos()
  repos_backed_up  INTEGER NOT NULL DEFAULT 0,    -- nº repos con push OK
  repos_total      INTEGER NOT NULL DEFAULT 0,    -- nº repos verificados
  repos_errors     TEXT[]  DEFAULT '{}',          -- nombres de repos con error

  -- Resultado de backup_supabase()
  db_backup_ok     BOOLEAN NOT NULL DEFAULT FALSE,

  -- Resultados de verify_services() → { "tienda": "ok (200)", "finance": "error (503)", ... }
  services_ok      JSONB   NOT NULL DEFAULT '{}',

  -- Alertas generadas durante el mantenimiento
  alertas          TEXT[]  DEFAULT '{}',

  -- ¿Se envió el informe por Telegram?
  telegram_sent    BOOLEAN NOT NULL DEFAULT FALSE,

  -- Duración total en segundos
  duracion_seg     INTEGER,

  -- Modo de ejecución
  dry_run          BOOLEAN NOT NULL DEFAULT FALSE
);

-- Índice para consultas recientes
CREATE INDEX IF NOT EXISTS idx_system_health_fecha
  ON system_health(fecha DESC);

-- RLS: solo service_role puede escribir/leer
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON system_health
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── VISTA: último estado de salud ─────────────────────────
CREATE OR REPLACE VIEW system_health_latest AS
SELECT
  id,
  fecha,
  repos_backed_up,
  repos_total,
  db_backup_ok,
  services_ok,
  alertas,
  telegram_sent,
  duracion_seg,
  dry_run,
  -- Semáforo: verde si todos repos OK y todos servicios OK
  CASE
    WHEN array_length(repos_errors, 1) > 0 THEN 'warning'
    WHEN EXISTS (
      SELECT 1 FROM jsonb_each_text(services_ok) WHERE value NOT LIKE 'ok%'
    ) THEN 'warning'
    ELSE 'ok'
  END AS estado
FROM system_health
ORDER BY fecha DESC
LIMIT 1;

-- ── FUNCIÓN: salud últimos 7 días ─────────────────────────
CREATE OR REPLACE FUNCTION system_health_summary(days INTEGER DEFAULT 7)
RETURNS TABLE (
  total_runs      BIGINT,
  runs_clean      BIGINT,
  runs_warning    BIGINT,
  last_run        TIMESTAMPTZ,
  avg_duracion    NUMERIC
) LANGUAGE sql STABLE AS $$
  SELECT
    COUNT(*)                                                            AS total_runs,
    COUNT(*) FILTER (WHERE array_length(repos_errors, 1) IS NULL
                       AND NOT EXISTS (
                           SELECT 1 FROM jsonb_each_text(services_ok)
                           WHERE value NOT LIKE 'ok%'
                       ))                                              AS runs_clean,
    COUNT(*) FILTER (WHERE array_length(repos_errors, 1) > 0
                       OR EXISTS (
                           SELECT 1 FROM jsonb_each_text(services_ok)
                           WHERE value NOT LIKE 'ok%'
                       ))                                              AS runs_warning,
    MAX(fecha)                                                         AS last_run,
    ROUND(AVG(duracion_seg), 0)                                        AS avg_duracion
  FROM system_health
  WHERE fecha >= NOW() - (days || ' days')::INTERVAL
    AND dry_run = FALSE;
$$;

-- ============================================================
-- RESUMEN
-- Tabla:    system_health
-- Vista:    system_health_latest
-- Función:  system_health_summary(days)
-- ============================================================
