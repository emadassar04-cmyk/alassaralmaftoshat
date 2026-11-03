import type { Metadata } from 'next'
import Link from 'next/link'
import { getPosts } from '@/lib/data'

export const revalidate = 300
export const metadata: Metadata = { title: 'المدونة', description: 'نصائح في اختيار المفروشات وقياس الستائر والعناية بالأقمشة من مفروشات العصار.', alternates: { canonical: '/blog' } }
export default async function Blog() {
  const posts = await getPosts()
  return (
    <div className="container-x max-w-3xl py-14"><h1 className="font-display copper-text text-center text-5xl">المدونة</h1>
      <ul className="mt-10 space-y-4">{posts.map((p) => <li key={p.slug}><Link href={`/blog/${p.slug}`} className="block border border-copper/20 p-6 transition-colors hover:border-copper"><h2 className="font-display text-2xl text-copper-lt">{p.title}</h2><p className="mt-1 text-sm text-muted">{p.excerpt}</p></Link></li>)}</ul></div>
  )
}
