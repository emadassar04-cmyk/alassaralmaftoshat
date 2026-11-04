'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireStaff } from '@/lib/admin'

type R = { ok?: boolean; error?: string }
const O = z.object({ product_id: z.string().uuid(), sale_price: z.number().positive().max(1000000), starts: z.string().datetime().nullable(), ends: z.string().datetime().nullable(), featured: z.boolean() })
const done = (slug?: string) => { revalidatePath('/admin/offers'); revalidatePath('/admin/products'); revalidatePath('/'); revalidatePath('/shop'); if (slug) revalidatePath(`/product/${slug}`) }

export async function saveOffer(raw: unknown): Promise<R> {
  const { sb } = await requireStaff()
  const p = O.safeParse(raw); if (!p.success) return { error: 'بيانات العرض غير صحيحة' }
  const { data: prod } = await sb.from('products').select('base_price, slug, is_custom').eq('id', p.data.product_id).maybeSingle()
  if (!prod) return { error: 'المنتج غير موجود' }
  if (p.data.sale_price >= Number(prod.base_price)) return { error: `سعر العرض لازم يكون أقل من السعر الأساسي (${prod.base_price} ₪)` }
  if (p.data.starts && p.data.ends && Date.parse(p.data.starts) >= Date.parse(p.data.ends)) return { error: 'نهاية العرض يجب أن تكون بعد بدايته' }
  if (p.data.ends && Date.parse(p.data.ends) <= Date.now()) return { error: 'تاريخ النهاية مضى' }
  const { error } = await sb.from('products').update({ sale_price: p.data.sale_price, sale_starts_at: p.data.starts, sale_ends_at: p.data.ends, is_featured: p.data.featured }).eq('id', p.data.product_id)
  if (error) return { error: 'تعذّر حفظ العرض' }
  done(prod.slug); return { ok: true }
}
export async function endOffer(id: string): Promise<R> {
  const { sb } = await requireStaff()
  const { data } = await sb.from('products').update({ sale_price: null, sale_starts_at: null, sale_ends_at: null }).eq('id', z.string().uuid().parse(id)).select('slug').maybeSingle()
  done(data?.slug); return { ok: true }
}
