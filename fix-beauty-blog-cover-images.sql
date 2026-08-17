-- =============================================================
-- FIX: Blog cover_image incorrectas en posts de beauty
-- Ejecutar en: https://supabase.com/dashboard/project/nxcnykpsooolxruwmifu/sql
-- =============================================================
-- Primero: ver qué cover_images hay actualmente en posts beauty
SELECT slug, keyword, LEFT(cover_image, 100) as cover_image_preview
FROM public.blog_posts
WHERE brand = 'beauty' AND status = 'published'
ORDER BY created_at DESC;

-- =============================================================
-- Luego: NULL-ificar las que son logos de AizuaTec o fallback incorrecto.
-- El código de blog/page.tsx asignará automáticamente la imagen
-- beauty adecuada según keyword/slug.
-- =============================================================
UPDATE public.blog_posts
SET cover_image = NULL
WHERE brand = 'beauty'
  AND status = 'published'
  AND cover_image IS NOT NULL
  AND (
    cover_image ILIKE '%logo_aizuatec%'
    OR cover_image ILIKE '%logo_aizualabs%'
    OR cover_image ILIKE '%_fallback/logo%'
    OR cover_image ILIKE '%social-images/_fallback%'
    OR cover_image ILIKE '%aizuatec.jpg%'
    OR cover_image ILIKE '%aizuatec.png%'
  )
RETURNING slug, keyword, cover_image;
-- Si el UPDATE devuelve 0 filas, las imágenes malas ya no están en Supabase
-- (puede que ya estén solo en caché de Next.js → tras el deploy se corrigen solas).
