'use client'
import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { fmt } from '@/lib/format'

export function CartDrawer() {
  const { open, setOpen, lines, subtotal, setQty, remove } = useCart()
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="سلة التسوق">
      <button className="absolute inset-0 bg-charcoal/50" aria-label="إغلاق" onClick={() => setOpen(false)} />
      <aside className="absolute inset-y-0 start-0 flex w-[min(92vw,440px)] flex-col bg-ivory shadow-[var(--shadow-lift)]">
        <div className="flex items-center justify-between border-b border-line p-4">
          <h2 className="font-display text-2xl font-light text-charcoal">سلتك</h2>
          <button onClick={() => setOpen(false)} aria-label="إغلاق" className="p-2"><X /></button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {lines.length === 0 && (
            <div className="flex flex-col items-center py-16 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-sand text-brown"><ShoppingBag size={22} strokeWidth={1.4} /></span>
              <p className="t-h3 mt-5 !text-xl">السلة فارغة</p><p className="mt-1 text-sm text-ink-2">تصفّح المتجر وأضف ما يعجبك.</p>
              <Link href="/shop" onClick={() => setOpen(false)} className="btn mt-6">تصفّح المتجر</Link>
            </div>)}
          {lines.map((l) => (
            <div key={l.key} className="flex gap-3 border-b border-line pb-4">
              <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-champagne">{l.image && <Image src={l.image} alt="" fill sizes="80px" className="object-cover" />}</div>
              <div className="min-w-0 flex-1">
                <Link href={`/product/${l.slug}`} onClick={() => setOpen(false)} className="block truncate font-display text-lg">{l.name}</Link>
                {l.variant_label && <p className="text-xs text-muted">{l.variant_label}</p>}
                {l.is_custom && <p className="text-xs text-brown">تفصيل · السعر النهائي بعد مراجعة القياسات</p>}
                <div className="mt-2 flex items-center justify-between">
                  {l.is_custom ? <span className="text-sm text-muted">× {l.qty}</span> : (
                    <div className="flex items-center rounded-[var(--radius-md)] border border-line">
                      <button className="grid h-9 w-9 place-items-center" aria-label="إنقاص" onClick={() => setQty(l.key, l.qty - 1)}><Minus size={14} /></button>
                      <span className="w-8 text-center">{l.qty}</span>
                      <button className="grid h-9 w-9 place-items-center" aria-label="زيادة" onClick={() => setQty(l.key, l.qty + 1)}><Plus size={14} /></button>
                    </div>)}
                  <span className="text-brown">{fmt(l.unit_price * l.qty)}</span>
                  <button aria-label="حذف" className="p-2 text-muted hover:text-danger" onClick={() => remove(l.key)}><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {lines.length > 0 && (
          <div className="space-y-3 border-t border-line p-4">
            <div className="flex justify-between text-lg"><span>المجموع</span><strong className="text-brown">{fmt(subtotal)}</strong></div>
            <Link href="/checkout" onClick={() => setOpen(false)} className="btn btn-solid w-full">إتمام الطلب</Link>
          </div>
        )}
      </aside>
    </div>
  )
}
