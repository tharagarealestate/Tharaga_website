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

  return NextResponse.next()
}

export const config = {
  matcher: ['/app', '/app/:path*', '/admin', '/admin/:path*'],
}
