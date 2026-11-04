'use server'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { z } from 'zod'
import { requireStaff } from '@/lib/admin'
import { dispatchPending } from '@/lib/webhooks'

type R = { ok?: boolean; error?: string }
const STATUSES = ['new', 'confirmed', 'ready', 'received', 'cancelled'] as const

export async function saveOrderNote(_: R | undefined, fd: FormData): Promise<R> {
  const { sb } = await requireStaff()
  const id = z.string().uuid().safeParse(fd.get('id')); if (!id.success) return { error: 'طلب غير صحيح' }
  const note = String(fd.get('note') ?? '').trim().slice(0, 2000)
  const { error } = await sb.from('orders').update({ staff_notes: note || null }).eq('id', id.data)
  if (error) return { error: 'تعذّر حفظ الملاحظة' }
  revalidatePath(`/admin/orders/${id.data}`); return { ok: true }
}

export async function setOrderStatus(_: R | undefined, fd: FormData): Promise<R> {
  const { sb } = await requireStaff()
  const p = z.object({ id: z.string().uuid(), status: z.enum(STATUSES) }).safeParse({ id: fd.get('id'), status: fd.get('status') })
  if (!p.success) return { error: 'بيانات غير صحيحة' }
  const { error } = await sb.from('orders').update({ status: p.data.status }).eq('id', p.data.id)
  if (error) return { error: error.message.includes('stock') || error.code === '23514' ? 'المخزون لا يكفي لتأكيد هذا الطلب' : 'تعذّر تحديث الحالة' }
  after(() => dispatchPending())
  revalidatePath('/admin', 'layout'); return { ok: true }
}

export async function setItemPrice(_: R | undefined, fd: FormData): Promise<R> {
  const { sb } = await requireStaff()
  const raw = String(fd.get('price') ?? '').trim()
  const price = raw === '' ? null : Number(raw)
  const p = z.object({ id: z.string().uuid(), price: z.number().min(0).max(100000).nullable() }).safeParse({ id: fd.get('id'), price })
  if (!p.success) return { error: 'السعر غير صحيح' }
  const { error } = await sb.from('order_items').update({ custom_price: p.data.price }).eq('id', p.data.id)
  if (error) return { error: 'تعذّر حفظ السعر' }
  revalidatePath('/admin', 'layout'); return { ok: true }
}

export async function markReviewRequested(id: string): Promise<R> {
  const { sb } = await requireStaff()
  const p = z.string().uuid().safeParse(id); if (!p.success) return { error: 'طلب غير صحيح' }
  await sb.from('orders').update({ review_requested_at: new Date().toISOString() }).eq('id', p.data).eq('status', 'received')
  revalidatePath('/admin/orders'); revalidatePath(`/admin/orders/${p.data}`); return { ok: true }
}
