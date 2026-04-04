-- ============================================================
-- AIZUA — Poblar aliexpress_id para los 11 productos activos
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- Fuente: aizua_products_simple.csv (raíz del proyecto)
-- ============================================================

-- Actualiza aliexpress_id por slug (safe — solo cambia si el slug existe)
UPDATE products SET aliexpress_id = '1005010171418964' WHERE slug = 'proyector-magcubic-hy300-pro-8k-android14';
UPDATE products SET aliexpress_id = '1005009911214609' WHERE slug = 'auriculares-conduccion-osea-x10-ipx8-32gb';
UPDATE products SET aliexpress_id = '1005008564519949' WHERE slug = 'allpowers-r600-estacion-energia-299wh';
UPDATE products SET aliexpress_id = '1005003212270630' WHERE slug = 'xiaomi-redmi-watch-5-smartwatch-bluetooth';
UPDATE products SET aliexpress_id = '1005007425600001' WHERE slug = 'panel-solar-flexible-monocristalino-12v';
UPDATE products SET aliexpress_id = '1005007542155658' WHERE slug = 'soporte-tripode-universal-magcubic';
UPDATE products SET aliexpress_id = '1005007914556601' WHERE slug = 'tira-led-rgb-wifi-inteligente-app-musical';
UPDATE products SET aliexpress_id = '1005007938960627' WHERE slug = 'lampara-luna-3d-led-16-colores-mando';
UPDATE products SET aliexpress_id = '1005006460405708' WHERE slug = 'humidificador-nube-lluvia-asmr-led-aromas';
UPDATE products SET aliexpress_id = '1005008204965685' WHERE slug = 'lampara-proyectora-sunset-atardecer-decoracion';
UPDATE products SET aliexpress_id = '1005009578856878' WHERE slug = 'lampara-medusas-led-7-colores-fantasy';

-- También actualizar ali_product_id (usado por ali-fulfill para crear pedidos)
UPDATE products SET ali_product_id = aliexpress_id WHERE ali_product_id IS NULL AND aliexpress_id IS NOT NULL;

-- Verificar resultado
SELECT slug, aliexpress_id, ali_product_id,
       array_length(images, 1) AS num_images
FROM products
WHERE active = true
ORDER BY created_at DESC;
