import type { Metadata } from 'next'
import { requireOwner } from '@/lib/admin'
import { buildReport } from '@/lib/reports'
import { fmt } from '@/lib/format'
import { PrintButton } from '@/components/admin/OrderForms'

export const metadata: Metadata = { title: 'تقرير للطباعة', robots: { index: false } }
export const dynamic = 'force-dynamic'
export default async function PrintReport(props: PageProps<'/admin/reports/print'>) {
  const { sb } = await requireOwner(); const sp = await props.searchParams
  const s = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '')
  const r = await buildReport(sb, s('type'), s('from'), s('to'), s('branch'))
  return (
    <div className="bg-white p-4 text-[#222] md:p-8">
      <div className="no-print mb-4"><PrintButton /></div>
      <header className="border-b-2 border-[#8f6a2e] pb-3"><p className="font-display text-3xl text-[#8f6a2e]">مفروشات العصار</p><h1 className="text-xl font-semibold">{r.title}</h1><p className="text-sm text-[#666]">{r.subtitle}</p></header>
      <ul className="my-4 grid gap-1 text-sm sm:grid-cols-2">{r.summary.map(([k, v]) => <li key={k} className="flex justify-between border-b border-[#eee] py-1"><span>{k}</span><b>{typeof v === 'number' && k.includes('₪') ? fmt(v) : v}</b></li>)}</ul>
      <table className="w-full border-collapse text-xs"><thead><tr className="bg-[#f6f0e4]">{r.columns.map((c) => <th key={c} className="border p-1.5 text-start">{c}</th>)}</tr></thead>
        <tbody>{r.rows.map((row, i) => <tr key={i}>{row.map((c, j) => <td key={j} className="border p-1.5">{r.moneyCols.includes(j) ? Number(c).toLocaleString('en-US') : c}</td>)}</tr>)}</tbody></table>
      {!r.rows.length && <p className="py-10 text-center text-[#666]">لا بيانات في هذه الفترة</p>}
    </div>
  )
}
