import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Normalize legacy routes like /app/saas -> /saas
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  if (pathname === '/app' || pathname.startsWith('/app/')) {
    const dest = new URL(req.url)
    dest.pathname = pathname.replace(/^\/app(\/)?/, '/')
    // Preserve query and hash are already in dest via original URL
    return NextResponse.redirect(dest, { status: 308 })
  }
  return NextResponse.next()
}

// Run only for legacy /app/* paths (and exact /app)
export const config = {
  matcher: ['/app', '/app/:path*'],
}
