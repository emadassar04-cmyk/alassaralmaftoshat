'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireStaff } from '@/lib/admin'

type R = { ok?: boolean; error?: string }
const img = z.string().max(500).refine((v) => v === '' || v.startsWith('/img/') || /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\//.test(v), 'صورة غير صالحة')
const Cat = z.object({
  id: z.string().uuid().nullable(), name: z.string().trim().min(2, 'اسم القسم قصير').max(60),
  slug: z.string().trim().min(2).max(60).regex(/^[\p{L}\p{N}-]+$/u, 'الرابط: حروف وأرقام وشرطات فقط'),
  description: z.string().max(200).default(''), image_url: img.default(''), is_visible: z.boolean(), sort: z.number().int().min(0).max(9999),
})
const done = () => { revalidatePath('/admin/categories'); revalidatePath('/', 'layout') }

export async function saveCategory(raw: unknown): Promise<R> {
  const { sb } = await requireStaff()
  const p = Cat.safeParse(raw); if (!p.success) return { error: p.error.issues[0]?.message ?? 'بيانات غير صحيحة' }
  const { id, ...row } = p.data
  const data = { ...row, description: row.description || null, image_url: row.image_url || null }
  const { error } = id ? await sb.from('categories').update(data).eq('id', id) : await sb.from('categories').insert(data)
  if (error) return { error: error.code === '23505' ? 'هذا الرابط مستخدم لقسم آخر' : 'تعذّر الحفظ' }
  done(); return { ok: true }
}
export async function deleteCategory(id: string): Promise<R> {
  const { sb } = await requireStaff()
  const { count } = await sb.from('products').select('id', { count: 'exact', head: true }).eq('category_id', z.string().uuid().parse(id))
  if (count) return { error: `في هذا القسم ${count} منتج. انقلهم لقسم آخر أو أخفِ القسم بدل حذفه.` }
  const { error } = await sb.from('categories').delete().eq('id', id)
  if (error) return { error: 'تعذّر الحذف' }
  done(); return { ok: true }
}
export async function moveCategory(id: string, dir: -1 | 1): Promise<R> {
  const { sb } = await requireStaff()
  const { data } = await sb.from('categories').select('id, sort').order('sort').order('name')
  const list = data ?? []; const i = list.findIndex((c) => c.id === id); const j = i + dir
  if (i < 0 || j < 0 || j >= list.length) return { ok: true }
  ;[list[i], list[j]] = [list[j], list[i]]
  for (const [k, c] of list.entries()) if (c.sort !== (k + 1) * 10) await sb.from('categories').update({ sort: (k + 1) * 10 }).eq('id', c.id)
  done(); return { ok: true }
}
