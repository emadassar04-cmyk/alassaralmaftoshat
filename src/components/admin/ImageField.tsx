'use client'
import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { toWebp } from '@/lib/image'

/** Single image picker for staff: uploads to the public product-images bucket (staff-only write) and returns the public URL. */
export function ImageField({ value, onChange, folder, label, ratio = 'aspect-[4/3]' }: { value: string; onChange: (url: string) => void; folder: string; label: string; ratio?: string }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('')
  async function pick(f: File | undefined) {
    if (!f) return; setErr('')
    if (!f.type.startsWith('image/')) { setErr('اختر صورة فقط'); return }
    if (f.size > 15 * 1024 * 1024) { setErr('الصورة كبيرة جداً (الحد 15MB)'); return }
    setBusy(true)
    try {
      const sb = supabaseBrowser(); const path = `${folder}/${crypto.randomUUID()}.webp`
      const { error } = await sb.storage.from('product-images').upload(path, await toWebp(f, 2000), { contentType: 'image/webp', cacheControl: '31536000' })
      if (error) throw error
      onChange(sb.storage.from('product-images').getPublicUrl(path).data.publicUrl)
    } catch { setErr('تعذّر رفع الصورة') } finally { setBusy(false) }
  }
  return (
    <div className="space-y-2">
      <p className="a-lbl">{label}</p>
      <div className="flex flex-wrap items-center gap-3">
        <div className={`relative w-40 overflow-hidden rounded-xl border border-[var(--a-line)] bg-[var(--a-sand)] ${ratio}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {value ? <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <span className="a-muted absolute inset-0 grid place-items-center text-xs">بدون صورة</span>}
        </div>
        <div className="flex flex-col gap-2">
          <label className="a-btn cursor-pointer">{busy ? 'جارٍ الرفع…' : value ? 'تغيير الصورة' : 'رفع صورة'}<input type="file" accept="image/*" className="sr-only" disabled={busy} onChange={(e) => void pick(e.target.files?.[0])} /></label>
          {value && <button type="button" className="a-btn a-btn-danger" onClick={() => onChange('')}>إزالة</button>}
        </div>
      </div>
      {err && <p role="alert" className="text-sm text-rose-700">{err}</p>}
    </div>
  )
}
