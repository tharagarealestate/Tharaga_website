/**
 * POST /api/social-media/post
 *
 * Queues a social media post for the authenticated builder.
 * Accepts: { property_id?, caption, platforms, post_type }
 *
 * Saves the post record to social_posts table if it exists,
 * otherwise returns a queued success response (graceful degradation).
 *
 * Note: Actual posting to Instagram/Facebook requires a connected
 * Meta Business account via the Meta Graph API. This endpoint
 * stores the post intent and returns mock post IDs until a real
 * Meta integration is wired.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getBuilderUser, getServiceSupabase } from '../builder/_lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const authed = await getBuilderUser(request)
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      property_id = null,
      caption,
      platforms = ['instagram', 'facebook'],
      post_type = 'property',
    } = body

    if (!caption?.trim()) {
      return NextResponse.json({ error: 'caption is required' }, { status: 400 })
    }

    const serviceClient = getServiceSupabase()
    const now = new Date().toISOString()

    // Optionally verify property ownership if property_id is given
    if (property_id) {
      const { data: prop } = await serviceClient
        .from('properties')
        .select('builder_id')
        .eq('id', property_id)
        .single()
      if (prop && !authed.isAdmin && prop.builder_id !== authed.user.id) {
        return NextResponse.json({ error: 'Property access denied' }, { status: 403 })
      }
    }

    // Try to save to social_posts table (may not exist yet)
    let savedId: string | null = null
    try {
      const { data: inserted } = await serviceClient
        .from('social_posts')
        .insert({
          builder_id:  authed.user.id,
          property_id: property_id || null,
          caption:     caption.trim(),
          platforms,
          post_type,
          status:      'queued',
          created_at:  now,
        })
        .select('id')
        .single()
      savedId = inserted?.id || null
    } catch {
      // Table doesn't exist yet — continue without saving
    }

    // In production this would call Meta Graph API to publish the post.
    // For now, return a "queued" success with mock post IDs.
    const response: Record<string, any> = {
      success: true,
      status:  'queued',
      message: 'Post queued successfully. Connect your Meta Business account to enable auto-publishing.',
      queued_at: now,
    }

    if (savedId) response.post_id = savedId

    // Return platform-specific mock IDs so the UI can show them
    if (platforms.includes('instagram')) {
      response.instagram_post_id = `ig_queued_${Date.now()}`
    }
    if (platforms.includes('facebook')) {
      response.facebook_post_id = `fb_queued_${Date.now()}`
    }

    return NextResponse.json(response)
  } catch (err: any) {
    console.error('[social-media/post] Error:', err?.message || err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
