'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireOwner, requireStaff } from '@/lib/admin'

type R = { ok?: boolean; error?: string; message?: string }

export async function setVisitStatus(fd: FormData) {
  const { sb } = await requireStaff()
  const id = z.string().uuid().parse(fd.get('id')); const to = z.enum(['new', 'confirmed', 'done', 'cancelled']).parse(fd.get('to'))
  await sb.from('visits').update({ status: to, updated_at: new Date().toISOString() }).eq('id', id)
  revalidatePath('/admin/visits')
}

export async function saveVisitNote(fd: FormData) {
  const { sb } = await requireStaff()
  const id = z.string().uuid().parse(fd.get('id')); const note = String(fd.get('note') ?? '').trim().slice(0, 500)
  await sb.from('visits').update({ staff_notes: note || null, updated_at: new Date().toISOString() }).eq('id', id)
  revalidatePath('/admin/visits')
}

const SLOT = /^([01]\d|2[0-3]):[0-5]\d$/
export async function saveVisitSettings(_: R | undefined, fd: FormData): Promise<R> {
  const { sb } = await requireOwner()
  const slots = [...new Set(String(fd.get('slots') ?? '').split(/[,،\s]+/).map((s) => s.trim()).filter(Boolean).map((s) => (/^\d:\d\d$/.test(s) ? `0${s}` : s)))].sort()
  if (!slots.length || slots.some((s) => !SLOT.test(s))) return { error: 'اكتب الأوقات بصيغة 24 ساعة مفصولة بفواصل، مثل: 10:00, 14:30, 18:00' }
  const days = fd.getAll('days').map(Number).filter((d) => d >= 0 && d <= 6)
  if (!days.length) return { error: 'اختر يوماً واحداً على الأقل' }
  const items = [...new Set(String(fd.get('items') ?? '').split(/[,،\n]+/).map((s) => s.trim()).filter(Boolean))].slice(0, 10)
  const num = (k: string, min: number, max: number, d: number) => { const n = Math.round(Number(fd.get(k))); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d }
  const value = { enabled: fd.get('enabled') === 'on', days: [...new Set(days)].sort(), slots, capacity: num('capacity', 1, 10, 1), lead_days: num('lead_days', 0, 7, 1), horizon_days: num('horizon_days', 1, 60, 14), items: items.length ? items : ['ستائر', 'فرش عربي', 'باطنة', 'أخرى'] }
  if (value.lead_days > value.horizon_days) return { error: 'أقرب موعد لازم يكون قبل آخر موعد' }
  const { error } = await sb.from('store_settings').upsert({ key: 'visits', value, is_public: true, updated_at: new Date().toISOString() })
  if (error) return { error: 'تعذّر الحفظ' }
  revalidatePath('/admin/visits'); revalidatePath('/visit')
  return { ok: true, message: 'تم حفظ إعدادات المواعيد' }
}
