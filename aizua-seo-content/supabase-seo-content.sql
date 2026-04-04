-- ============================================================
-- AIZUA — Supabase: Schema SEO + Content
-- Ejecutar después de supabase-crm.sql
-- ============================================================

-- ── AÑADIR columnas SEO a productos ──
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS seo_title       JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS seo_description JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS keywords        TEXT[];

CREATE INDEX IF NOT EXISTS idx_products_seo_title ON products USING gin(seo_title);

-- ── TABLA: artículos de blog ──
CREATE TABLE IF NOT EXISTS blog_posts (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  title       JSONB DEFAULT '{}',    -- {"es":"...","en":"..."}
  content     JSONB DEFAULT '{}',    -- {"es":"...","en":"..."}
  keyword     TEXT,
  status      TEXT DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  views       INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_blog_slug    ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_status  ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_keyword ON blog_posts(keyword);

-- ── TABLA: logs de auditoría SEO diaria ──
CREATE TABLE IF NOT EXISTS seo_audit_logs (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  total_products        INTEGER,
  total_indexable_urls  INTEGER,
  products_without_meta INTEGER,
  products_without_slug INTEGER,
  score                 INTEGER,
  issues                JSONB DEFAULT '[]',
  ran_at                TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seo_audit_ran ON seo_audit_logs(ran_at DESC);

-- ── RLS: blog público ──
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published posts"
  ON blog_posts FOR SELECT
  USING (status = 'published');
CREATE POLICY "Service role full access on blog"
  ON blog_posts FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ── RLS: seo_audit_logs solo service_role ──
ALTER TABLE seo_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only on seo_logs"
  ON seo_audit_logs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================
-- RESULTADO FINAL: todas las tablas del proyecto
--
-- orders                 ← checkout Stripe
-- products               ← productos con slug, seo, sku_list
-- product_reviews        ← reviews verificadas
-- newsletter_subscribers ← Klaviyo sync
-- ali_tokens             ← OAuth AliExpress
-- sync_logs              ← logs de sync de precios
-- crm_conversations      ← agente CRM
-- crm_messages           ← historial de mensajes
-- blog_posts             ← artículos SEO
-- seo_audit_logs         ← auditoría diaria
-- ============================================================
