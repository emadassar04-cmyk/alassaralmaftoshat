import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Optimistic gate + session refresh for /admin. Real authorization is RLS in the database and requireStaff() in each page.
export async function proxy(req: NextRequest) {
  let res = NextResponse.next({ request: req })
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '', {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value))
        res = NextResponse.next({ request: req })
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      },
    },
  })
  const { data: { user } } = await sb.auth.getUser()
  const isLogin = req.nextUrl.pathname.startsWith('/admin/login')
  if (!user && !isLogin) return NextResponse.redirect(new URL('/admin/login', req.url))
  if (user && isLogin) return NextResponse.redirect(new URL('/admin', req.url))
  res.headers.set('x-robots-tag', 'noindex, nofollow')
  return res
}
export const config = { matcher: ['/admin/:path*'] }
