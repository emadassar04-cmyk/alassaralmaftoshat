'use client'
import { useState, useTransition } from 'react'
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react'
import { deleteCategory, moveCategory, saveCategory } from '@/app/admin/categories-actions'
import { ImageField } from './ImageField'

export type Cat = { id: string; name: string; slug: string; description: string | null; image_url: string | null; is_visible: boolean; sort: number; products: number }
const slugify = (s: string) => s.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 60)

function Editor({ c, onClose, nextSort }: { c: Cat | null; onClose: () => void; nextSort: number }) {
  const [f, setF] = useState({ name: c?.name ?? '', slug: c?.slug ?? '', description: c?.description ?? '', image_url: c?.image_url ?? '', is_visible: c?.is_visible ?? true })
  const [err, setErr] = useState(''); const [pending, start] = useTransition()
  return (
    <form className="a-card space-y-3 !border-[var(--a-copper)]" onSubmit={(e) => { e.preventDefault(); setErr(''); start(async () => { const r = await saveCategory({ id: c?.id ?? null, ...f, sort: c?.sort ?? nextSort }); if (r.error) setErr(r.error); else onClose() }) }}>
      <h3 className="font-semibold">{c ? `تعديل «${c.name}»` : 'قسم جديد'}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="a-lbl">اسم القسم<input required className="a-field mt-1" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value, slug: c ? f.slug : slugify(e.target.value) })} /></label>
        <label className="a-lbl">الرابط<input required dir="ltr" className="a-field mt-1" value={f.slug} onChange={(e) => setF({ ...f, slug: slugify(e.target.value) })} /></label>
        <label className="a-lbl sm:col-span-2">وصف قصير (يظهر على بطاقة القسم)<input className="a-field mt-1" maxLength={200} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
      </div>
      <ImageField label="صورة القسم (يفضّل عمودية 4:5)" folder="categories" ratio="aspect-[4/5]" value={f.image_url} onChange={(u) => setF({ ...f, image_url: u })} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.is_visible} onChange={(e) => setF({ ...f, is_visible: e.target.checked })} />ظاهر في المتجر (يظهر فقط إذا فيه منتج ظاهر)</label>
      {err && <p role="alert" className="rounded-md bg-rose-50 p-2 text-sm text-rose-800">{err}</p>}
      <div className="flex gap-2"><button className="a-btn a-btn-solid" disabled={pending}>{pending ? '…' : 'حفظ'}</button><button type="button" className="a-btn" onClick={onClose}>إلغاء</button></div>
    </form>
  )
}

export function CategoryManager({ cats }: { cats: Cat[] }) {
  const [edit, setEdit] = useState<string | 'new' | null>(null); const [err, setErr] = useState(''); const [pending, start] = useTransition()
  const run = (fn: () => Promise<{ error?: string }>) => { setErr(''); start(async () => { const r = await fn(); if (r.error) setErr(r.error) }) }
  return (
    <div className="space-y-3">
      <div className="flex justify-end"><button className="a-btn a-btn-solid" onClick={() => setEdit('new')}><Plus size={16} />قسم جديد</button></div>
      {edit === 'new' && <Editor c={null} onClose={() => setEdit(null)} nextSort={(cats.at(-1)?.sort ?? 0) + 10} />}
      {err && <p role="alert" className="rounded-md bg-rose-50 p-3 text-sm text-rose-800">{err}</p>}
      <ul className="space-y-2">{cats.map((c, i) => edit === c.id ? <li key={c.id}><Editor c={c} onClose={() => setEdit(null)} nextSort={c.sort} /></li> : (
        <li key={c.id} className={`a-card flex flex-wrap items-center gap-4 !p-3 ${c.is_visible ? '' : 'opacity-60'}`}>
          <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-[var(--a-sand)]">{/* eslint-disable-next-line @next/next/no-img-element */}{c.image_url && <img src={c.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />}</div>
          <div className="min-w-0 flex-1"><p className="font-semibold">{c.name} {!c.is_visible && <span className="a-pill ms-1 bg-stone-200 text-stone-700">مخفي</span>}{c.products === 0 && <span className="a-pill ms-1 bg-amber-100 text-amber-800">فاضي</span>}</p>
            <p className="a-muted truncate">{c.products} منتج · <span dir="ltr">/shop?cat={c.slug}</span></p></div>
          <div className="flex flex-wrap gap-1.5">
            <button className="a-btn !min-h-9 !px-2.5" aria-label="للأعلى" disabled={pending || i === 0} onClick={() => run(() => moveCategory(c.id, -1))}><ArrowUp size={15} /></button>
            <button className="a-btn !min-h-9 !px-2.5" aria-label="للأسفل" disabled={pending || i === cats.length - 1} onClick={() => run(() => moveCategory(c.id, 1))}><ArrowDown size={15} /></button>
            <button className="a-btn !min-h-9 !px-2.5" aria-label={c.is_visible ? 'إخفاء' : 'إظهار'} disabled={pending} onClick={() => run(() => saveCategory({ ...c, description: c.description ?? '', image_url: c.image_url ?? '', is_visible: !c.is_visible }))}>{c.is_visible ? <EyeOff size={15} /> : <Eye size={15} />}</button>
            <button className="a-btn !min-h-9" onClick={() => setEdit(c.id)}><Pencil size={15} />تعديل</button>
            <button className="a-btn a-btn-danger !min-h-9 !px-2.5" aria-label="حذف" disabled={pending} onClick={() => { if (confirm(`حذف قسم «${c.name}»؟`)) run(() => deleteCategory(c.id)) }}><Trash2 size={15} /></button>
          </div>
        </li>))}</ul>
    </div>
  )
}
