'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarCheck, Check, Clock, MapPin, MessageCircle } from 'lucide-react'
import type { Branch } from '@/lib/types'
import { type Availability, dayLabel, left, openDays, slotLabel } from '@/lib/visits'
import { waLink } from '@/lib/format'
import { track } from '@/lib/pixel'
import { Turnstile } from './Turnstile'

const TS_ON = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
type Done = { number: string; date: string; slot: string; branch: string; whatsapp: string | null }

export function VisitForm({ branches }: { branches: Branch[] }) {
  const [branch, setBranch] = useState(branches[0]?.id ?? '')
  const [av, setAv] = useState<Availability | null>(null); const [loadErr, setLoadErr] = useState('')
  const [day, setDay] = useState(''); const [slot, setSlot] = useState('')
  const [f, setF] = useState({ name: '', phone: '', area: '', address: '', notes: '', hp: '' })
  const [items, setItems] = useState<string[]>([])
  const [token, setToken] = useState(''); const [tsReset, setTsReset] = useState(0)
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [done, setDone] = useState<Done | null>(null)
  const onToken = useCallback((t: string) => setToken(t), [])
  const load = useCallback(async (b: string) => {
    setLoadErr('')
    try {
      const r = await fetch(`/api/visits/availability?branch=${b}`, { cache: 'no-store' })
      if (!r.ok) throw new Error()
      setAv(await r.json())
    } catch { setLoadErr('تعذّر تحميل المواعيد، حدّث الصفحة') }
  }, [])
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!branch) return
    setAv(null); setDay(''); setSlot(''); void load(branch)
    const q = new URLSearchParams(location.search).get('item'); if (q) setItems((x) => (x.includes(q) ? x : [...x, q]))
  }, [branch, load])
  /* eslint-enable react-hooks/set-state-in-effect */
  const days = useMemo(() => (av ? openDays(av) : []), [av])
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }))
  const b = branches.find((x) => x.id === branch)

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr('')
    if (!day || !slot) { setErr('اختر اليوم والوقت'); return }
    setBusy(true)
    try {
      const r = await fetch('/api/visits', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...f, branch_id: branch, items, date: day, slot, address: f.address || undefined, notes: f.notes || undefined, token }) })
      const j = await r.json()
      if (!r.ok) { setErr(j.error ?? 'حدث خطأ'); setTsReset((n) => n + 1); setToken(''); if (j.code === 'slot_taken') { setSlot(''); void load(branch) } return }
      track('Schedule'); setDone(j)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch { setErr('تعذّر الإرسال، تأكد من الإنترنت وحاول مرة أخرى') } finally { setBusy(false) }
  }

  if (done) {
    const msg = `مرحباً ${done.branch} 👋\nحجزت زيارة قياس رقم ${done.number}\nالموعد: ${dayLabel(done.date, true)} - ${slotLabel(done.slot)}\nالاسم: ${f.name}\nالمنطقة: ${f.area}${items.length ? `\nالمطلوب: ${items.join('، ')}` : ''}`
    return (
      <div className="card mx-auto max-w-xl p-8 text-center sm:p-12">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-sand text-success"><Check size={30} strokeWidth={1.6} /></span>
        <h2 className="t-h2 mt-6 !text-[clamp(1.7rem,4vw,2.4rem)]">تم استلام حجزك</h2>
        <p className="mt-3 text-ink-2">رقم الحجز <b className="num text-charcoal">{done.number}</b>. سنتواصل معك لتأكيد الموعد.</p>
        <ul className="mx-auto mt-8 max-w-sm space-y-3 rounded-[var(--radius-lg)] bg-sand p-5 text-start text-[15px]">
          <li className="flex gap-3"><CalendarCheck size={19} className="mt-0.5 shrink-0 text-brown" strokeWidth={1.5} />{dayLabel(done.date, true)}</li>
          <li className="flex gap-3"><Clock size={19} className="mt-0.5 shrink-0 text-brown" strokeWidth={1.5} />{slotLabel(done.slot)}</li>
          <li className="flex gap-3"><MapPin size={19} className="mt-0.5 shrink-0 text-brown" strokeWidth={1.5} />{done.branch} · {f.area}</li>
        </ul>
        {done.whatsapp && <a href={waLink(done.whatsapp, msg)} target="_blank" rel="noopener" className="btn btn-solid mt-8 w-full sm:w-auto"><MessageCircle size={18} />أرسل الحجز للفرع على واتساب</a>}
        <p className="mt-4 text-xs text-muted">الزيارة مجانية، والقياس يتم في بيتك بواسطة فريق العصار.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-12">
      <div className="min-w-0 space-y-8">
        <fieldset>
          <legend className="t-h3 mb-4">1. الفرع الأقرب لك</legend>
          <div className="grid gap-3 sm:grid-cols-2">{branches.map((x) => (
            <button type="button" key={x.id} onClick={() => setBranch(x.id)} aria-pressed={branch === x.id}
              className={`rounded-[var(--radius-md)] border bg-white p-4 text-start transition-colors hover:border-brown ${branch === x.id ? 'border-brown !bg-sand ring-1 ring-brown' : 'border-line'}`}>
              <span className="font-medium">{x.name}</span>{x.address && <span className="mt-1 block text-sm text-ink-2">{x.address}</span>}</button>))}</div>
        </fieldset>
        <fieldset>
          <legend className="t-h3 mb-4">2. اختر اليوم</legend>
          {loadErr ? <p className="rounded-[var(--radius-md)] bg-sand p-4 text-sm text-danger">{loadErr}</p> : !av ? (
            <div className="flex gap-2 overflow-hidden">{Array.from({ length: 5 }, (_, i) => <div key={i} className="skeleton h-[74px] w-24 shrink-0" />)}</div>
          ) : !av.config.enabled ? <p className="rounded-[var(--radius-md)] bg-sand p-4 text-sm text-ink-2">الحجز الإلكتروني متوقف مؤقتاً. راسلنا على واتساب ونحدد معك موعد.</p> : (
            <div className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="الأيام المتاحة">
              {days.map((d) => {
                const free = av.config.slots.some((s) => left(av, d, s) > 0)
                const [name, date] = dayLabel(d).split(' ')
                return <button type="button" key={d} disabled={!free} onClick={() => { setDay(d); setSlot('') }} aria-pressed={day === d}
                  className={`flex w-[88px] shrink-0 snap-start flex-col items-center rounded-[var(--radius-md)] border px-2 py-3 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${day === d ? 'border-charcoal bg-charcoal text-ivory' : 'border-line bg-white hover:border-charcoal'}`}>
                  <span className="text-xs">{name}</span><span className="num mt-1 font-display text-lg">{date}</span>{!free && <span className="text-[10px]">مكتمل</span>}</button>
              })}
            </div>)}
        </fieldset>
        {av && day && (
          <fieldset>
            <legend className="t-h3 mb-4">3. اختر الوقت</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{av.config.slots.map((s) => {
              const n = left(av, day, s)
              return <button type="button" key={s} disabled={n === 0} onClick={() => setSlot(s)} aria-pressed={slot === s}
                className={`num rounded-full border px-4 py-3 text-sm transition-colors disabled:cursor-not-allowed disabled:line-through disabled:opacity-40 ${slot === s ? 'border-charcoal bg-charcoal text-ivory' : 'border-line bg-white hover:border-charcoal'}`}>{slotLabel(s)}</button>
            })}</div>
          </fieldset>)}
        <fieldset>
          <legend className="t-h3 mb-4">شو بدك نقيس؟ <span className="text-sm font-normal text-muted">(اختياري)</span></legend>
          <div className="flex flex-wrap gap-2">{(av?.config.items ?? []).map((it) => {
            const on = items.includes(it)
            return <button type="button" key={it} aria-pressed={on} onClick={() => setItems((x) => (on ? x.filter((y) => y !== it) : [...x, it]))}
              className={`rounded-full border px-5 py-2.5 text-sm transition-colors ${on ? 'border-brown bg-brown text-white' : 'border-line bg-white hover:border-brown'}`}>{on && <Check size={14} className="me-1 inline" />}{it}</button>
          })}</div>
        </fieldset>
      </div>

      <div className="card h-fit min-w-0 space-y-4 p-6 lg:sticky lg:top-28">
        <h2 className="t-h3">بياناتك</h2>
        <label className="block text-sm text-ink-2">الاسم<input required minLength={2} className="field mt-1.5" value={f.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" /></label>
        <label className="block text-sm text-ink-2">رقم الجوال<input required inputMode="tel" dir="ltr" className="field mt-1.5 text-start" placeholder="059xxxxxxx" value={f.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" /></label>
        <label className="block text-sm text-ink-2">المنطقة<input required minLength={2} className="field mt-1.5" placeholder="مثال: دير البلح - البركة" value={f.area} onChange={(e) => set('area', e.target.value)} /></label>
        <label className="block text-sm text-ink-2">العنوان بالتفصيل <span className="text-muted">(اختياري)</span><input className="field mt-1.5" value={f.address} onChange={(e) => set('address', e.target.value)} /></label>
        <label className="block text-sm text-ink-2">ملاحظات <span className="text-muted">(اختياري)</span><textarea className="field mt-1.5 min-h-20" placeholder="مثال: 3 شبابيك بالصالون" value={f.notes} onChange={(e) => set('notes', e.target.value)} /></label>
        <input className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={f.hp} onChange={(e) => set('hp', e.target.value)} />
        {day && slot && b && <p className="num rounded-[var(--radius-md)] bg-sand p-3 text-sm">موعدك: <b>{dayLabel(day)}</b> · <b>{slotLabel(slot)}</b> · {b.name}</p>}
        <Turnstile onToken={onToken} resetKey={tsReset} />
        {err && <p role="alert" className="rounded-[var(--radius-md)] bg-[#f8e7e4] p-3 text-sm text-danger">{err}</p>}
        <button className="btn btn-solid w-full" disabled={busy || !day || !slot || (TS_ON && !token)} aria-busy={busy}>{busy ? 'جارٍ الحجز…' : !day || !slot ? 'اختر اليوم والوقت' : 'تأكيد الحجز'}</button>
        <p className="text-center text-xs text-muted">زيارة القياس مجانية، ولا يلزمك الحجز بالشراء.</p>
      </div>
    </form>
  )
}
