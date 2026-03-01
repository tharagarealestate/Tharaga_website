// =============================================
// API ROUTE FOR TRACKING FLUSH (sendBeacon)
// =============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { events, user_id } = body

    if (!events || !user_id) {
      return NextResponse.json(
        { error: 'Missing events or user_id' },
        { status: 400 }
      )
    }

    // Server-side Supabase client (use service role key)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and service role key are required');
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseKey, // Server-side only
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Batch insert events
    const { error } = await supabase.from('user_behavior').insert(events)

    if (error) {
      console.error('[API/Tracking] Flush error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Trigger score calculation
    try {
      await supabase.rpc('calculate_lead_score', { p_user_id: user_id })
    } catch (rpcError: any) {
      // Silently fail if RPC doesn't exist - it's optional
      if (
        !rpcError.message?.includes('function') &&
        !rpcError.message?.includes('does not exist')
      ) {
        console.warn('[API/Tracking] Score calculation failed:', rpcError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API/Tracking] Server error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

