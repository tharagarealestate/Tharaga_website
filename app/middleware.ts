import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { defaultLocale, locales } from './i18n/config'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// Normalize legacy routes and protect /admin with role-based access
// IMPORTANT: Do NOT localize the root "/". We serve a static homepage at
// app/public/index.html on Netlify. If we prefix the root, Netlify tries to
// render a localized Next.js page and the homepage collapses. We therefore
// scope next-intl to explicit locale-prefixed routes only (e.g. /en, /ta, /hi).
const handleI18nRouting = createMiddleware({
  locales: Array.from(locales),
  defaultLocale,
  // Use 'as-needed' to avoid forcing locale on the root path
  localePrefix: 'as-needed',
})

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 0) Serve static homepage for root path using public/index.html
  // This keeps Render/Vercel/Node deployments consistent with Netlify, where
  // the static marketing homepage lives in app/public/index.html.
  if (pathname === '/') {
    return NextResponse.rewrite(new URL('/index.html', req.url))
  }

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

  // 3) Homepage for explicit locale root -> serve static marketing homepage
  // e.g. /en, /ta, /hi should show same homepage as /
  if (/^\/(en|ta|hi)\/?$/.test(pathname)) {
    return NextResponse.rewrite(new URL('/index.html', req.url))
  }

  // 4) next-intl locale routing (only for explicit locale-prefixed paths)
  const first = pathname.split('/')[1]
  if (Array.from(locales).includes(first as any)) {
    return handleI18nRouting(req)
  }

  // For all other paths, proceed without i18n handling
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Root homepage should pass through middleware so we can rewrite to /index.html
    '/',
    // Preserve existing guards
    '/app',
    '/app/:path*',
    '/admin',
    '/admin/:path*',
    // Localized routes — handle only explicit locale prefixes (non-root)
    '/(en|ta|hi)/:path*',
  ],
}
