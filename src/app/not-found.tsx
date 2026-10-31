import Link from 'next/link'
export default function NotFound() {
  return <div className="container-x py-32 text-center"><p className="eyebrow">404</p><h1 className="font-display copper-text mt-3 text-5xl">الصفحة غير موجودة</h1><Link href="/" className="btn btn-solid mt-8">العودة للرئيسية</Link></div>
}
