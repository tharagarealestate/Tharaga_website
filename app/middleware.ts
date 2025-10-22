import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { defaultLocale, locales } from './i18n/config'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// Normalize legacy routes and protect /admin with role-based access
const handleI18nRouting = createMiddleware({
  locales: Array.from(locales),
  defaultLocale,
  localePrefix: 'always',
})

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 1) Normalize legacy /app/* -> /*
  if (pathname === '/app' || pathname.startsWith('/app/')) {
    const dest = new URL(req.url)
    dest.pathname = pathname.replace(/^\/app(\/)?/, '/')
    return NextResponse.redirect(dest, { status: 308 })
  }

  // 2) Admin route protection
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (process.env.NEXT_PUBLIC_DISABLE_ADMIN_GUARD === 'true') {
      return NextResponse.next()
    }
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    return res
  }

  // 3) next-intl locale routing
  return handleI18nRouting(req)
}

export const config = {
  matcher: [
    // Preserve existing guards
    '/app',
    '/app/:path*',
    '/admin',
    '/admin/:path*',
    // Localized routes
    '/',
    '/(en|ta|hi)/:path*',
  ],
}
