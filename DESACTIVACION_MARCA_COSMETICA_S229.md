# Desactivación de la marca de cosmética externa — sesión 229 (29/07/2026)

Este documento es el **manual de reversión**. La marca no se ha eliminado: se ha desactivado.
Todo lo de abajo se puede deshacer sin pérdida de datos.

> Nota de privacidad: el nombre del partner y la URL del partner shop **no** aparecen en este
> repo (regla 🔴 de `CLAUDE.md`: el apellido real de Miguel no puede publicarse). El detalle de
> compliance y precios vive fuera del repo, en
> `C:\Users\aizua\AizuaLabs\_docs\backups_ringana_s229\RINGANA_COMPLIANCE_Y_PRECIOS.md`
> (repo de planificación local, sin remoto).

## 1. Qué se desactivó

| Capa | Estado antes | Estado ahora |
|---|---|---|
| Productos en Supabase | 20 filas `supplier='ringana'`, `active=true` | `active=false` (las filas **siguen ahí**, con precios, imágenes y textos) |
| Catálogo beauty activo | 30 productos | 10 productos (AliExpress) |
| Landing de marca `/[locale]/ringana` | 6 locales en 200, indexada, en el sitemap | **301 → `/[locale]/tienda`**. El fichero `app/[locale]/ringana/page.tsx` sigue en el repo intacto (86 productos hardcodeados) |
| Posts monográficos del blog | 5 publicados | `status='archived'` + 301 a un post afín |
| Posts con menciones de pasada | 8 publicados con la marca | Publicados, con el texto saneado (ES y EN) |
| Imágenes de producto | `public/ringana/*.jpg` (20, servidas en `/ringana/*.jpg`) | movidas a `_assets_marca_desactivada_s229/` (fuera de `public/`, **no** se sirven) |
| Agente de atención (`/api/chat`) | proveedor activo, con su política de envío/devolución | fuera de `ACTIVE_PROVIDERS`; el bloque `PROVIDERS.ringana` sigue en el fichero, inerte |
| `llms.txt` | descripción centrada en la marca | reescrito |

## 2. Cómo revertirlo (orden recomendado)

```sql
-- 1. Reactivar los 20 productos
UPDATE public.products SET active = true WHERE supplier = 'ringana';

-- 2. Republicar los 5 posts monográficos
UPDATE public.blog_posts SET status = 'published'
WHERE brand = 'beauty' AND slug IN (
  'ringana-productos-opiniones-20260713',
  'ringana-partner-ventajas-20260609',
  'ringana-fresh-crema-hidratante-corporal',
  'ringana-overnight-crema-noche-retinal',
  'fresh-skin-perfection-ringana-crema-antiedad'
);
```

Y en el repo:

1. `git mv _assets_marca_desactivada_s229 public/ringana` — devuelve las 20 imágenes al árbol servido
   (los `products.images` apuntan a `https://beauty.aizualabs.com/ringana/<slug>.jpg`, así que sin
   este paso las fichas reactivadas saldrían sin imagen).
2. `next.config.mjs` → borrar el bloque marcado `── s229 · DESACTIVACIÓN DE LA MARCA EXTERNA ──`
   (8 redirects: la landing, los 5 posts, las 20 fichas de producto y `/ringana/:file*`).
3. `components/nav/MainNav.tsx` → devolver la entrada de nav (desktop y bottom-nav móvil).
4. `app/api/chat/route.ts` → volver a añadir `"ringana"` a `ACTIVE_PROVIDERS`.
5. `app/sitemap.ts` → volver a declarar las URLs de la landing (solo `es`/`en`, ver comentario).
6. Vercel: definir `RINGANA_PARTNER_URL` (el código ya no trae fallback hardcodeado, ver punto 4).
7. `public/llms.txt` y los textos de la web: recuperarlos del commit anterior a s229.

El backup de los datos ANTES del cambio está en
`C:\Users\aizua\AizuaLabs\_docs\backups_ringana_s229\`:
`products_ringana_ANTES.json` (20 filas completas) y `blog_posts_beauty_ANTES.json` (35 posts).

**El `fetchCache = "force-no-store"` de `coleccion/[categoria]`, `blog/[slug]`, `blog`, `tienda` y la
home NO forma parte de la desactivación: NO lo quites al revertir.** Es el arreglo de un bug real
(commit `ee8901c`): el Data Cache de Next persiste entre deployments, así que al desactivar los 20
productos las colecciones siguieron pintándolos y un post siguió sirviendo el texto viejo, con
`Age: 0` y `X-Vercel-Cache: MISS` — render fresco, lectura de Supabase cacheada. Es la misma clase de
bug que s224 en `/api/merchant-feed`. Si lo quitas, la próxima vez que desactives o edites algo en
Supabase volverás a servir lo viejo hasta una hora sin enterarte.

> **Al verificar cualquier cambio de datos en producción:** no basta con desplegar. Haz `curl` a la
> página real con cache-buster. Y si ves `Age: 0`, eso descarta el CDN pero **no** el Data Cache.

## 3. Lo que NO se tocó a propósito

- **`finance_rows`**: las facturas y gastos reales del proveedor (ene–abr 2026) siguen intactos.
  Son registro fiscal, no contenido de marketing.
- **`aizua-business/index.html`** (panel interno): mantiene la regex que clasifica facturas de
  proveedor por nombre de fichero, y la clave interna `ringana` de la entidad AizuaBeauty. Si se
  quita, deja de clasificar las facturas históricas.
- **`orders` / `beauty_orders`**: pedidos históricos, sin cambios.
- **`app/[locale]/ringana/page.tsx`**: se conserva completo. Es el activo más costoso de rehacer
  (86 productos con textos ES/EN, JSON-LD, FAQ).

## 4. Cambio de política de claims (mismo commit, motivo distinto)

Al desactivar la marca, el catálogo activo pasó a ser sólo AliExpress: crema facial de ácido
kójico, bálsamo labial, brillo de labios, cepillo capilar, joyería y organizadores. **No podemos
respaldar** que sean naturales, veganos, cruelty-free, sin parabenos ni certificados. Por decisión
de Miguel se retiraron esos claims de toda la web:

- `100% Natural` (stat del hero y badge del footer) · `Solo marcas naturales` (ticker)
- El relleno de meta description de **toda** ficha de producto, que añadía
  `"Cosmética Natural sin Parabenos"` + `"Vegano y cruelty-free."` a cualquier producto
- Titles y OG de home/tienda/colecciones: `Cosmética Natural` → `Belleza y Accesorios de Mujer`
- `sobre-nosotros`: `Sin tóxicos`, `sin PEGs`, `ingredientes naturales certificados`
- FAQ: la pregunta "¿tiene parabenos?" (respondía "No") → "¿dónde veo la composición?"
- 6 productos **de AliExpress** cuyos `seo_title`/`seo_description` atribuían falsamente la marca
  ajena, más `Envío 24h` (el real es 5-10 días) y `Elimina manchas oscuras` (afirmación
  cuasi-terapéutica, prohibida en cosmética UE)

El contenido **educativo** del blog (qué son los parabenos, qué hace la vitamina C, cómo leer un
INCI) se mantiene: lo que se retiró es el claim sobre lo que AizuaBeauty vende.

Si en el futuro se sourcean productos con certificación real, los claims se pueden recuperar
**por producto**, con la certificación del fabricante como respaldo — no como copy global.

## 5. Generadores blindados (para que no vuelva solo)

`master_runner.py` corre al arrancar el PC. Sin esto, el trabajo se deshacía en el siguiente
arranque. Parcheados en el Business System y en los repos web:

| Fichero | Qué hacía |
|---|---|
| `generate_beauty_blog_post.py` | pool de keywords con 2 de la marca + prompt que pedía mencionarla |
| `state/beauty_blog_keywords.txt` | cola con la keyword de la marca |
| `gsc_keyword_picker.py` | la marca en el filtro de keywords relevantes de GSC |
| `ag46_instagram_publish.py` | brief de marca de @aizuabeauty nombrándola |
| `pipeline_product_upload.py` | `store_context` describía la tienda como su distribuidora |
| `Aizua-store/app/api/social-content/route.ts` | inyectaba `Marca: Ringana (premium)` en el prompt del social de beauty |
| `aizua-beauty/app/api/social-content/route.ts` | prompt de "cosmética natural" |
| `aizua-beauty/app/api/newsletter/route.ts` | asuntos con "belleza natural" |

Los `.neq('supplier','ringana')` de `merchant-feed`, `newsletter`, `social-content` y la home
**se conservan a propósito**: son la red de seguridad si algún día se reactivan los productos.

## 6. Pendiente de Miguel (no automatizable)

- **Bio de Instagram `@aizuabeauty`** y **`@sophie.marem`**: mencionan la marca. Editar a mano.
- **Descripción del repo `aizuamweb-source/aizua-beauty`** en GitHub: la menciona.
- **Google Merchant Center**: forzar «Actualizar» el feed para reingesta inmediata de los 6
  productos con SEO corregido (si no, reingesta sola a las 0:00).
- **Google Search Console**: pedir reindexación; ~52 URLs han pasado a 301.
- **Vercel**: las env vars `RINGANA_PARTNER_URL` y `NEXT_PUBLIC_RINGANA_PARTNER_URL` ya no las lee
  ningún componente. Se pueden borrar, o dejarlas para la reversión.
- **Decidir** si repoblar las 3 colecciones que se quedaron sin producto (Suplementos, Corporal,
  Perfumes). Hoy se auto-marcan `noindex` y no aparecen en el sitemap ni enlazadas — no rompen
  nada, pero tampoco aportan.
