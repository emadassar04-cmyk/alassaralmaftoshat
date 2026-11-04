import type { Metadata } from 'next'
import Link from 'next/link'
import { getPosts } from '@/lib/data'
import { PageHead } from '@/components/store/Breadcrumbs'

export const revalidate = 300
export const metadata: Metadata = { title: 'المدونة', description: 'نصائح في اختيار المفروشات وقياس الستائر والعناية بالأقمشة من مفروشات العصار.', alternates: { canonical: '/blog' } }
export default async function Blog() {
  const posts = await getPosts()
  return (
    <>
      <PageHead crumbs={[{ label: 'المدونة' }]} eyebrow="نصائح من العصار" title="المدونة" sub="أفكار في اختيار المفروشات وقياس الستائر والعناية بالأقمشة." />
      <div className="container-x py-10 md:py-14">
        <ul className="grid gap-5 md:grid-cols-2">{posts.map((p) => <li key={p.slug}><Link href={`/blog/${p.slug}`} className="card group block h-full p-7 transition-shadow duration-500 hover:shadow-[var(--shadow-lift)]"><p className="num text-xs text-muted">{new Date(p.published_at).toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' })}</p><h2 className="t-h3 mt-3 transition-colors group-hover:text-brown">{p.title}</h2>{p.excerpt && <p className="mt-2 text-ink-2">{p.excerpt}</p>}<span className="mt-5 inline-block text-sm text-brown link-u">اقرأ المقال</span></Link></li>)}</ul>
        {posts.length === 0 && <p className="panel p-10 text-center text-ink-2">لا توجد مقالات بعد.</p>}
      </div>
    </>
  )
}
