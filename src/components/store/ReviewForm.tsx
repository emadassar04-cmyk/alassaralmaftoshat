'use client'
import { useState } from 'react'
import { Star } from 'lucide-react'

export function ReviewForm({ token, productId, name }: { token: string; productId: string; name: string }) {
  const [rating, setRating] = useState(5); const [body, setBody] = useState(''); const [who, setWho] = useState(''); const [msg, setMsg] = useState(''); const [done, setDone] = useState(false)
  async function send(e: React.FormEvent) {
    e.preventDefault()
    const r = await fetch('/api/review', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, product_id: productId, rating, name: who, body }) })
    const j = await r.json().catch(() => ({})); if (r.ok) setDone(true); else setMsg(j.error ?? 'تعذّر الإرسال')
  }
  if (done) return <p className="text-sm text-copper-lt">شكراً! سيظهر تقييمك بعد مراجعته.</p>
  return (
    <form onSubmit={send} className="space-y-2 border border-copper/20 p-3">
      <p className="text-sm">قيّم: {name}</p>
      <div className="flex gap-1" role="radiogroup" aria-label="التقييم">{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} aria-label={`${n}`} onClick={() => setRating(n)} className={n <= rating ? 'text-copper' : 'text-muted/40'}><Star fill="currentColor" size={22} /></button>)}</div>
      <input className="field" required placeholder="اسمك" value={who} onChange={(e) => setWho(e.target.value)} />
      <textarea className="field" placeholder="رأيك (اختياري)" value={body} onChange={(e) => setBody(e.target.value)} />
      {msg && <p className="text-sm text-danger">{msg}</p>}<button className="btn !min-h-10">إرسال التقييم</button>
    </form>
  )
}
