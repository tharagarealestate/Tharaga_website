/**
 * WORKFLOW 1: INSTANT PROPERTY INTELLIGENCE ENGINE
 * Trigger: New Property Listed (Real-time Database Trigger)
 * Purpose: Extract, analyze, and enrich property data with AI-powered market intelligence
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropicClient } from '@/lib/ai/anthropic'

export const maxDuration = 300 // 5 minutes for AI processing

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const { record } = body

    if (!record || !record.id) {
      return NextResponse.json({ error: 'Invalid payload: missing property record' }, { status: 400 })
    }

    const propertyId = record.id

    // Step 1: Fetch Complete Property Context
    const { data: contextData, error: contextError } = await supabase.rpc(
      'get_property_marketing_context',
      { p_property_id: propertyId }
    )

    if (contextError || !contextData) {
      console.error('[Marketing Automation] Error fetching property context:', contextError)
      return NextResponse.json(
        { error: 'Failed to fetch property context', details: contextError?.message },
        { status: 500 }
      )
    }

    const property = contextData.property
    const competitors = contextData.competitors
    const marketTrends = contextData.market_trends
    const pricingPosition = contextData.pricing_position

    // Step 2: AI Market Analysis & Strategy Generation
    const analysisPrompt = `You are an expert real estate marketing strategist for the Indian market. Analyze this property listing and create a comprehensive marketing strategy.

PROPERTY DETAILS:
- Title: ${property.title}
- Location: ${property.location}, ${property.address}
- Type: ${property.bhk_type} ${property.property_type}
- Price: ₹${(property.price || property.price_inr)?.toLocaleString('en-IN')}
- Area: ${property.carpet_area} sq.ft
- Amenities: ${(property.amenities || []).join(', ')}
- Builder: ${property.builder_name} (Reputation: ${property.reputation_score}/10)
- RERA: ${property.rera_id || 'N/A'}
- Possession: ${property.possession_date || 'N/A'}

MARKET INTELLIGENCE:
- Competitors in 2km: ${competitors?.competitors_count || 0}
- Average Competitor Price: ₹${competitors?.avg_competitor_price?.toLocaleString('en-IN') || 'N/A'}
- Pricing Position: ${pricingPosition}
- Market Trend: ${marketTrends?.trend_direction || 'stable'}
- Demand Score: ${marketTrends?.demand_score || 'N/A'}/100

COMPETITIVE LISTINGS:
${JSON.stringify(competitors?.competitor_listings || [], null, 2)}

Generate a JSON response with:
{
  "target_audience": {
    "primary": "detailed persona (age, income, profession, family size, pain points)",
    "secondary": "secondary persona",
    "tertiary": "tertiary persona"
  },
  "unique_selling_propositions": [
    "USP 1 (compelling, specific, benefit-focused)",
    "USP 2",
    "USP 3",
    "USP 4",
    "USP 5"
  ],
  "messaging_strategy": {
    "primary_message": "core message (emotional + rational)",
    "supporting_messages": ["message 1", "message 2", "message 3"],
    "objection_handling": {
      "price_concern": "response",
      "location_concern": "response",
      "builder_trust": "response"
    }
  },
  "channel_priorities": {
    "high_priority": ["channel names with reasoning"],
    "medium_priority": ["channel names"],
    "low_priority": ["channel names"]
  },
  "content_themes": [
    "theme 1 (with content ideas)",
    "theme 2",
    "theme 3"
  ],
  "campaign_hooks": [
    "hook 1 (attention-grabbing headline)",
    "hook 2",
    "hook 3",
    "hook 4",
    "hook 5"
  ],
  "budget_allocation": {
    "google_ads_percentage": 30,
    "facebook_ads_percentage": 25,
    "content_marketing_percentage": 20,
    "influencer_percentage": 15,
    "other_percentage": 10,
    "reasoning": "explanation"
  },
  "kpi_targets": {
    "week_1": {
      "views": 1000,
      "leads": 50,
      "site_visits": 100
    },
    "month_1": {
      "views": 5000,
      "leads": 250,
      "site_visits": 500,
      "conversions": 5
    }
  },
  "competitive_advantages": [
    "advantage vs competitor 1",
    "advantage vs competitor 2",
    "advantage vs competitor 3"
  ],
  "risk_factors": [
    "risk 1 with mitigation",
    "risk 2 with mitigation"
  ]
}`

    const aiResponse = await anthropicClient.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: analysisPrompt }],
    })

    const aiAnalysisText = aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : ''
    let marketingStrategy
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = aiAnalysisText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       aiAnalysisText.match(/```\s*([\s\S]*?)\s*```/) ||
                       [null, aiAnalysisText]
      marketingStrategy = JSON.parse(jsonMatch[1] || jsonMatch[0] || aiAnalysisText)
    } catch (parseError) {
      console.error('[Marketing Automation] Error parsing AI response:', parseError)
      return NextResponse.json(
        { error: 'Failed to parse AI strategy response' },
        { status: 500 }
      )
    }

    // Step 3: Store Marketing Strategy
    const { data: strategyData, error: strategyError } = await supabase
      .from('property_marketing_strategies')
      .insert({
        property_id: propertyId,
        builder_id: property.builder_id,
        target_audience: marketingStrategy.target_audience,
        usps: marketingStrategy.unique_selling_propositions,
        messaging_strategy: marketingStrategy.messaging_strategy,
        channel_priorities: marketingStrategy.channel_priorities,
        content_themes: marketingStrategy.content_themes,
        campaign_hooks: marketingStrategy.campaign_hooks,
        budget_allocation: marketingStrategy.budget_allocation,
        kpi_targets: marketingStrategy.kpi_targets,
        competitive_advantages: marketingStrategy.competitive_advantages,
        risk_factors: marketingStrategy.risk_factors,
        market_intelligence: {
          competitors_count: competitors?.competitors_count || 0,
          avg_competitor_price: competitors?.avg_competitor_price || null,
          pricing_position: pricingPosition,
          market_trends: marketTrends,
        },
        pricing_position: pricingPosition,
        competitor_count: competitors?.competitors_count || 0,
        avg_competitor_price: competitors?.avg_competitor_price || null,
        ai_generated: true,
        ai_model_used: 'claude-sonnet-4',
        status: 'active',
      })
      .select()
      .single()

    if (strategyError) {
      console.error('[Marketing Automation] Error storing strategy:', strategyError)
      return NextResponse.json(
        { error: 'Failed to store marketing strategy', details: strategyError.message },
        { status: 500 }
      )
    }

    // Step 4: Update property status
    await supabase
      .from('properties')
      .update({
        marketing_strategy_generated: true,
        marketing_strategy_generated_at: new Date().toISOString(),
      })
      .eq('id', propertyId)

    // Step 5: Trigger Parallel Marketing Workflows
    const workflows = [
      { name: 'content_generation', webhook: '/api/automation/marketing/content-generation', priority: 'critical', delay: 0 },
      { name: 'image_processing', webhook: '/api/automation/marketing/image-processing', priority: 'critical', delay: 0 },
      { name: 'landing_page', webhook: '/api/automation/marketing/landing-page', priority: 'high', delay: 30 },
      { name: 'social_media', webhook: '/api/automation/marketing/social-media', priority: 'high', delay: 60 },
      { name: 'paid_ads', webhook: '/api/automation/marketing/paid-ads', priority: 'high', delay: 120 },
      { name: 'seo_content', webhook: '/api/automation/marketing/seo-content', priority: 'medium', delay: 300 },
      { name: 'influencer_outreach', webhook: '/api/automation/marketing/influencer-outreach', priority: 'medium', delay: 600 },
      { name: 'whatsapp_broadcast', webhook: '/api/automation/marketing/whatsapp-broadcast', priority: 'high', delay: 90 },
    ]

    // Fire webhooks with delays (non-blocking)
    workflows.forEach((workflow) => {
      setTimeout(async () => {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tharaga.co.in'
          const internalApiKey = process.env.INTERNAL_API_KEY
          if (!internalApiKey) {
            console.error('[Marketing Automation] INTERNAL_API_KEY not configured. Webhook calls may fail.')
          }
          await fetch(`${baseUrl}${workflow.webhook}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${internalApiKey || ''}`,
            },
            body: JSON.stringify({
              property_id: propertyId,
              strategy: marketingStrategy,
              triggered_at: new Date().toISOString(),
              workflow_name: workflow.name,
            }),
          })
        } catch (error) {
          console.error(`[Marketing Automation] Error triggering ${workflow.name}:`, error)
        }
      }, workflow.delay * 1000)
    })

    return NextResponse.json({
      success: true,
      property_id: propertyId,
      strategy_id: strategyData.id,
      workflows_triggered: workflows.length,
      status: 'marketing_automation_initiated',
    })
  } catch (error) {
    console.error('[Marketing Automation] Intelligence Engine error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}




