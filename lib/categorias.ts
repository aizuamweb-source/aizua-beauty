/**
 * categorias.ts — las categorías de AizuaBeauty, en un solo sitio (s293)
 * ======================================================================
 *
 * Estaban dentro de `app/[locale]/coleccion/[categoria]/page.tsx`. Salen de ahí
 * porque ahora las necesita también el CTA del blog (`lib/blog-cta.ts`), y dos
 * tablas de categorías se separan: el CTA acabaría enlazando a un slug que la
 * página de colección ya no reconoce, o sea un 404 silencioso.
 *
 * ⚠️ Se probó primero lo más pequeño —dejarlas en la página y solo exportarlas—
 * y **Next.js lo rechaza**: el chequeo de tipos generado para una ruta no
 * admite exports arbitrarios desde un `page.tsx` (TS2344). De ahí este módulo.
 *
 * `CATEGORY_MAP` y `CATEGORY_META` viajan VERBATIM desde la página. Es un
 * movimiento, no una reescritura.
 */

// URL slug → DB category name
export const CATEGORY_MAP: Record<string, string> = {
  "skincare":    "Skincare",
  "suplementos": "Suplementos",
  "corporal":    "Corporal",
  "capilar":     "Capilar",
  "bolsos":      "Bolsos",
  "perfumes":    "Perfumes",
  "accesorios":  "Accesorios",
};

// SEO metadata per category per locale
export const CATEGORY_META: Record<string, Record<string, { title: string; desc: string; keywords: string[] }>> = {
  "skincare": {
    es: { title: "Cuidado Facial y Labial Online", desc: "Cuidado facial y labial: cremas, bálsamos hidratantes y brillos de labios seleccionados. Envío gratis a España y toda la Unión Europea.", keywords: ["crema facial comprar online", "bálsamo labial hidratante", "brillo de labios mate", "cuidado facial mujer EU", "cosmética online España"] },
    en: { title: "Facial & Lip Care Online", desc: "Facial and lip care: creams, hydrating balms and lip glosses, hand-picked. Free shipping to Spain and across the European Union.", keywords: ["face cream buy online", "hydrating lip balm", "matte lip gloss", "facial care women EU", "cosmetics online EU"] },
    fr: { title: "Soins Visage et Lèvres en Ligne", desc: "Soins visage et lèvres: crèmes, baumes hydratants et gloss sélectionnés. Livraison gratuite en Espagne et dans toute l'UE.", keywords: ["crème visage acheter en ligne", "baume à lèvres hydratant", "gloss mat", "soin visage femme EU"] },
    de: { title: "Gesichts- und Lippenpflege Online", desc: "Gesichts- und Lippenpflege: Cremes, feuchtigkeitsspendende Balsame und Lipglosse. Kostenloser Versand nach Spanien und in die ganze EU.", keywords: ["Gesichtscreme online kaufen", "Lippenbalsam feuchtigkeitsspendend", "matter Lipgloss", "Gesichtspflege Damen EU"] },
  },
  "suplementos": {
    es: { title: "Complementos de Bienestar", desc: "Complementos de bienestar para tu rutina diaria. Categoría en preparación: estamos seleccionando referencias antes de publicarlas. Envío gratis EU.", keywords: ["complementos bienestar mujer EU", "suplementos online España", "bienestar rutina diaria"] },
    en: { title: "Wellness Supplements", desc: "Wellness supplements for your daily routine. Category in preparation: we are selecting references before publishing them. Free EU shipping.", keywords: ["wellness supplements women EU", "supplements online EU", "daily wellness routine"] },
    fr: { title: "Compléments Bien-être", desc: "Compléments bien-être pour votre routine quotidienne. Catégorie en préparation: nous sélectionnons les références. Livraison gratuite UE.", keywords: ["compléments bien-être femme EU", "compléments en ligne UE", "routine bien-être"] },
    de: { title: "Wellness-Nahrungsergänzung", desc: "Wellness-Nahrungsergänzung für den Alltag. Kategorie in Vorbereitung: wir wählen die Produkte noch aus. Kostenloser EU-Versand.", keywords: ["Wellness Nahrungsergänzung Damen EU", "Nahrungsergänzung online EU"] },
  },
  "corporal": {
    es: { title: "Cuidado Corporal Online", desc: "Cuidado corporal: cremas, aceites y accesorios para la piel. Categoría en preparación: estamos seleccionando referencias. Envío gratis España y EU.", keywords: ["crema corporal comprar online", "aceite corporal mujer EU", "cuidado corporal online España"] },
    en: { title: "Body Care Online", desc: "Body care: creams, oils and skin accessories. Category in preparation: we are selecting references. Free shipping to Spain and the EU.", keywords: ["body cream buy online", "body oil women EU", "body care online EU"] },
    fr: { title: "Soins Corps en Ligne", desc: "Soins corps: crèmes, huiles et accessoires. Catégorie en préparation: nous sélectionnons les références. Livraison gratuite UE.", keywords: ["crème corps acheter en ligne", "huile corporelle femme EU", "soin corps en ligne"] },
    de: { title: "Körperpflege Online", desc: "Körperpflege: Cremes, Öle und Zubehör. Kategorie in Vorbereitung: wir wählen die Produkte noch aus. Kostenloser EU-Versand.", keywords: ["Körpercreme online kaufen", "Körperöl Damen EU", "Körperpflege online EU"] },
  },
  "capilar": {
    es: { title: "Cuidado del Cabello y Accesorios", desc: "Cuidado del cabello: cepillos masajeadores, accesorios de peinado y herramientas para el cuero cabelludo. Envío gratis a España y toda la EU.", keywords: ["cepillo masajeador cuero cabelludo", "accesorios cabello mujer EU", "cepillo pelo comprar online", "herramientas peinado mujer"] },
    en: { title: "Hair Care & Accessories", desc: "Hair care: scalp massage brushes, styling accessories and tools for the scalp. Free shipping to Spain and across the EU.", keywords: ["scalp massage brush EU", "hair accessories women EU", "hair brush buy online", "styling tools women"] },
    fr: { title: "Soins Cheveux et Accessoires", desc: "Soins cheveux: brosses de massage du cuir chevelu, accessoires de coiffage et outils. Livraison gratuite en Espagne et dans toute l'UE.", keywords: ["brosse massage cuir chevelu", "accessoires cheveux femme EU", "brosse à cheveux en ligne"] },
    de: { title: "Haarpflege und Zubehör", desc: "Haarpflege: Kopfhaut-Massagebürsten, Styling-Zubehör und Werkzeuge. Kostenloser Versand nach Spanien und in die ganze EU.", keywords: ["Kopfhaut Massagebürste", "Haarzubehör Damen EU", "Haarbürste online kaufen"] },
  },
  "bolsos": {
    es: { title: "Bolsos Mujer Moda | Mini Bolsos y Tote Bags EU", desc: "Bolsos de moda para mujer con envío gratis a toda la EU. Mini bolsos de cadena, tote bags de canvas y más. Diseños virales y exclusivos.", keywords: ["bolsos mujer baratos", "mini bolso cadena", "tote bag canvas mujer", "bolsos moda EU"] },
    en: { title: "Women's Fashion Bags | Free EU Shipping", desc: "Trendy women's fashion bags with free EU shipping: mini chain bags, canvas tote bags and clutches. Viral and exclusive designs for every occasion.", keywords: ["women's bags EU", "mini chain bag", "canvas tote bag", "cheap bags EU"] },
    fr: { title: "Sacs Femme Mode | Livraison UE", desc: "Sacs de mode pour femme avec livraison gratuite dans toute l'UE: mini sacs à chaîne, tote bags en toile et pochettes. Designs exclusifs et tendance.", keywords: ["sacs femme mode", "mini sac chaîne", "tote bag", "livraison Europe"] },
    de: { title: "Damen Modetaschen | EU-Versand", desc: "Modische Damentaschen mit kostenlosem Versand in der ganzen EU: Mini-Kettentaschen, Canvas-Tote-Bags und Clutches. Exklusive, trendige Designs.", keywords: ["Damentaschen EU", "Mini Kettentasche", "Canvas Tote Bag günstig"] },
  },
  "perfumes": {
    es: { title: "Perfumes y Fragancias Mujer", desc: "Perfumes y fragancias para mujer. Categoría en preparación: estamos seleccionando referencias antes de publicarlas. Envío gratis a toda la EU.", keywords: ["perfume mujer comprar online", "fragancias mujer EU", "perfumes online España"] },
    en: { title: "Women's Perfumes & Fragrances", desc: "Perfumes and fragrances for women. Category in preparation: we are selecting references before publishing them. Free EU shipping.", keywords: ["women's perfume buy online", "fragrances women EU", "perfumes online EU"] },
    fr: { title: "Parfums et Fragrances Femme", desc: "Parfums et fragrances pour femme. Catégorie en préparation: nous sélectionnons les références. Livraison gratuite UE.", keywords: ["parfum femme acheter en ligne", "fragrances femme UE", "parfums en ligne"] },
    de: { title: "Damen Parfums und Düfte", desc: "Parfums und Düfte für Damen. Kategorie in Vorbereitung: wir wählen die Produkte noch aus. Kostenloser EU-Versand.", keywords: ["Damenparfum online kaufen", "Düfte Damen EU", "Parfums online EU"] },
  },
  "accesorios": {
    es: { title: "Bisutería y Accesorios Mujer Hipoalergénicos", desc: "Accesorios y bisutería de moda para mujer: pendientes, pulseras y collares de acero inoxidable hipoalergénico. Envío gratis a toda la EU.", keywords: ["bisutería mujer tendencia EU", "pendientes acero inoxidable hipoalergénico", "accesorios moda mujer baratos", "clip pelo mujer tendencia", "pulseras collares mujer EU"] },
    en: { title: "Hypoallergenic Jewellery for Women EU", desc: "Women's fashion accessories and jewellery: hypoallergenic stainless steel earrings, bracelets and necklaces. Free EU shipping on all orders.", keywords: ["women's fashion accessories EU", "hypoallergenic earrings EU", "cheap women's jewellery", "hair clip women EU", "bracelets necklaces EU"] },
    fr: { title: "Bijoux Femme Hypoallergéniques Tendance", desc: "Accessoires et bijoux mode pour femme avec livraison gratuite dans l'UE: boucles d'oreilles et colliers hypoallergéniques tendance.", keywords: ["bijoux femme mode EU", "boucles d'oreilles acier inoxydable", "accessoires mode femme pas cher", "clip cheveux tendance", "livraison Europe"] },
    de: { title: "Damen Modezubehör & Schmuck | EU-Versand", desc: "Damen Modezubehör und Schmuck mit kostenlosem Versand in der EU. Hypoallergene Edelstahl-Ohrringe, Armbänder, Halsketten und Haarklammern.", keywords: ["Damen Modezubehör EU", "hypoallergene Ohrringe Edelstahl", "günstiger Damenschmuck EU", "Haarklammer Damen Trend"] },
  },
};

// Relleno de descripción por locale. Frases neutras, las mismas que la tienda
// tech ya publica: se usan SOLO cuando CATEGORY_META no está traducido a ese
// idioma (hoy pt e it), para no servir texto en español a quien no lo pidió.
export const DESC_FILLER: Record<string, string> = {
  es: "Compra online con envío rápido y atención en español.",
  en: "Shop online with fast shipping and English-language support.",
  fr: "Achetez en ligne avec une livraison rapide dans toute l'UE.",
  de: "Online einkaufen mit schnellem Versand in die gesamte EU.",
  pt: "Compre online com envio rápido para toda a UE.",
  it: "Acquista online con spedizione rapida in tutta l'UE.",
};
