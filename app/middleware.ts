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

  // 0) Homepage uses Next.js App Router (app/app/page.tsx)
  // Renders React components: Header, HeroSection, DashboardCTASection, FeaturesSection, Footer
  // Header includes Supabase auth integration via layout.tsx auth script
  // No rewrite needed - let Next.js handle it normally

  // 1) Normalize legacy /app/* -> /*
  if (pathname === '/app' || pathname.startsWith('/app/')) {
    const dest = new URL(req.url)
    dest.pathname = pathname.replace(/^\/app(\/)?/, '/')
    return NextResponse.redirect(dest, { status: 308 })
  }

  // 2) Admin route protection
  // SKIP /admin - it's a standalone HTML served by Netlify redirect (netlify.toml line 55-58)
  // The admin panel has its own authentication in admin/index.html
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    // Let Netlify handle /admin routing - don't intercept
    return NextResponse.next()
  }

  // 3) Homepage for explicit locale root -> serve Next.js homepage
  // e.g. /en, /ta, /hi should show same homepage as /
  // if (/^\/(en|ta|hi)\/?$/.test(pathname)) {
  //   return NextResponse.rewrite(new URL('/index.html', req.url))
  // }

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
