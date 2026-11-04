'use client'
import { useActionState } from 'react'
import { saveVisitSettings } from '@/app/admin/visits-actions'
import { DAY_AR, type VisitConfig } from '@/lib/visits'

type R = { ok?: boolean; error?: string; message?: string }
export function VisitSettingsForm({ c }: { c: VisitConfig }) {
  const [s, action, pending] = useActionState<R | undefined, FormData>(saveVisitSettings, undefined)
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="enabled" defaultChecked={c.enabled} /> الحجز الإلكتروني مفعّل</label>
      <fieldset className="sm:col-span-2"><legend className="a-lbl mb-2">أيام الزيارات</legend>
        <div className="flex flex-wrap gap-3">{[6, 0, 1, 2, 3, 4, 5].map((d) => <label key={d} className="flex items-center gap-1.5 text-sm"><input type="checkbox" name="days" value={d} defaultChecked={c.days.includes(d)} />{DAY_AR[d]}</label>)}</div></fieldset>
      <label className="a-lbl sm:col-span-2">الأوقات (24 ساعة، مفصولة بفواصل)<input name="slots" dir="ltr" defaultValue={c.slots.join(', ')} className="a-field mt-1" /></label>
      <label className="a-lbl">عدد الزيارات بنفس الوقت (لكل فرع)<input name="capacity" type="number" min={1} max={10} defaultValue={c.capacity} className="a-field mt-1" /></label>
      <label className="a-lbl">أقرب موعد بعد (يوم)<input name="lead_days" type="number" min={0} max={7} defaultValue={c.lead_days} className="a-field mt-1" /></label>
      <label className="a-lbl">الحجز متاح لـ (يوم قادم)<input name="horizon_days" type="number" min={1} max={60} defaultValue={c.horizon_days} className="a-field mt-1" /></label>
      <label className="a-lbl">أنواع القياس (مفصولة بفواصل)<input name="items" defaultValue={c.items.join('، ')} className="a-field mt-1" /></label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2"><button className="a-btn a-btn-solid" disabled={pending}>حفظ</button>
        {s?.error && <p role="alert" className="rounded-md bg-rose-50 p-2 text-sm text-rose-800">{s.error}</p>}{s?.message && <p role="status" className="rounded-md bg-emerald-50 p-2 text-sm text-emerald-800">{s.message}</p>}</div>
    </form>
  )
}
