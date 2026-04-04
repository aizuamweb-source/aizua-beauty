#!/usr/bin/env python3
"""
mirror_images_to_supabase.py
============================
Descarga todas las imágenes de productos activos desde sus URLs actuales
y las sube a Supabase Storage (bucket: product-images).
Luego actualiza la columna `images` en la tabla `products` con las nuevas
URLs permanentes de Supabase Storage.

Uso:
    pip install supabase requests --break-system-packages
    python mirror_images_to_supabase.py

Requiere variables de entorno (o editar las constantes al principio):
    SUPABASE_URL          https://nxcnykpsooolxruwmifu.supabase.co
    SUPABASE_SERVICE_KEY  <service_role key>  (NO anon key – necesita permisos de Storage)
"""

import os
import io
import sys
import time
import hashlib
import requests
from supabase import create_client, Client

# ─── CONFIG ────────────────────────────────────────────────────────────────────
SUPABASE_URL         = os.getenv("SUPABASE_URL", "https://nxcnykpsooolxruwmifu.supabase.co")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")   # ← pega tu service_role key aquí si no usas env
BUCKET_NAME          = "product-images"
PUBLIC_BASE_URL      = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    "Referer": "https://www.aliexpress.com/",
}
TIMEOUT = 20          # segundos por imagen
SLEEP_BETWEEN = 0.3   # segundos entre descargas (evita rate-limit)
# ───────────────────────────────────────────────────────────────────────────────


def get_supabase() -> Client:
    if not SUPABASE_SERVICE_KEY:
        print("❌  SUPABASE_SERVICE_KEY vacío. Edita el script o pon la variable de entorno.")
        sys.exit(1)
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def ensure_bucket(sb: Client):
    """Crea el bucket si no existe (público para que las URLs funcionen sin auth)."""
    try:
        buckets = [b.name for b in sb.storage.list_buckets()]
        if BUCKET_NAME not in buckets:
            sb.storage.create_bucket(BUCKET_NAME, options={"public": True})
            print(f"✅  Bucket '{BUCKET_NAME}' creado.")
        else:
            print(f"ℹ️   Bucket '{BUCKET_NAME}' ya existe.")
    except Exception as e:
        print(f"⚠️  No se pudo verificar/crear el bucket: {e}")


def download_image(url: str) -> bytes | None:
    try:
        r = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
        if r.status_code == 200 and len(r.content) > 5000:  # descartar placeholders <5KB
            return r.content
        print(f"   ↳ skip (status={r.status_code}, size={len(r.content)}B): {url[-50:]}")
        return None
    except Exception as e:
        print(f"   ↳ error descargando {url[-50:]}: {e}")
        return None


def upload_image(sb: Client, product_slug: str, img_index: int, img_bytes: bytes, original_url: str) -> str | None:
    """Sube la imagen y devuelve la URL pública de Supabase Storage."""
    # Detectar extensión
    ext = "jpg"
    if original_url.lower().endswith(".png"):
        ext = "png"
    elif original_url.lower().endswith(".webp"):
        ext = "webp"

    # Nombre de archivo determinista: slug/00.jpg, slug/01.jpg …
    file_path = f"{product_slug}/{img_index:02d}.{ext}"

    try:
        sb.storage.from_(BUCKET_NAME).upload(
            path=file_path,
            file=img_bytes,
            file_options={
                "content-type": f"image/{ext}",
                "upsert": "true",   # sobreescribir si ya existe
            },
        )
        public_url = f"{PUBLIC_BASE_URL}/{file_path}"
        return public_url
    except Exception as e:
        print(f"   ↳ error subiendo {file_path}: {e}")
        return None


def already_in_storage(url: str) -> bool:
    return SUPABASE_URL in url and BUCKET_NAME in url


def process_products(sb: Client, dry_run: bool = False):
    # Obtener todos los productos activos con imágenes
    res = sb.table("products").select("id, slug, images").eq("active", True).execute()
    products = res.data or []
    print(f"\n📦  Productos activos encontrados: {len(products)}\n")

    updated = 0
    skipped = 0
    errors  = 0

    for product in products:
        slug   = product["slug"]
        images = product.get("images") or []

        if not images:
            print(f"  ⚪ [{slug}] — sin imágenes, skip")
            skipped += 1
            continue

        # ¿Todas las imágenes ya están en Supabase Storage?
        if all(already_in_storage(u) for u in images):
            print(f"  ✅ [{slug}] — ya en Storage, skip")
            skipped += 1
            continue

        print(f"  🔄 [{slug}] — procesando {len(images)} imagen(es)…")
        new_images = []

        for i, url in enumerate(images):
            if already_in_storage(url):
                new_images.append(url)
                continue

            img_bytes = download_image(url)
            time.sleep(SLEEP_BETWEEN)

            if img_bytes is None:
                # Si falla la descarga, conservar la URL original (mejor que perderla)
                new_images.append(url)
                print(f"   ↳ [{i}] conservada URL original (descarga fallida)")
                errors += 1
                continue

            if dry_run:
                print(f"   ↳ [{i}] DRY-RUN: descargaría {len(img_bytes)//1024}KB → {slug}/{i:02d}.jpg")
                new_images.append(url)
                continue

            new_url = upload_image(sb, slug, i, img_bytes, url)
            if new_url:
                new_images.append(new_url)
                print(f"   ↳ [{i}] ✅ subida → {new_url}")
            else:
                new_images.append(url)
                errors += 1

        if not dry_run and new_images != images:
            try:
                sb.table("products").update({"images": new_images}).eq("id", product["id"]).execute()
                print(f"  💾 [{slug}] — base de datos actualizada con {len(new_images)} URLs de Storage")
                updated += 1
            except Exception as e:
                print(f"  ❌ [{slug}] — error actualizando DB: {e}")
                errors += 1

    print(f"\n{'─'*50}")
    print(f"✅  Actualizados : {updated}")
    print(f"⏭️   Saltados     : {skipped}")
    print(f"❌  Errores      : {errors}")
    print(f"{'─'*50}\n")


def immediate_sql_patch():
    """
    Imprime el SQL listo para pegar en Supabase SQL Editor,
    para corregir AHORA los 2 productos bloqueados con URLs verificadas.
    """
    print("""
╔══════════════════════════════════════════════════════════════════╗
║  SQL PARCHE INMEDIATO — pega en Supabase > SQL Editor > Run     ║
╚══════════════════════════════════════════════════════════════════╝

-- Panel Solar Flexible Monocristalino 12V
UPDATE products
SET images = ARRAY[
  'https://ae01.alicdn.com/kf/S5f71d26525d1464cb47dbe798060d97e4.jpg',
  'https://ae01.alicdn.com/kf/S0941f593a3044f6485e33038ad87dbb35.jpg',
  'https://ae01.alicdn.com/kf/S017100463fef4a41bfa9c7a5c127ab6e7.jpg',
  'https://ae01.alicdn.com/kf/S72c74519d97b4413b13b8937871f291aV.jpg',
  'https://ae01.alicdn.com/kf/Sf50632b630e7472086ba4dc928987680W.jpg',
  'https://ae01.alicdn.com/kf/Sd8a230cb53ff4b75a8b2f9cfcc4164271.jpg'
]
WHERE slug = 'panel-solar-flexible-monocristalino-12v';

-- Magcubic HY300 Pro 8K Android 14
UPDATE products
SET images = ARRAY[
  'https://ae01.alicdn.com/kf/S912559e6042248a28930e0a079a383f0V.jpg',
  'https://ae01.alicdn.com/kf/S81e7fb6f8d8b4500bfda91c68e5b1f81D.jpg',
  'https://ae01.alicdn.com/kf/Sc7eb17a719f54d2b829584479d0dfee3C.jpg',
  'https://ae01.alicdn.com/kf/Sd789894b63534720a4cdc6f48f88bb1a1.jpg',
  'https://ae01.alicdn.com/kf/S1fddbd7af9df4b889a72315eadb7b29al.jpg'
]
WHERE slug = 'proyector-magcubic-hy300-pro-8k-android14';

-- Verificar resultado
SELECT slug, images[1] as first_image, array_length(images,1) as total
FROM products
WHERE slug IN (
  'panel-solar-flexible-monocristalino-12v',
  'proyector-magcubic-hy300-pro-8k-android14'
);
""")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Mirror product images to Supabase Storage")
    parser.add_argument("--dry-run", action="store_true", help="Simular sin subir ni modificar DB")
    parser.add_argument("--sql-only", action="store_true", help="Solo mostrar SQL para el parche inmediato")
    args = parser.parse_args()

    if args.sql_only:
        immediate_sql_patch()
        sys.exit(0)

    immediate_sql_patch()

    sb = get_supabase()
    ensure_bucket(sb)
    process_products(sb, dry_run=args.dry_run)
