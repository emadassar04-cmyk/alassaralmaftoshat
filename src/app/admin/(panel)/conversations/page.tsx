import type { Metadata } from 'next'
import Link from 'next/link'
import { requireOwner, dt } from '@/lib/admin'

export const metadata: Metadata = { title: 'محادثات البوت', robots: { index: false } }
export const dynamic = 'force-dynamic'
const clean = (s: string) => s.replace(/[,()%*\\]/g, ' ').trim().slice(0, 40)
export default async function Conversations(props: PageProps<'/admin/conversations'>) {
  const { sb } = await requireOwner(); const sp = await props.searchParams
  const v = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '')
  let q = sb.from('bot_conversations').select('id, channel, external_id, customer_name, phone, last_message_at').order('last_message_at', { ascending: false }).limit(100)
  if (v('channel')) q = q.eq('channel', v('channel'))
  if (clean(v('q'))) { const t = clean(v('q')); q = q.or(`customer_name.ilike.%${t}%,phone.ilike.%${t}%,external_id.ilike.%${t}%`) }
  const { data: convs } = await q
  const ids = (convs ?? []).map((c) => c.id)
  const { data: msgs } = ids.length ? await sb.from('bot_messages').select('conversation_id, body, role, sent_at').in('conversation_id', ids).order('sent_at', { ascending: false }).limit(400) : { data: [] }
  const last = new Map<string, { body: string; role: string }>(); msgs?.forEach((m) => { if (!last.has(m.conversation_id)) last.set(m.conversation_id, m) })
  return (
    <>
      <h1 className="a-h1">محادثات البوت</h1><p className="a-muted">يرسلها n8n عبر <Link href="/admin/integrations/docs" className="underline">POST /api/v1/conversations/messages</Link> من تليجرام وواتساب.</p>
      <form method="get" className="a-card flex flex-wrap items-end gap-3"><label className="a-lbl flex-1">بحث (اسم / رقم)<input name="q" defaultValue={v('q')} className="a-field mt-1" /></label>
        <label className="a-lbl">القناة<select name="channel" defaultValue={v('channel')} className="a-field mt-1"><option value="">الكل</option><option value="telegram">تليجرام</option><option value="whatsapp">واتساب</option></select></label><button className="a-btn a-btn-solid">تطبيق</button><Link href="/admin/conversations" className="a-btn">مسح</Link></form>
      <div className="a-card a-scroll !p-0"><table className="a-table"><thead><tr><th>القناة</th><th>الزبون</th><th>آخر رسالة</th><th>الوقت</th></tr></thead><tbody>
        {convs?.map((c) => <tr key={c.id}><td><span className={`a-pill ${c.channel === 'telegram' ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'}`}>{c.channel === 'telegram' ? 'تليجرام' : 'واتساب'}</span></td>
          <td><Link href={`/admin/conversations/${c.id}`} className="font-medium text-[var(--a-copper)] underline">{c.customer_name ?? c.external_id}</Link>{c.phone && <p dir="ltr" className="a-muted text-end">{c.phone}</p>}</td>
          <td className="max-w-md truncate">{last.get(c.id) ? `${last.get(c.id)!.role === 'bot' ? '🤖 ' : ''}${last.get(c.id)!.body}` : '—'}</td><td className="whitespace-nowrap">{dt(c.last_message_at)}</td></tr>)}
        {!convs?.length && <tr><td colSpan={4} className="a-muted py-10 text-center">لا محادثات بعد</td></tr>}</tbody></table></div>
    </>
  )
}
