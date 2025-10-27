import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { builderId } = (await req.json().catch(() => ({}))) as { builderId?: string }
    if (!builderId) return NextResponse.json({ error: 'builderId required' }, { status: 400 })

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE
    if (!url || !key) return NextResponse.json({ error: 'Supabase env missing' }, { status: 500 })

    const supabase = createClient(url, key)

    const now = new Date()
    const expires = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

    const { error } = await supabase.from('builder_subscriptions').insert([
      {
        builder_id: builderId,
        tier: 'trial',
        status: 'active',
        trial_started_at: now.toISOString(),
        trial_expires_at: expires.toISOString(),
      },
    ])

    if (error) return NextResponse.json({ error: error.message }, { status: 200 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected' }, { status: 200 })
  }
}
