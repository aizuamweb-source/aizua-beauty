-- ============================================================
-- AIZUA — Supabase: Schema CRM
-- Ejecutar después de supabase-product.sql
-- ============================================================

-- ── TABLA: conversaciones CRM ──
CREATE TABLE IF NOT EXISTS crm_conversations (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_email  TEXT NOT NULL UNIQUE,
  customer_name   TEXT,
  last_message    TEXT,
  last_reply      TEXT,
  status          TEXT DEFAULT 'open'
                  CHECK (status IN ('open','ai_handled','escalated','resolved')),
  order_id        UUID REFERENCES orders(id),
  lang            TEXT DEFAULT 'es',
  ticket_count    INTEGER DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_status     ON crm_conversations(status);
CREATE INDEX IF NOT EXISTS idx_crm_email      ON crm_conversations(customer_email);
CREATE INDEX IF NOT EXISTS idx_crm_updated    ON crm_conversations(updated_at DESC);

-- ── TABLA: mensajes individuales del historial ──
CREATE TABLE IF NOT EXISTS crm_messages (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES crm_conversations(id) ON DELETE CASCADE,
  role            TEXT CHECK (role IN ('customer','assistant','agent')),
  content         TEXT NOT NULL,
  lang            TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_msgs_conv ON crm_messages(conversation_id, created_at);

-- ── ACTUALIZAR newsletter_subscribers ──
ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS lang           TEXT DEFAULT 'es',
  ADD COLUMN IF NOT EXISTS source         TEXT DEFAULT 'footer',
  ADD COLUMN IF NOT EXISTS engagement     TEXT DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS last_click     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS spam_report    BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;

-- ── RLS: solo service_role accede a datos de CRM ──
ALTER TABLE crm_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON crm_conversations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE crm_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON crm_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── FUNCIÓN: auto-update updated_at en conversaciones ──
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE crm_conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER crm_msg_update_conv
  AFTER INSERT ON crm_messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

-- ============================================================
-- VARIABLES DE ENTORNO A AÑADIR:
-- ANTHROPIC_API_KEY=sk-ant-...
-- KLAVIYO_PRIVATE_KEY=pk_...
-- KLAVIYO_LIST_ALL=LIST_ID
-- KLAVIYO_LIST_ES=LIST_ID
-- KLAVIYO_LIST_EN=LIST_ID
-- KLAVIYO_LIST_FR=LIST_ID
-- KLAVIYO_LIST_DE=LIST_ID
-- KLAVIYO_LIST_PT=LIST_ID
-- KLAVIYO_LIST_IT=LIST_ID
-- ============================================================
