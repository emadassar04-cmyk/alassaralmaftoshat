'use client'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react'

type Img = { url: string; alt: string | null }
/** Main image + thumbnails; tap to open a full-screen viewer with swipe, arrows, keyboard and double-tap zoom. */
export function Gallery({ images, name }: { images: Img[]; name: string }) {
  const [i, setI] = useState(0); const [open, setOpen] = useState(false); const [zoom, setZoom] = useState(false)
  const n = images.length; const touch = useRef<number | null>(null)
  const go = useCallback((d: number) => { setZoom(false); setI((x) => (x + d + n) % n) }, [n])
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); if (e.key === 'ArrowLeft') go(1); if (e.key === 'ArrowRight') go(-1) }
    document.body.style.overflow = 'hidden'; window.addEventListener('keydown', k)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', k) }
  }, [open, go])
  if (!n) return <div className="media aspect-[4/5]" />
  const cur = images[i]
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)} className="media group block aspect-[4/5] w-full cursor-zoom-in sm:aspect-[5/4]" aria-label="تكبير الصورة">
        <Image src={cur.url} alt={cur.alt ?? name} fill preload fetchPriority="high" sizes="(max-width:1024px) 100vw, 55vw" className="object-cover" />
        <span className="absolute bottom-3 end-3 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-charcoal shadow-[var(--shadow-soft)]"><Expand size={17} /></span>
        {n > 1 && <span className="num absolute bottom-3 start-3 rounded-full bg-white/90 px-3 py-1 text-xs">{i + 1} / {n}</span>}
      </button>
      {n > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto" role="tablist" aria-label="صور المنتج">
          {images.map((im, k) => (
            <button key={im.url} type="button" role="tab" aria-selected={k === i} onClick={() => setI(k)}
              className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-[10px] border-2 transition-colors sm:h-24 sm:w-20 ${k === i ? 'border-charcoal' : 'border-transparent opacity-70 hover:opacity-100'}`}>
              <Image src={im.url} alt="" fill sizes="80px" className="object-cover" /></button>))}
        </div>)}
      {open && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-charcoal/95" role="dialog" aria-modal="true" aria-label={`صور ${name}`}>
          <div className="flex items-center justify-between p-4 text-ivory"><span className="num text-sm">{i + 1} / {n}</span>
            <button onClick={() => setOpen(false)} className="grid h-11 w-11 place-items-center rounded-full bg-white/10" aria-label="إغلاق"><X /></button></div>
          <div className="relative flex-1 overflow-hidden" onDoubleClick={() => setZoom((z) => !z)}
            onTouchStart={(e) => { touch.current = e.touches[0].clientX }} onTouchEnd={(e) => { if (touch.current == null || zoom) return; const dx = e.changedTouches[0].clientX - touch.current; if (Math.abs(dx) > 50) go(dx < 0 ? -1 : 1); touch.current = null }}>
            <Image src={cur.url} alt={cur.alt ?? name} fill sizes="100vw" quality={90} className={`object-contain transition-transform duration-300 ${zoom ? 'scale-[2] cursor-zoom-out' : 'cursor-zoom-in'}`} onClick={() => setZoom((z) => !z)} />
          </div>
          {n > 1 && <div className="flex justify-center gap-3 p-4">
            <button onClick={() => go(-1)} className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-ivory" aria-label="السابقة"><ChevronRight /></button>
            <button onClick={() => go(1)} className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-ivory" aria-label="التالية"><ChevronLeft /></button></div>}
        </div>)}
    </div>
  )
}
