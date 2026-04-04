-- ============================================================
-- AIZUA — Supabase Schema: contenido generado (Fase 5)
-- Agente de Contenido — TikTok/IG · Blog · SEO · KDP
--
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Dependencias: supabase-schema.sql (tabla products)
-- ============================================================

-- ── TABLA: content_outputs ────────────────────────────────
-- Almacena todo el contenido generado por el Agente de Contenido.
-- Revisión y aprobación manual antes de publicar.

CREATE TABLE IF NOT EXISTS content_outputs (
  id           UUID    DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Origen
  product_id   UUID    REFERENCES products(id) ON DELETE SET NULL,
  product_slug TEXT,   -- referencia rápida sin JOIN

  -- Tipo de contenido
  content_type TEXT    NOT NULL,
  -- Valores:
  --   'tiktok_script'      — guión TikTok/Reels 30-45s
  --   'social_post'        — post Instagram/Facebook
  --   'product_description'— descripción tienda
  --   'email_subject'      — asuntos carrito abandonado
  --   'blog_article'       — artículo SEO
  --   'kdp_chapter'        — fragmento para libro Amazon KDP
  --   'academy_module'     — módulo para curso Academy

  -- Contenido multiidioma { es, en, fr, it, ... }
  content      JSONB   NOT NULL,

  -- Metadata de generación
  model        TEXT    DEFAULT 'claude-sonnet-4-5',
  prompt_hash  TEXT,   -- hash del prompt — para detectar duplicados
  tokens_used  INTEGER,

  -- Workflow de publicación
  status       TEXT    NOT NULL DEFAULT 'draft',
  -- 'draft'     → recién generado, pendiente revisión
  -- 'approved'  → revisado y aprobado por Miguel
  -- 'published' → publicado en el canal correspondiente
  -- 'rejected'  → descartado
  channel      TEXT,   -- 'tiktok' | 'instagram' | 'blog' | 'newsletter' | 'kdp' | 'academy'
  published_at TIMESTAMPTZ,
  notes        TEXT,   -- comentarios de revisión

  -- Métricas (a rellenar después de publicar)
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

CREATE TRIGGER content_updated_at
  BEFORE UPDATE ON content_outputs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE content_outputs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON content_outputs
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ── TABLA: blog_posts ─────────────────────────────────────
-- Artículos de blog SEO. Fuente única para tienda + KDP + Academy.

CREATE TABLE IF NOT EXISTS blog_posts (
  id          UUID  DEFAULT gen_random_uuid() PRIMARY KEY,
  slug        TEXT  UNIQUE NOT NULL,
  title       JSONB NOT NULL,   -- { es, en, fr, it }
  content     JSONB NOT NULL,   -- { es, en, fr, it }
  keyword     TEXT,             -- keyword principal SEO
  excerpt     JSONB,            -- { es, en } para meta description
  status      TEXT  DEFAULT 'draft',   -- draft | published | archived
  product_id  UUID  REFERENCES products(id) ON DELETE SET NULL,
  views       INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_status  ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_keyword ON blog_posts(keyword);

CREATE TRIGGER blog_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published" ON blog_posts
  FOR SELECT USING (status = 'published');
CREATE POLICY "Service role full access" ON blog_posts
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ── VISTA: contenido pendiente de revisión ────────────────
CREATE OR REPLACE VIEW content_pending_review AS
SELECT
  co.id,
  co.content_type,
  co.product_slug,
  co.status,
  co.channel,
  co.created_at,
  COALESCE(co.content->>'es', co.content->>'en', '') AS preview_es
FROM content_outputs co
WHERE co.status = 'draft'
ORDER BY co.created_at DESC;

-- ── FUNCIÓN: stats del agente de contenido ────────────────
CREATE OR REPLACE FUNCTION content_agent_stats()
RETURNS TABLE (
  content_type TEXT,
  total        BIGINT,
  drafts       BIGINT,
  approved     BIGINT,
  published    BIGINT
) LANGUAGE sql STABLE AS $$
  SELECT
    content_type,
    COUNT(*)                                         AS total,
    COUNT(*) FILTER (WHERE status = 'draft')         AS drafts,
    COUNT(*) FILTER (WHERE status = 'approved')      AS approved,
    COUNT(*) FILTER (WHERE status = 'published')     AS published
  FROM content_outputs
  GROUP BY content_type
  ORDER BY total DESC;
$$;

-- ============================================================
-- RESUMEN
-- Tablas: content_outputs, blog_posts
-- Vista:  content_pending_review
-- Función: content_agent_stats()
-- ============================================================
