'use client'
import { useActionState, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createCoupon, saveBranch, savePost, saveSetting, setStaffRole } from '@/app/admin/misc-actions'

const Msg = ({ s }: { s?: { ok?: boolean; error?: string } }) => s?.error ? <p role="alert" className="rounded-md bg-rose-50 p-2 text-sm text-rose-800">{s.error}</p> : s?.ok ? <p role="status" className="rounded-md bg-emerald-50 p-2 text-sm text-emerald-800">تم الحفظ</p> : null

export function CouponForm() {
  const [s, action, pending] = useActionState(createCoupon, undefined)
  return (
    <form action={action} className="a-card grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <label className="a-lbl">الكود<input name="code" required dir="ltr" className="a-field mt-1" placeholder="EID2026" /></label>
      <label className="a-lbl">النوع<select name="kind" className="a-field mt-1"><option value="percent">نسبة %</option><option value="fixed">مبلغ ₪</option></select></label>
      <label className="a-lbl">القيمة<input name="value" required inputMode="decimal" dir="ltr" className="a-field mt-1" /></label>
      <label className="a-lbl">حد أدنى للطلب ₪<input name="min_order" inputMode="decimal" dir="ltr" defaultValue="0" className="a-field mt-1" /></label>
      <label className="a-lbl">حد الاستخدام (فارغ = بلا حد)<input name="max_uses" inputMode="numeric" dir="ltr" className="a-field mt-1" /></label>
      <label className="a-lbl">ينتهي في<input name="expires" type="date" className="a-field mt-1" /></label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-3 lg:col-span-6"><button className="a-btn a-btn-solid" disabled={pending}>+ إنشاء كوبون</button><Msg s={s} /></div>
    </form>
  )
}

export function UserForm() {
  const [s, action, pending] = useActionState(setStaffRole, undefined)
  return (
    <form action={action} className="a-card grid gap-3 sm:grid-cols-4">
      <label className="a-lbl sm:col-span-2">إيميل المستخدم (يجب أن يكون منشأً في Supabase Auth)<input name="email" type="email" required dir="ltr" className="a-field mt-1" /></label>
      <label className="a-lbl">الاسم (اختياري)<input name="name" className="a-field mt-1" /></label>
      <label className="a-lbl">الدور<select name="role" defaultValue="supervisor" className="a-field mt-1"><option value="supervisor">مشرف بضاعة</option><option value="owner">مالك</option></select></label>
      <label className="a-lbl">الحالة<select name="active" className="a-field mt-1"><option value="1">مفعّل</option><option value="0">معطّل</option></select></label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-4"><button className="a-btn a-btn-solid" disabled={pending}>حفظ / تحديث الصلاحية</button><Msg s={s} /></div>
    </form>
  )
}

export function PostForm({ post }: { post: { id: string; title: string; slug: string; excerpt: string | null; body: string; published: boolean } | null }) {
  const router = useRouter(); const [pending, start] = useTransition(); const [s, setS] = useState<{ ok?: boolean; error?: string }>()
  const [f, setF] = useState({ title: post?.title ?? '', slug: post?.slug ?? '', excerpt: post?.excerpt ?? '', body: post?.body ?? '', published: post?.published ?? false })
  const slugify = (t: string) => t.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 80)
  return (
    <form className="a-card space-y-3" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await savePost({ id: post?.id ?? null, ...f, slug: f.slug || slugify(f.title) }); setS(r); if (r.ok && !post && r.id) router.replace(`/admin/blog/${r.id}`) }) }}>
      <label className="a-lbl">العنوان<input required className="a-field mt-1" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
      <label className="a-lbl">الرابط (يُولَّد تلقائياً إن تُرك فارغاً)<input dir="ltr" className="a-field mt-1" value={f.slug} placeholder={slugify(f.title)} onChange={(e) => setF({ ...f, slug: e.target.value })} /></label>
      <label className="a-lbl">مقتطف يظهر في القائمة وجوجل<input className="a-field mt-1" value={f.excerpt} onChange={(e) => setF({ ...f, excerpt: e.target.value })} /></label>
      <label className="a-lbl">المقال<textarea required className="a-field mt-1 min-h-64" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={f.published} onChange={(e) => setF({ ...f, published: e.target.checked })} />منشور</label>
      <div className="flex flex-wrap items-center gap-3"><button className="a-btn a-btn-solid" disabled={pending}>حفظ</button><Msg s={s} /></div>
    </form>
  )
}

type B = { id: string; name: string; address: string | null; whatsapp: string | null; phone: string | null; hours: string | null; map_url: string | null; is_active: boolean }
export function BranchForm({ b }: { b: B }) {
  const [pending, start] = useTransition(); const [s, setS] = useState<{ ok?: boolean; error?: string }>()
  const [f, setF] = useState({ name: b.name, address: b.address ?? '', whatsapp: b.whatsapp ?? '', phone: b.phone ?? '', hours: b.hours ?? '', map_url: b.map_url ?? '', is_active: b.is_active })
  return (
    <form className="a-card grid gap-3 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); start(async () => setS(await saveBranch({ id: b.id, ...f }))) }}>
      <h3 className="font-semibold md:col-span-2">{b.name}</h3>
      <label className="a-lbl">اسم الفرع<input required className="a-field mt-1" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
      <label className="a-lbl">العنوان<input className="a-field mt-1" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></label>
      <label className="a-lbl">رقم واتساب (059… أو +970…)<input dir="ltr" className="a-field mt-1" value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} /></label>
      <label className="a-lbl">رقم الهاتف للعرض<input dir="ltr" className="a-field mt-1" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
      <label className="a-lbl">ساعات العمل<input className="a-field mt-1" value={f.hours} onChange={(e) => setF({ ...f, hours: e.target.value })} placeholder="السبت – الخميس 9:00 – 21:00" /></label>
      <label className="a-lbl">رابط الخريطة (Google Maps)<input dir="ltr" className="a-field mt-1" value={f.map_url} onChange={(e) => setF({ ...f, map_url: e.target.value })} /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })} />الفرع فعّال (يظهر في المتجر)</label>
      <div className="flex flex-wrap items-center gap-3 md:col-span-2"><button className="a-btn a-btn-solid" disabled={pending}>حفظ الفرع</button><Msg s={s} /></div>
    </form>
  )
}

function SettingShell({ title, k, value, children, hint }: { title: string; k: string; value: () => unknown; children: React.ReactNode; hint?: string }) {
  const [pending, start] = useTransition(); const [s, setS] = useState<{ ok?: boolean; error?: string }>()
  return (
    <form className="a-card space-y-3" onSubmit={(e) => { e.preventDefault(); start(async () => setS(await saveSetting(k, value()))) }}>
      <h3 className="font-semibold">{title}</h3>{hint && <p className="a-muted">{hint}</p>}{children}
      <div className="flex flex-wrap items-center gap-3"><button className="a-btn a-btn-solid" disabled={pending}>حفظ</button><Msg s={s} /></div>
    </form>
  )
}
export function HomeSettings({ v }: { v: { headline: string; tagline: string; badge: string } }) {
  const [f, setF] = useState(v)
  return <SettingShell title="نصوص الصفحة الرئيسية" k="home" value={() => f}>
    <label className="a-lbl">العنوان الرئيسي<input className="a-field mt-1" value={f.headline} onChange={(e) => setF({ ...f, headline: e.target.value })} /></label>
    <label className="a-lbl">الشعار<input className="a-field mt-1" value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} /></label>
    <label className="a-lbl">الشارة تحت الشعار<input className="a-field mt-1" value={f.badge} onChange={(e) => setF({ ...f, badge: e.target.value })} /></label></SettingShell>
}
export function PaymentSettings({ v }: { v: Record<string, { account: string; holder?: string }> }) {
  const names: Record<string, string> = { palpay: 'PalPay', jawwal_pay: 'جوال باي', bank_palestine: 'بنك فلسطين' }
  const [f, setF] = useState(() => Object.fromEntries(Object.keys(names).map((k) => [k, { account: v[k]?.account ?? '', holder: v[k]?.holder ?? '' }])))
  return <SettingShell title="حسابات الدفع الإلكتروني" k="payment_accounts" value={() => f} hint="تظهر للزبون عند اختيار طريقة الدفع. اكتب الرقم أو IBAN واسم صاحب الحساب.">
    {Object.entries(names).map(([k, n]) => <div key={k} className="grid gap-2 sm:grid-cols-2"><label className="a-lbl">{n} - رقم الحساب<input dir="ltr" className="a-field mt-1" value={f[k].account} onChange={(e) => setF({ ...f, [k]: { ...f[k], account: e.target.value } })} /></label>
      <label className="a-lbl">{n} - اسم صاحب الحساب<input className="a-field mt-1" value={f[k].holder} onChange={(e) => setF({ ...f, [k]: { ...f[k], holder: e.target.value } })} /></label></div>)}</SettingShell>
}
export function PixelSettings({ v }: { v: string }) {
  const [f, setF] = useState(v)
  return <SettingShell title="Meta Pixel (فيسبوك)" k="meta_pixel_id" value={() => f} hint="رقم الـ Pixel أرقام فقط. اتركه فارغاً لإيقافه."><input dir="ltr" inputMode="numeric" className="a-field" value={f} onChange={(e) => setF(e.target.value.trim())} aria-label="رقم Pixel" /></SettingShell>
}
export function TestimonialSettings({ v }: { v: { name: string; text: string; place?: string }[] }) {
  const [f, setF] = useState(v.map((t) => ({ name: t.name, text: t.text, place: t.place ?? '' })))
  return <SettingShell title="آراء الزبائن في الصفحة الرئيسية" k="testimonials" value={() => f} hint="استبدل النصوص التجريبية بآراء زبائنك الحقيقية (بموافقتهم).">
    {f.map((t, i) => <div key={i} className="grid gap-2 rounded-lg border border-[var(--a-line)] p-3 md:grid-cols-[1fr_1fr_3fr_auto]">
      <input className="a-field" placeholder="الاسم" aria-label="الاسم" value={t.name} onChange={(e) => setF(f.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
      <input className="a-field" placeholder="المنطقة" aria-label="المنطقة" value={t.place} onChange={(e) => setF(f.map((x, j) => j === i ? { ...x, place: e.target.value } : x))} />
      <input className="a-field" placeholder="الرأي" aria-label="الرأي" value={t.text} onChange={(e) => setF(f.map((x, j) => j === i ? { ...x, text: e.target.value } : x))} />
      <button type="button" className="a-btn a-btn-danger" aria-label="حذف" onClick={() => setF(f.filter((_, j) => j !== i))}>✕</button></div>)}
    <button type="button" className="a-btn" onClick={() => setF([...f, { name: '', text: '', place: '' }])}>+ رأي</button></SettingShell>
}
