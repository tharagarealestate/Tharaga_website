/**
 * GET /api/social-media/analytics/[propertyId]
 *
 * Returns property data formatted for social media caption generation.
 * Used by MarketingSection AI Caption button.
 *
 * Previously called an external backend URL that doesn't exist.
 * Now fetches directly from Supabase and returns caption-ready fields.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getBuilderUser, getServiceSupabase } from '../../../builder/_lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    const authed = await getBuilderUser(request)
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { propertyId } = params
    const serviceClient = getServiceSupabase()

    // Fetch property details
    const { data: property, error } = await serviceClient
      .from('properties')
      .select('id,title,description,city,locality,property_type,bedrooms,bathrooms,sqft,price_inr,facing,furnished,builder,project,images,builder_id,rera_id')
      .eq('id', propertyId)
      .single()

    if (error || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Only allow the owning builder (or admin) to access
    if (!authed.isAdmin && property.builder_id !== authed.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Format price for caption
    const priceINR = Number(property.price_inr || 0)
    const priceDisplay = priceINR >= 10_000_000
      ? `₹${(priceINR / 10_000_000).toFixed(2)} Cr`
      : priceINR >= 100_000
      ? `₹${(priceINR / 100_000).toFixed(1)} L`
      : priceINR > 0 ? `₹${priceINR.toLocaleString('en-IN')}` : 'Price on request'

    // Build a rich AI-ready caption
    const bhk  = property.bedrooms     ? `${property.bedrooms}BHK ` : ''
    const size = property.sqft         ? ` · ${property.sqft} sqft` : ''
    const loc  = property.locality
      ? `${property.locality}, ${property.city || 'Chennai'}`
      : property.city || 'Chennai'
    const proj = property.project  ? `\n🏗️ Project: ${property.project}` : ''
    const rera = property.rera_id  ? `\n✅ RERA: ${property.rera_id}`   : ''

    const suggested_caption = [
      `🏠 ${bhk}${property.property_type || 'Property'} in ${loc}`,
      `💰 ${priceDisplay}${size}`,
      property.furnished ? `🛋️ ${property.furnished} furnished` : null,
      property.facing    ? `🧭 ${property.facing} facing`        : null,
      proj,
      rera,
      '',
      property.description
        ? property.description.slice(0, 120) + (property.description.length > 120 ? '…' : '')
        : null,
      '',
      '📞 Contact us today!',
      '',
      '#TharagaRealestate #Chennai #RealEstate #DreamHome #NewLaunch',
    ]
      .filter(l => l !== null)
      .join('\n')
      .trim()

    return NextResponse.json({
      id:            property.id,
      title:         property.title || '',
      city:          property.city  || 'Chennai',
      locality:      property.locality || '',
      property_type: property.property_type || '',
      bedrooms:      property.bedrooms,
      sqft:          property.sqft,
      price_display: priceDisplay,
      furnished:     property.furnished || '',
      facing:        property.facing    || '',
      builder:       property.builder   || '',
      project:       property.project   || '',
      images:        Array.isArray(property.images) ? property.images : [],
      suggested_caption,
      caption: suggested_caption, // alias for backward compat
    })
  } catch (err: any) {
    console.error('[social-media/analytics] Error:', err?.message || err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
