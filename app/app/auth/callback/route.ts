import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * OAuth callback handler.
 * After Google (or any provider) auth, Supabase redirects here with a `code` param.
 * We exchange that code for a session, fetch the user's role, and redirect accordingly.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/'

  if (!code) {
    // No code — redirect home
    return NextResponse.redirect(new URL('/?error=missing_code', req.url))
  }

  const response = NextResponse.redirect(new URL(next, req.url))

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
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !data?.user) {
      console.error('[Auth Callback] Code exchange failed:', error?.message)
      return NextResponse.redirect(new URL('/?error=auth_failed', req.url))
    }

    const user = data.user

    // Fetch user role for redirect
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    const roleList = (roles || []).map((r: any) => r.role)

    // Role-based redirect
    let destination = '/'
    if (roleList.includes('admin') || roleList.includes('builder')) {
      destination = '/builder'
    } else if (roleList.includes('buyer')) {
      destination = '/my-dashboard'
    } else {
      // New user with no role — default to builder onboarding
      destination = '/builder'
    }

    const redirectUrl = new URL(destination, req.url)
    const redirectResponse = NextResponse.redirect(redirectUrl)

    // Copy auth cookies from the exchange response
    response.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie)
    })

    return redirectResponse
  } catch (err) {
    console.error('[Auth Callback] Exception:', err)
    return NextResponse.redirect(new URL('/?error=callback_error', req.url))
  }
}
