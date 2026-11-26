import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

// Use Node runtime so we can write with service role securely
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any))
    const events = Array.isArray(body?.events) ? body.events : []

    // Insert into Supabase interactions table (best-effort)
    try {
      const supabase = getSupabase()
      const rows = events
        .map((e: any) => ({
          property_id: String(e?.property_id || ''),
          user_id: e?.user_id ? String(e.user_id) : null,
          session_id: e?.session_id ? String(e.session_id) : null,
          event: String(e?.event || 'custom'),
          value: typeof e?.value === 'number' ? e.value : null,
          duration_seconds: typeof e?.duration_seconds === 'number' ? e.duration_seconds : null,
          created_at: e?.ts ? new Date(Number(e.ts)) : new Date(),
        }))
        .filter(r => r.property_id && r.event)
      if (rows.length) {
        await supabase.from('interactions').insert(rows)
      }
    } catch (_err) {
      // swallow insert errors - do not block client
    }

    // Optionally forward to external backend if configured
    const base = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL
    if (base) {
      const url = new URL('/api/interactions', base)
      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const text = await res.text()
      return new NextResponse(text, { status: res.status, headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' } })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Proxy error' }, { status: 500 })
  }
}
