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
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden glass-bg"><div className="glass-blob glow-drift -top-40 start-[-10%] h-[36rem] w-[36rem] bg-[#c9a227]/25" /><div className="glass-blob glow-drift top-1/3 end-[-12%] h-[32rem] w-[32rem] bg-[#0f4c5c]/15 [animation-delay:-5s]" /><div className="glass-blob bottom-[-10%] start-1/3 h-[28rem] w-[28rem] bg-[#e0bd4a]/20" /></div>
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
