import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPost, getPosts } from '@/lib/data'

export const revalidate = 300
export async function generateStaticParams() { return (await getPosts()).map((p) => ({ slug: p.slug })) }
export async function generateMetadata(props: PageProps<'/blog/[slug]'>): Promise<Metadata> {
  const p = await getPost((await props.params).slug); if (!p) return {}
  return { title: p.title, description: p.excerpt ?? undefined, alternates: { canonical: `/blog/${p.slug}` } }
}
export default async function Post(props: PageProps<'/blog/[slug]'>) {
  const p = await getPost((await props.params).slug); if (!p) notFound()
  return <article className="container-x max-w-2xl py-14"><h1 className="font-display copper-text text-4xl md:text-5xl">{p.title}</h1><div className="mt-8 space-y-4 whitespace-pre-line text-lg text-cream/90">{p.body}</div></article>
}
