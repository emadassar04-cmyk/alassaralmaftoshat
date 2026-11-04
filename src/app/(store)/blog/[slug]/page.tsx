import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPost, getPosts } from '@/lib/data'
import { slugParam } from '@/lib/format'
import { Breadcrumbs } from '@/components/store/Breadcrumbs'

export const revalidate = 300
export async function generateStaticParams() { return (await getPosts()).map((p) => ({ slug: p.slug })) }
export async function generateMetadata(props: PageProps<'/blog/[slug]'>): Promise<Metadata> {
  const p = await getPost(slugParam((await props.params).slug)); if (!p) return {}
  return { title: p.title, description: p.excerpt ?? undefined, alternates: { canonical: `/blog/${p.slug}` } }
}
export default async function Post(props: PageProps<'/blog/[slug]'>) {
  const p = await getPost(slugParam((await props.params).slug)); if (!p) notFound()
  return <article className="container-x max-w-3xl py-8 md:py-12"><Breadcrumbs items={[{ href: '/blog', label: 'المدونة' }, { label: p.title }]} /><h1 className="t-h2 mt-8">{p.title}</h1>{p.excerpt && <p className="t-lead mt-4">{p.excerpt}</p>}<div className="mt-10 whitespace-pre-line border-t hairline pt-10 text-[17px] leading-9 text-charcoal">{p.body}</div></article>
}
