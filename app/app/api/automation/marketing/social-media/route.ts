/**
 * WORKFLOW 5: MULTI-CHANNEL SOCIAL MEDIA AUTOMATION
 * Trigger: Webhook from Content Generation Workflow
 * Purpose: Auto-publish to Instagram, Facebook, LinkedIn, Twitter with optimal timing
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 300 // 5 minutes for social media posting

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const { property_id } = body

    if (!property_id) {
      return NextResponse.json({ error: 'Missing property_id' }, { status: 400 })
    }

    // Fetch property and content
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', property_id)
      .single()

    if (propertyError || !property) {
      return NextResponse.json(
        { error: 'Property not found', details: propertyError?.message },
        { status: 404 }
      )
    }

    // Fetch content library
    const { data: contentData } = await supabase
      .from('property_content_library')
      .select('content_data')
      .eq('property_id', property_id)
      .eq('content_type', 'master_set')
      .eq('language', 'en')
      .single()

    // Fetch media assets
    const { data: mediaAssets } = await supabase
      .from('property_media_assets')
      .select('*')
      .eq('property_id', property_id)
      .eq('is_active', true)
      .limit(10)

    const content = contentData?.content_data || {}
    const media = mediaAssets || []

    // Store social media posts (actual posting would be handled by n8n or external services)
    const platforms = ['instagram', 'facebook', 'linkedin', 'twitter']
    const posts = []

    for (const platform of platforms) {
      const postContent = content.social_media_posts?.[platform]?.[0] || `${property.title} - ${property.location}`
      const mediaUrls = media
        .filter((m) => {
          if (platform === 'instagram') return m.asset_type.includes('instagram')
          if (platform === 'facebook') return m.asset_type.includes('facebook')
          return true
        })
        .map((m) => m.asset_url)
        .slice(0, platform === 'instagram' ? 10 : 1)

      const { data: post, error: postError } = await supabase
        .from('social_media_posts')
        .insert({
          property_id,
          platform,
          post_content: postContent,
          post_caption: postContent,
          media_urls: mediaUrls,
          status: 'pending', // Will be updated when actually posted
          scheduled_for: new Date().toISOString(),
        })
        .select()
        .single()

      if (!postError && post) {
        posts.push({
          platform,
          post_id: post.id,
          status: 'scheduled',
        })
      }
    }

    // Schedule monitoring task
    await supabase.from('social_monitoring_tasks').insert({
      property_id,
      builder_id: property.builder_id,
      platforms,
      check_frequency_minutes: 30,
      metrics_to_track: ['likes', 'comments', 'shares', 'reach', 'impressions'],
      status: 'active',
      next_check_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    })

    return NextResponse.json({
      success: true,
      property_id,
      posts_scheduled: posts.length,
      posts,
      status: 'social_media_automation_initiated',
    })
  } catch (error) {
    console.error('[Social Media] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

























































