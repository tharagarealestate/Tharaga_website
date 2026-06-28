/**
 * Meta Facebook Post API
 * Posts a property listing to the Facebook page using the Meta Graph API.
 * Optionally uploads a photo first if image_url is provided.
 * Records the post in the social_posts Supabase table.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ── helpers ────────────────────────────────────────────────────────────────

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars missing')
  return createClient(url, key)
}

function missingToken() {
  return NextResponse.json(
    { success: false, error: 'META_PAGE_ACCESS_TOKEN is not configured', skipped: true },
    { status: 200 }
  )
}

// ── main handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Parse body
  let body: { property_id?: string; message?: string; image_url?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const { property_id, message, image_url } = body

  if (!property_id || !message) {
    return NextResponse.json(
      { success: false, error: 'property_id and message are required' },
      { status: 400 }
    )
  }

  // 2. Check env vars
  const pageAccessToken = process.env.META_PAGE_ACCESS_TOKEN
  if (!pageAccessToken) return missingToken()

  // 3. Auto-detect page ID via /me
  let pageId: string
  try {
    const meRes = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=id,name`,
      { headers: { Authorization: `Bearer ${pageAccessToken}` } }
    )
    const meData = await meRes.json()
    if (!meRes.ok || !meData.id) {
      return NextResponse.json(
        {
          success: false,
          error: meData.error?.message ?? 'Failed to fetch Meta page identity',
          skipped: true,
        },
        { status: 200 }
      )
    }
    pageId = meData.id as string
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { success: false, error: `Meta /me request failed: ${msg}`, skipped: true },
      { status: 200 }
    )
  }

  // 4. Post to Facebook — photo upload path or feed path
  let postId: string
  let postUrl: string

  try {
    if (image_url) {
      // Upload photo with caption
      const photoRes = await fetch(
        `https://graph.facebook.com/v19.0/${pageId}/photos`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: image_url,
            caption: message,
            published: true,
            access_token: pageAccessToken,
          }),
        }
      )
      const photoData = await photoRes.json()
      if (!photoRes.ok || !photoData.id) {
        return NextResponse.json(
          {
            success: false,
            error: photoData.error?.message ?? 'Photo upload to Facebook failed',
            skipped: true,
          },
          { status: 200 }
        )
      }
      postId = photoData.id as string
      postUrl = `https://www.facebook.com/${pageId}/posts/${postId}`
    } else {
      // Text/link post via /feed
      const propertyUrl = `https://tharaga.co.in/properties/${property_id}`
      const feedRes = await fetch(
        `https://graph.facebook.com/v19.0/${pageId}/feed`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            link: propertyUrl,
            access_token: pageAccessToken,
          }),
        }
      )
      const feedData = await feedRes.json()
      if (!feedRes.ok || !feedData.id) {
        return NextResponse.json(
          {
            success: false,
            error: feedData.error?.message ?? 'Facebook feed post failed',
            skipped: true,
          },
          { status: 200 }
        )
      }
      postId = feedData.id as string
      postUrl = `https://www.facebook.com/${pageId}/posts/${postId}`
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { success: false, error: `Meta Graph API call failed: ${msg}`, skipped: true },
      { status: 200 }
    )
  }

  // 5. Upsert into social_media_posts table (best-effort — don't fail the response if DB errors)
  try {
    const supabase = getSupabaseAdmin()
    await supabase.from('social_media_posts').upsert(
      {
        property_id,
        platform: 'facebook',
        platform_post_id: postId,
        post_content: message,
        post_url: postUrl,
        status: 'published',
        posted_at: new Date().toISOString(),
        media_urls: image_url ? [image_url] : null,
        post_type: image_url ? 'photo' : 'text',
      },
      { onConflict: 'property_id,platform,platform_post_id' }
    )
  } catch {
    // Non-fatal — post was already published; just log and continue
    console.error('[meta-post] Failed to upsert social_media_posts row')
  }

  // 6. Return success
  return NextResponse.json({
    success: true,
    post_id: postId,
    platform: 'facebook',
    url: postUrl,
  })
}
