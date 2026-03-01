/**
 * AI AUTOMATION MARKETING - AUTO TRIGGER
 * 
 * This endpoint is automatically called when a property is uploaded/published.
 * It analyzes the property data and generates marketing content automatically.
 * 
 * Features:
 * - Property data analysis
 * - AI content generation (emails, social posts, descriptions)
 * - Campaign creation
 * - Performance tracking
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 300 // 5 minutes for comprehensive marketing automation

interface PropertyData {
  id: string
  title: string
  description?: string
  property_type?: string
  city?: string
  locality?: string
  price_inr?: number
  bedrooms?: number
  bathrooms?: number
  sqft?: number
  amenities?: string[]
  images?: string[]
  builder_id: string
}

/**
 * Analyze property data and extract key insights
 */
async function analyzeProperty(property: PropertyData): Promise<{
  targetAudience: string[]
  keyFeatures: string[]
  uniqueSellingPoints: string[]
  priceSegment: 'budget' | 'mid-range' | 'premium' | 'luxury'
  locationAdvantages: string[]
}> {
  const price = property.price_inr || 0
  const sqft = property.sqft || 0
  const pricePerSqft = sqft > 0 ? price / sqft : 0

  // Determine price segment
  let priceSegment: 'budget' | 'mid-range' | 'premium' | 'luxury' = 'mid-range'
  if (price < 5000000) priceSegment = 'budget'
  else if (price < 15000000) priceSegment = 'mid-range'
  else if (price < 50000000) priceSegment = 'premium'
  else priceSegment = 'luxury'

  // Extract key features
  const keyFeatures: string[] = []
  if (property.bedrooms) keyFeatures.push(`${property.bedrooms} BHK`)
  if (property.sqft) keyFeatures.push(`${property.sqft} sq ft`)
  if (property.amenities && property.amenities.length > 0) {
    keyFeatures.push(...property.amenities.slice(0, 3))
  }

  // Determine target audience
  const targetAudience: string[] = []
  if (priceSegment === 'budget' || priceSegment === 'mid-range') {
    targetAudience.push('First-time homebuyers', 'Young professionals', 'Small families')
  } else if (priceSegment === 'premium') {
    targetAudience.push('Established professionals', 'Growing families', 'Investors')
  } else {
    targetAudience.push('High-net-worth individuals', 'Luxury seekers', 'Premium investors')
  }

  // Unique selling points
  const uniqueSellingPoints: string[] = []
  if (property.amenities && property.amenities.length > 5) {
    uniqueSellingPoints.push('Premium amenities')
  }
  if (pricePerSqft < 5000) {
    uniqueSellingPoints.push('Great value for money')
  }
  if (property.locality) {
    uniqueSellingPoints.push(`Prime location in ${property.locality}`)
  }

  // Location advantages
  const locationAdvantages: string[] = []
  if (property.city) locationAdvantages.push(`Located in ${property.city}`)
  if (property.locality) locationAdvantages.push(`Prime ${property.locality} location`)

  return {
    targetAudience,
    keyFeatures,
    uniqueSellingPoints,
    priceSegment,
    locationAdvantages,
  }
}

/**
 * Generate marketing content using OpenAI
 */
async function generateMarketingContent(
  property: PropertyData,
  analysis: Awaited<ReturnType<typeof analyzeProperty>>
): Promise<{
  emailSubject: string
  emailBody: string
  socialPost: string
  description: string
  highlights: string[]
}> {
  const openaiApiKey = process.env.OPENAI_API_KEY

  if (!openaiApiKey) {
    // Fallback content generation
    return {
      emailSubject: `New Property: ${property.title} in ${property.locality || property.city || 'Chennai'}`,
      emailBody: `We're excited to announce our new property: ${property.title}!\n\n${property.description || 'A beautiful property with modern amenities.'}\n\nKey Features:\n${analysis.keyFeatures.join('\n')}\n\nPrice: ₹${(property.price_inr || 0).toLocaleString('en-IN')}\n\nContact us to schedule a viewing!`,
      socialPost: `🏠 New Property Alert! ${property.title} in ${property.locality || property.city || 'Chennai'}\n\n✨ ${analysis.keyFeatures.join(' • ')}\n\n💰 Starting at ₹${(property.price_inr || 0).toLocaleString('en-IN')}\n\n📞 Contact us for more details! #RealEstate #Property #Chennai`,
      description: property.description || `${property.title} - A beautiful ${property.property_type || 'property'} in ${property.locality || property.city || 'Chennai'}.`,
      highlights: analysis.keyFeatures,
    }
  }

  try {
    // Generate email content
    const emailPrompt = `Generate a compelling email marketing content for a real estate property:

Property: ${property.title}
Location: ${property.locality || property.city || 'Chennai'}
Type: ${property.property_type || 'Apartment'}
Price: ₹${(property.price_inr || 0).toLocaleString('en-IN')}
Bedrooms: ${property.bedrooms || 'N/A'}
Size: ${property.sqft || 'N/A'} sq ft
Amenities: ${(property.amenities || []).join(', ') || 'Modern amenities'}
Target Audience: ${analysis.targetAudience.join(', ')}
Price Segment: ${analysis.priceSegment}
Unique Selling Points: ${analysis.uniqueSellingPoints.join(', ')}

Generate:
1. Email Subject Line (max 60 characters)
2. Email Body (200-300 words, engaging and persuasive)
3. Social Media Post (150-200 characters, include emojis)
4. Property Description (150-200 words)
5. 5 Key Highlights (bullet points)

Return as JSON:
{
  "emailSubject": "...",
  "emailBody": "...",
  "socialPost": "...",
  "description": "...",
  "highlights": ["...", "...", "...", "...", "..."]
}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional real estate marketing copywriter. Generate compelling, persuasive marketing content that converts leads into buyers.',
          },
          {
            role: 'user',
            content: emailPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      const content = data.choices[0]?.message?.content || ''

      // Try to parse JSON from response
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          return {
            emailSubject: parsed.emailSubject || `New Property: ${property.title}`,
            emailBody: parsed.emailBody || property.description || '',
            socialPost: parsed.socialPost || '',
            description: parsed.description || property.description || '',
            highlights: parsed.highlights || analysis.keyFeatures,
          }
        }
      } catch (e) {
        console.error('Failed to parse OpenAI JSON response:', e)
      }
    }
  } catch (error) {
    console.error('OpenAI API error:', error)
  }

  // Fallback
  return {
    emailSubject: `New Property: ${property.title} in ${property.locality || property.city || 'Chennai'}`,
    emailBody: `We're excited to announce our new property: ${property.title}!\n\n${property.description || 'A beautiful property with modern amenities.'}\n\nKey Features:\n${analysis.keyFeatures.join('\n')}\n\nPrice: ₹${(property.price_inr || 0).toLocaleString('en-IN')}\n\nContact us to schedule a viewing!`,
    socialPost: `🏠 New Property Alert! ${property.title} in ${property.locality || property.city || 'Chennai'}\n\n✨ ${analysis.keyFeatures.join(' • ')}\n\n💰 Starting at ₹${(property.price_inr || 0).toLocaleString('en-IN')}\n\n📞 Contact us for more details! #RealEstate #Property #Chennai`,
    description: property.description || `${property.title} - A beautiful ${property.property_type || 'property'} in ${property.locality || property.city || 'Chennai'}.`,
    highlights: analysis.keyFeatures,
  }
}

/**
 * Create marketing campaign
 */
async function createMarketingCampaign(
  supabase: Awaited<ReturnType<typeof createClient>>,
  property: PropertyData,
  content: Awaited<ReturnType<typeof generateMarketingContent>>,
  analysis: Awaited<ReturnType<typeof analyzeProperty>>
): Promise<string> {
  const { data: campaign, error } = await supabase
    .from('property_marketing_campaigns')
    .insert({
      property_id: property.id,
      builder_id: property.builder_id,
      campaign_name: `Auto Campaign: ${property.title}`,
      campaign_type: 'property_launch',
      status: 'active',
      target_audience: analysis.targetAudience,
      content_data: {
        email_subject: content.emailSubject,
        email_body: content.emailBody,
        social_post: content.socialPost,
        description: content.description,
        highlights: content.highlights,
      },
      analysis_data: {
        price_segment: analysis.priceSegment,
        key_features: analysis.keyFeatures,
        unique_selling_points: analysis.uniqueSellingPoints,
        location_advantages: analysis.locationAdvantages,
      },
      created_at: new Date().toISOString(),
      scheduled_at: new Date().toISOString(), // Start immediately
    })
    .select()
    .single()

  if (error || !campaign) {
    console.error('Failed to create marketing campaign:', error)
    throw new Error('Failed to create marketing campaign')
  }

  return campaign.id
}

/**
 * Track marketing automation activity
 */
async function trackAutomationActivity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  propertyId: string,
  builderId: string,
  campaignId: string,
  status: 'success' | 'partial' | 'failed',
  details: any
): Promise<void> {
  await supabase.from('property_marketing_automation_logs').insert({
    property_id: propertyId,
    builder_id: builderId,
    campaign_id: campaignId,
    automation_type: 'auto_trigger',
    status,
    details,
    created_at: new Date().toISOString(),
  })
}

/**
 * POST /api/automation/marketing/auto-trigger
 * Triggered automatically when a property is uploaded/published
 * 
 * This endpoint now delegates to the intelligence-engine for comprehensive marketing automation
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const { property_id } = body

    if (!property_id) {
      return NextResponse.json(
        { success: false, error: 'Missing property_id' },
        { status: 400 }
      )
    }

    // Fetch property data to verify it exists and get status
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, builder_id, status, marketing_automation_enabled')
      .eq('id', property_id)
      .single()

    if (propertyError || !property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      )
    }

    // Only trigger if property is active and automation is enabled
    if (property.status !== 'active' || property.marketing_automation_enabled === false) {
      return NextResponse.json({
        success: false,
        error: 'Property is not active or marketing automation is disabled',
        property_status: property.status,
        automation_enabled: property.marketing_automation_enabled,
      }, { status: 400 })
    }

    // Delegate to intelligence-engine for comprehensive automation
    // This ensures we use the full n8n workflow system
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tharaga.co.in'
    const internalApiKey = process.env.INTERNAL_API_KEY

    try {
      const intelligenceResponse = await fetch(`${baseUrl}/api/automation/marketing/intelligence-engine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${internalApiKey || ''}`,
        },
        body: JSON.stringify({
          record: {
            id: property.id,
            builder_id: property.builder_id,
            status: property.status,
            marketing_automation_enabled: property.marketing_automation_enabled,
          },
        }),
      })

      if (!intelligenceResponse.ok) {
        const errorData = await intelligenceResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Intelligence engine failed')
      }

      const intelligenceData = await intelligenceResponse.json()

      // Track successful automation trigger
      await trackAutomationActivity(
        supabase,
        property.id,
        property.builder_id,
        intelligenceData.strategy_id || 'pending',
        'success',
        {
          triggered_via: 'auto-trigger',
          intelligence_engine_success: true,
          workflows_triggered: intelligenceData.workflows_triggered || 0,
        }
      )

      return NextResponse.json({
        success: true,
        message: 'AI automation marketing triggered successfully via intelligence engine',
        property_id: property.id,
        strategy_id: intelligenceData.strategy_id,
        workflows_triggered: intelligenceData.workflows_triggered,
        status: intelligenceData.status,
      })
    } catch (intelligenceError: any) {
      console.error('[Auto-Trigger] Intelligence engine call failed:', intelligenceError)

      // Fallback to basic marketing if intelligence engine fails
      try {
        const { data: fullProperty } = await supabase
          .from('properties')
          .select('*')
          .eq('id', property_id)
          .single()

        if (fullProperty) {
          const analysis = await analyzeProperty(fullProperty as PropertyData)
          const content = await generateMarketingContent(fullProperty as PropertyData, analysis)
          const campaignId = await createMarketingCampaign(supabase, fullProperty as PropertyData, content, analysis)

          await trackAutomationActivity(
            supabase,
            fullProperty.id,
            fullProperty.builder_id,
            campaignId,
            'partial',
            {
              triggered_via: 'auto-trigger',
              intelligence_engine_failed: true,
              fallback_to_basic: true,
              error: intelligenceError.message,
            }
          )

          return NextResponse.json({
            success: true,
            message: 'Basic marketing automation triggered (intelligence engine unavailable)',
            campaign_id: campaignId,
            fallback_mode: true,
          })
        }
      } catch (fallbackError) {
        console.error('[Auto-Trigger] Fallback also failed:', fallbackError)
      }

      // Track failure
      await trackAutomationActivity(
        supabase,
        property.id,
        property.builder_id,
        'unknown',
        'failed',
        { error: intelligenceError.message, triggered_via: 'auto-trigger' }
      )

      throw intelligenceError
    }
  } catch (error: any) {
    console.error('AI Automation Marketing Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to trigger AI automation marketing',
        details: error.message,
      },
      { status: 500 }
    )
  }
}



