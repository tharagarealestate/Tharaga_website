/**
 * WORKFLOW 1: INSTANT PROPERTY INTELLIGENCE ENGINE
 * Trigger: New Property Listed (via auto-trigger or DB webhook)
 * Purpose: Extract, analyze, and enrich property data with AI-powered market intelligence.
 *
 * Architecture note: uses getAdminClient() for all DB writes because this endpoint
 * is called server-to-server (no user session cookie is present). setTimeout-based
 * workflow dispatching is replaced with workflow_execution_queue inserts — the only
 * pattern that survives Vercel/Netlify serverless function shutdown.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { anthropicClient } from '@/lib/ai/anthropic'

export const maxDuration = 300

// Workflow definitions — delay is advisory and stored in the queue row
const WORKFLOWS = [
  { name: 'content_generation',  path: '/api/automation/marketing/content-generation',  priority: 'critical', delaySec: 0   },
  { name: 'image_processing',    path: '/api/automation/marketing/image-processing',    priority: 'critical', delaySec: 0   },
  { name: 'landing_page',        path: '/api/automation/marketing/landing-page',        priority: 'high',     delaySec: 30  },
  { name: 'social_media',        path: '/api/automation/marketing/social-media',        priority: 'high',     delaySec: 60  },
  { name: 'paid_ads',            path: '/api/automation/marketing/paid-ads',            priority: 'high',     delaySec: 120 },
  { name: 'seo_content',         path: '/api/automation/marketing/seo-content',         priority: 'medium',   delaySec: 300 },
  { name: 'influencer_outreach', path: '/api/automation/marketing/influencer-outreach', priority: 'medium',   delaySec: 600 },
  { name: 'whatsapp_broadcast',  path: '/api/automation/marketing/whatsapp-broadcast',  priority: 'high',     delaySec: 90  },
]

export async function POST(req: NextRequest) {
  const db = getAdminClient()

  try {
    const body = await req.json()
    const { record } = body

    if (!record?.id) {
      return NextResponse.json({ error: 'Invalid payload: missing property record' }, { status: 400 })
    }

    const propertyId = record.id

    // ── Step 1: Fetch Complete Property Context ──────────────────────────────
    const { data: contextData, error: contextError } = await db.rpc(
      'get_property_marketing_context',
      { p_property_id: propertyId }
    )

    if (contextError || !contextData) {
      console.error('[Intelligence Engine] Error fetching context:', contextError)
      return NextResponse.json(
        { error: 'Failed to fetch property context', details: contextError?.message },
        { status: 500 }
      )
    }

    const property        = contextData.property
    const competitors     = contextData.competitors
    const marketTrends    = contextData.market_trends
    const pricingPosition = contextData.pricing_position

    // ── Step 2: AI Market Analysis & Strategy Generation ─────────────────────
    const analysisPrompt = `You are an expert real estate marketing strategist for the Indian market. Analyze this property listing and create a comprehensive marketing strategy.

PROPERTY DETAILS:
- Title: ${property.title}
- Location: ${property.location || property.locality}, ${property.city}
- Type: ${property.bhk_type || ''} ${property.property_type || ''}
- Price: ₹${((property.price || property.price_inr) ?? 0).toLocaleString('en-IN')}
- Area: ${property.carpet_area || property.sqft || 'N/A'} sq.ft
- Amenities: ${(property.amenities || []).join(', ')}
- Builder: ${property.builder_name || 'N/A'} (Reputation: ${property.reputation_score ?? 'N/A'}/10)
- RERA: ${property.rera_id || 'N/A'}
- Possession: ${property.possession_date || 'N/A'}

MARKET INTELLIGENCE:
- Competitors in 2km: ${competitors?.competitors_count ?? 0}
- Average Competitor Price: ₹${competitors?.avg_competitor_price?.toLocaleString('en-IN') ?? 'N/A'}
- Pricing Position: ${pricingPosition ?? 'competitive'}
- Market Trend: ${marketTrends?.trend_direction ?? 'stable'}
- Demand Score: ${marketTrends?.demand_score ?? 'N/A'}/100

Generate a JSON response with this exact structure:
{
  "target_audience": {
    "primary": "detailed persona",
    "secondary": "secondary persona",
    "tertiary": "tertiary persona"
  },
  "unique_selling_propositions": ["USP 1","USP 2","USP 3","USP 4","USP 5"],
  "messaging_strategy": {
    "primary_message": "core message",
    "supporting_messages": ["msg1","msg2","msg3"],
    "objection_handling": {
      "price_concern": "response",
      "location_concern": "response",
      "builder_trust": "response"
    }
  },
  "channel_priorities": {
    "high_priority": ["channels"],
    "medium_priority": ["channels"],
    "low_priority": ["channels"]
  },
  "content_themes": ["theme1","theme2","theme3"],
  "campaign_hooks": ["hook1","hook2","hook3","hook4","hook5"],
  "budget_allocation": {
    "google_ads_percentage": 30,
    "facebook_ads_percentage": 25,
    "content_marketing_percentage": 20,
    "influencer_percentage": 15,
    "other_percentage": 10,
    "reasoning": "explanation"
  },
  "kpi_targets": {
    "week_1": {"views": 1000, "leads": 50, "site_visits": 10},
    "month_1": {"views": 5000, "leads": 250, "site_visits": 50, "conversions": 5}
  },
  "competitive_advantages": ["adv1","adv2","adv3"],
  "risk_factors": ["risk1 with mitigation","risk2 with mitigation"]
}`

    let marketingStrategy: any
    try {
      const aiResponse = await anthropicClient.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        messages: [{ role: 'user', content: analysisPrompt }],
      })

      const rawText = aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : ''
      const jsonMatch =
        rawText.match(/```json\s*([\s\S]*?)\s*```/) ||
        rawText.match(/```\s*([\s\S]*?)\s*```/) ||
        [null, rawText]
      marketingStrategy = JSON.parse(jsonMatch[1] || jsonMatch[0] || rawText)
    } catch (aiErr) {
      console.error('[Intelligence Engine] AI error — using fallback strategy:', aiErr)
      // Rule-based fallback so automation still proceeds without AI
      marketingStrategy = buildFallbackStrategy(property)
    }

    // ── Step 3: Store Marketing Strategy ─────────────────────────────────────
    const { data: strategyData, error: strategyError } = await db
      .from('property_marketing_strategies')
      .insert({
        property_id:            propertyId,
        builder_id:             property.builder_id,
        target_audience:        marketingStrategy.target_audience        ?? {},
        usps:                   marketingStrategy.unique_selling_propositions ?? [],
        messaging_strategy:     marketingStrategy.messaging_strategy     ?? {},
        channel_priorities:     marketingStrategy.channel_priorities     ?? {},
        content_themes:         marketingStrategy.content_themes         ?? [],
        campaign_hooks:         marketingStrategy.campaign_hooks         ?? [],
        budget_allocation:      marketingStrategy.budget_allocation      ?? {},
        kpi_targets:            marketingStrategy.kpi_targets            ?? {},
        competitive_advantages: marketingStrategy.competitive_advantages ?? [],
        risk_factors:           marketingStrategy.risk_factors           ?? [],
        market_intelligence: {
          competitors_count:    competitors?.competitors_count ?? 0,
          avg_competitor_price: competitors?.avg_competitor_price ?? null,
          pricing_position:     pricingPosition,
          market_trends:        marketTrends,
        },
        pricing_position:    pricingPosition ?? 'competitive',
        competitor_count:    competitors?.competitors_count ?? 0,
        avg_competitor_price: competitors?.avg_competitor_price ?? null,
        ai_generated:        true,
        ai_model_used:       'claude-sonnet-4-6',
        status:              'active',
      })
      .select()
      .single()

    if (strategyError) {
      console.error('[Intelligence Engine] Strategy store error:', strategyError)
      return NextResponse.json(
        { error: 'Failed to store marketing strategy', details: strategyError.message },
        { status: 500 }
      )
    }

    // ── Step 4: Update property marketing flag ────────────────────────────────
    await db
      .from('properties')
      .update({
        marketing_strategy_generated:    true,
        marketing_strategy_generated_at: new Date().toISOString(),
      })
      .eq('id', propertyId)

    // ── Step 5: Enqueue Parallel Marketing Workflows ──────────────────────────
    // Uses workflow_execution_queue instead of setTimeout — serverless-safe.
    const now = new Date()
    const queueRows = WORKFLOWS.map((w) => ({
      property_id:   propertyId,
      builder_id:    property.builder_id,
      workflow_name: w.name,
      webhook_path:  w.path,
      payload:       {
        property_id:   propertyId,
        strategy:      marketingStrategy,
        strategy_id:   strategyData.id,
        triggered_at:  now.toISOString(),
        workflow_name: w.name,
      },
      priority:     w.priority,
      status:       'pending',
      scheduled_at: new Date(now.getTime() + w.delaySec * 1000).toISOString(),
    }))

    const { error: queueError } = await db
      .from('workflow_execution_queue')
      .insert(queueRows)

    if (queueError) {
      console.error('[Intelligence Engine] Queue insert error (non-fatal):', queueError)
      // Non-fatal — strategy is saved, cron will retry
    }

    // ── Step 6: Fire delay=0 workflows immediately (best-effort) ─────────────
    const baseUrl       = process.env.NEXT_PUBLIC_APP_URL || 'https://tharaga.co.in'
    const internalKey   = process.env.INTERNAL_API_KEY   || ''
    const immediateJobs = WORKFLOWS.filter((w) => w.delaySec === 0)

    for (const job of immediateJobs) {
      fetch(`${baseUrl}${job.path}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${internalKey}` },
        body:    JSON.stringify({
          property_id:   propertyId,
          strategy:      marketingStrategy,
          strategy_id:   strategyData.id,
          triggered_at:  now.toISOString(),
          workflow_name: job.name,
        }),
      }).catch((err) =>
        console.error(`[Intelligence Engine] Immediate fire failed for ${job.name}:`, err)
      )
    }

    return NextResponse.json({
      success:              true,
      property_id:          propertyId,
      strategy_id:          strategyData.id,
      workflows_queued:     queueRows.length,
      workflows_fired_now:  immediateJobs.length,
      status:               'marketing_automation_initiated',
    })
  } catch (error) {
    console.error('[Intelligence Engine] Unhandled error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

// ── Fallback strategy when AI is unavailable ───────────────────────────────────
function buildFallbackStrategy(property: any) {
  const price = property.price || property.price_inr || 0
  const loc   = property.locality || property.city || 'Chennai'
  const bhk   = property.bhk_type || property.bedrooms ? `${property.bedrooms} BHK` : 'Property'

  return {
    target_audience: {
      primary:   'Working professionals aged 28–45 seeking quality homes',
      secondary: 'Families upgrading from smaller apartments',
      tertiary:  'NRIs and investors looking for Chennai real estate',
    },
    unique_selling_propositions: [
      `Prime location in ${loc}`,
      `Competitively priced ${bhk}`,
      'RERA approved project',
      'Zero brokerage — direct from builder',
      'Ready possession / early delivery',
    ],
    messaging_strategy: {
      primary_message:    `Your dream ${bhk} in ${loc} — now within reach`,
      supporting_messages: ['Direct builder pricing', 'Transparent documentation', 'Hassle-free registration'],
      objection_handling: {
        price_concern:    'Our pricing is competitive with no hidden charges',
        location_concern: `${loc} offers excellent connectivity and social infrastructure`,
        builder_trust:    'RERA registered project with transparent documentation',
      },
    },
    channel_priorities: {
      high_priority:   ['WhatsApp', 'Facebook/Instagram', 'Google Search'],
      medium_priority: ['Email Marketing', 'YouTube'],
      low_priority:    ['LinkedIn', 'Twitter'],
    },
    content_themes: ['Dream Home', 'Smart Investment', 'Community Living'],
    campaign_hooks: [
      `Book your site visit — limited units available in ${loc}`,
      `₹${(price / 100000).toFixed(0)}L onwards — best value in ${loc}`,
      'Zero brokerage. 100% transparent pricing.',
      `${bhk} homes in ${loc} — register your interest today`,
      'Site visits open this weekend — reserve your slot',
    ],
    budget_allocation: {
      google_ads_percentage: 30, facebook_ads_percentage: 25,
      content_marketing_percentage: 20, influencer_percentage: 15, other_percentage: 10,
      reasoning: 'Balanced digital-first strategy for Indian real estate market',
    },
    kpi_targets: {
      week_1:  { views: 500,  leads: 25,  site_visits: 5  },
      month_1: { views: 2500, leads: 125, site_visits: 25, conversions: 2 },
    },
    competitive_advantages: [
      'Direct builder pricing eliminates brokerage',
      'RERA compliance ensures legal protection',
      'Transparent unit availability and pricing',
    ],
    risk_factors: [
      'Market seasonality — mitigate with early-bird pricing',
      'Competing launches nearby — emphasize unique USPs',
    ],
  }
}
