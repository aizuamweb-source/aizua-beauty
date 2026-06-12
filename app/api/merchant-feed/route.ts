/**
 * Google Shopping Merchant Feed — AizuaBeauty (beauty.aizualabs.com)
 * Genera un feed RSS 2.0 con g: namespace para Google Merchant Center.
 * Excluye productos Ringana (supplier='ringana') — restricciones del programa de partner.
 * Solo productos AliExpress (supplier='aliexpress') propios de la tienda beauty.
 * Endpoint registrado en Merchant Center ID 5789444596.
 * Envío gratuito a ES, FR, IT, DE, IE, PT.
 *
 * GET /api/merchant-feed
 */

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BASE_URL = 'https://beauty.aizualabs.com'

// Mapeo categorías internas beauty → Google Product Taxonomy
const CATEGORY_MAP: Record<string, string> = {
  'Cosmética':         'Health & Beauty > Personal Care > Skin Care',
  'Skincare':          'Health & Beauty > Personal Care > Skin Care',
  'Maquillaje':        'Health & Beauty > Personal Care > Cosmetics',
  'Cabello':           'Health & Beauty > Personal Care > Hair Care',
  'Perfumes':          'Health & Beauty > Personal Care > Perfume & Cologne',
  'Moda':              'Apparel & Accessories',
  'Accesorios':        'Apparel & Accessories > Jewelry',
  'Bolsos':            'Apparel & Accessories > Handbags, Wallets & Cases > Handbags',
  'Joyería':           'Apparel & Accessories > Jewelry',
  'Complementos':      'Apparel & Accessories',
  'Bienestar':         'Health & Beauty > Health Care',
  'Cuidado':           'Health & Beauty > Personal Care',
  'Vitaminas':         'Health & Beauty > Health Care > Fitness & Nutrition',
  'Deporte':           'Sporting Goods',
  'Hogar':             'Home & Garden',
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Países con envío gratuito
const FREE_SHIPPING_COUNTRIES = ['ES', 'FR', 'IT', 'DE', 'IE', 'PT']

export async function GET() {
  const { data: products, error } = await supabase
    .from('products')
    .select(
      'slug, name_es, description, price, compare_price, images, category, rating, review_count, stock, supplier'
    )
    .eq('active', true)
    .eq('store', 'beauty')
    .neq('supplier', 'ringana') // Ringana excluído: restricciones programa partner
    .order('sort_order', { ascending: true })
    .limit(1000)

  if (error) {
    console.error('[merchant-feed beauty] Supabase error:', error.message)
    return new NextResponse('Internal error', { status: 500 })
  }

  const rows = products || []

  const items = rows
    .map((p) => {
      const title = escapeXml((p.name_es || p.slug || '').substring(0, 150))
      const desc = escapeXml(
        (p.description || p.name_es || p.slug || '').substring(0, 5000)
      )
      const img = p.images?.[0] ?? ''
      const inStock =
        p.stock === null || p.stock === undefined || p.stock > 0
      const availability = inStock ? 'in_stock' : 'out_of_stock'
      const price = Number(p.price).toFixed(2)
      const comparePrice = p.compare_price ? Number(p.compare_price).toFixed(2) : null
      const brand = escapeXml('AizuaBeauty')
      const category = escapeXml(
        CATEGORY_MAP[p.category] || 'Health & Beauty > Personal Care'
      )
      const productUrl = `${BASE_URL}/es/product/${escapeXml(p.slug)}`

      const shippingNodes = FREE_SHIPPING_COUNTRIES.map(
        (c) =>
          `      <g:shipping>
        <g:country>${c}</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
        <g:min_handling_time>1</g:min_handling_time>
        <g:max_handling_time>3</g:max_handling_time>
        <g:min_transit_time>3</g:min_transit_time>
        <g:max_transit_time>7</g:max_transit_time>
      </g:shipping>`
      ).join('\n')

      return `  <item>
      <g:id>beauty-${escapeXml(p.slug)}</g:id>
      <g:title>${title}</g:title>
      <g:description>${desc}</g:description>
      <g:link>${productUrl}</g:link>
      ${img ? `<g:image_link>${escapeXml(img)}</g:image_link>` : ''}
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${price} EUR</g:price>
      ${comparePrice ? `<g:sale_price>${price} EUR</g:sale_price>` : ''}
      <g:brand>${brand}</g:brand>
      <g:google_product_category>${category}</g:google_product_category>
      <g:identifier_exists>no</g:identifier_exists>
      ${p.rating ? `<g:product_review_count>${p.review_count || 0}</g:product_review_count>` : ''}
${shippingNodes}
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>AizuaBeauty — Cosmética Natural y Moda Femenina</title>
    <link>${BASE_URL}</link>
    <description>Cosmética natural consciente y moda femenina atemporal. Envío gratuito a Europa.</description>
${items}
  </channel>
</rss>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'X-Robots-Tag': 'noindex',
    },
  })
}
