import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/format'
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/', disallow: ['/track/', '/thank-you/', '/checkout', '/admin', '/api/'] }, sitemap: `${SITE}/sitemap.xml` }
}
