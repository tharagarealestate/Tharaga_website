import { readFileSync } from 'fs'
const env = {}
readFileSync('./app/.env.local', 'utf8').split('\n').forEach(l => {
  const i = l.indexOf('=')
  if (i > 0 && !l.startsWith('#')) env[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '')
})
const SB_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SB_KEY = env.SUPABASE_SERVICE_ROLE_KEY
const PROP_ID = '39026116-b35a-496d-9085-be3b7d5346ed'
const BUILDER_ID = 'b3bcde76-cd22-4f47-8fc0-8e5d75939034'

async function postRow(table, payload) {
  const r = await fetch(SB_URL + '/rest/v1/' + table, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, Prefer: 'return=representation' },
    body: JSON.stringify(payload),
  })
  const text = await r.text()
  let parsed = null; try { parsed = JSON.parse(text) } catch {}
  return { status: r.status, text: text.slice(0, 400), parsed }
}

async function run() {
  console.log('=== Debug: strategy/SEO for property with builder_id ===\n')

  // 1. Check what exists
  const sr = await fetch(SB_URL + '/rest/v1/property_marketing_strategies?property_id=eq.' + PROP_ID + '&select=id,status', { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY } })
  const strats = await sr.json()
  console.log('Existing strategy rows:', strats.length)

  const er = await fetch(SB_URL + '/rest/v1/seo_content?property_id=eq.' + PROP_ID + '&select=id,slug', { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY } })
  const seos = await er.json()
  console.log('Existing seo rows:', seos.length)

  const cr = await fetch(SB_URL + '/rest/v1/property_marketing_campaigns?property_id=eq.' + PROP_ID + '&select=id,campaign_name&order=created_at.desc&limit=3', { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY } })
  const camps = await cr.json()
  console.log('Existing campaign rows:', camps.length, camps.map(c => c.id?.slice(0,8)))

  // 2. Try direct insert of strategy with valid builder_id
  console.log('\n--- strategy insert with builder_id=' + BUILDER_ID.slice(0,8) + '... ---')
  const s = await postRow('property_marketing_strategies', {
    property_id:          PROP_ID,
    builder_id:           BUILDER_ID,
    pricing_position:     'budget',
    target_audience:      { primary: 'Homebuyers', secondary: [], city: 'Chennai', locality: 'Perungudi' },
    usps:                 { highlights: ['1 BHK', 'Test'] },
    messaging_strategy:   { hook: 'Test' },
    channel_priorities:   { rank_1: 'email_drip', rank_2: 'whatsapp', rank_3: 'social_media', rank_4: 'seo' },
    content_themes:       { themes: ['modern'] },
    campaign_hooks:       { launch_hook: 'Test' },
    budget_allocation:    { email: 40, whatsapp: 30, social: 20, seo: 10 },
    kpi_targets:          { leads_per_week: 5, site_visits_per_month: 2, conversion_rate: 0.05 },
    competitive_advantages: { price_segment: 'budget', locality_advantage: 'Perungudi' },
    risk_factors:         { market_risk: 'low', competition: 'medium' },
    ai_generated:         true, ai_model_used: 'rule-based', status: 'active',
  })
  console.log('strategy insert HTTP', s.status)
  if (s.parsed && !Array.isArray(s.parsed)) console.log('Error:', JSON.stringify(s.parsed))
  else if (s.parsed) console.log('Inserted ID:', s.parsed[0]?.id?.slice(0,8))

  // 3. Try SEO insert
  console.log('\n--- seo insert ---')
  const seoR = await postRow('seo_content', {
    property_id: PROP_ID, builder_id: BUILDER_ID,
    content_type: 'property_listing',
    title: '1 BHK for Sale in Perungudi Chennai',
    slug: '1-bhk-for-sale-perungudi-chennai-' + Date.now(),
    meta_title: 'Buy 1 BHK in Perungudi Chennai | Tharaga',
    meta_description: '1 BHK for sale in Perungudi, Chennai. View details on Tharaga.',
    focus_keywords: ['1 BHK for sale Perungudi', 'property for sale Chennai'],
    status: 'published', url: 'https://tharaga.co.in/properties/' + PROP_ID,
  })
  console.log('seo insert HTTP', seoR.status)
  if (seoR.parsed && !Array.isArray(seoR.parsed)) console.log('Error:', JSON.stringify(seoR.parsed))
  else if (seoR.parsed) console.log('Inserted ID:', seoR.parsed[0]?.id?.slice(0,8))
}

run().catch(e => console.error('Fatal:', e.message))
