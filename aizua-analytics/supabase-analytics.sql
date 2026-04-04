-- ============================================================
-- AIZUA — Schema Analytics + Ads Logs
-- Ejecutar después de supabase-seo-content.sql
-- ============================================================

-- ── Tabla analytics_reports ──
CREATE TABLE IF NOT EXISTS analytics_reports (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  period_days  INTEGER NOT NULL,
  kpis         JSONB   DEFAULT '{}',
  anomalies    JSONB   DEFAULT '[]',
  report_text  TEXT,
  ran_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_analytics_ran ON analytics_reports(ran_at DESC);

-- ── Tabla ads_agent_logs ──
CREATE TABLE IF NOT EXISTS ads_agent_logs (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  executed         INTEGER DEFAULT 0,
  pending_approval INTEGER DEFAULT 0,
  alerts           INTEGER DEFAULT 0,
  summary          TEXT,
  decisions        JSONB DEFAULT '[]',
  ran_at           TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ads_logs_ran ON ads_agent_logs(ran_at DESC);

-- ── RLS ──
ALTER TABLE analytics_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service only" ON analytics_reports FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE ads_agent_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service only" ON ads_agent_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- VARIABLES DE ENTORNO COMPLETAS — añadir en Vercel
-- ============================================================
-- # Supabase
-- NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
-- SUPABASE_SERVICE_ROLE_KEY=eyJ...
-- DATABASE_URL=postgresql://...
--
-- # Stripe
-- STRIPE_SECRET_KEY=sk_live_...
-- STRIPE_WEBHOOK_SECRET=whsec_...
-- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
--
-- # AliExpress API
-- ALI_APP_KEY=xxxxx
-- ALI_APP_SECRET=xxxxx
--
-- # Resend (email transaccional)
-- RESEND_API_KEY=re_...
--
-- # Klaviyo
-- KLAVIYO_PRIVATE_KEY=pk_...
-- KLAVIYO_LIST_ALL=LIST_ID
-- KLAVIYO_LIST_ES=LIST_ID
-- KLAVIYO_LIST_EN=LIST_ID
-- KLAVIYO_LIST_FR=LIST_ID
-- KLAVIYO_LIST_DE=LIST_ID
-- KLAVIYO_LIST_PT=LIST_ID
-- KLAVIYO_LIST_IT=LIST_ID
--
-- # Anthropic (agentes IA)
-- ANTHROPIC_API_KEY=sk-ant-...
--
-- # Meta Ads
-- META_ADS_TOKEN=EAA...
-- META_AD_ACCOUNT_ID=act_XXXXXXXXXXXXXXXXXX
-- META_PAGE_ID=XXXXXXXXXXXXXXXXXX
-- META_PIXEL_ID=XXXXXXXXXXXXXXXXXX
-- META_VISITORS_AUDIENCE_ID=XXXXXXXXXXXXXXXXXX
--
-- # Google Analytics
-- NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
-- GA_MEASUREMENT_ID=G-XXXXXXXXXX
-- GA_API_SECRET=xxxxx
--
-- # Meta CAPI / TikTok CAPI
-- META_CAPI_TOKEN=xxxxx
-- TIKTOK_PIXEL_ID=xxxxx
-- TIKTOK_EVENTS_TOKEN=xxxxx
--
-- # Telegram Bot
-- TELEGRAM_BOT_TOKEN=XXXXXXXXXX:AAE...
-- TELEGRAM_CHAT_ID=XXXXXXXXXX
--
-- # App
-- NEXT_PUBLIC_APP_URL=https://aizua.vercel.app      # Cambiar a https://aizua.com cuando tengas el dominio
-- SYNC_SECRET_TOKEN=genera-uno-con-openssl-rand-hex-32
-- ============================================================

-- ============================================================
-- N8N — WORKFLOWS DE LOS 6 AGENTES
-- Importar en n8n como JSON o configurar manualmente
-- ============================================================
-- AGENTE SEO      → Schedule 07:00 diario → POST /api/seo-agent        {action:"full"}
-- AGENTE ADS      → Schedule 08:00 diario → POST /api/ads-agent
-- AGENTE CRM      → Webhook email/Tidio   → POST /api/crm-agent        (en tiempo real)
-- AGENTE EMAIL    → Klaviyo gestiona flows → POST /api/klaviyo-sync     (al registrarse)
-- AGENTE CONTENT  → Trigger: nuevo prod.  → POST /api/content-agent    {type:"product_description"}
-- AGENTE ANALYTICS→ Schedule 08:00 diario → POST /api/analytics-agent  {days:7}
--
-- Todas las llamadas llevan cabecera:
-- Authorization: Bearer [SYNC_SECRET_TOKEN]
-- ============================================================

-- ============================================================
-- RESUMEN FINAL: TABLAS COMPLETAS DE AIZUA
-- ============================================================
-- orders                 Pedidos completados (Stripe webhook)
-- products               Catálogo con slug, seo, variantes, imágenes
-- product_reviews        Reseñas verificadas de compradores
-- newsletter_subscribers Lista Klaviyo con engagement tracking
-- ali_tokens             Tokens OAuth AliExpress (auto-refresh)
-- sync_logs              Logs de sync de precios/stock AliExpress
-- crm_conversations      Historial de atención al cliente
-- crm_messages           Mensajes individuales por conversación
-- blog_posts             Artículos SEO en 6 idiomas
-- seo_audit_logs         Auditorías diarias de SEO
-- analytics_reports      Informes ejecutivos diarios
-- ads_agent_logs         Decisiones del Agente Ads
-- ============================================================
