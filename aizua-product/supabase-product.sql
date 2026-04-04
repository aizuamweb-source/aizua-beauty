-- ============================================================
-- AIZUA — Supabase: Adiciones para página de producto
-- Ejecutar después de supabase-schema.sql y supabase-aliexpress.sql
-- ============================================================

-- ── Añadir slug a productos ──
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Función para generar slug automático desde el nombre
CREATE OR REPLACE FUNCTION generate_slug(name_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        translate(name_text,
          'àáâãäåæçèéêëìíîïðñòóôõöùúûüýÿ',
          'aaaaaaeceeeeiiiidnoooooouuuuyy'
        ),
        '[^a-z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger: generar slug automáticamente al insertar/actualizar nombre
CREATE OR REPLACE FUNCTION set_product_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Solo generar si el slug está vacío
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := generate_slug(
      CASE
        WHEN NEW.name->>'es' IS NOT NULL THEN NEW.name->>'es'
        WHEN NEW.name->>'en' IS NOT NULL THEN NEW.name->>'en'
        ELSE 'producto'
      END
    );

    final_slug := base_slug;

    -- Asegurar unicidad añadiendo contador si ya existe
    WHILE EXISTS (SELECT 1 FROM products WHERE slug = final_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;

    NEW.slug := final_slug;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_set_slug
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_product_slug();

-- Índice para búsqueda por slug (fast lookup)
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- ── Actualizar reviews con columna verified ──
-- (ya creada en supabase-aliexpress.sql, solo añadir índice)
CREATE INDEX IF NOT EXISTS idx_reviews_product_verified
  ON product_reviews(product_id, verified);

-- ── Vista: productos con rating calculado ──
CREATE OR REPLACE VIEW products_with_rating AS
SELECT
  p.*,
  COALESCE(
    ROUND(AVG(r.rating)::NUMERIC, 1),
    p.rating
  ) AS computed_rating,
  COUNT(r.id) AS computed_review_count
FROM products p
LEFT JOIN product_reviews r ON r.product_id = p.id
GROUP BY p.id;

-- ── RLS para products: lectura pública ──
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active products"
  ON products FOR SELECT
  USING (active = true);
CREATE POLICY "Service role full access on products"
  ON products FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================
-- RESUMEN DE LO QUE AÑADE ESTE SCRIPT:
-- 1. Columna slug en products (auto-generado con trigger)
-- 2. Función generate_slug() para URLs limpias
-- 3. Índices para mejor rendimiento
-- 4. Vista products_with_rating
-- 5. RLS: lectura pública de productos activos
-- ============================================================
