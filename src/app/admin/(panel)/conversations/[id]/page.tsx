import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireOwner, dt, STATUS_AR, STATUS_TONE } from '@/lib/admin'
import { fmt } from '@/lib/format'
import { PrintButton } from '@/components/admin/OrderForms'

export const metadata: Metadata = { title: 'محادثة', robots: { index: false } }
export const dynamic = 'force-dynamic'
export default async function Conversation(props: PageProps<'/admin/conversations/[id]'>) {
  const { id } = await props.params
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound()
  const { sb } = await requireOwner()
  const { data: c } = await sb.from('bot_conversations').select('*').eq('id', id).maybeSingle(); if (!c) notFound()
  const [{ data: msgs }, { data: orders }] = await Promise.all([
    sb.from('bot_messages').select('id, role, body, sent_at').eq('conversation_id', id).order('sent_at').limit(2000),
    c.phone ? sb.from('orders').select('id, number, status, total, created_at').eq('phone', c.phone).order('created_at', { ascending: false }).limit(10) : Promise.resolve({ data: [] as { id: string; number: string; status: string; total: number; created_at: string }[] })])
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><Link href="/admin/conversations" className="a-muted underline no-print">← المحادثات</Link>
        <h1 className="a-h1">{c.customer_name ?? c.external_id}</h1><p className="a-muted">{c.channel === 'telegram' ? 'تليجرام' : 'واتساب'}{c.phone && <> · <span dir="ltr">{c.phone}</span></>} · {msgs?.length ?? 0} رسالة</p></div><PrintButton /></div>
      {orders && orders.length > 0 && <section className="a-card"><h2 className="mb-2 font-semibold">طلبات هذا الزبون (بنفس رقم الجوال)</h2><ul className="flex flex-wrap gap-2">{orders.map((o) => <li key={o.id}><Link href={`/admin/orders/${o.id}`} className="a-btn !min-h-8">{o.number} · {fmt(o.total)} · <span className={`a-pill ${STATUS_TONE[o.status]}`}>{STATUS_AR[o.status]}</span></Link></li>)}</ul></section>}
      <section className="a-card space-y-3" aria-label="الرسائل">
        {msgs?.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'bot' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${m.role === 'bot' ? 'rounded-es-sm bg-[#e8f3e6]' : 'rounded-ee-sm bg-[#f1e7d2]'}`}>
              <p className="mb-0.5 text-[10px] font-semibold text-[var(--a-mute)]">{m.role === 'bot' ? '🤖 البوت' : (c.customer_name ?? 'الزبون')}</p>{m.body}<p className="mt-1 text-[10px] text-[var(--a-mute)]">{dt(m.sent_at)}</p></div></div>))}
        {!msgs?.length && <p className="a-muted py-8 text-center">لا رسائل</p>}</section>
    </>
  )
}
