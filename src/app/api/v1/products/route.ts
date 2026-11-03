import { NextResponse } from 'next/server'
import { requireApiKey } from '@/lib/api-auth'
import { getProducts } from '@/lib/data'
export const dynamic = 'force-dynamic'
export async function GET(req: Request) {
  const d = await requireApiKey(req); if (d) return d
  const items = (await getProducts()).map((p) => ({
    id: p.id, slug: p.slug, name: p.name, description: p.description, category: p.categories?.name ?? null, is_custom: p.is_custom, price: p.sale_price ?? p.base_price, regular_price: p.base_price,
    on_sale: p.sale_price !== null, in_stock: p.is_custom ? true : p.product_variants.some((v) => v.stock > 0),
    variants: p.product_variants.map((v) => ({ id: v.id, label: v.label, color: v.color, size: v.size, fabric: v.fabric, price: v.price ?? p.sale_price ?? p.base_price, stock: p.is_custom ? null : v.stock })),
    measurement_fields: p.measurement_schema?.fields.map((f) => ({ label: f.label, type: f.type, options: f.options ?? null })) ?? null, url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/product/${p.slug}`,
  }))
  return NextResponse.json({ ok: true, count: items.length, products: items })
}
