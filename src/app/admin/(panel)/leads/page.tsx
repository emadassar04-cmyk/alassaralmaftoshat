import type { Metadata } from 'next'
import { requireOwner, dt } from '@/lib/admin'
import { waLink } from '@/lib/format'

export const metadata: Metadata = { title: 'الأرقام (Leads)', robots: { index: false } }
export const dynamic = 'force-dynamic'
export default async function Leads() {
  const { sb } = await requireOwner()
  const { data } = await sb.from('leads').select('id, phone, source, created_at, coupons(code, used_count, max_uses, expires_at)').order('created_at', { ascending: false }).limit(500)
  return (
    <>
      <h1 className="a-h1">الأرقام (Leads)</h1><p className="a-muted">أرقام من تركوها في النافذة المنبثقة ومعها كود خصم 10% مرتبط برقمهم ويُستعمل مرة واحدة.</p>
      <div className="a-card a-scroll !p-0"><table className="a-table"><thead><tr><th>الجوال</th><th>الكود</th><th>استُخدم؟</th><th>التاريخ</th><th></th></tr></thead><tbody>
        {data?.map((l) => { const c = l.coupons as unknown as { code: string; used_count: number; max_uses: number | null; expires_at: string | null } | null
          return <tr key={l.id}><td dir="ltr" className="text-end">{l.phone}</td><td dir="ltr" className="font-mono">{c?.code}</td><td>{c && c.used_count > 0 ? <span className="a-pill bg-emerald-100 text-emerald-800">نعم</span> : <span className="a-pill bg-stone-200 text-stone-700">لا</span>}</td><td className="whitespace-nowrap">{dt(l.created_at)}</td>
            <td><a className="a-btn !min-h-8" target="_blank" rel="noopener" href={waLink(l.phone, `مرحباً من مفروشات العصار 👋 كود خصمك 10%: ${c?.code}`)}>أرسل الكود</a></td></tr> })}
        {!data?.length && <tr><td colSpan={5} className="a-muted py-8 text-center">لا أرقام بعد</td></tr>}</tbody></table></div>
    </>
  )
}
