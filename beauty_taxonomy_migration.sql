-- Migración taxonomía beauty → taxonomía única (sesión 131)
-- Ejecutar UNA vez en Supabase SQL Editor (proyecto nxcnykpsooolxruwmifu)
-- Seguro: los 22 productos live ya usan la nueva taxonomía; este script cubre
-- cualquier producto con categoría del set antiguo que pudiera existir.

UPDATE products SET category = 'Skincare'    WHERE store = 'beauty' AND category = 'Belleza';
UPDATE products SET category = 'Suplementos' WHERE store = 'beauty' AND category = 'Bienestar';
UPDATE products SET category = 'Corporal'    WHERE store = 'beauty' AND category = 'Cuidado';
UPDATE products SET category = 'Capilar'     WHERE store = 'beauty' AND category = 'Cabello';
UPDATE products SET category = 'Accesorios'  WHERE store = 'beauty' AND category IN ('Joyería', 'Moda');
-- Bolsos y Accesorios: mismo nombre en ambas taxonomías, sin cambio

-- Verificar resultado
SELECT category, COUNT(*) as n
FROM products
WHERE store = 'beauty' AND active = true
GROUP BY category
ORDER BY n DESC;
