import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ tier: 'trial', trial_leads_used: 0, days_remaining: 14 }, { status: 200 })

    // Read the subscription row
    const { data: sub } = await supabase
      .from('builder_subscriptions')
      .select('tier, status, trial_started_at, trial_expires_at')
      .eq('builder_id', user.id)
      .maybeSingle()

    // Derive days remaining
    let days_remaining = 0
    if (sub?.trial_expires_at) {
      const now = Date.now()
      const exp = new Date(sub.trial_expires_at).getTime()
      days_remaining = Math.max(0, Math.ceil((exp - now) / (1000 * 60 * 60 * 24)))
    }

    // Optionally compute trial leads used from leads table
    let trial_leads_used = 0
    try {
      const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('builder_id', user.id)
        .gte('created_at', sub?.trial_started_at || new Date(0).toISOString())
      trial_leads_used = count || 0
    } catch {}

    return NextResponse.json({
      tier: sub?.tier || 'trial',
      status: sub?.status || 'active',
      days_remaining,
      trial_leads_used,
    })
  } catch {
    return NextResponse.json({ tier: 'trial', trial_leads_used: 0, days_remaining: 14 }, { status: 200 })
  }
}

