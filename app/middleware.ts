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

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/auth',
  '/login',
  '/signup',
  '/properties',
  '/pricing',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/api/auth',
  '/api/webhooks',
  '/api/public',
]

// Role-based route configuration
const ROLE_ROUTES: Record<string, string[]> = {
  buyer: [
    '/buyer',
    '/my-dashboard',
    '/saved',
  ],
  builder: [
    '/builder',
    '/builder/dashboard',
    '/builder/properties',
    '/builder/leads',
    '/builder/analytics',
  ],
  admin: [
    '/admin',
    '/admin/dashboard',
    '/admin/users',
    '/admin/verify',
  ],
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const response = NextResponse.next()

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

  // 4) Role-based route protection (only for protected routes)
  if (!isPublicRoute) {
    try {
      const supabase = createMiddlewareClient({ req, res: response })
      const { data: { session } } = await supabase.auth.getSession()

      // If not authenticated, allow through - client-side will handle opening auth modal
      // Don't redirect to /login - let the dashboard pages open the modal popup
      if (!session) {
        // Add header to indicate auth is required - client can use this to open modal
        response.headers.set('X-Auth-Required', 'true')
        response.headers.set('X-Auth-Redirect', pathname)
        // Allow the request through - client-side code will handle opening modal
        return response
      }

      // Check role-based access for protected routes
      for (const [requiredRole, routes] of Object.entries(ROLE_ROUTES)) {
        const isRoleRoute = routes.some(route => 
          pathname === route || pathname.startsWith(`${route}/`)
        )

        if (isRoleRoute) {
          // Fetch user roles from user_roles table (primary source of truth)
          const { data: userRoles } = await supabase
            .from('user_roles')
            .select('role, is_primary')
            .eq('user_id', session.user.id)

          const roles = userRoles?.map(r => r.role) || []
          const primaryRoleData = userRoles?.find(r => r.is_primary)
          const primaryRole = primaryRoleData?.role || roles[0] || null

          // Check if user has required role in user_roles table
          if (!roles.includes(requiredRole) && requiredRole !== 'admin') {
            // User doesn't have the required role - redirect to home with error
            const homeUrl = new URL('/', req.url)
            homeUrl.searchParams.set('error', 'unauthorized')
            homeUrl.searchParams.set('message', `You need ${requiredRole} role to access this page`)
            return NextResponse.redirect(homeUrl, { status: 403 })
          }

          // Builder-specific checks
          if (requiredRole === 'builder') {
            const { data: builderProfile } = await supabase
              .from('builder_profiles')
              .select('verification_status')
              .eq('user_id', session.user.id)
              .single()

            // Allow access even if pending verification (for onboarding)
            // Only block if explicitly rejected
            if (builderProfile?.verification_status === 'rejected') {
              return NextResponse.redirect(new URL('/builder/verification-required', req.url))
            }
          }

          // Add user context to headers
          response.headers.set('X-User-Id', session.user.id)
          response.headers.set('X-User-Role', primaryRole || '')
          response.headers.set('X-User-Roles', roles.join(','))

          break
        }
      }
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
    '/admin/:path*',
    // Role-based routes - protect all builder and buyer dashboard routes
    '/buyer/:path*',
    '/builder/:path*',
    '/builder',
    '/my-dashboard/:path*',
    '/my-dashboard',
    // Localized routes — handle only explicit locale prefixes (non-root)
    '/(en|ta|hi)/:path*',
  ],
}
