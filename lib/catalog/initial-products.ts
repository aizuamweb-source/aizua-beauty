// lib/catalog/initial-products.ts
// Aizua — Catálogo inicial: 20 productos listos para importar a Supabase
// Ejecutar con: npx tsx lib/catalog/seed.ts
// O llamar a POST /api/ali-import con cada URL de AliExpress

// INSTRUCCIONES DE USO:
// 1. Busca cada producto en AliExpress con las palabras clave indicadas
// 2. Copia la URL del producto que te parezca mejor (más ventas, mejor rating)
// 3. Llama a POST /api/ali-import con esa URL
// 4. El agente Content generará las descripciones en 6 idiomas automáticamente

export const INITIAL_CATALOG = [

  // ── AUDIO ──
  {
    searchQuery:  "wireless headphones active noise cancelling 40db",
    category:     "Audio",
    badge:        "BEST SELLER",
    targetPrice:  89.99,
    keywords:     ["auriculares cancelacion ruido", "headphones anc", "casque antibruit"],
    notes:        "Buscar: >1000 ventas, rating >4.5, incluya estuche y cable USB-C",
  },
  {
    searchQuery:  "tws earbuds noise cancelling bluetooth 5.3",
    category:     "Audio",
    badge:        "HOT",
    targetPrice:  49.99,
    keywords:     ["auriculares inalambricos baratos", "tws earbuds", "écouteurs sans fil"],
    notes:        "Buscar: ANC, IPX5, autonomía >6h por carga",
  },
  {
    searchQuery:  "portable bluetooth speaker waterproof bass",
    category:     "Audio",
    badge:        "BEST SELLER",
    targetPrice:  39.99,
    keywords:     ["altavoz bluetooth portatil", "enceinte bluetooth", "bluetooth lautsprecher"],
    notes:        "Buscar: IPX7, 360°, >12h batería",
  },

  // ── CARGA Y ENERGÍA ──
  {
    searchQuery:  "3 in 1 wireless charger magsafe stand",
    category:     "Charging",
    badge:        "NEW",
    targetPrice:  59.99,
    keywords:     ["cargador inalambrico 3 en 1", "chargeur sans fil", "wireless ladestation"],
    notes:        "Compatible MagSafe iPhone, Apple Watch, AirPods simultáneo",
  },
  {
    searchQuery:  "power bank 26800mah 65w usb-c pd fast charge",
    category:     "Charging",
    badge:        "BEST SELLER",
    targetPrice:  69.99,
    keywords:     ["bateria portatil 65w", "powerbank usb-c", "banque d energie"],
    notes:        "PD 65W para cargar portátiles, pantalla LED porcentaje",
  },
  {
    searchQuery:  "gan charger 100w usb-c multiport",
    category:     "Charging",
    badge:        "HOT",
    targetPrice:  44.99,
    keywords:     ["cargador gan 100w", "chargeur rapide multi port", "gan ladegerät"],
    notes:        "Tecnología GaN, 4 puertos mínimo, plegable",
  },

  // ── CONECTIVIDAD ──
  {
    searchQuery:  "usb-c hub 12 in 1 4k hdmi 100w pd",
    category:     "Connectivity",
    badge:        "NEW",
    targetPrice:  79.99,
    keywords:     ["hub usb-c mac", "concentrateur usb", "usb-c hub macbook"],
    notes:        "HDMI 4K@60Hz, lector SD, ethernet, mínimo 10 puertos",
  },
  {
    searchQuery:  "wifi extender repeater wifi 6 mesh",
    category:     "Connectivity",
    badge:        "NEW",
    targetPrice:  54.99,
    keywords:     ["extensor wifi 6", "repeteur wifi", "wlan verstaerker"],
    notes:        "WiFi 6 o WiFi 6E, cobertura >300m², fácil setup",
  },
  {
    searchQuery:  "magnetic car phone holder magsafe vent",
    category:     "Connectivity",
    badge:        "BEST SELLER",
    targetPrice:  34.99,
    keywords:     ["soporte movil coche magnetico", "support voiture magsafe", "kfz halterung"],
    notes:        "MagSafe compatible, rejilla ventilación, rotación 360°",
  },

  // ── CÁMARA Y VÍDEO ──
  {
    searchQuery:  "4k action camera waterproof wifi stabilizer",
    category:     "Camera",
    badge:        "HOT",
    targetPrice:  99.99,
    keywords:     ["camara accion 4k barata", "camera action 4k", "action kamera"],
    notes:        "4K@60fps, EIS estabilización, pantalla táctil trasera",
  },
  {
    searchQuery:  "usb condenser microphone cardioid studio",
    category:     "Camera",
    badge:        "NEW",
    targetPrice:  64.99,
    keywords:     ["microfono usb podcast", "microphone usb condensateur", "usb mikrofon"],
    notes:        "Cardioide, brazo incluido o compatible, plug-and-play",
  },

  // ── ESCRITORIO Y PRODUCTIVIDAD ──
  {
    searchQuery:  "laptop stand adjustable aluminum cooling",
    category:     "Desk",
    badge:        "HOT",
    targetPrice:  54.99,
    keywords:     ["soporte portatil aluminio", "support pc portable", "laptop staender"],
    notes:        "Aluminio, plegable, compatible 10-17 pulgadas",
  },
  {
    searchQuery:  "rgb gaming mouse pad xxl desk mat",
    category:     "Desk",
    badge:        "HOT",
    targetPrice:  44.99,
    keywords:     ["alfombrilla gaming rgb xxl", "tapis souris gaming", "gaming mauspad"],
    notes:        "XXL >800x400mm, RGB perimetral, carga inalámbrica si posible",
  },
  {
    searchQuery:  "mechanical keyboard tkl wireless bluetooth rgb",
    category:     "Desk",
    badge:        "BEST SELLER",
    targetPrice:  89.99,
    keywords:     ["teclado mecanico inalambrico", "clavier mecanique sans fil", "mechanische tastatur"],
    notes:        "TKL, triple modo (Bluetooth/2.4G/USB), switches incluidos",
  },
  {
    searchQuery:  "wireless mouse silent ergonomic 4000dpi",
    category:     "Desk",
    badge:        "NEW",
    targetPrice:  44.99,
    keywords:     ["raton inalambrico silencioso", "souris sans fil silencieuse", "kabellose maus"],
    notes:        "Silent clicks, recargable USB-C, DPI ajustable",
  },
  {
    searchQuery:  "monitor light bar screen lamp dimming",
    category:     "Lighting",
    badge:        "NEW",
    targetPrice:  49.99,
    keywords:     ["lampara monitor barra luz", "lampe moniteur", "monitor lichtleiste"],
    notes:        "Sin reflejos en pantalla, temperatura color ajustable, USB-C",
  },

  // ── WEARABLES ──
  {
    searchQuery:  "smart watch fitness tracker blood oxygen gps",
    category:     "Wearables",
    badge:        "BEST SELLER",
    targetPrice:  74.99,
    keywords:     ["reloj inteligente barato", "montre connectee sport", "smartwatch fitness"],
    notes:        ">10 días batería, GPS integrado, SpO2, notificaciones",
  },
  {
    searchQuery:  "bluetooth tracker finder wallet keys airtag",
    category:     "Wearables",
    badge:        "NEW",
    targetPrice:  29.99,
    keywords:     ["localizador bluetooth cartera", "localisateur bluetooth", "bluetooth tracker"],
    notes:        "Compatible iOS y Android, reemplazable batería, ultra-delgado",
  },

  // ── HOGAR INTELIGENTE ──
  {
    searchQuery:  "led strip lights smart wifi rgb music sync",
    category:     "Lighting",
    badge:        "HOT",
    targetPrice:  34.99,
    keywords:     ["tiras led rgb wifi", "ruban led connecte", "led streifen smart"],
    notes:        ">5m, sincronización música, compatible Alexa/Google",
  },
  {
    searchQuery:  "screen cleaner kit spray microfiber electronics",
    category:     "Accessories",
    badge:        "NEW",
    targetPrice:  24.99,
    keywords:     ["kit limpieza pantallas", "kit nettoyage ecran", "bildschirmreiniger"],
    notes:        "Spray sin alcohol, paño microfibra incluido, packaging premium",
  },
];

// ── RESUMEN DEL CATÁLOGO ──
export const CATALOG_SUMMARY = {
  total:      INITIAL_CATALOG.length,
  categories: [...new Set(INITIAL_CATALOG.map(p => p.category))],
  avgTarget:  Math.round(INITIAL_CATALOG.reduce((s, p) => s + p.targetPrice, 0) / INITIAL_CATALOG.length * 100) / 100,
  badges: {
    BEST_SELLER: INITIAL_CATALOG.filter(p => p.badge === "BEST SELLER").length,
    HOT:         INITIAL_CATALOG.filter(p => p.badge === "HOT").length,
    NEW:         INITIAL_CATALOG.filter(p => p.badge === "NEW").length,
  },
};

// console.log("Catálogo inicial:", CATALOG_SUMMARY);
// → { total: 20, categories: ['Audio','Charging','Connectivity','Camera','Desk','Lighting','Wearables','Accessories'],
//     avgTarget: 56.99, badges: { BEST_SELLER: 8, HOT: 7, NEW: 8 } }
