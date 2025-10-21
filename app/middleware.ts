import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// Normalize legacy routes and protect /admin with role-based access
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
      const dest = new URL('/login', req.url)
      dest.searchParams.set('next', pathname)
      return NextResponse.redirect(dest)
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

  return NextResponse.next()
}

export const config = {
  matcher: ['/app', '/app/:path*', '/admin', '/admin/:path*'],
}
