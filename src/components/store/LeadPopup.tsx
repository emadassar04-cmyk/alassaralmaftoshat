'use client'
import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { track } from '@/lib/pixel'
import { Turnstile } from './Turnstile'

export function LeadPopup() {
  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState(''); const [hp, setHp] = useState(''); const [token, setToken] = useState('')
  const [code, setCode] = useState<string | null>(null); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const onToken = useCallback((t: string) => setToken(t), [])

  useEffect(() => {
    if (localStorage.getItem('as_lead_seen')) return
    const show = () => { if (!localStorage.getItem('as_lead_seen')) { setOpen(true); localStorage.setItem('as_lead_seen', '1') } }
    const t = setTimeout(show, 20000)
    const out = (e: MouseEvent) => { if (e.clientY <= 0) show() }
    document.addEventListener('mouseleave', out)
    return () => { clearTimeout(t); document.removeEventListener('mouseleave', out) }
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('')
    const r = await fetch('/api/lead', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone, hp, token }) })
    const j = await r.json().catch(() => ({}))
    setBusy(false)
    if (!r.ok) return setErr(j.error ?? 'تعذّر الحفظ، حاول مرة أخرى')
    setCode(j.code); track('Lead')
  }
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-label="خصم 10%">
      <div className="relative w-full max-w-md border border-copper/40 bg-night-2 p-7 text-center shadow-[0_0_80px_rgba(200,163,106,.15)]">
        <button className="absolute end-3 top-3 p-2 text-muted" aria-label="إغلاق" onClick={() => setOpen(false)}><X size={18} /></button>
        {code ? (<>
          <p className="eyebrow">WELCOME</p><h2 className="font-display mt-3 text-3xl copper-text">هذا كودك</h2>
          <p className="my-5 border border-dashed border-copper py-4 font-display text-3xl tracking-widest text-copper-lt" dir="ltr">{code}</p>
          <p className="text-sm text-muted">خصم 10% على أول طلب، يُستخدم مرة واحدة ومرتبط برقمك. اكتبه في صفحة إتمام الطلب.</p>
        </>) : (<>
          <p className="eyebrow">AL-ASSAR</p><h2 className="font-display mt-3 text-3xl copper-text">خصم 10% على أول طلب</h2>
          <p className="mt-2 text-sm text-muted">اترك رقم جوالك واحصل على كود الخصم فوراً.</p>
          <form onSubmit={submit} className="mt-5 space-y-3">
            <input className="field text-center" dir="ltr" inputMode="tel" placeholder="059xxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} required aria-label="رقم الجوال" />
            <input className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" value={hp} onChange={(e) => setHp(e.target.value)} name="website" />
            <Turnstile onToken={onToken} />
            {err && <p className="text-sm text-danger" role="alert">{err}</p>}
            <button className="btn btn-solid w-full" disabled={busy}>{busy ? '...' : 'احصل على الكود'}</button>
          </form>
        </>)}
      </div>
    </div>
  )
}
