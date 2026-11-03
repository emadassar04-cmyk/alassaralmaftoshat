'use client'
import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { deleteProduct, saveProduct, type ProductPayload } from '@/app/admin/products-actions'
import { supabaseBrowser } from '@/lib/supabase-browser'
import type { Field, MeasurementSchema } from '@/lib/types'

type Variant = { id: string | null; label: string; color: string; size: string; fabric: string; price: string; stock: string; is_active: boolean }
type Img = { id: string | null; url: string; alt: string }
export type FormProduct = {
  id: string; name: string; slug: string; description: string | null; category_id: string | null; base_price: number; sale_price: number | null
  is_custom: boolean; is_bestseller: boolean; status: 'visible' | 'hidden'; sort: number; measurement_schema: MeasurementSchema | null
  product_variants: { id: string; label: string; color: string | null; size: string | null; fabric: string | null; price: number | null; stock: number; is_active: boolean }[]
  product_images: { id: string; url: string; alt: string | null }[]
}

const slugify = (s: string) => s.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 80)

async function toWebp(file: File, max = 1600): Promise<Blob> {
  const bmp = await createImageBitmap(file)
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k)
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('encode'))), 'image/webp', 0.82))
}

export function ProductForm({ product, categories, canDelete }: { product: FormProduct | null; categories: { id: string; name: string }[]; canDelete: boolean }) {
  const router = useRouter(); const [pending, start] = useTransition()
  const [f, setF] = useState({ name: product?.name ?? '', slug: product?.slug ?? '', description: product?.description ?? '', category_id: product?.category_id ?? '', base_price: String(product?.base_price ?? ''),
    sale_price: product?.sale_price != null ? String(product.sale_price) : '', is_custom: product?.is_custom ?? false, is_bestseller: product?.is_bestseller ?? false, status: product?.status ?? 'visible', sort: String(product?.sort ?? 100) })
  const [variants, setVariants] = useState<Variant[]>(product?.product_variants.map((v) => ({ id: v.id, label: v.label, color: v.color ?? '', size: v.size ?? '', fabric: v.fabric ?? '', price: v.price != null ? String(v.price) : '', stock: String(v.stock), is_active: v.is_active })) ?? [])
  const [images, setImages] = useState<Img[]>(product?.product_images.map((i) => ({ id: i.id, url: i.url, alt: i.alt ?? '' })) ?? [])
  const [schema, setSchema] = useState<MeasurementSchema>(product?.measurement_schema ?? { fields: [] })
  const [raw, setRaw] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; s: string } | null>(null); const [busy, setBusy] = useState(false); const drop = useRef<HTMLLabelElement>(null)
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }))

  async function upload(files: FileList | File[]) {
    setBusy(true); setMsg(null)
    try {
      const sb = supabaseBrowser(); const folder = product?.id ?? crypto.randomUUID(); const added: Img[] = []
      for (const file of Array.from(files).slice(0, 12 - images.length)) {
        if (!file.type.startsWith('image/')) continue
        const blob = await toWebp(file); const path = `${folder}/${crypto.randomUUID()}.webp`
        const { error } = await sb.storage.from('product-images').upload(path, blob, { contentType: 'image/webp', cacheControl: '31536000' })
        if (error) throw new Error('تعذّر رفع الصورة')
        added.push({ id: null, url: sb.storage.from('product-images').getPublicUrl(path).data.publicUrl, alt: f.name })
      }
      setImages((x) => [...x, ...added])
    } catch (e) { setMsg({ t: 'err', s: e instanceof Error ? e.message : 'تعذّر رفع الصورة' }) } finally { setBusy(false) }
  }
  const move = <T,>(arr: T[], i: number, d: number) => { const a = [...arr]; const j = i + d; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a }

  function submit(e: React.FormEvent) {
    e.preventDefault(); setMsg(null)
    let ms: MeasurementSchema | null = null
    if (f.is_custom) { try { ms = raw !== null ? JSON.parse(raw) : schema } catch { return setMsg({ t: 'err', s: 'صيغة JSON لحقول القياس غير صحيحة' }) } }
    const payload: ProductPayload = {
      id: product?.id ?? null, name: f.name, slug: f.slug || slugify(f.name), description: f.description, category_id: f.category_id || null,
      base_price: Number(f.base_price), sale_price: f.sale_price === '' ? null : Number(f.sale_price), is_custom: f.is_custom, is_bestseller: f.is_bestseller, status: f.status, sort: Number(f.sort) || 0,
      measurement_schema: ms,
      variants: variants.map((v, i) => ({ id: v.id, label: v.label, color: v.color, size: v.size, fabric: v.fabric, price: v.price === '' ? null : Number(v.price), stock: Math.max(0, Math.floor(Number(v.stock) || 0)), is_active: v.is_active, sort: i })),
      images: images.map((i) => ({ id: i.id, url: i.url, alt: i.alt })),
    }
    start(async () => {
      const r = await saveProduct(payload)
      if (r.error) return setMsg({ t: 'err', s: r.error })
      setMsg({ t: 'ok', s: 'تم الحفظ' })
      if (!product && r.id) router.replace(`/admin/products/${r.id}`); else router.refresh()
    })
  }
  const upField = (i: number, p: Partial<Field>) => setSchema((s) => ({ ...s, fields: s.fields.map((x, j) => (j === i ? { ...x, ...p } : x)) }))

  return (
    <form onSubmit={submit} className="space-y-5">
      <section className="a-card grid gap-3 md:grid-cols-2">
        <label className="a-lbl md:col-span-2">اسم المنتج<input required className="a-field mt-1" value={f.name} onChange={(e) => { set('name', e.target.value); if (!product && !f.slug) { /* slug filled on save */ } }} /></label>
        <label className="a-lbl">رابط المنتج (يُولَّد تلقائياً إن تُرك فارغاً)<input className="a-field mt-1" dir="ltr" value={f.slug} onChange={(e) => set('slug', e.target.value)} placeholder={slugify(f.name)} /></label>
        <label className="a-lbl">القسم<select className="a-field mt-1" value={f.category_id} onChange={(e) => set('category_id', e.target.value)}><option value="">— بدون —</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="a-lbl md:col-span-2">الوصف<textarea className="a-field mt-1 min-h-24" value={f.description} onChange={(e) => set('description', e.target.value)} /></label>
        <label className="a-lbl">السعر الأساسي ₪<input required inputMode="decimal" dir="ltr" className="a-field mt-1" value={f.base_price} onChange={(e) => set('base_price', e.target.value)} /></label>
        <label className="a-lbl">سعر العرض ₪ (اتركه فارغاً بدون عرض)<input inputMode="decimal" dir="ltr" className="a-field mt-1" value={f.sale_price} onChange={(e) => set('sale_price', e.target.value)} /></label>
        <label className="a-lbl">الحالة<select className="a-field mt-1" value={f.status} onChange={(e) => set('status', e.target.value as 'visible')}><option value="visible">ظاهر في المتجر</option><option value="hidden">مخفي</option></select></label>
        <label className="a-lbl">الترتيب (الأصغر أولاً)<input inputMode="numeric" dir="ltr" className="a-field mt-1" value={f.sort} onChange={(e) => set('sort', e.target.value)} /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.is_bestseller} onChange={(e) => set('is_bestseller', e.target.checked)} className="h-4 w-4" />يظهر في «الأكثر مبيعاً»</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.is_custom} onChange={(e) => set('is_custom', e.target.checked)} className="h-4 w-4" />منتج تفصيل (حسب القياس، بدون مخزون)</label>
      </section>

      <section className="a-card space-y-3"><h2 className="font-semibold">الصور <span className="a-muted">(حتى 12، الأولى هي الرئيسية، وتُصغَّر تلقائياً لتوفير الإنترنت)</span></h2>
        <label ref={drop} onDragOver={(e) => { e.preventDefault(); drop.current?.classList.add('bg-[#f1e7d2]') }} onDragLeave={() => drop.current?.classList.remove('bg-[#f1e7d2]')}
          onDrop={(e) => { e.preventDefault(); drop.current?.classList.remove('bg-[#f1e7d2]'); void upload(e.dataTransfer.files) }}
          className="grid cursor-pointer place-items-center rounded-lg border-2 border-dashed border-[var(--a-line)] p-6 text-center text-sm text-[var(--a-mute)]">
          {busy ? 'جارٍ الرفع...' : 'اسحب الصور هنا أو اضغط للاختيار'}<input type="file" accept="image/*" multiple className="sr-only" disabled={busy || images.length >= 12} onChange={(e) => e.target.files && void upload(e.target.files)} /></label>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">{images.map((im, i) => (
          <li key={im.url} className="space-y-1 rounded-lg border border-[var(--a-line)] p-2"><div className="relative aspect-square overflow-hidden rounded"><Image src={im.url} alt={im.alt} fill sizes="160px" className="object-cover" />{i === 0 && <span className="a-pill absolute start-1 top-1 bg-[#8f6a2e] text-white">رئيسية</span>}</div>
            <div className="flex justify-between gap-1"><button type="button" className="a-btn !min-h-8 !px-2" aria-label="تقديم" onClick={() => setImages((a) => move(a, i, -1))}>→</button><button type="button" className="a-btn !min-h-8 !px-2" aria-label="تأخير" onClick={() => setImages((a) => move(a, i, 1))}>←</button>
              <button type="button" className="a-btn a-btn-danger !min-h-8 !px-2" aria-label="حذف الصورة" onClick={() => setImages((a) => a.filter((_, j) => j !== i))}>✕</button></div></li>))}</ul></section>

      <section className="a-card space-y-3"><div className="flex items-center justify-between"><h2 className="font-semibold">الخيارات والمخزون</h2><button type="button" className="a-btn" onClick={() => setVariants((v) => [...v, { id: null, label: '', color: '', size: '', fabric: '', price: '', stock: '0', is_active: true }])}>+ خيار</button></div>
        <p className="a-muted">لكل خيار سعر خاص اختياري (إن تُرك فارغاً يُستعمل سعر المنتج). {f.is_custom ? 'منتجات التفصيل لا تخضع للمخزون.' : 'تنبيه المخزون يظهر عند 5 أو أقل.'}</p>
        <div className="a-scroll"><table className="a-table"><thead><tr><th>الاسم</th><th>اللون</th><th>المقاس</th><th>القماش</th><th>السعر ₪</th>{!f.is_custom && <th>المخزون</th>}<th>فعّال</th><th></th></tr></thead><tbody>
          {variants.map((v, i) => { const u = (p: Partial<Variant>) => setVariants((a) => a.map((x, j) => (j === i ? { ...x, ...p } : x)))
            return <tr key={v.id ?? `n${i}`}><td><input required className="a-field !min-h-9 w-40" value={v.label} onChange={(e) => u({ label: e.target.value })} aria-label="اسم الخيار" /></td><td><input className="a-field !min-h-9 w-24" value={v.color} onChange={(e) => u({ color: e.target.value })} aria-label="اللون" /></td>
              <td><input className="a-field !min-h-9 w-24" value={v.size} onChange={(e) => u({ size: e.target.value })} aria-label="المقاس" /></td><td><input className="a-field !min-h-9 w-28" value={v.fabric} onChange={(e) => u({ fabric: e.target.value })} aria-label="القماش" /></td>
              <td><input inputMode="decimal" dir="ltr" className="a-field !min-h-9 w-24" value={v.price} onChange={(e) => u({ price: e.target.value })} aria-label="سعر الخيار" /></td>
              {!f.is_custom && <td><input inputMode="numeric" dir="ltr" className="a-field !min-h-9 w-20" value={v.stock} onChange={(e) => u({ stock: e.target.value })} aria-label="المخزون" /></td>}
              <td><input type="checkbox" checked={v.is_active} onChange={(e) => u({ is_active: e.target.checked })} aria-label="فعّال" className="h-4 w-4" /></td>
              <td><button type="button" className="a-btn a-btn-danger !min-h-8 !px-2" aria-label="حذف الخيار" onClick={() => setVariants((a) => a.filter((_, j) => j !== i))}>✕</button></td></tr> })}
          {!variants.length && <tr><td colSpan={8} className="a-muted py-4 text-center">لا خيارات: المنتج يُباع بسعره الأساسي بلا مخزون محدد</td></tr>}</tbody></table></div></section>

      {f.is_custom && (
        <section className="a-card space-y-3"><div className="flex items-center justify-between"><h2 className="font-semibold">حقول القياس (يملؤها الزبون)</h2>
          <button type="button" className="a-btn" onClick={() => setRaw(raw === null ? JSON.stringify(schema, null, 2) : null)}>{raw === null ? 'متقدم (JSON)' : 'العودة للمنشئ'}</button></div>
          {raw !== null ? <textarea dir="ltr" className="a-field min-h-64 font-mono text-xs" value={raw} onChange={(e) => setRaw(e.target.value)} /> : (<>
            <label className="a-lbl w-60">الرسم التوضيحي<select className="a-field mt-1" value={schema.diagram ?? ''} onChange={(e) => setSchema((s) => ({ ...s, diagram: (e.target.value || undefined) as MeasurementSchema['diagram'] }))}><option value="">بدون</option><option value="curtains">شباك / ستائر</option><option value="majlis">جلسة / فرش عربي</option><option value="batana">باطنة</option></select></label>
            <ul className="space-y-2">{schema.fields.map((fl, i) => (
              <li key={fl.key + i} className="grid gap-2 rounded-lg border border-[var(--a-line)] p-3 md:grid-cols-[2fr_1fr_2fr_2fr_auto]">
                <input className="a-field" placeholder="اسم الحقل (مثل: عرض الشباك سم)" value={fl.label} onChange={(e) => upField(i, { label: e.target.value })} aria-label="اسم الحقل" />
                <select className="a-field" value={fl.type} onChange={(e) => upField(i, { type: e.target.value as Field['type'] })} aria-label="النوع"><option value="number">رقم</option><option value="select">اختيار</option><option value="text">نص</option></select>
                <input className="a-field" placeholder={fl.type === 'select' ? 'الخيارات مفصولة بفاصلة' : '—'} disabled={fl.type !== 'select'} value={(fl.options ?? []).join('، ')} onChange={(e) => upField(i, { options: e.target.value.split(/[,،]/).map((x) => x.trim()).filter(Boolean) })} aria-label="الخيارات" />
                <input className="a-field" placeholder="تلميح للزبون (اختياري)" value={fl.hint ?? ''} onChange={(e) => upField(i, { hint: e.target.value })} aria-label="تلميح" />
                <div className="flex gap-1"><button type="button" className="a-btn !px-2" aria-label="للأعلى" onClick={() => setSchema((s) => ({ ...s, fields: move(s.fields, i, -1) }))}>↑</button><button type="button" className="a-btn !px-2" aria-label="للأسفل" onClick={() => setSchema((s) => ({ ...s, fields: move(s.fields, i, 1) }))}>↓</button>
                  <button type="button" className="a-btn a-btn-danger !px-2" aria-label="حذف الحقل" onClick={() => setSchema((s) => ({ ...s, fields: s.fields.filter((_, j) => j !== i) }))}>✕</button></div>
                {fl.showIf && <p className="a-muted md:col-span-5">⚙ حقل مشروط (يظهر عند اختيار معيّن)، يُعدَّل من وضع JSON المتقدم.</p>}</li>))}</ul>
            <button type="button" className="a-btn" onClick={() => setSchema((s) => ({ ...s, fields: [...s.fields, { key: `f${Date.now().toString(36)}`, label: '', type: 'number' }] }))}>+ حقل قياس</button></>)}</section>)}

      {msg && <p role={msg.t === 'err' ? 'alert' : 'status'} className={`rounded-md p-3 text-sm ${msg.t === 'err' ? 'bg-rose-50 text-rose-800' : 'bg-emerald-50 text-emerald-800'}`}>{msg.s}</p>}
      <div className="sticky bottom-0 -mx-4 flex flex-wrap gap-2 border-t border-[var(--a-line)] bg-[var(--a-bg)] p-3 md:-mx-8 md:px-8">
        <button className="a-btn a-btn-solid" disabled={pending || busy}>{pending ? 'جارٍ الحفظ...' : 'حفظ'}</button>
        {product && <a className="a-btn" target="_blank" rel="noopener" href={`/product/${product.slug}`}>معاينة في المتجر</a>}
        {product && canDelete && <button type="button" className="a-btn a-btn-danger ms-auto" onClick={() => { if (confirm('حذف المنتج نهائياً؟ (الأفضل «إخفاؤه» بدل الحذف)')) start(async () => { const r = await deleteProduct(product.id); if (r.error) setMsg({ t: 'err', s: r.error }); else router.replace('/admin/products') }) }}>حذف</button>}
      </div>
    </form>
  )
}
