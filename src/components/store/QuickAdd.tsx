'use client'
import { Plus } from 'lucide-react'
import type { Product } from '@/lib/types'
import { useCart } from '@/lib/cart'
import { unitPrice } from '@/lib/format'
import { track } from '@/lib/pixel'

/** One-tap add for products without options (variants/custom products go through the product page). */
export function QuickAdd({ p, image }: { p: Product; image: string | null }) {
  const { add } = useCart()
  return (
    <button type="button" aria-label={`أضف ${p.name} إلى السلة`}
      onClick={() => { add({ product_id: p.id, variant_id: null, slug: p.slug, name: p.name, variant_label: null, image, unit_price: unitPrice(p), qty: 1, is_custom: false }); track('AddToCart', { content_ids: [p.id], value: unitPrice(p), currency: 'ILS' }) }}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full border hairline bg-white text-charcoal transition-colors hover:border-brown hover:bg-brown hover:text-white">
      <Plus size={18} strokeWidth={1.6} />
    </button>
  )
}
