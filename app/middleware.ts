import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { defaultLocale, locales } from './i18n/config'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

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

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/auth',
  '/auth/callback',
  '/login',
  '/signup',
  '/property-listing',
  '/pricing',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/api/auth',
  '/api/webhooks',
  '/api/public',
]

// Role-based route configuration — single builder dashboard
const ROLE_ROUTES: Record<string, string[]> = {
  builder: [
    '/builder',
    '/builder/dashboard',
    '/builder/properties',
    '/builder/leads',
    '/builder/analytics',
  ],
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const response = NextResponse.next()

  // ============================================
  // SECURITY HEADERS (Applied to all responses)
  // ============================================
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://cdn.jsdelivr.net https://www.gstatic.com https://www.google.com https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co https://api.razorpay.com https://www.googleapis.com",
      "frame-src https://api.razorpay.com https://checkout.razorpay.com https://www.google.com",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests"
    ].join('; ')
  )

  // HSTS (HTTP Strict Transport Security)
  if (req.nextUrl.protocol === 'https:') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

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

  // 2) Admin route protection - handled by Next.js layout with server-side auth
  // Admin routes are now handled by Next.js, not Netlify redirects

  // 3) Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  )

  // 3.5) API routes handling
  const isApiRoute = pathname.startsWith('/api/')
  if (isApiRoute) {
    // CRITICAL: Skip session refresh for public API routes (auth, webhooks, public)
    // These routes handle their own auth or don't need auth at all
    const isPublicApiRoute =
      pathname.startsWith('/api/auth') ||
      pathname.startsWith('/api/webhooks') ||
      pathname.startsWith('/api/public')

    if (isPublicApiRoute) {
      // Let public API routes through without any session handling
      return response
    }

    // For protected API routes, refresh the session
    // This is CRITICAL for API auth to work properly
    try {
      // Create Supabase client for session refresh
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return req.cookies.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                req.cookies.set(name, value)
                response.cookies.set({
                  name,
                  value,
                  ...options,
                })
              })
            },
          },
        }
      )

      // Refresh the session by calling getUser()
      // This updates the cookies with fresh tokens if needed
      await supabase.auth.getUser()

      // Return response with refreshed cookies
      return response
    } catch (error) {
      console.error('Middleware API session refresh error:', error)
      // Allow through even on error - let API handle auth
      return response
    }
  }

  // 4) Role-based route protection (only for protected routes)
  if (!isPublicRoute) {
    try {
      // Create Supabase client with proper cookie handling for middleware
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return req.cookies.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                req.cookies.set(name, value)
                response.cookies.set({
                  name,
                  value,
                  ...options,
                })
              })
            },
          },
        }
      )

      // IMPORTANT: Call getUser() to refresh tokens if needed
      // This ensures tokens are refreshed before they expire
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      // If not authenticated, allow through - client-side will handle opening auth modal
      // Don't redirect to /login - let the dashboard pages open the modal popup
      if (authError || !user) {
        // Add header to indicate auth is required - client can use this to open modal
        response.headers.set('X-Auth-Required', 'true')
        response.headers.set('X-Auth-Redirect', pathname)
        // Allow the request through - client-side code will handle opening modal
        return response
      }

      // Pass authenticated user id in header — client-side BuilderAuthProvider
      // handles role checking and profile fetching. We do NOT query user_roles or
      // builder_profiles here because that adds 2 extra DB round-trips to EVERY
      // request. The middleware's job is only to confirm the session is valid.
      response.headers.set('X-User-Id', user.id)
      response.headers.set('X-User-Email', user.email || '')
    } catch (error) {
      console.error('Middleware error:', error)
      // On error, allow through (fail open for now)
    }
  }

  // 5) next-intl locale routing (only for explicit locale-prefixed paths)
  const first = pathname.split('/')[1]
  if (Array.from(locales).includes(first as any)) {
    return handleI18nRouting(req)
  }

  // For all other paths, proceed
  return response
}

export const config = {
  matcher: [
    // Root homepage should pass through middleware so we can rewrite to /index.html
    '/',
    // Preserve existing guards
    '/app',
    '/app/:path*',
    '/admin',
    // Builder dashboard routes
    '/builder/:path*',
    '/builder',
    // Localized routes — handle only explicit locale prefixes (non-root)
    '/(en|ta|hi)/:path*',
    // CRITICAL: API routes need middleware for session refresh
    // Without this, API routes don't get fresh tokens
    '/api/leads/:path*',
    '/api/crm/:path*',
    '/api/builder/:path*',
  ],
}
