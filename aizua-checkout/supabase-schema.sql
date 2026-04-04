-- ============================================================
-- AIZUA — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── ORDERS TABLE ──
CREATE TABLE IF NOT EXISTS orders (
  id                        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number              TEXT UNIQUE NOT NULL,
  stripe_payment_intent_id  TEXT UNIQUE,
  status                    TEXT NOT NULL DEFAULT 'pending',
  -- Status values: pending | paid | processing | shipped | delivered | cancelled | refunded | payment_failed

  -- Customer
  customer_email            TEXT NOT NULL,
  customer_name             TEXT NOT NULL,
  customer_phone            TEXT,

  -- Shipping
  shipping_address          JSONB NOT NULL,
  -- { firstName, lastName, address, city, postal, country }
  shipping_method           TEXT NOT NULL DEFAULT 'standard',
  shipping_cost             DECIMAL(10,2) NOT NULL DEFAULT 0,
  tracking_number           TEXT,
  shipped_at                TIMESTAMPTZ,
  delivered_at              TIMESTAMPTZ,

  -- Products
  items                     JSONB NOT NULL,
  -- [{ id, name, price, qty, emoji, variant }]

  -- Financials
  subtotal                  DECIMAL(10,2) NOT NULL,
  discount                  DECIMAL(10,2) NOT NULL DEFAULT 0,
  coupon                    TEXT,
  total                     DECIMAL(10,2) NOT NULL,
  currency                  TEXT NOT NULL DEFAULT 'EUR',

  -- Timestamps
  paid_at                   TIMESTAMPTZ,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW(),

  -- DSers fulfillment
  dsers_order_id            TEXT,
  dsers_status              TEXT
);

-- ── INDEXES ──
CREATE INDEX idx_orders_email        ON orders(customer_email);
CREATE INDEX idx_orders_status       ON orders(status);
CREATE INDEX idx_orders_stripe_pi    ON orders(stripe_payment_intent_id);
CREATE INDEX idx_orders_created_at   ON orders(created_at DESC);

-- ── RLS (Row Level Security) ──
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for webhooks and API routes)
CREATE POLICY "Service role full access"
  ON orders FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Allow authenticated users to read their own orders
CREATE POLICY "Users read own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (customer_email = auth.jwt() ->> 'email');

-- ── UPDATED_AT TRIGGER ──
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── PRODUCTS TABLE (for catalog) ──
CREATE TABLE IF NOT EXISTS products (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dsers_id        TEXT UNIQUE,
  aliexpress_id   TEXT,
  name            JSONB NOT NULL,   -- { es, en, fr, de, pt, it }
  description     JSONB NOT NULL,   -- { es, en, fr, de, pt, it }
  price           DECIMAL(10,2) NOT NULL,
  compare_price   DECIMAL(10,2),
  images          TEXT[] NOT NULL DEFAULT '{}',
  category        TEXT,
  tags            TEXT[] DEFAULT '{}',
  stock           INTEGER DEFAULT 999,
  active          BOOLEAN DEFAULT true,
  badge           TEXT,             -- 'NEW' | 'HOT' | 'SALE' | 'BEST SELLER'
  rating          DECIMAL(3,2) DEFAULT 4.5,
  review_count    INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active   ON products(active);

-- ── NEWSLETTER SUBSCRIBERS ──
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email        TEXT UNIQUE NOT NULL,
  language     TEXT DEFAULT 'es',
  source       TEXT DEFAULT 'footer',  -- 'footer' | 'popup' | 'checkout'
  active       BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DONE. Tables created: orders, products, newsletter_subscribers
-- ============================================================
