import type { Metadata } from 'next'
import { getBranches, getSetting } from '@/lib/data'
import { CheckoutForm } from '@/components/store/CheckoutForm'

export const revalidate = 60
export const metadata: Metadata = { title: 'إتمام الطلب', robots: { index: false } }
export default async function Checkout() {
  const [branches, accounts] = await Promise.all([getBranches(), getSetting('payment_accounts', {})])
  return <div className="container-x py-10"><h1 className="font-display copper-text mb-8 text-center text-4xl md:text-5xl">إتمام الطلب</h1><CheckoutForm branches={branches} accounts={accounts} /></div>
}
