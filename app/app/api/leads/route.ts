import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as any
    const { property_id, name, email, phone, message } = body || {}
    if (!(name || email || phone)) return NextResponse.json({ error: 'Provide contact: phone or email' }, { status: 400 })

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE
    if (!url || !key) return NextResponse.json({ error: 'Supabase env missing' }, { status: 500 })

    const supabase = createClient(url, key)
    const authed = createRouteHandlerClient({ cookies })
    const { data: { user } } = await authed.auth.getUser()
    const source = req.headers.get('referer') || req.headers.get('origin') || ''
    const { error } = await supabase.from('leads').insert([{
      property_id: property_id || null,
      builder_id: user?.id || null,
      name,
      email,
      phone,
      message,
      source,
    }])
    if (error) return NextResponse.json({ error: error.message }, { status: 200 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected' }, { status: 200 })
  }
}
