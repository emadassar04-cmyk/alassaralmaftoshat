import type { Metadata } from 'next'
import { getBranches, getSetting } from '@/lib/data'
import { CheckoutForm } from '@/components/store/CheckoutForm'
import { Breadcrumbs } from '@/components/store/Breadcrumbs'

export const revalidate = 60
export const metadata: Metadata = { title: 'إتمام الطلب', robots: { index: false } }
export default async function Checkout() {
  const [branches, accounts] = await Promise.all([getBranches(), getSetting('payment_accounts', {})])
  return <div className="container-x py-8 md:py-12"><Breadcrumbs items={[{ label: 'إتمام الطلب' }]} /><h1 className="t-h2 mb-10 mt-6">إتمام الطلب</h1><CheckoutForm branches={branches} accounts={accounts} /></div>
}
