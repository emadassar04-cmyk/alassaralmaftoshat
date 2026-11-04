import type { Metadata, Viewport } from 'next'
import { Alexandria, IBM_Plex_Sans_Arabic } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { SITE } from '@/lib/format'

const display = Alexandria({ subsets: ['arabic', 'latin'], weight: ['300', '400', '500'], variable: '--font-alex', display: 'swap' })
const plex = IBM_Plex_Sans_Arabic({ subsets: ['arabic', 'latin'], weight: ['400', '500', '600'], variable: '--font-plex', display: 'swap' })

export const viewport: Viewport = { themeColor: '#faf9f6', width: 'device-width', initialScale: 1 }
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: 'مفروشات العصار | بيتك يستاهل الأفخم', template: '%s | مفروشات العصار' },
  description: 'مفروشات العصار: 30 عاماً من الثقة في دير البلح والنصيرات. وجه فرشات، مخدات، شراشف، ستائر، فرشات إسفنج، كنب وفرش عربي، وتفصيل على مقاسك.',
  openGraph: { type: 'website', locale: 'ar_PS', siteName: 'مفروشات العصار', images: ['/img/og.jpg'] },
  alternates: { canonical: '/' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${display.variable} ${plex.variable}`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
