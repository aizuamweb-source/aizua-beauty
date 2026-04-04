-- ============================================================
-- AIZUA — Supabase: daily_spend tabla + RPC
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── TABLA: gasto diario en AliExpress (límite de seguridad) ──
CREATE TABLE IF NOT EXISTS daily_spend (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_eur   DECIMAL(10,2) NOT NULL DEFAULT 0,
  order_count  INTEGER NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_spend_date ON daily_spend(date);

-- Solo service role puede acceder
ALTER TABLE daily_spend ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON daily_spend
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── RPC: incremento atómico del gasto diario (upsert) ──
CREATE OR REPLACE FUNCTION increment_daily_spend(amount DECIMAL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO daily_spend (date, amount_eur, order_count, updated_at)
  VALUES (CURRENT_DATE, amount, 1, NOW())
  ON CONFLICT (date) DO UPDATE
    SET amount_eur  = daily_spend.amount_eur + EXCLUDED.amount_eur,
        order_count = daily_spend.order_count + 1,
        updated_at  = NOW();
END;
$$;
