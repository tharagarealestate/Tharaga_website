import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { MANDATES } from '@/lib/mandates'

export const runtime = 'nodejs'

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase env not configured')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

// Live mandate portfolio (no prices are ever exposed). Source of truth: lib/mandates.ts
const SHOWCASE = MANDATES.map(({ slug, name, category, location, region, tagline, teaser, stats, badge, image }) => ({
  id: slug, slug, title: name, category, location, region, tagline, teaser, stats, badge: badge?.label ?? null, image,
}))

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')
    const email = searchParams.get('email')
    const category = searchParams.get('category')

    let userMandates: any[] = []

    // Fetch user submissions from Supabase if authenticated
    if (userId || email) {
      try {
        const supabase = getServiceSupabase()
        let query = supabase
          .from('properties')
          .select('id, title, description, property_type, city, locality, price_inr, plot_area, verification_status, listing_status, property_metadata, created_at')
          .order('created_at', { ascending: false })

        if (userId) {
          query = query.eq('property_metadata->seller->>user_id', userId)
        } else if (email) {
          query = query.ilike('property_metadata->seller->>email', email)
        }

        const { data, error } = await query
        if (!error && data) {
          userMandates = data.map(item => {
            const meta = item.property_metadata || {}
            return {
              id: item.id,
              title: item.title,
              category: item.property_type || 'Commercial Asset',
              district: item.city,
              corridor: item.locality,
              extent_acres: meta.extent_display || (meta.extent_acres ? `${meta.extent_acres} Acres` : (meta.built_up_sqft ? `${meta.built_up_sqft} sq.ft` : (item.plot_area ? `${(item.plot_area / 43560).toFixed(1)} Acres` : '—'))),
              price_display: meta.price_display || (item.price_inr ? `₹${(item.price_inr / 10000000).toFixed(2)} Cr` : 'Under Review'),
              rental_yield_display: meta.rental_yield_display || null,
              media_count: meta.media?.length || 0,
              verification_status: item.verification_status || 'in_review',
              listing_status: item.listing_status || 'in_progress',
              tracking_stage: meta.tracking_stage || 'confidential_underwriting',
              tracking_stage_title: meta.tracking_stage_title || 'Property Underwriting & Review',
              tracking_stage_description: meta.tracking_stage_description || 'Our desk is auditing title records and coordinating with verified buyers.',
              tracking_history: meta.tracking_history || [
                { stage: 'mandate_received', label: 'Property Listed via AI Assistant', timestamp: item.created_at, status: 'completed' },
                { stage: 'confidential_underwriting', label: 'Technical Underwriting & Title Review', timestamp: item.created_at, status: 'active' },
                { stage: 'buyer_matching', label: 'Private Buyer Matching & Outreach', timestamp: null, status: 'pending' },
              ],
              target_offtakers: meta.claude_analysis?.target_offtakers || ['Corporate Investors', 'Private Equity & Real Estate Funds'],
              created_at: item.created_at
            }
          })
        }
      } catch (dbErr: any) {
        console.warn('Could not fetch user mandates from DB:', dbErr.message)
      }
    }

    // Filter live portfolio by category if requested
    let showcase = SHOWCASE
    if (category && category !== 'all') {
      showcase = showcase.filter(m => m.category === category.toLowerCase())
    }

    return NextResponse.json({
      success: true,
      showcase,
      user_mandates: userMandates,
      authenticated: Boolean(userId || email)
    })
  } catch (err: any) {
    console.error('Commercial mandates GET error:', err)
    return NextResponse.json({ success: false, showcase: SHOWCASE, user_mandates: [] })
  }
}
