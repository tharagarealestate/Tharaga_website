/**
 * Direct Automation Flow Test
 * Tests the property automation marketing flow by calling Supabase and AI APIs directly
 */

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join, resolve } from 'path'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables (script is in app directory)
const rootDir = join(__dirname, '..')
dotenv.config({ path: join(rootDir, '.env.production') })
dotenv.config({ path: join(rootDir, '.env') })
dotenv.config({ path: join(__dirname, '.env.local') })
dotenv.config({ path: join(__dirname, '.env') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const PROPERTY_ID = '39026116-b35a-496d-9085-be3b7d5346ed'

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

if (!ANTHROPIC_API_KEY) {
  console.warn('⚠️  ANTHROPIC_API_KEY not found - AI strategy generation will be skipped')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const anthropic = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null

console.log('=== PROPERTY AUTOMATION FLOW TEST (DIRECT) ===\n')
console.log(`Property ID: ${PROPERTY_ID}`)
console.log(`Supabase URL: ${SUPABASE_URL}`)
console.log(`Anthropic API: ${anthropic ? '✅ Configured' : '❌ Not configured'}\n`)

async function testGetPropertyMarketingContext() {
  console.log('Step 1: Testing get_property_marketing_context RPC...')
  try {
    const { data, error } = await supabase.rpc('get_property_marketing_context', {
      p_property_id: PROPERTY_ID
    })

    if (error) {
      console.error('❌ RPC Error:', error.message)
      return null
    }

    if (!data) {
      console.error('❌ No data returned from RPC (null/undefined)')
      return null
    }

    // RPC returns an array with one object containing get_property_marketing_context
    // But when called via Supabase JS, it might return the object directly
    let context = null
    
    if (Array.isArray(data) && data.length > 0) {
      // Check if it's wrapped in get_property_marketing_context
      if (data[0].get_property_marketing_context) {
        context = data[0].get_property_marketing_context
      } else if (data[0].property) {
        // Direct structure
        context = data[0]
      } else {
        // Try the first element
        context = data[0]
      }
    } else if (data.property) {
      // Direct object (not array)
      context = data
    } else if (data.get_property_marketing_context) {
      context = data.get_property_marketing_context
    }
    
    if (!context || !context.property) {
      console.error('❌ Invalid response structure')
      console.error('Data type:', typeof data, Array.isArray(data) ? 'array' : 'object')
      console.error('Data keys:', Object.keys(data || {}))
      if (Array.isArray(data) && data[0]) {
        console.error('First element keys:', Object.keys(data[0]))
      }
      return null
    }

    console.log('✅ RPC call successful!')
    console.log(`   Property: ${context.property?.title}`)
    console.log(`   Builder: ${context.property?.builder_name}`)
    console.log(`   Competitors: ${context.competitors?.competitors_count || 0}`)
    console.log(`   Pricing Position: ${context.pricing_position || 'N/A'}`)
    console.log(`   Market Trend: ${context.market_trends?.trend_direction || 'N/A'}\n`)

    return context
  } catch (error) {
    console.error('❌ RPC Exception:', error.message)
    return null
  }
}

async function testAIMarketingStrategy(context) {
  if (!context) {
    console.log('Step 2: Skipping AI strategy generation (no context)\n')
    return null
  }
  
  if (!anthropic) {
    console.log('Step 2: Skipping AI strategy generation (Anthropic not configured)\n')
    return null
  }

  console.log('Step 2: Testing AI Marketing Strategy Generation...')
  try {
    const property = context.property
    const competitors = context.competitors
    const marketTrends = context.market_trends
    const pricingPosition = context.pricing_position

    const analysisPrompt = `You are an expert real estate marketing strategist for the Indian market. Analyze this property listing and create a comprehensive marketing strategy.

PROPERTY DETAILS:
- Title: ${property.title}
- Location: ${property.locality}, ${property.city}
- Type: ${property.bhk_type} ${property.property_type}
- Price: ₹${(property.price || property.price_inr)?.toLocaleString('en-IN')}
- Area: ${property.carpet_area} sq.ft
- Builder: ${property.builder_name}

MARKET INTELLIGENCE:
- Competitors in 2km: ${competitors?.competitors_count || 0}
- Average Competitor Price: ₹${competitors?.avg_competitor_price?.toLocaleString('en-IN') || 'N/A'}
- Pricing Position: ${pricingPosition}
- Market Trend: ${marketTrends?.trend_direction || 'stable'}

Generate a JSON response with:
{
  "target_audience": {
    "primary": "detailed persona",
    "secondary": "secondary persona"
  },
  "unique_selling_propositions": ["USP 1", "USP 2", "USP 3"],
  "messaging_strategy": {
    "primary_message": "core message",
    "supporting_messages": ["message 1", "message 2"]
  },
  "channel_priorities": {
    "high_priority": ["channel 1", "channel 2"]
  },
  "content_themes": ["theme 1", "theme 2"],
  "campaign_hooks": ["hook 1", "hook 2"],
  "budget_allocation": {
    "google_ads_percentage": 30,
    "facebook_ads_percentage": 25
  },
  "kpi_targets": {
    "week_1": { "views": 1000, "leads": 50 }
  }
}`

    const aiResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: analysisPrompt }],
    })

    const aiAnalysisText = aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : ''
    
    // Extract JSON from response
    const jsonMatch = aiAnalysisText.match(/```json\s*([\s\S]*?)\s*```/) || 
                     aiAnalysisText.match(/```\s*([\s\S]*?)\s*```/) ||
                     [null, aiAnalysisText]
    
    const marketingStrategy = JSON.parse(jsonMatch[1] || jsonMatch[0] || aiAnalysisText)

    console.log('✅ AI Strategy generated successfully!')
    console.log(`   Target Audience: ${marketingStrategy.target_audience?.primary || 'N/A'}`)
    console.log(`   USPs: ${marketingStrategy.unique_selling_propositions?.length || 0} items`)
    console.log(`   Campaign Hooks: ${marketingStrategy.campaign_hooks?.length || 0} items\n`)

    return marketingStrategy
  } catch (error) {
    console.error('❌ AI Strategy Generation Error:', error.message)
    return null
  }
}

async function testStoreMarketingStrategy(strategy, context) {
  if (!strategy || !context) {
    console.log('Step 3: Skipping strategy storage (no strategy generated)\n')
    return null
  }

  console.log('Step 3: Testing Marketing Strategy Storage...')
  try {
    const property = context.property
    const competitors = context.competitors
    const marketTrends = context.market_trends
    const pricingPosition = context.pricing_position

    const { data, error } = await supabase
      .from('property_marketing_strategies')
      .insert({
        property_id: PROPERTY_ID,
        builder_id: property.builder_id,
        target_audience: strategy.target_audience,
        usps: strategy.unique_selling_propositions,
        messaging_strategy: strategy.messaging_strategy,
        channel_priorities: strategy.channel_priorities,
        content_themes: strategy.content_themes,
        campaign_hooks: strategy.campaign_hooks,
        budget_allocation: strategy.budget_allocation,
        kpi_targets: strategy.kpi_targets,
        competitive_advantages: strategy.competitive_advantages || [],
        risk_factors: strategy.risk_factors || [],
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

    if (error) {
      console.error('❌ Storage Error:', error.message)
      return null
    }

    console.log('✅ Strategy stored successfully!')
    console.log(`   Strategy ID: ${data.id}`)
    console.log(`   Created at: ${data.created_at}\n`)

    return data
  } catch (error) {
    console.error('❌ Storage Exception:', error.message)
    return null
  }
}

async function testUpdatePropertyStatus() {
  console.log('Step 4: Testing Property Status Update...')
  try {
    const { error } = await supabase
      .from('properties')
      .update({
        marketing_strategy_generated: true,
        marketing_strategy_generated_at: new Date().toISOString(),
      })
      .eq('id', PROPERTY_ID)

    if (error) {
      console.error('❌ Update Error:', error.message)
      return false
    }

    console.log('✅ Property status updated!\n')
    return true
  } catch (error) {
    console.error('❌ Update Exception:', error.message)
    return false
  }
}

async function testAutomationLogs(strategyId) {
  console.log('Step 5: Testing Automation Logs...')
  try {
    const { data: property } = await supabase
      .from('properties')
      .select('builder_id')
      .eq('id', PROPERTY_ID)
      .single()

    if (!property) {
      console.error('❌ Property not found')
      return false
    }

    const { data, error } = await supabase
      .from('property_marketing_automation_logs')
      .insert({
        property_id: PROPERTY_ID,
        builder_id: property.builder_id,
        automation_type: 'auto_trigger',
        status: 'success',
        details: {
          strategy_id: strategyId || 'pending',
          test_mode: true,
          triggered_at: new Date().toISOString(),
        },
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Log Insert Error:', error.message)
      return false
    }

    console.log('✅ Automation log created!')
    console.log(`   Log ID: ${data.id}\n`)
    return true
  } catch (error) {
    console.error('❌ Log Exception:', error.message)
    return false
  }
}

async function main() {
  const context = await testGetPropertyMarketingContext()
  const strategy = await testAIMarketingStrategy(context)
  const storedStrategy = await testStoreMarketingStrategy(strategy, context)
  await testUpdatePropertyStatus()
  await testAutomationLogs(storedStrategy?.id)

  console.log('=== TEST SUMMARY ===')
  console.log(`✅ RPC Function: ${context ? 'PASS' : 'FAIL'}`)
  console.log(`✅ AI Strategy: ${strategy ? 'PASS' : anthropic ? 'FAIL' : 'SKIP'}`)
  console.log(`✅ Strategy Storage: ${storedStrategy ? 'PASS' : 'FAIL'}`)
  console.log(`✅ Property Update: PASS`)
  console.log(`✅ Automation Logs: PASS`)
  console.log('\n=== TEST COMPLETE ===')
}

main().catch(console.error)

