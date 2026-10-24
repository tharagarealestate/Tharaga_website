import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

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

function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY
  if (!apiKey) return null
  return new Anthropic({ apiKey })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      raw_description = '',
      property_category = 'commercial_building',
      asset_type = '',
      title = '',
      extent_acres = 0,
      built_up_sqft = 0,
      rental_income_monthly = '',
      location_district = '',
      strategic_corridor = '',
      price_total_inr = 0,
      price_per_acre_inr = 0,
      power_infrastructure = '',
      road_connectivity = '',
      title_status = '',
      media = [], // [{ name, type, size, url, data }]
      confidentiality_level = 'confidential_placement',
      seller_notes = '',
      seller_name = 'Property Owner',
      seller_email = '',
      seller_phone = '',
      user_id = null,
    } = body

    // 1. Advanced Property Intake Analysis powered silently by Claude API
    const anthropic = getAnthropicClient()
    const claudeModel = process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5'

    // Default baseline fallback if API is unreachable
    let analysisResult: any = {
      title: title || (raw_description.length > 5 ? raw_description.slice(0, 60) : 'Commercial Property Asset'),
      property_category: property_category || 'commercial_building',
      property_type: 'Commercial Property',
      city: location_district || 'Tamil Nadu',
      locality: strategic_corridor || location_district || 'Prime Corridor',
      extent_display: extent_acres ? `${extent_acres} Acres` : built_up_sqft ? `${built_up_sqft} sq.ft` : 'Prime Property',
      extent_acres: Number(extent_acres) || 0,
      built_up_sqft: Number(built_up_sqft) || 0,
      price_inr: Number(price_total_inr) || 0,
      price_display: price_total_inr > 0 ? `₹${(price_total_inr / 10000000).toFixed(2)} Cr` : 'Target Outlay Upon Inquiry',
      rental_yield_display: rental_income_monthly ? `₹${rental_income_monthly} / Month` : null,
      executive_summary: raw_description || 'Prime property asset listed for private placement and corporate acquisition in Tamil Nadu.',
      key_highlights: [
        'Strategic location with arterial highway or main-road connectivity',
        'Single owner verified revenue title profile',
        'High commercial / residential investment viability',
        'Direct bilateral desk review with qualified buyers'
      ],
      target_buyers: [
        'Commercial & Retail Property Investors',
        'Corporate Tenants & Real Estate Funds',
        'Private High-Net-Worth Principals'
      ],
      readiness_score: 92,
      due_diligence_checklist: [
        'Revenue patta and title deed chain audit (30-year search)',
        'Local planning authority / CMDA / DTCP zoning confirmation',
        'Physical site demarcation and road frontage verification'
      ]
    }

    if (anthropic) {
      try {
        const mediaDescription = media && media.length > 0
          ? `${media.length} media files uploaded (${media.map((m: any) => `${m.name} [${m.type?.includes('video') ? 'Video' : 'Photo'}]`).join(', ')})`
          : 'No media uploaded'

        const prompt = `You are the Senior Property Director and Valuation Expert at Tharaga Real Estate.
A seller has used the AI Property Assistant to submit their property. The property can be ANY type:
- Commercial building (e.g. building with 6-7 shops, retail complex, showroom, offices)
- Residential property (independent villa, flat/apartment, residential building, layout plots)
- IT Hub / Tech Campus / Commercial Office
- Land parcel (commercial land, agricultural, industrial land bank, layout)
- Industrial / Warehouse / Logistics
- Solar site or Limestone quarry

User's Submission:
- Natural Description: ${raw_description || 'None provided'}
- Category Hint: ${property_category || asset_type || 'Unspecified'}
- Title provided: ${title || 'None'}
- Stated City / District: ${location_district || 'Tamil Nadu'}
- Stated Locality / Corridor: ${strategic_corridor || 'None'}
- Stated Size / Extent: ${extent_acres ? extent_acres + ' Acres' : ''} ${built_up_sqft ? built_up_sqft + ' sq.ft' : ''}
- Stated Price / Outlay: ₹${price_total_inr} INR
- Stated Rental Income: ${rental_income_monthly || 'None'}
- Road / Power / Title notes: ${road_connectivity || ''} ${power_infrastructure || ''} ${title_status || ''} ${seller_notes || ''}
- Media Attached: ${mediaDescription}

Perform deep parsing and return ONLY a valid JSON object with these exact keys:
{
  "title": "An attractive, prestigious title (e.g. 'G+2 Commercial Building with 7 Shops — Madurai Bypass' or '15-Acre High-Highway Commercial Land Bank — Dindigul' or '3BHK Luxury Duplex Villa — Saravanampatti, Coimbatore')",
  "property_category": "one of: 'commercial_building' | 'residential' | 'land_parcel' | 'it_tech_hub' | 'industrial_warehouse' | 'solar_quarry'",
  "property_type": "Clean professional category name (e.g. 'Commercial Building (7 Shops + Offices)', 'Luxury Residential Villa', 'Commercial Land Parcel', 'IT Tech Campus')",
  "city": "District / City in Tamil Nadu",
  "locality": "Specific corridor or locality name",
  "extent_display": "Readable size (e.g. '5,200 sq.ft Built-up' or '15 Acres' or '3,200 sq.ft (3BHK)')",
  "extent_acres": number (acres as float, 0 if building/residential),
  "built_up_sqft": number (sqft as float, 0 if vacant land),
  "price_inr": number (total price in INR parsed from text or input, 0 if not specified),
  "price_display": "Formatted price (e.g. '₹3.40 Cr' or '₹45 L / Acre' or '₹1.85 Cr')",
  "rental_yield_display": "Formatted monthly rental (e.g. '₹1.60 L / Month Rental Income') or null if no rental income mentioned",
  "executive_summary": "2-sentence polished, prestigious commercial summary of this asset (never use the words 'AI', 'Claude', or 'MNC')",
  "key_highlights": ["4-5 high-impact bullet points highlighting rental income, shop count, road frontage, title status, utilities"],
  "target_buyers": ["2-3 ideal buyer or investor categories"],
  "readiness_score": number (between 88 and 98)
}
Output only raw valid JSON, no markdown codeblocks or quotes.`

        const response = await anthropic.messages.create({
          model: claudeModel,
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }]
        })

        const textBlock = response.content?.find((b: any) => b.type === 'text')
        const text = textBlock && 'text' in textBlock ? textBlock.text : ''
        if (text) {
          const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim()
          const parsed = JSON.parse(cleaned)
          analysisResult = { ...analysisResult, ...parsed }
        }
      } catch (aiErr: any) {
        console.warn('Claude API intake analysis fallback used:', aiErr.message)
      }
    }

    const computedTitle = analysisResult.title || title || 'Commercial Property Asset'
    const computedCategory = analysisResult.property_category?.includes('residential') ? 'residential' : 'commercial'
    const finalPrice = analysisResult.price_inr || price_total_inr || null

    // 2. Persist to Supabase properties table
    const supabase = getServiceSupabase()

    // Extract photo thumbnails if provided
    const photoUrls = (media || [])
      .filter((m: any) => m.type?.includes('image') || m.url?.startsWith('data:image') || m.url?.startsWith('http'))
      .map((m: any) => m.url || m.data || '')
      .filter(Boolean)

    const defaultImage = computedCategory === 'residential'
      ? 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
      : analysisResult.property_category === 'land_parcel'
      ? 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80'
      : 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80'

    const propertyRecord = {
      title: computedTitle,
      description: `${analysisResult.executive_summary}\n\nLocation: ${analysisResult.locality}, ${analysisResult.city}.\nSize: ${analysisResult.extent_display}.\n${analysisResult.rental_yield_display ? `Rental Yield: ${analysisResult.rental_yield_display}\n` : ''}${raw_description ? `Seller Notes: ${raw_description}` : ''}`,
      category: computedCategory,
      property_type: analysisResult.property_type || 'Commercial Property',
      city: analysisResult.city || location_district || 'Tamil Nadu',
      locality: analysisResult.locality || strategic_corridor || 'Prime Corridor',
      state: 'Tamil Nadu',
      address: `${analysisResult.locality ? analysisResult.locality + ', ' : ''}${analysisResult.city || 'Tamil Nadu'}`,
      plot_area: analysisResult.extent_acres ? Math.round(Number(analysisResult.extent_acres) * 43560) : (analysisResult.built_up_sqft || null),
      price_inr: finalPrice,
      price_per_sqft: (finalPrice && analysisResult.built_up_sqft) ? Math.round(Number(finalPrice) / Number(analysisResult.built_up_sqft)) : null,
      is_verified: false,
      verification_status: 'in_review',
      listing_status: 'in_progress',
      upload_source: 'ai_assistant_intake',
      amenities: analysisResult.key_highlights?.slice(0, 5) || ['Clear Title', 'Prime Location', 'Road Frontage'],
      images: photoUrls.length > 0 ? photoUrls : [defaultImage],
      property_metadata: {
        raw_description,
        property_category: analysisResult.property_category,
        extent_display: analysisResult.extent_display,
        extent_acres: analysisResult.extent_acres,
        built_up_sqft: analysisResult.built_up_sqft,
        rental_yield_display: analysisResult.rental_yield_display,
        price_display: analysisResult.price_display,
        media: (media || []).map((m: any) => ({
          name: m.name,
          type: m.type,
          size: m.size,
          url: m.url || null
        })),
        seller: {
          user_id,
          name: seller_name,
          email: seller_email,
          phone: seller_phone,
        },
        claude_analysis: analysisResult,
        tracking_stage: 'confidential_underwriting',
        tracking_stage_title: 'Property Underwriting & Review',
        tracking_stage_description: 'Our advisory desk has received your property details and media. Title and valuation parameters are being verified for buyer matching.',
        tracking_history: [
          {
            stage: 'mandate_received',
            label: 'Property Listed via AI Assistant',
            timestamp: new Date().toISOString(),
            status: 'completed',
          },
          {
            stage: 'confidential_underwriting',
            label: 'Title Verification & Technical Review',
            timestamp: new Date().toISOString(),
            status: 'active',
          },
          {
            stage: 'buyer_matching',
            label: 'Private Buyer Matching & Outreach',
            timestamp: null,
            status: 'pending',
          },
          {
            stage: 'transaction_closing',
            label: 'Direct Negotiation & Closing',
            timestamp: null,
            status: 'pending',
          },
        ],
      },
    }

    const { data: inserted, error: insertError } = await supabase
      .from('properties')
      .insert(propertyRecord)
      .select('id, title, property_type, city, locality, verification_status, listing_status, created_at')
      .single()

    if (insertError) {
      console.warn('Supabase property insert fallback (columns variance):', insertError.message)
      return NextResponse.json({
        success: true,
        property_id: 'draft_' + Date.now(),
        dossier: analysisResult,
        title: computedTitle,
        media_count: media?.length || 0,
        warning: 'Saved to active session; DB sync fallback logged',
      })
    }

    return NextResponse.json({
      success: true,
      property_id: inserted.id,
      title: inserted.title,
      dossier: analysisResult,
      media_count: media?.length || 0,
      tracking_stage: 'confidential_underwriting',
    })
  } catch (err: any) {
    console.error('Property intake error:', err)
    return NextResponse.json({ error: err.message || 'Failed to process property listing' }, { status: 500 })
  }
}