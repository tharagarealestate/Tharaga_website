import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Create Supabase client for server-side use (API routes, server components)
 * Properly handles async cookies in Next.js 15+
 * 
 * Pattern: Await cookies() first, then use the resolved cookieStore in getAll/setAll
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // cookieStore is already resolved, so getAll() is synchronous
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            // cookieStore is already resolved, so set() is synchronous
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
            // Suppress error logging for this expected case
          }
        },
      },
    }
  )
}

