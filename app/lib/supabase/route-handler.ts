import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Create Supabase client specifically for API Route Handlers
 * This handles the cookie synchronization issue in Next.js 14.2+
 *
 * The key insight: In API routes, we need to ensure cookies are
 * properly read from the incoming request, not just from next/headers
 */
export async function createRouteHandlerClient() {
  const cookieStore = await cookies()

  // Get all cookies as an array for debugging
  const allCookies = cookieStore.getAll()

  // Log for debugging (remove in production)
  const authCookie = allCookies.find(c => c.name.includes('auth-token'))
  if (!authCookie) {
    console.warn('[RouteHandler] No auth token cookie found. Available cookies:',
      allCookies.map(c => c.name).join(', ') || 'none')
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            // Ignore - this is expected in some contexts
          }
        },
      },
    }
  )
}

/**
 * Alternative: Create client from NextRequest directly
 * This bypasses next/headers and reads cookies directly from the request
 * Use this if the above method still fails
 */
export function createClientFromRequest(request: NextRequest) {
  const response = NextResponse.next()

  return {
    supabase: createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              response.cookies.set({ name, value, ...options })
            })
          },
        },
      }
    ),
    response
  }
}
