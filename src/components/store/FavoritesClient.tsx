'use client'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import type { Product } from '@/lib/types'
import { useFavorites } from '@/lib/favorites'
import { ProductCard } from './ProductCard'

export function FavoritesClient({ products, wa = null }: { products: Product[]; wa?: string | null }) {
  const { favs } = useFavorites()
  const list = favs.map((s) => products.find((p) => p.slug === s)).filter(Boolean) as Product[]
  if (!list.length) return (
    <div className="panel flex flex-col items-center px-6 py-16 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-white text-brown"><Heart size={26} strokeWidth={1.4} /></span>
      <p className="t-h3 mt-6">لا توجد منتجات في المفضلة بعد</p>
      <p className="mt-2 max-w-sm text-ink-2">اضغط على القلب ♡ فوق أي منتج يعجبك، وبيضل محفوظ هون على جهازك.</p>
      <Link href="/shop" className="btn btn-solid mt-8">تصفّح المتجر</Link>
    </div>)
  return <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">{list.map((p) => <ProductCard key={p.id} p={p} level={2} wa={wa} />)}</div>
}
