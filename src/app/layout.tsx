import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans_Arabic, Reem_Kufi } from 'next/font/google'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Providers } from '@/components/store/Providers'
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { CartDrawer } from '@/components/store/CartDrawer'
import { LeadPopup } from '@/components/store/LeadPopup'
import { FloatingWhatsApp } from '@/components/store/FloatingWhatsApp'
import { getBranches, getSetting } from '@/lib/data'
import { SITE } from '@/lib/format'

const display = Reem_Kufi({ subsets: ['arabic', 'latin'], variable: '--font-reem', display: 'swap' })
const plex = IBM_Plex_Sans_Arabic({ subsets: ['arabic', 'latin'], weight: ['400', '500', '600'], variable: '--font-plex', display: 'swap' })

export const revalidate = 60
export const viewport: Viewport = { themeColor: '#0e0b09', width: 'device-width', initialScale: 1 }
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: 'مفروشات العصار | بيتك يستاهل الأفخم', template: '%s | مفروشات العصار' },
  description: 'مفروشات العصار: 30 عاماً من الثقة في دير البلح والنصيرات. وجه فرشات، مخدات، شراشف، ستائر، فرشات إسفنج، كنب وفرش عربي، وتفصيل على مقاسك.',
  openGraph: { type: 'website', locale: 'ar_PS', siteName: 'مفروشات العصار', images: ['/img/og.jpg'] },
  alternates: { canonical: '/' },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [branches, pixel] = await Promise.all([getBranches(), getSetting<string>('meta_pixel_id', '')])
  return (
    <html lang="ar" dir="rtl" className={`${display.variable} ${plex.variable}`}>
      <body>
        <Providers>
          <Header />
          <main id="main">{children}</main>
          <Footer branches={branches} />
          <CartDrawer />
          <LeadPopup />
          <FloatingWhatsApp phone={branches[0]?.whatsapp ?? null} />
        </Providers>
        <Analytics />
        {pixel && /^\d{5,20}$/.test(pixel) && (
          <Script id="fb-pixel" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel}');fbq('track','PageView');`}</Script>
        )}
      </body>
    </html>
  )
}
