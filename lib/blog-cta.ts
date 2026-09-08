/**
 * blog-cta.ts — a qué colección manda cada post del blog (s293)
 * =============================================================
 *
 * QUÉ RESUELVE, medido el 08/09/2026 — y en AizuaBeauty es lo más grave de las
 * cuatro marcas
 *   El post del blog NO tenía CTA: los dos únicos enlaces salientes al final
 *   del artículo eran `/{locale}/blog`. De los 34 posts publicados, **30 no
 *   tenían NINGÚN enlace comercial** (ni en el cuerpo ni al final) y ninguno
 *   enlazaba a una colección. 34 artículos escritos y 21 productos activos,
 *   sin un camino de uno a otro.
 *
 * POR QUÉ A UNA COLECCIÓN Y NO A UN PRODUCTO
 *   Porque un enlace a producto se podre y una colección se cura sola: de los
 *   28 enlaces a producto que ya existen en el cuerpo de estos posts, **14
 *   apuntan a productos INACTIVOS — exactamente la mitad**. El catálogo rota
 *   (21 activos de 60), así que el destino estable es la categoría.
 *
 * POR QUÉ SE COMPRUEBA QUE LA COLECCIÓN TIENE PRODUCTO
 *   `Suplementos`, `Corporal` y `Perfumes` están a **0 productos activos** desde
 *   que se desactivó Ringana, y siguen teniendo página de colección. Mandar ahí
 *   a un lector es un callejón sin salida, así que cada tema declara sus
 *   categorías **en orden de preferencia** y se coge la primera que de verdad
 *   tiene producto. Si ninguna lo tiene, el CTA cae a la tienda entera.
 *
 * DE DÓNDE SALE EL TEXTO
 *   De `CATEGORY_META` (`lib/categorias.ts`), que ya tiene título y descripción
 *   por categoría y por idioma, revisados y publicados. Se IMPORTA en vez de
 *   copiarse: dos tablas de categorías se separan y el CTA acabaría enlazando a
 *   un slug que la colección ya no reconoce.
 */

import {
  CATEGORY_MAP,
  CATEGORY_META,
  DESC_FILLER,
} from "@/lib/categorias";

/** Los 6 idiomas que sirve AizuaBeauty. */
export type LocaleTienda = "es" | "en" | "fr" | "de" | "pt" | "it";

/**
 * Tema del artículo → categorías candidatas, EN ORDEN DE PREFERENCIA.
 * Gana la primera regla que casa, y dentro de ella la primera categoría que
 * tenga producto activo.
 *
 * ⚠️ Un radical seguido de `\b` NO CASA NUNCA (`/\bproyector\b/` no encuentra
 * "proyectores"). O palabra completa, o el radical con sus sufijos escritos.
 */
const REGLAS: ReadonlyArray<{ clave: string; patron: RegExp; cats: string[] }> = [
  { clave: "bolsos",      patron: /\b(bolsos?|mochilas?|bandoleras?|neceser(es)?|bags?)\b/i,
    cats: ["bolsos", "accesorios"] },
  { clave: "accesorios",  patron: /\b(accesorios?|complementos?|pa[ñn]uelos?|seda|organizador(es)?|tocador|joyer[ií]a|pendientes|collares?|moda|minimalista|c[aá]psula|looks? b[aá]sicos?)\b/i,
    cats: ["accesorios", "bolsos"] },
  { clave: "capilar",     patron: /\b(capilar(es)?|cabello|pelo|champ[uú](es)?|acondicionador(es)?|caspa|alopecia)\b/i,
    cats: ["capilar", "skincare"] },
  { clave: "corporal",    patron: /\b(corporal(es)?|cuerpo|manos|pies|celulitis|estr[ií]as)\b/i,
    cats: ["corporal", "skincare"] },
  { clave: "suplementos", patron: /\b(suplementos?|col[aá]geno|vitaminas|nutricosm[eé]tica|c[aá]psulas)\b/i,
    cats: ["suplementos", "skincare"] },
  { clave: "perfumes",    patron: /\b(perfumes?|fragancias?|colonias?|aroma(s)?)\b/i,
    cats: ["perfumes", "accesorios"] },
  { clave: "skincare",    patron: /\b(skincare|s[eé]rums?|sueros?|cremas?|facial(es)?|piel|rostro|cosm[eé]tica|cosm[eé]ticos?|ingredientes?|inci|antienvejecimiento|arrugas|vitamina c|parabenos|t[oó]xicos|limpieza facial|rutina|belleza)\b/i,
    cats: ["skincare", "accesorios"] },
];

/** Categorías por defecto: lo genérico del catálogo. */
const POR_DEFECTO = ["skincare", "accesorios", "bolsos"];

export interface CtaBlog {
  /** Qué regla ganó. Para medir, no se pinta. */
  clave: string;
  href: string;
  kicker: string;
  titular: string;
  detalle: string;
  boton: string;
}

const UI: Record<LocaleTienda, { kicker: string; boton: string; tienda: string; todo: string }> = {
  es: { kicker: "Lo que encaja con este artículo", boton: "Ver la colección →", tienda: "Toda la tienda",         todo: "Ver toda la tienda →" },
  en: { kicker: "What fits this article",          boton: "See the collection →", tienda: "The whole store",      todo: "Browse the store →" },
  fr: { kicker: "Ce qui va avec cet article",      boton: "Voir la collection →", tienda: "Toute la boutique",    todo: "Voir la boutique →" },
  de: { kicker: "Passend zu diesem Artikel",       boton: "Kollektion ansehen →", tienda: "Der ganze Shop",       todo: "Zum Shop →" },
  pt: { kicker: "O que combina com este artigo",   boton: "Ver a coleção →",      tienda: "Toda a loja",          todo: "Ver a loja →" },
  it: { kicker: "Cosa si abbina a questo articolo",boton: "Vedi la collezione →", tienda: "Tutto il negozio",     todo: "Vai al negozio →" },
};

/** Categorías candidatas para un post, en orden. Expuesto para poder medirlo. */
export function categoriasCandidatas(post: {
  slug: string; keyword?: string | null; titulo?: string | null;
}): { clave: string; cats: string[] } {
  const texto = [
    post.slug.replace(/-/g, " "),
    post.keyword ?? "",
    post.titulo ?? "",
  ].join(" ");
  for (const r of REGLAS) {
    if (r.patron.test(texto)) return { clave: r.clave, cats: r.cats };
  }
  return { clave: "generico", cats: POR_DEFECTO };
}

/**
 * CTA resuelto. `activas` son los NOMBRES DE CATEGORÍA DE LA BASE que tienen
 * producto activo (p. ej. "Hogar", "Gadgets") — los pasa la página, que ya
 * habla con Supabase. Con un conjunto vacío (fallo de red al consultarlo) el
 * CTA sale apuntando a la tienda entera, que nunca está mal: se degrada, no
 * miente.
 */
export function ctaDelPost(
  post: { slug: string; keyword?: string | null; titulo?: string | null },
  locale: string,
  activas: Set<string>,
): CtaBlog {
  const loc = (["es", "en", "fr", "de", "pt", "it"].includes(locale) ? locale : "es") as LocaleTienda;
  const ui = UI[loc];
  const { clave, cats } = categoriasCandidatas(post);

  const elegida = cats.find((slug) => {
    const nombreBd = CATEGORY_MAP[slug];
    return nombreBd ? activas.has(nombreBd) : false;
  });

  if (!elegida) {
    return {
      clave: `${clave}:sin-stock`,
      href: `/${loc}/tienda`,
      kicker: ui.kicker,
      titular: ui.tienda,
      detalle: DESC_FILLER[loc] ?? DESC_FILLER.es,
      boton: ui.todo,
    };
  }

  // CATEGORY_META solo está traducido a es/en/fr/de. La página de colección, en
  // ese caso, cae al ESPAÑOL — así que un visitante portugués o italiano ve un
  // <meta> en español. Aquí NO se propaga eso: sin copy en su idioma se usa el
  // nombre de la categoría (que es casi el mismo en las seis lenguas) y el
  // relleno de `DESC_FILLER`, que sí está en los seis. Una página en portugués
  // con menos texto es mejor que una con dos frases en español.
  const meta = (CATEGORY_META[elegida] ?? {})[loc];
  const relleno = DESC_FILLER[loc] ?? DESC_FILLER.es;
  return {
    clave: `${clave}:${elegida}${meta ? "" : ":sin-traducir"}`,
    href: `/${loc}/coleccion/${elegida}`,
    // El título de CATEGORY_META es un <title> de SEO con sufijo de marca. En un
    // CTA se lee mal, así que se corta en la barra y se queda la parte que
    // nombra la categoría.
    titular: (meta?.title ?? CATEGORY_MAP[elegida] ?? elegida).split("|")[0].trim(),
    detalle: meta?.desc ?? relleno,
    kicker: ui.kicker,
    boton: ui.boton,
  };
}

/**
 * Toda categoría declarada arriba existe en `CATEGORY_MAP`. Se comprueba en
 * caliente y no en un test: si una categoría se renombra en la colección, esta
 * tabla apuntaría al vacío y el CTA caería a la tienda entera EN SILENCIO —
 * que es la forma de romperse que no se nota.
 */
export function categoriasHuerfanas(): string[] {
  const declaradas = [...REGLAS.flatMap((r) => r.cats), ...POR_DEFECTO];
  return [...new Set(declaradas)].filter((c) => !CATEGORY_MAP[c]);
}
