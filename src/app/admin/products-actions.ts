'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireOwner, requireStaff } from '@/lib/admin'

const num = z.number().finite()
const Field = z.object({
  key: z.string().min(1).max(40), label: z.string().min(1).max(80), type: z.enum(['number', 'select', 'text']),
  options: z.array(z.string().min(1).max(60)).max(20).optional(), hint: z.string().max(200).optional(),
  showIf: z.object({ key: z.string(), in: z.array(z.string()) }).optional(),
})
const Payload = z.object({
  id: z.string().uuid().nullable(),
  name: z.string().min(2).max(120), slug: z.string().min(2).max(80).regex(/^[\p{L}\p{N}-]+$/u, 'الرابط: حروف وأرقام وشرطات فقط'),
  description: z.string().max(4000).default(''), category_id: z.string().uuid().nullable(),
  base_price: num.min(0).max(1000000), sale_price: num.min(0).max(1000000).nullable(),
  is_custom: z.boolean(), is_bestseller: z.boolean(), status: z.enum(['visible', 'hidden']), sort: z.number().int().min(0).max(9999),
  measurement_schema: z.object({ diagram: z.enum(['curtains', 'majlis', 'batana']).optional(), fields: z.array(Field).max(30) }).nullable(),
  variants: z.array(z.object({ id: z.string().uuid().nullable(), label: z.string().min(1).max(100), color: z.string().max(40).default(''), size: z.string().max(40).default(''), fabric: z.string().max(60).default(''),
    price: num.min(0).max(1000000).nullable(), stock: z.number().int().min(0).max(100000), is_active: z.boolean(), sort: z.number().int() })).max(60),
  images: z.array(z.object({ id: z.string().uuid().nullable(), url: z.string().url().max(500), alt: z.string().max(160).default('') })).max(12),
})
export type ProductPayload = z.infer<typeof Payload>
type R = { ok?: boolean; id?: string; error?: string }

export async function saveProduct(raw: unknown): Promise<R> {
  const { sb } = await requireStaff()
  const p = Payload.safeParse(raw)
  if (!p.success) return { error: p.error.issues[0]?.message ?? 'بيانات غير صحيحة' }
  const d = p.data
  if (d.sale_price !== null && d.sale_price >= d.base_price) return { error: 'سعر العرض يجب أن يكون أقل من السعر الأساسي' }
  const row = { name: d.name, slug: d.slug, description: d.description, category_id: d.category_id, base_price: d.base_price, sale_price: d.sale_price,
    is_custom: d.is_custom, is_bestseller: d.is_bestseller, status: d.status, sort: d.sort, measurement_schema: d.is_custom ? d.measurement_schema : null }
  let id = d.id
  if (id) { const { error } = await sb.from('products').update(row).eq('id', id); if (error) return { error: error.code === '23505' ? 'هذا الرابط مستخدم لمنتج آخر' : 'تعذّر حفظ المنتج' } }
  else { const { data, error } = await sb.from('products').insert(row).select('id').single(); if (error || !data) return { error: error?.code === '23505' ? 'هذا الرابط مستخدم لمنتج آخر' : 'تعذّر إنشاء المنتج' }; id = data.id }

  // variants: delete removed, update existing, insert new
  const { data: oldV } = await sb.from('product_variants').select('id').eq('product_id', id)
  const keepV = new Set(d.variants.map((v) => v.id).filter(Boolean))
  const delV = (oldV ?? []).map((v) => v.id).filter((x) => !keepV.has(x))
  if (delV.length) await sb.from('product_variants').delete().in('id', delV)
  for (const [i, v] of d.variants.entries()) {
    const vr = { product_id: id, label: v.label, color: v.color || null, size: v.size || null, fabric: v.fabric || null, price: v.price, stock: v.stock, is_active: v.is_active, sort: i }
    const { error } = v.id ? await sb.from('product_variants').update(vr).eq('id', v.id) : await sb.from('product_variants').insert(vr)
    if (error) return { error: `تعذّر حفظ الخيار «${v.label}»` }
  }
  const { data: oldI } = await sb.from('product_images').select('id').eq('product_id', id)
  const keepI = new Set(d.images.map((v) => v.id).filter(Boolean))
  const delI = (oldI ?? []).map((v) => v.id).filter((x) => !keepI.has(x))
  if (delI.length) await sb.from('product_images').delete().in('id', delI)
  for (const [i, im] of d.images.entries()) {
    const ir = { product_id: id, url: im.url, alt: im.alt || null, sort: i }
    const { error } = im.id ? await sb.from('product_images').update(ir).eq('id', im.id) : await sb.from('product_images').insert(ir)
    if (error) return { error: 'تعذّر حفظ الصور' }
  }
  revalidatePath('/admin/products'); revalidatePath('/shop'); revalidatePath('/'); revalidatePath(`/product/${d.slug}`)
  return { ok: true, id: id ?? undefined }
}

export async function deleteProduct(id: string): Promise<R> {
  const { sb } = await requireOwner()
  if (!z.string().uuid().safeParse(id).success) return { error: 'معرّف غير صحيح' }
  const { error } = await sb.from('products').delete().eq('id', id)
  if (error) return { error: 'تعذّر الحذف' }
  revalidatePath('/admin/products'); revalidatePath('/shop'); revalidatePath('/'); return { ok: true }
}
