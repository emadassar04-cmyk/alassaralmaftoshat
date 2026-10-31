import type { MetadataRoute } from 'next'
import { getPosts, getProducts } from '@/lib/data'
import { SITE } from '@/lib/format'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, posts] = await Promise.all([getProducts(), getPosts()])
  const now = new Date()
  return [...['', '/shop', '/custom', '/about', '/branches', '/blog'].map((p) => ({ url: `${SITE}${p}`, lastModified: now })),
    ...products.map((p) => ({ url: `${SITE}/product/${p.slug}`, lastModified: now })), ...posts.map((p) => ({ url: `${SITE}/blog/${p.slug}`, lastModified: new Date(p.published_at) }))]
}
