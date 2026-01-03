/**
 * WORKFLOW 4: INSTANT LANDING PAGE GENERATOR
 * Trigger: Webhook from Intelligence Engine
 * Purpose: Auto-generate SEO-optimized property landing page with dynamic content
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 300 // 5 minutes for deployment

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const { property_id } = body

    if (!property_id) {
      return NextResponse.json({ error: 'Missing property_id' }, { status: 400 })
    }

    // Fetch complete property data with content and media
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

    const content = contentData?.content_data || {}
    const media = mediaAssets || []

    // Generate landing page HTML (simplified version - full HTML generation would be in a separate helper)
    const urlSlug = property.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `property-${property_id}`
    const landingPageUrl = `https://${urlSlug}.tharaga.co.in`

    // Store landing page data
    const { data: landingPage, error: landingPageError } = await supabase
      .from('property_landing_pages')
      .insert({
        property_id,
        builder_id: property.builder_id,
        url: landingPageUrl,
        custom_domain: landingPageUrl,
        deployment_platform: 'vercel',
        meta_title: content.seo_content?.seo_titles?.[0] || property.title,
        meta_description: content.seo_content?.meta_description || property.description,
        focus_keywords: content.seo_content?.focus_keywords || [],
        status: 'deploying',
      })
      .select()
      .single()

    if (landingPageError) {
      console.error('[Landing Page] Error storing landing page:', landingPageError)
      return NextResponse.json(
        { error: 'Failed to store landing page', details: landingPageError.message },
        { status: 500 }
      )
    }

    // Update property status
    await supabase
      .from('properties')
      .update({
        landing_page_url: landingPageUrl,
        landing_page_live: false,
        landing_page_created_at: new Date().toISOString(),
      })
      .eq('id', property_id)

    // Note: Actual HTML generation and Vercel deployment would happen here
    // For now, we're just storing the metadata

    return NextResponse.json({
      success: true,
      property_id,
      landing_page_id: landingPage.id,
      landing_page_url: landingPageUrl,
      status: 'landing_page_created',
    })
  } catch (error) {
    console.error('[Landing Page] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}




































