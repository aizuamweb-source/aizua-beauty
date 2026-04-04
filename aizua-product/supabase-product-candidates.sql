-- ============================================================
-- AIZUA — Supabase Schema: product_candidates (Fase 4)
-- Buscador de productos ganadores — candidatos para dropshipping
--
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Dependencias: supabase-schema.sql (tabla products)
-- ============================================================

-- ── TABLA: product_candidates ─────────────────────────────
-- Candidatos a productos ganadores encontrados por el agente.
-- Fuentes: TikTok Creative Center, AliExpress trending, Amazon BSR.
-- El agente evalúa y puntúa cada candidato; Miguel aprueba o descarta.

CREATE TABLE IF NOT EXISTS product_candidates (
  id              UUID    DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Identificación del producto
  name            TEXT    NOT NULL,
  aliexpress_url  TEXT,
  aliexpress_id   TEXT,              -- ID numérico del producto
  tiktok_url      TEXT,              -- URL del vídeo viral de referencia
  amazon_asin     TEXT,

  -- Criterios de evaluación (puntuados por el agente)
  estimated_cost  DECIMAL(10,2),     -- Coste estimado AliExpress (€)
  estimated_pvp   DECIMAL(10,2),     -- PVP sugerido (€)
  estimated_margin_pct DECIMAL(5,2), -- % margen bruto estimado
  shipping_days   INTEGER,           -- Días de envío estimados
  has_invoice     BOOLEAN DEFAULT FALSE, -- ¿Proveedor emite factura?
  has_invoice_note TEXT,             -- Explicación sobre factura

  -- Señales de demanda
  tiktok_views    BIGINT,            -- Visualizaciones del vídeo de referencia
  amazon_bsr      INTEGER,           -- Best Seller Rank en Amazon (si aplica)
  search_volume   INTEGER,           -- Volumen búsqueda mensual estimado
  competition     TEXT CHECK (competition IN ('low','medium','high')),

  -- Puntuación del agente (0-100)
  score           INTEGER CHECK (score BETWEEN 0 AND 100),
  score_breakdown JSONB DEFAULT '{}', -- { "margin": 30, "demand": 25, "competition": 20, ... }

  -- Análisis IA
  summary         TEXT,              -- Por qué es un buen candidato (Claude)
  risks           TEXT,              -- Riesgos identificados
  suggested_angle TEXT,              -- Ángulo de marketing sugerido

  -- Mercados sugeridos
  target_markets  TEXT[] DEFAULT '{ES,FR,IT,IE}',

  -- Estado en el pipeline
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','sourcing','live')),
  -- 'pending'  → recién encontrado, pendiente revisión de Miguel
  -- 'approved' → Miguel lo quiere investigar/probar
  -- 'rejected' → descartado
  -- 'sourcing' → en proceso de encontrar proveedor con factura
  -- 'live'     → añadido al catálogo activo

  notes           TEXT,              -- Notas de Miguel
  promoted_to     UUID REFERENCES products(id) ON DELETE SET NULL,

  -- Metadata
  source          TEXT,              -- 'tiktok_cc' | 'aliexpress_trending' | 'amazon_bsr' | 'manual'
  found_at        TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidates_status  ON product_candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_score   ON product_candidates(score DESC);
CREATE INDEX IF NOT EXISTS idx_candidates_created ON product_candidates(created_at DESC);

CREATE TRIGGER candidates_updated_at
  BEFORE UPDATE ON product_candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE product_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON product_candidates
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ── VISTA: top candidatos pendientes ──────────────────────
CREATE OR REPLACE VIEW top_product_candidates AS
SELECT
  id,
  name,
  score,
  estimated_margin_pct,
  estimated_pvp,
  estimated_cost,
  shipping_days,
  has_invoice,
  competition,
  tiktok_views,
  summary,
  suggested_angle,
  source,
  found_at
FROM product_candidates
WHERE status = 'pending'
ORDER BY score DESC, found_at DESC;

-- ── FUNCIÓN: estadísticas del buscador ────────────────────
CREATE OR REPLACE FUNCTION product_finder_stats()
RETURNS TABLE (
  status    TEXT,
  total     BIGINT,
  avg_score NUMERIC,
  avg_margin NUMERIC
) LANGUAGE sql STABLE AS $$
  SELECT
    status,
    COUNT(*)                          AS total,
    ROUND(AVG(score), 1)              AS avg_score,
    ROUND(AVG(estimated_margin_pct), 1) AS avg_margin
  FROM product_candidates
  GROUP BY status
  ORDER BY total DESC;
$$;

-- ============================================================
-- RESUMEN
-- Tabla:    product_candidates
-- Vista:    top_product_candidates
-- Función:  product_finder_stats()
-- ============================================================
