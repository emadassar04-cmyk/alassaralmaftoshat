import type { SupabaseClient } from '@supabase/supabase-js'
import { PAYMENT_AR, STATUS_AR } from './admin-consts'
import { gazaIso, isDay } from './gaza'

export type Report = { title: string; subtitle: string; columns: string[]; rows: (string | number)[][]; summary: [string, string | number][]; moneyCols: number[] }
const d = (s: string) => new Date(s).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Gaza' })

export async function buildReport(sb: SupabaseClient, type: string, from: string, to: string, branch: string): Promise<Report> {
  const range = `${isDay(from) ? from : 'البداية'} → ${isDay(to) ? to : 'اليوم'}`
  if (type === 'customers') {
    const { data } = await sb.rpc('admin_customers')
    const rows = ((data ?? []) as { phone: string; name: string; orders: number; spent: number; last_order: string }[]).map((c) => [c.name, c.phone, Number(c.orders), Number(c.spent), d(c.last_order)])
    return { title: 'تقرير الزبائن', subtitle: 'كل الفترات', columns: ['الاسم', 'الجوال', 'عدد الطلبات', 'مجموع الشراء ₪', 'آخر طلب'], rows, moneyCols: [3],
      summary: [['عدد الزبائن', rows.length], ['إجمالي المشتريات ₪', rows.reduce((n, r) => n + Number(r[3]), 0)]] }
  }
  let q = sb.from('orders').select('id, number, created_at, customer_name, phone, payment_method, status, subtotal, discount, total, branches(name), order_items(name, variant_label, qty, unit_price, custom_price)').order('created_at').limit(5000)
  if (isDay(from)) q = q.gte('created_at', gazaIso(from)); if (isDay(to)) q = q.lte('created_at', gazaIso(to, true)); if (branch) q = q.eq('branch_id', branch)
  const { data } = await q
  type O = { number: string; created_at: string; customer_name: string; phone: string; payment_method: string; status: string; subtotal: number; discount: number; total: number; branches: { name: string } | null; order_items: { name: string; variant_label: string | null; qty: number; unit_price: number; custom_price: number | null }[] }
  const orders = (data ?? []) as unknown as O[]
  const valid = orders.filter((o) => o.status !== 'cancelled')
  const byBranch = new Map<string, number>(); valid.forEach((o) => byBranch.set(o.branches?.name ?? '—', (byBranch.get(o.branches?.name ?? '—') ?? 0) + Number(o.total)))
  const summary: Report['summary'] = [['عدد الطلبات', orders.length], ['طلبات ملغية', orders.length - valid.length], ['إجمالي المبيعات ₪ (بدون الملغي)', valid.reduce((n, o) => n + Number(o.total), 0)], ...[...byBranch].map(([k, v]) => [`مبيعات ${k} ₪`, v] as [string, number])]
  if (type === 'orders') {
    const rows: (string | number)[][] = []
    for (const o of orders) for (const i of o.order_items) { const p = Number(i.custom_price ?? i.unit_price); rows.push([o.number, d(o.created_at), o.branches?.name ?? '', o.customer_name, `${i.name}${i.variant_label ? ` (${i.variant_label})` : ''}`, i.qty, p, p * i.qty, STATUS_AR[o.status]]) }
    return { title: 'تقرير تفاصيل الطلبات', subtitle: range, columns: ['الطلب', 'التاريخ', 'الفرع', 'الزبون', 'المنتج', 'الكمية', 'السعر ₪', 'المجموع ₪', 'الحالة'], rows, moneyCols: [6, 7], summary }
  }
  const rows = orders.map((o) => [o.number, d(o.created_at), o.branches?.name ?? '', o.customer_name, o.phone, PAYMENT_AR[o.payment_method], STATUS_AR[o.status], Number(o.subtotal), Number(o.discount), Number(o.total)])
  return { title: 'تقرير المبيعات', subtitle: range, columns: ['الطلب', 'التاريخ', 'الفرع', 'الزبون', 'الجوال', 'الدفع', 'الحالة', 'المجموع الفرعي ₪', 'الخصم ₪', 'الإجمالي ₪'], rows, moneyCols: [7, 8, 9], summary }
}
