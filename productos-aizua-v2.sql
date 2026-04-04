-- ============================================================
-- AIZUA — Productos iniciales (columnas correctas)
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

INSERT INTO products (
  aliexpress_id, name, description, price, compare_price,
  images, category, tags, stock, active, badge,
  rating, review_count, slug,
  seo_title, seo_description, keywords,
  created_at, updated_at
) VALUES

-- 1. PROYECTOR MAGCUBIC HY310
(
  '1005010064673487',
  '{"es":"Proyector Portátil Magcubic HY310 — Cine 4K en Casa con Android 11","en":"Magcubic HY310 Portable Projector — 4K Home Cinema Android 11","fr":"Projecteur Portable Magcubic HY310 — Cinéma 4K Android 11","de":"Magcubic HY310 Tragbarer Projektor — 4K Heimkino Android 11","pt":"Projetor Portátil Magcubic HY310 — Cinema 4K Android 11","it":"Proiettore Portatile Magcubic HY310 — Cinema 4K Android 11"}',
  '{"es":"Transforma cualquier pared en tu cine personal. Resolución nativa 1080P con compatibilidad 4K, 330 ANSI lúmenes y Android 11 integrado con acceso a Netflix, YouTube y más. Enfoque automático y corrección trapezoidal sin ajustes manuales. Altavoz de 5W integrado, mando Air Mouse con control por voz. Rotación 180° para proyectar en techos o paredes. WiFi 6 doble banda para streaming sin cortes.","en":"Transform any wall into your personal cinema. Native 1080P resolution with 4K support, 330 ANSI lumens, built-in Android 11 with Netflix and YouTube. Auto focus and keystone correction. 5W speaker, Air Mouse remote with voice control. 180° rotation for ceiling projection. Dual-band WiFi 6 for seamless streaming.","fr":"Transformez n\'importe quel mur en votre cinéma. Résolution native 1080P 4K, 330 lumens ANSI, Android 11 intégré. Mise au point automatique. Haut-parleur 5W. Rotation 180°. WiFi 6.","de":"Verwandeln Sie jede Wand in Ihr Kino. Native 1080P mit 4K, 330 ANSI Lumen, Android 11. Autofokus. 5W Lautsprecher. 180° Rotation. WiFi 6.","pt":"Transforme qualquer parede no seu cinema. 1080P nativo 4K, 330 ANSI lumens, Android 11. Foco automático. Alto-falante 5W. Rotação 180°. WiFi 6.","it":"Trasforma qualsiasi parete nel tuo cinema. 1080P nativo 4K, 330 ANSI lumen, Android 11. Messa a fuoco automatica. Altoparlante 5W. Rotazione 180°. WiFi 6."}',
  149.99, 199.99,
  '{}', 'Proyectores', ARRAY['proyector','4k','android','portatil','magcubic'],
  999, true, 'BEST SELLER', 4.8, 140,
  'proyector-magcubic-hy310-4k-android',
  'Proyector Magcubic HY310 4K Android 11 | Aizüa','Proyector portátil 1080P con Android 11, WiFi 6 y enfoque automático. Envío gratis a Europa.','proyector portatil 4k android smart',
  NOW(), NOW()
),

-- 2. PROYECTOR MAGCUBIC HY300 PRO
(
  '1005010171418964',
  '{"es":"Proyector Magcubic HY300 Pro 8K — Android 14, WiFi 6, Bluetooth 5.4","en":"Magcubic HY300 Pro 8K Projector — Android 14, WiFi 6, BT 5.4","fr":"Projecteur Magcubic HY300 Pro 8K — Android 14, WiFi 6","de":"Magcubic HY300 Pro 8K Projektor — Android 14, WiFi 6","pt":"Projetor Magcubic HY300 Pro 8K — Android 14, WiFi 6","it":"Proiettore Magcubic HY300 Pro 8K — Android 14, WiFi 6"}',
  '{"es":"El proyector más avanzado de la gama HY300. Android 14 con soporte 8K, procesador Allwinner H726, Bluetooth 5.4 y WiFi 6 doble banda. Resolución nativa 1280x720P con compatibilidad 8K. 290 ANSI lúmenes. Diseño ultracompacto y ligero, perfecto para viajes.","en":"The most advanced HY300 projector. Android 14 with 8K support, Allwinner H726, BT 5.4, dual WiFi 6. Native 1280x720P with 8K support. 290 ANSI lumens. Ultra-compact, perfect for travel.","fr":"Le projecteur HY300 le plus avancé. Android 14, 8K, WiFi 6. 290 lumens. Ultra-compact.","de":"Der fortschrittlichste HY300. Android 14, 8K, WiFi 6. 290 Lumen. Ultra-kompakt.","pt":"O HY300 mais avançado. Android 14, 8K, WiFi 6. 290 lumens. Ultra-compacto.","it":"L\'HY300 più avanzato. Android 14, 8K, WiFi 6. 290 lumen. Ultra-compatto."}',
  109.99, 149.99,
  '{}', 'Proyectores', ARRAY['proyector','8k','android14','magcubic','compact'],
  999, true, 'NEW', 4.7, 89,
  'proyector-magcubic-hy300-pro-8k-android14',
  'Proyector Magcubic HY300 Pro 8K Android 14 | Aizüa','Proyector compacto con Android 14 y soporte 8K. WiFi 6 y Bluetooth 5.4. Envío gratis.','proyector 8k android 14 magcubic compacto',
  NOW(), NOW()
),

-- 3. AURICULARES CONDUCCIÓN ÓSEA X10
(
  '1005009911214609',
  '{"es":"Auriculares Deportivos Conducción Ósea X10 — 32GB MP3, IPX8, Bluetooth 5.3","en":"X10 Bone Conduction Sports Headphones — 32GB MP3, IPX8, BT 5.3","fr":"Écouteurs Sport Conduction Osseuse X10 — MP3 32Go, IPX8, BT 5.3","de":"X10 Knochenleitungs-Kopfhörer — 32GB MP3, IPX8, BT 5.3","pt":"Fones Condução Óssea X10 — MP3 32GB, IPX8, BT 5.3","it":"Cuffie Conduzione Ossea X10 — MP3 32GB, IPX8, BT 5.3"}',
  '{"es":"Tecnología de conducción ósea que transmite el sonido a través de los huesos del pómulo, dejando los oídos libres. Certificación IPX8: sumergibles hasta 2 metros, perfectos para natación. 32GB MP3 integrado sin necesidad de teléfono. HIFI Bass Music. Bluetooth 5.3.","en":"Bone conduction technology transmits sound through cheekbones, ears stay free. IPX8: submersible 2m, perfect for swimming. 32GB built-in MP3. HIFI Bass. Bluetooth 5.3.","fr":"Conduction osseuse, oreilles libres. IPX8, 2m. 32Go MP3. HIFI Bass. BT 5.3.","de":"Knochenleitung, Ohren frei. IPX8, 2m. 32GB MP3. HIFI Bass. BT 5.3.","pt":"Condução óssea, ouvidos livres. IPX8, 2m. 32GB MP3. HIFI Bass. BT 5.3.","it":"Conduzione ossea, orecchie libere. IPX8, 2m. 32GB MP3. HIFI Bass. BT 5.3."}',
  89.99, 119.99,
  '{}', 'Audio', ARRAY['auriculares','conduccion osea','natacion','ipx8','mp3','deportes'],
  999, true, 'HOT', 4.6, 312,
  'auriculares-conduccion-osea-x10-ipx8-32gb',
  'Auriculares Conducción Ósea X10 IPX8 32GB MP3 | Aizüa','Auriculares de conducción ósea impermeables IPX8 con 32GB MP3 integrado. Perfectos para natación.','auriculares conduccion osea natacion ipx8 bluetooth',
  NOW(), NOW()
),

-- 4. ALLPOWERS R600
(
  '1005008564519949',
  '{"es":"ALLPOWERS R600 — Estación de Energía Portátil 299Wh LiFePO4, 600W AC","en":"ALLPOWERS R600 — 299Wh LiFePO4 Portable Power Station, 600W AC","fr":"ALLPOWERS R600 — Station Énergie Portable 299Wh LiFePO4, 600W","de":"ALLPOWERS R600 — Tragbare Powerstation 299Wh LiFePO4, 600W","pt":"ALLPOWERS R600 — Estação de Energia 299Wh LiFePO4, 600W","it":"ALLPOWERS R600 — Stazione Energia Portatile 299Wh LiFePO4, 600W"}',
  '{"es":"Batería LiFePO4 de 299Wh con más de 3000 ciclos — dura 10 veces más que el litio convencional. Dos salidas AC de 600W (pico 1200W). Carga de 0 a 100% en 1 hora. Compatible con paneles solares. Perfecta para camping, autocaravana y emergencias.","en":"299Wh LiFePO4 with 3000+ cycles. Two 600W AC outputs (1200W peak). 0-100% in 1 hour. Solar compatible. Perfect for camping, RV, emergencies.","fr":"LiFePO4 299Wh, 3000+ cycles. 600W AC x2 (1200W pic). Charge en 1h. Compatible solaire.","de":"LiFePO4 299Wh, 3000+ Zyklen. 600W AC x2 (1200W). Ladung in 1h. Solarkompatibel.","pt":"LiFePO4 299Wh, 3000+ ciclos. 600W AC x2 (1200W). Carrega em 1h. Compatível solar.","it":"LiFePO4 299Wh, 3000+ cicli. 600W AC x2 (1200W). Ricarica in 1h. Solare."}',
  349.99, 449.99,
  '{}', 'Energía', ARRAY['estacion energia','lifepo4','camping','solar','portatil','bateria'],
  999, true, NULL, 4.8, 203,
  'allpowers-r600-estacion-energia-299wh-lifepo4',
  'ALLPOWERS R600 299Wh Estación Energía Portátil | Aizüa','Estación de energía portátil 299Wh LiFePO4 con 600W AC. Ideal para camping y emergencias.','estacion energia portatil lifepo4 camping solar',
  NOW(), NOW()
),

-- 5. XIAOMI REDMI WATCH 5
(
  '1005003212270630',
  '{"es":"Xiaomi Redmi Watch 5 — Smartwatch Llamadas Bluetooth, Pantalla 2\" AMOLED","en":"Xiaomi Redmi Watch 5 — Bluetooth Calling Smartwatch, 2\" AMOLED","fr":"Xiaomi Redmi Watch 5 — Montre Connectée Bluetooth, AMOLED 2\"","de":"Xiaomi Redmi Watch 5 — Smartwatch Bluetooth, 2\" AMOLED","pt":"Xiaomi Redmi Watch 5 — Smartwatch Bluetooth, AMOLED 2\"","it":"Xiaomi Redmi Watch 5 — Smartwatch Bluetooth, AMOLED 2\""}',
  '{"es":"Pantalla de 2\" alta resolución. Llamadas telefónicas directas vía Bluetooth. Monitorización continua de ritmo cardíaco y SpO2. Más de 100 modos deportivos. Resistencia 5ATM. Compatible con Android e iOS.","en":"2\" high-res display. Direct Bluetooth calls. Continuous heart rate and SpO2. 100+ sports modes. 5ATM water resistance. Android and iOS.","fr":"Écran 2\" haute résolution. Appels Bluetooth. Fréquence cardiaque et SpO2. 100+ modes. 5ATM.","de":"2\" Display. Bluetooth-Anrufe. Herzfrequenz und SpO2. 100+ Modi. 5ATM.","pt":"Tela 2\". Chamadas Bluetooth. Frequência cardíaca e SpO2. 100+ modos. 5ATM.","it":"Display 2\". Chiamate Bluetooth. Frequenza cardiaca e SpO2. 100+ modalità. 5ATM."}',
  79.99, 109.99,
  '{}', 'Wearables', ARRAY['smartwatch','xiaomi','bluetooth','llamadas','deportes','salud'],
  999, true, 'NEW', 4.7, 445,
  'xiaomi-redmi-watch-5-smartwatch-bluetooth',
  'Xiaomi Redmi Watch 5 Smartwatch Bluetooth | Aizüa','Xiaomi Redmi Watch 5 con llamadas Bluetooth, pantalla AMOLED 2\" y más de 100 modos deportivos.','xiaomi redmi watch 5 smartwatch bluetooth amoled',
  NOW(), NOW()
),

-- 6. PANEL SOLAR FLEXIBLE
(
  '1005007425600001',
  '{"es":"Panel Solar Flexible Monocristalino 12V — Impermeable para Barco y Autocaravana","en":"Flexible Monocrystalline Solar Panel 12V — Waterproof for Boat and RV","fr":"Panneau Solaire Flexible 12V — Étanche pour Bateau et Camping-Car","de":"Flexibles Solarpanel 12V — Wasserdicht für Boot und Wohnmobil","pt":"Painel Solar Flexível 12V — Impermeável para Barco e Trailer","it":"Pannello Solare Flessibile 12V — Impermeabile per Barca e Camper"}',
  '{"es":"Panel solar monocristalino flexible de alta eficiencia para superficies curvas. Resistente al agua e impactos. Conector MC4 estándar. Ligero y enrollable. Disponible de 100W a 600W.","en":"High-efficiency flexible monocrystalline panel for curved surfaces. Waterproof. MC4 connector. Lightweight and rollable. 100W to 600W.","fr":"Panneau monocristallin flexible haute efficacité. Étanche. Connecteur MC4. 100W à 600W.","de":"Flexibles monokristallines Panel. Wasserdicht. MC4. 100W bis 600W.","pt":"Painel monocristalino flexível. À prova d\'água. MC4. 100W a 600W.","it":"Pannello monocristallino flessibile. Impermeabile. MC4. 100W a 600W."}',
  119.99, 159.99,
  '{}', 'Energía', ARRAY['panel solar','flexible','12v','barco','autocaravana','camping'],
  999, true, NULL, 4.5, 178,
  'panel-solar-flexible-monocristalino-12v',
  'Panel Solar Flexible Monocristalino 12V 100W-600W | Aizüa','Panel solar flexible impermeable para barco y autocaravana. De 100W a 600W. Envío gratis.','panel solar flexible 12v barco autocaravana impermeable',
  NOW(), NOW()
),

-- 7. SOPORTE TRÍPODE MAGCUBIC
(
  '1005007542155658',
  '{"es":"Soporte Trípode Universal Magcubic — Compatible HY300 Pro, HY310, HY320","en":"Magcubic Universal Tripod Stand — For HY300 Pro, HY310, HY320","fr":"Support Trépied Universel Magcubic — HY300 Pro, HY310, HY320","de":"Magcubic Universal-Stativ — HY300 Pro, HY310, HY320","pt":"Suporte Tripé Universal Magcubic — HY300 Pro, HY310, HY320","it":"Supporto Treppiede Universale Magcubic — HY300 Pro, HY310, HY320"}',
  '{"es":"Soporte portátil extensible para proyectores mini. Altura ajustable. Material ligero para viajes. Compatible con todos los modelos HY y mini proyectores con rosca 1/4\". Plegable en segundos.","en":"Portable extendable stand for mini projectors. Adjustable height. Lightweight for travel. Compatible with all HY models and 1/4\" thread projectors. Folds in seconds.","fr":"Support extensible pour mini projecteurs. Hauteur réglable. Léger. Compatible HY. Filettage 1/4\".","de":"Ausziehbarer Ständer für Mini-Projektoren. Höhenverstellbar. Leicht. HY-kompatibel. 1/4\" Gewinde.","pt":"Suporte extensível para mini projetores. Altura ajustável. Leve. Compatível HY. Rosca 1/4\".","it":"Supporto estensibile per mini proiettori. Altezza regolabile. Leggero. Compatibile HY. 1/4\"."}',
  34.99, 49.99,
  '{}', 'Accesorios', ARRAY['tripode','soporte','magcubic','proyector','viaje'],
  999, true, NULL, 4.6, 67,
  'soporte-tripode-universal-magcubic',
  'Soporte Trípode Universal Magcubic Proyector | Aizüa','Soporte trípode extensible para proyectores Magcubic HY300 Pro, HY310 y HY320. Ligero y portátil.','soporte tripode magcubic proyector universal',
  NOW(), NOW()
);

-- Añadir policy para lectura pública
CREATE POLICY IF NOT EXISTS "Public read active products"
ON products FOR SELECT
USING (active = true);

-- Verificar inserción
SELECT slug, price, category, badge FROM products ORDER BY created_at DESC;
