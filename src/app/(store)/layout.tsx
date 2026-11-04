import Script from 'next/script'
import { Providers } from '@/components/store/Providers'
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { CartDrawer } from '@/components/store/CartDrawer'
import { LeadPopup } from '@/components/store/LeadPopup'
import { FloatingWhatsApp } from '@/components/store/FloatingWhatsApp'
import { getBranches, getCategories, getSetting } from '@/lib/data'

export const revalidate = 60
export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [branches, pixel, categories, social] = await Promise.all([getBranches(), getSetting<string>('meta_pixel_id', ''), getCategories(), getSetting<Record<string, string>>('social', {})])
  return (
    <Providers>
      <Header categories={categories.map((c) => ({ slug: c.slug, name: c.name }))} />
      <main id="main">{children}</main>
      <Footer branches={branches} categories={categories} social={social} />
      <CartDrawer />
      <LeadPopup />
      <FloatingWhatsApp phone={branches[0]?.whatsapp ?? null} />
      {pixel && /^\d{5,20}$/.test(pixel) && (
        <Script id="fb-pixel" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel}');fbq('track','PageView');`}</Script>
      )}
    </Providers>
  )
}
