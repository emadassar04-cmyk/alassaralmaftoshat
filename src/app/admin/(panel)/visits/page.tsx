import type { Metadata } from 'next'
import Link from 'next/link'
import { requireStaff } from '@/lib/admin'
import { getSetting } from '@/lib/data'
import { waLink } from '@/lib/format'
import { DEFAULT_VISITS, VISIT_STATUS_AR, addDays, dayLabel, slotLabel, type VisitConfig, type VisitStatus } from '@/lib/visits'
import { saveVisitNote, setVisitStatus } from '@/app/admin/visits-actions'
import { VisitSettingsForm } from '@/components/admin/VisitSettingsForm'

export const metadata: Metadata = { title: 'زيارات القياس', robots: { index: false } }
export const dynamic = 'force-dynamic'
const TONE: Record<VisitStatus, string> = { new: 'bg-amber-100 text-amber-800', confirmed: 'bg-emerald-100 text-emerald-800', done: 'bg-stone-200 text-stone-700', cancelled: 'bg-rose-100 text-rose-800' }
const todayGaza = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Gaza' }).format(new Date())
type V = { id: string; number: string; customer_name: string; phone: string; area: string; address: string | null; items: string[]; notes: string | null; staff_notes: string | null; visit_date: string; slot: string; status: VisitStatus; branches: { name: string } | null }

export default async function Visits(props: PageProps<'/admin/visits'>) {
  const { sb, staff } = await requireStaff()
  const sp = await props.searchParams
  const view = sp.view === 'past' ? 'past' : sp.view === 'all' ? 'all' : 'upcoming'
  const status = typeof sp.status === 'string' && sp.status in VISIT_STATUS_AR ? sp.status : ''
  const today = todayGaza()
  let q = sb.from('visits').select('id, number, customer_name, phone, area, address, items, notes, staff_notes, visit_date, slot, status, branches(name)').limit(200)
  q = view === 'upcoming' ? q.gte('visit_date', today).order('visit_date').order('slot') : view === 'past' ? q.lt('visit_date', today).order('visit_date', { ascending: false }).order('slot') : q.order('visit_date', { ascending: false }).order('slot')
  if (status) q = q.eq('status', status)
  const [{ data }, cfg, { count: pending }] = await Promise.all([q, getSetting<VisitConfig>('visits', DEFAULT_VISITS),
    sb.from('visits').select('id', { count: 'exact', head: true }).eq('status', 'new').gte('visit_date', today)])
  const rows = (data ?? []) as unknown as V[]
  const groups = rows.reduce<Record<string, V[]>>((m, r) => { (m[r.visit_date] ??= []).push(r); return m }, {})
  const confirmMsg = (v: V) => `مرحباً ${v.customer_name} 👋\nمعك مفروشات العصار (${v.branches?.name ?? ''}).\nنؤكد موعد زيارة القياس: ${dayLabel(v.visit_date, true)} الساعة ${slotLabel(v.slot)}.\nرقم الحجز ${v.number}. إذا بدك تغيّر الموعد ردّ علينا هون.`
  const tab = (k: string, l: string) => <Link href={`/admin/visits?view=${k}${status ? `&status=${status}` : ''}`} className={`a-btn ${view === k ? 'a-btn-solid' : ''}`}>{l}</Link>
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="a-h1">زيارات القياس</h1>
        <a href="/visit" target="_blank" rel="noopener" className="a-btn">صفحة الحجز للزبائن ↗</a></div>
      {!!pending && <p className="a-card border-amber-300 bg-amber-50 text-sm text-amber-900">⚠️ عندك <b>{pending}</b> حجز جديد غير مؤكد. أكّد مع الزبون على واتساب ثم اضغط «تأكيد».</p>}
      <div className="flex flex-wrap items-center gap-2">{tab('upcoming', 'القادمة')}{tab('past', 'السابقة')}{tab('all', 'الكل')}
        <form method="get" className="ms-auto flex gap-2"><input type="hidden" name="view" value={view} />
          <select name="status" defaultValue={status} className="a-field !w-auto"><option value="">كل الحالات</option>{Object.entries(VISIT_STATUS_AR).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <button className="a-btn">تصفية</button></form></div>

      {rows.length === 0 && <p className="a-card a-muted py-10 text-center">لا توجد زيارات {view === 'upcoming' ? 'قادمة' : ''}. رابط الحجز للزبائن: <span dir="ltr">/visit</span></p>}
      {Object.entries(groups).map(([day, list]) => (
        <section key={day} className="space-y-2">
          <h2 className="font-semibold">{dayLabel(day, true)}{day === today && <span className="a-pill ms-2 bg-[var(--a-copper)] text-white">اليوم</span>}{day === addDays(today, 1) && <span className="a-pill ms-2 bg-[var(--a-sand)]">بكرا</span>}</h2>
          {list.map((v) => (
            <article key={v.id} className="a-card grid gap-3 md:grid-cols-[110px_1fr_auto]">
              <div><p className="font-display text-xl text-[var(--a-copper)]">{slotLabel(v.slot)}</p><p className="a-muted">{v.number}</p><span className={`a-pill mt-1 ${TONE[v.status]}`}>{VISIT_STATUS_AR[v.status]}</span></div>
              <div className="space-y-1 text-sm">
                <p className="font-semibold">{v.customer_name} · <a href={`tel:${v.phone}`} dir="ltr" className="underline">{v.phone}</a></p>
                <p>📍 {v.area}{v.address && ` — ${v.address}`} <span className="a-muted">· {v.branches?.name}</span></p>
                {v.items.length > 0 && <p>📏 {v.items.join('، ')}</p>}
                {v.notes && <p className="a-muted">ملاحظات الزبون: {v.notes}</p>}
                <form action={saveVisitNote} className="flex gap-2 pt-1"><input type="hidden" name="id" value={v.id} /><input name="note" defaultValue={v.staff_notes ?? ''} placeholder="ملاحظة داخلية (مين رايح، شو صار…)" className="a-field !min-h-9 flex-1 text-sm" /><button className="a-btn !min-h-9">حفظ</button></form>
              </div>
              <div className="flex flex-wrap content-start gap-2 md:w-48 md:flex-col">
                <a className="a-btn" href={waLink(v.phone, confirmMsg(v))} target="_blank" rel="noopener">واتساب الزبون</a>
                {v.status === 'new' && <form action={setVisitStatus}><input type="hidden" name="id" value={v.id} /><input type="hidden" name="to" value="confirmed" /><button className="a-btn a-btn-solid w-full">تأكيد</button></form>}
                {(v.status === 'new' || v.status === 'confirmed') && <form action={setVisitStatus}><input type="hidden" name="id" value={v.id} /><input type="hidden" name="to" value="done" /><button className="a-btn w-full">تمت الزيارة</button></form>}
                {v.status !== 'cancelled' && v.status !== 'done' && <form action={setVisitStatus}><input type="hidden" name="id" value={v.id} /><input type="hidden" name="to" value="cancelled" /><button className="a-btn a-btn-danger w-full">إلغاء</button></form>}
                {(v.status === 'cancelled' || v.status === 'done') && <form action={setVisitStatus}><input type="hidden" name="id" value={v.id} /><input type="hidden" name="to" value="new" /><button className="a-btn w-full">إرجاع لجديد</button></form>}
              </div>
            </article>
          ))}
        </section>
      ))}

      {staff.role === 'owner' && <section className="a-card space-y-3"><h2 className="font-semibold">إعدادات المواعيد</h2>
        <p className="a-muted">الأيام والأوقات اللي بتظهر للزبون، وكم زيارة ممكن بنفس الوقت لكل فرع. الإلغاء بيرجّع الموعد متاح تلقائياً.</p>
        <VisitSettingsForm c={{ ...DEFAULT_VISITS, ...cfg }} /></section>}
    </>
  )
}
