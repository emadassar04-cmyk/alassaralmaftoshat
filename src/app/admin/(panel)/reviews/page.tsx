import type { Metadata } from 'next'
import { requireStaff, dt } from '@/lib/admin'
import { setReview } from '@/app/admin/misc-actions'

export const metadata: Metadata = { title: 'التقييمات', robots: { index: false } }
export const dynamic = 'force-dynamic'
const TONE: Record<string, string> = { pending: 'bg-amber-100 text-amber-800', approved: 'bg-emerald-100 text-emerald-800', rejected: 'bg-rose-100 text-rose-800' }
const AR: Record<string, string> = { pending: 'بانتظار المراجعة', approved: 'منشور', rejected: 'مرفوض' }
export default async function Reviews() {
  const { sb } = await requireStaff()
  const { data } = await sb.from('reviews').select('id, author_name, rating, body, status, created_at, products(name)').order('status').order('created_at', { ascending: false }).limit(200)
  const btn = (id: string, s: string, l: string, cls = '') => <form action={setReview} className="inline"><input type="hidden" name="id" value={id} /><input type="hidden" name="s" value={s} /><button className={`a-btn !min-h-8 !px-3 ${cls}`}>{l}</button></form>
  return (
    <>
      <h1 className="a-h1">التقييمات</h1><p className="a-muted">لا يظهر أي تقييم للزوار إلا بعد الموافقة عليه. الزبون يقيّم من صفحة طلبه بعد حالة «مستلم».</p>
      <ul className="space-y-3">{data?.map((r) => (
        <li key={r.id} className="a-card flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><p className="font-medium">{(r.products as unknown as { name: string } | null)?.name} <span className="text-[#8f6a2e]">{'★'.repeat(r.rating)}</span></p>
          <p className="mt-1">{r.body || <span className="a-muted">بدون نص</span>}</p><p className="a-muted mt-1">{r.author_name} · {dt(r.created_at)} · <span className={`a-pill ${TONE[r.status]}`}>{AR[r.status]}</span></p></div>
          <div className="flex flex-wrap gap-2">{r.status !== 'approved' && btn(r.id, 'approved', 'موافقة', 'a-btn-solid')}{r.status !== 'rejected' && btn(r.id, 'rejected', 'رفض')}{btn(r.id, 'delete', 'حذف', 'a-btn-danger')}</div></li>))}
        {!data?.length && <li className="a-card a-muted py-10 text-center">لا تقييمات بعد</li>}</ul>
    </>
  )
}
