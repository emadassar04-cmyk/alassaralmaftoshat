import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans_Arabic, Reem_Kufi } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { SITE } from '@/lib/format'

const display = Reem_Kufi({ subsets: ['arabic', 'latin'], variable: '--font-reem', display: 'swap' })
const plex = IBM_Plex_Sans_Arabic({ subsets: ['arabic', 'latin'], weight: ['400', '500', '600'], variable: '--font-plex', display: 'swap' })

export const viewport: Viewport = { themeColor: '#0e0b09', width: 'device-width', initialScale: 1 }
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
