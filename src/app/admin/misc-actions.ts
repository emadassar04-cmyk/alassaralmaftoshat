'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireOwner, requireStaff } from '@/lib/admin'

type R = { ok?: boolean; error?: string }
const uuid = z.string().uuid()

// ---------- coupons ----------
const Coupon = z.object({
  code: z.string().min(3).max(30).regex(/^[A-Za-z0-9_-]+$/, 'الكود: حروف إنجليزية وأرقام فقط'), kind: z.enum(['percent', 'fixed']),
  value: z.coerce.number().positive().max(100000), min_order: z.coerce.number().min(0).max(1000000).default(0),
  max_uses: z.preprocess((v) => (v === '' || v == null ? null : Number(v)), z.number().int().positive().nullable()),
  expires: z.string().optional(),
})
export async function createCoupon(_: R | undefined, fd: FormData): Promise<R> {
  const { sb } = await requireStaff()
  const p = Coupon.safeParse(Object.fromEntries(fd))
  if (!p.success) return { error: p.error.issues[0]?.message ?? 'بيانات غير صحيحة' }
  if (p.data.kind === 'percent' && p.data.value > 100) return { error: 'النسبة لا تتجاوز 100' }
  const { error } = await sb.from('coupons').insert({ code: p.data.code.toUpperCase(), kind: p.data.kind, value: p.data.value, min_order: p.data.min_order, max_uses: p.data.max_uses,
    expires_at: p.data.expires ? new Date(`${p.data.expires}T23:59:59+03:00`).toISOString() : null })
  if (error) return { error: error.code === '23505' ? 'هذا الكود موجود مسبقاً' : 'تعذّر إنشاء الكوبون' }
  revalidatePath('/admin/coupons'); return { ok: true }
}
export async function toggleCoupon(fd: FormData) {
  const { sb } = await requireStaff(); const id = uuid.parse(fd.get('id'))
  await sb.from('coupons').update({ is_active: fd.get('active') === '1' }).eq('id', id); revalidatePath('/admin/coupons')
}
export async function deleteCoupon(fd: FormData) {
  const { sb } = await requireStaff(); await sb.from('coupons').delete().eq('id', uuid.parse(fd.get('id'))); revalidatePath('/admin/coupons')
}

// ---------- reviews ----------
export async function setReview(fd: FormData) {
  const { sb } = await requireStaff(); const id = uuid.parse(fd.get('id')); const s = z.enum(['approved', 'rejected', 'pending', 'delete']).parse(fd.get('s'))
  if (s === 'delete') await sb.from('reviews').delete().eq('id', id); else await sb.from('reviews').update({ status: s }).eq('id', id)
  revalidatePath('/admin/reviews'); revalidatePath('/product', 'layout')
}

// ---------- blog ----------
const Post = z.object({ id: uuid.nullable(), title: z.string().min(2).max(160), slug: z.string().min(2).max(80).regex(/^[\p{L}\p{N}-]+$/u, 'الرابط: حروف وأرقام وشرطات فقط'),
  excerpt: z.string().max(300).default(''), body: z.string().min(1).max(20000), published: z.boolean() })
export async function savePost(raw: unknown): Promise<R & { id?: string }> {
  const { sb } = await requireStaff(); const p = Post.safeParse(raw)
  if (!p.success) return { error: p.error.issues[0]?.message ?? 'بيانات غير صحيحة' }
  const row = { title: p.data.title, slug: p.data.slug, excerpt: p.data.excerpt, body: p.data.body, published: p.data.published }
  const q = p.data.id ? sb.from('posts').update(row).eq('id', p.data.id).select('id').single() : sb.from('posts').insert(row).select('id').single()
  const { data, error } = await q
  if (error || !data) return { error: error?.code === '23505' ? 'هذا الرابط مستخدم' : 'تعذّر الحفظ' }
  revalidatePath('/admin/blog'); revalidatePath('/blog'); revalidatePath(`/blog/${p.data.slug}`); return { ok: true, id: data.id }
}
export async function deletePost(fd: FormData) { const { sb } = await requireStaff(); await sb.from('posts').delete().eq('id', uuid.parse(fd.get('id'))); revalidatePath('/admin/blog'); revalidatePath('/blog') }

// ---------- users (owner) ----------
export async function setStaffRole(_: R | undefined, fd: FormData): Promise<R> {
  const { sb } = await requireOwner()
  const p = z.object({ email: z.string().email(), role: z.enum(['owner', 'supervisor']), name: z.string().max(80).optional(), active: z.enum(['1', '0']).default('1') }).safeParse(Object.fromEntries(fd))
  if (!p.success) return { error: 'الإيميل أو الدور غير صحيح' }
  const { error } = await sb.rpc('owner_set_role', { p_email: p.data.email, p_role: p.data.role, p_name: p.data.name || undefined, p_active: p.data.active === '1' })
  if (error) return { error: error.message.includes('user_not_found') ? 'لا يوجد مستخدم بهذا الإيميل. أنشئه أولاً من Supabase → Authentication → Add user' : error.message.includes('cannot_change_self') ? 'لا يمكنك تعطيل نفسك أو خفض دورك' : 'تعذّر الحفظ' }
  revalidatePath('/admin/users'); return { ok: true }
}

// ---------- settings (owner) ----------
const Branch = z.object({ id: uuid, name: z.string().min(2).max(80), address: z.string().max(200), whatsapp: z.string().max(20), phone: z.string().max(20), hours: z.string().max(120), map_url: z.string().max(500).refine((v) => v === '' || /^https?:\/\//.test(v), 'رابط الخريطة يبدأ بـ https://'), is_active: z.boolean() })
export async function saveBranch(raw: unknown): Promise<R> {
  const { sb } = await requireOwner(); const p = Branch.safeParse(raw)
  if (!p.success) return { error: p.error.issues[0]?.message ?? 'بيانات غير صحيحة' }
  const { id, ...rest } = p.data
  const wa = rest.whatsapp.replace(/\D/g, ''); if (rest.whatsapp && wa.length < 9) return { error: 'رقم واتساب غير صحيح' }
  const intl = wa ? (wa.startsWith('0') ? `+970${wa.slice(1)}` : `+${wa}`) : ''
  const { error } = await sb.from('branches').update({ ...rest, whatsapp: intl }).eq('id', id)
  if (error) return { error: 'تعذّر الحفظ' }
  revalidatePath('/', 'layout'); revalidatePath('/admin/settings'); return { ok: true }
}
const Settings = {
  home: z.object({ headline: z.string().min(2).max(60), tagline: z.string().min(2).max(80), badge: z.string().max(120) }),
  payment_accounts: z.record(z.string(), z.object({ account: z.string().max(80), holder: z.string().max(80).default('') })),
  meta_pixel_id: z.string().regex(/^(\d{5,20})?$/, 'رقم Pixel أرقام فقط'),
  testimonials: z.array(z.object({ name: z.string().min(1).max(60), text: z.string().min(1).max(300), place: z.string().max(60).default('') })).max(12),
} as const
export async function saveSetting(key: string, value: unknown): Promise<R> {
  const { sb } = await requireOwner()
  const schema = (Settings as Record<string, z.ZodType>)[key]
  if (!schema) return { error: 'إعداد غير معروف' }
  const p = schema.safeParse(value); if (!p.success) return { error: p.error.issues[0]?.message ?? 'بيانات غير صحيحة' }
  const { error } = await sb.from('store_settings').upsert({ key, value: p.data, is_public: true, updated_at: new Date().toISOString() })
  if (error) return { error: 'تعذّر الحفظ' }
  revalidatePath('/', 'layout'); return { ok: true }
}
