import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL
    if (!base) {
      return NextResponse.json({ error: 'Missing NEXT_PUBLIC_API_URL (backend). Set it to your recommendations API origin.' }, { status: 501 })
    }
    const url = new URL('/api/recommendations', base)
    const body = await req.json().catch(() => ({}))
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const text = await res.text()
    return new NextResponse(text, { status: res.status, headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Proxy error' }, { status: 500 })
  }
}
