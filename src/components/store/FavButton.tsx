'use client'
import { Heart } from 'lucide-react'
import { useFavorites } from '@/lib/favorites'
import { track } from '@/lib/pixel'

export function FavButton({ slug, name, variant = 'icon' }: { slug: string; name: string; variant?: 'icon' | 'full' }) {
  const { has, toggle } = useFavorites(); const on = has(slug)
  const click = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); if (!on) track('AddToWishlist', { content_name: name }); toggle(slug) }
  if (variant === 'full') return (
    <button type="button" onClick={click} aria-pressed={on} className={`btn !min-h-12 ${on ? '!border-brown !text-brown' : ''}`}>
      <Heart size={18} strokeWidth={1.6} fill={on ? 'currentColor' : 'none'} />{on ? 'في المفضلة' : 'أضف للمفضلة'}
    </button>)
  return (
    <button type="button" onClick={click} aria-pressed={on} aria-label={on ? `إزالة ${name} من المفضلة` : `إضافة ${name} للمفضلة`}
      className={`grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow-[var(--shadow-soft)] transition-transform active:scale-90 ${on ? 'text-brown' : 'text-charcoal'}`}>
      <Heart size={18} strokeWidth={1.7} fill={on ? 'currentColor' : 'none'} />
    </button>)
}
