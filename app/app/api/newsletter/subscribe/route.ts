import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { email, source } = (await req.json().catch(() => ({}))) as { 
      email?: string
      source?: string
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      )
    }

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
    if (!url || !key) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase = createClient(url, key)

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim()

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id, status')
      .eq('email', normalizedEmail)
      .single()

    if (existing) {
      if (existing.status === 'active') {
        return NextResponse.json(
          { 
            ok: true, 
            message: 'You are already subscribed to our newsletter',
            already_subscribed: true 
          },
          { status: 200 }
        )
      } else {
        // Re-activate subscription
        const { error: updateError } = await supabase
          .from('newsletter_subscribers')
          .update({
            status: 'active',
            subscribed_at: new Date().toISOString(),
            unsubscribed_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('email', normalizedEmail)

        if (updateError) {
          return NextResponse.json(
            { error: 'Failed to reactivate subscription' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          ok: true,
          message: 'Welcome back! Your subscription has been reactivated.'
        })
      }
    }

    // Insert new subscriber
    const { error: insertError } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email: normalizedEmail,
        status: 'active',
        source: source || 'footer',
        subscribed_at: new Date().toISOString()
      })

    if (insertError) {
      // Handle unique constraint violation gracefully
      if (insertError.code === '23505') {
        return NextResponse.json(
          { 
            ok: true, 
            message: 'You are already subscribed to our newsletter',
            already_subscribed: true 
          },
          { status: 200 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to subscribe. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      message: 'Successfully subscribed! Check your inbox for market insights.'
    })
  } catch (e: any) {
    console.error('[Newsletter Subscribe] Error:', e)
    return NextResponse.json(
      { error: e?.message || 'Unexpected error occurred' },
      { status: 500 }
    )
  }
}

