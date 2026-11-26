/**
 * Clean E2E test — verifies full marketing pipeline without race condition
 * No explicit notify-lead call — lets the fire-and-forget do its job
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load env
const envFile = resolve('./app/.env.local')
const env = {}
try {
  readFileSync(envFile, 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=')
    if (k && !k.startsWith('#')) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '')
  })
} catch { /* ignore */ }

const SB_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SB_KEY = env.SUPABASE_SERVICE_ROLE_KEY
const BASE   = 'https://tharaga.co.in'

if (!SB_URL || !SB_KEY) {
  console.error('Missing SUPABASE env vars — check app/.env.local')
  process.exit(1)
}

const delay = ms => new Promise(r => setTimeout(r, ms))

async function sbFetch(path, opts = {}) {
  const r = await fetch(SB_URL + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      apikey: SB_KEY,
      Authorization: 'Bearer ' + SB_KEY,
      ...(opts.headers || {}),
    },
  })
  return { status: r.status, data: await r.json().catch(() => null) }
}

async function run() {
  console.log('\n===== THARAGA MARKETING PIPELINE — CLEAN E2E TEST =====')
  console.log('Target:', BASE, '\n')

  // ── Get a test property that HAS a builder_id (required for marketing strategy/SEO) ──
  const { data: props } = await sbFetch(
    '/rest/v1/properties?select=id,title,locality,price_inr,builder_id&listing_status=eq.active&builder_id=not.is.null&limit=1'
  )
  const prop = props?.[0]
  if (!prop) { console.log('❌ No active property with builder_id found in DB'); process.exit(1) }
  console.log('Using property:', prop.id, '|', prop.title, '| builder_id:', prop.builder_id?.slice(0,8) + '...', '\n')

  // ── Clean up previous E2E test data ─────────────────────────────────────
  const E2E_EMAIL = 'e2e.clean.test@example.com'
  const { data: oldLeads } = await sbFetch(
    '/rest/v1/leads?select=id&email=eq.' + encodeURIComponent(E2E_EMAIL)
  )
  if (oldLeads?.length) {
    for (const { id } of oldLeads) {
      await sbFetch('/rest/v1/email_sequence_queue?lead_id=eq.' + id, { method: 'DELETE' })
    }
    await sbFetch('/rest/v1/leads?email=eq.' + encodeURIComponent(E2E_EMAIL), { method: 'DELETE' })
    console.log('Cleaned', oldLeads.length, 'old E2E lead(s) + drip rows\n')
  }

  const results = []

  // ── TEST 1: Create lead (auto-triggers fire-and-forget notify-lead) ─────
  console.log('── [1/5] Create Lead + auto fire-and-forget ─────────────')
  const leadRes = await fetch(BASE + '/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name:         'Clean E2E Buyer',
      email:        E2E_EMAIL,
      phone_number: '+919876543210',
      message:      'Interested, looking for 2BHK with good metro connectivity',
      property_id:  prop.id,
      source:       'property_page',
    }),
  })
  const leadData = await leadRes.json()
  const leadId = leadData?.lead?.id || leadData?.id
  const score  = leadData?.lead?.lead_score ?? leadData?.lead_score ?? '?'

  if (leadRes.status < 300 && leadId) {
    console.log('  HTTP', leadRes.status, '| lead_id:', leadId, '| score:', score + '/10')
    console.log('  ✅ TEST 1 PASS — lead created, fire-and-forget triggered\n')
    results.push(true)
  } else {
    console.log('  ❌ TEST 1 FAIL:', leadRes.status, JSON.stringify(leadData))
    results.push(false)
    return
  }

  // ── Wait for fire-and-forget to complete ─────────────────────────────────
  console.log('  ⏳ Waiting 7s for fire-and-forget notify-lead to settle...')
  await delay(7000)

  // ── TEST 2: Verify exactly 7 drip emails, all with buyer_email ──────────
  console.log('── [2/5] Verify 7-Email Drip Sequence ───────────────────')
  const { data: drips } = await sbFetch(
    '/rest/v1/email_sequence_queue?select=id,sequence_position,buyer_email,status,scheduled_for' +
    '&lead_id=eq.' + leadId + '&campaign_type=eq.lead_nurture&order=sequence_position.asc'
  )
  const count        = drips?.length || 0
  const missingEmail = drips?.filter(d => !d.buyer_email).length || 0

  console.log('  Drip rows:', count, '| Missing buyer_email:', missingEmail)
  drips?.forEach(d =>
    console.log('   pos', d.sequence_position, '|', d.status, '| buyer_email:', d.buyer_email ? '✓' : '✗')
  )

  const t2 = count === 7 && missingEmail === 0
  console.log('  ' + (t2 ? '✅ TEST 2 PASS' : '⚠️  TEST 2 PARTIAL') + ' — ' + count + ' emails (expect 7), missing email: ' + missingEmail + '\n')
  results.push(t2)

  // ── TEST 3: Process queue returns 200 ───────────────────────────────────
  console.log('── [3/5] Process Queue (service key auth) ───────────────')
  const queueRes = await fetch(BASE + '/api/automation/email/process-sequence-queue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + SB_KEY },
    body: JSON.stringify({ source: 'e2e-clean-test' }),
  })
  const queueData = await queueRes.json()
  console.log('  HTTP', queueRes.status, '| processed:', queueData?.processed, '| sent:', queueData?.sent, '| skipped:', queueData?.skipped)
  const t3 = queueRes.status === 200
  console.log('  ' + (t3 ? '✅ TEST 3 PASS' : '❌ TEST 3 FAIL') + '\n')
  results.push(t3)

  // ── TEST 4: Behavioral tracking (identified user) ───────────────────────
  console.log('── [4/5] Behavioral Tracking (identified buyer) ─────────')
  const btRes = await fetch(BASE + '/api/automation/behavioral-tracking/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      buyer_id:    leadId,
      session_id:  crypto.randomUUID(),
      event_type:  'schedule_visit_click',
      property_id: prop.id,
      device_type: 'mobile',
      browser:     'chrome',
    }),
  })
  const btData = await btRes.json()
  console.log('  HTTP', btRes.status, '| weight:', btData?.signal_weight, '| tracked:', btData?.tracked, '| signal_id:', btData?.signal_id)
  const t4 = btRes.status === 200 && btData?.tracked === true
  console.log('  ' + (t4 ? '✅ TEST 4 PASS' : '⚠️  TEST 4 ISSUE — tracked should be true') + '\n')
  results.push(t4)

  // ── TEST 5: Marketing launch — strategy + SEO auto-generation ───────────
  console.log('── [5/5] Marketing Launch — Strategy + SEO ──────────────')
  const mlRes = await fetch(BASE + '/api/automation/marketing/launch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ property_id: prop.id, action: 'launch' }),
  })
  const mlData = await mlRes.json()
  const cid = mlData?.campaign_id
  console.log('  HTTP', mlRes.status, '| campaign_id:', cid ? String(cid).slice(0, 16) + '...' : 'none (no builder_id on property)')

  // Verify strategy + SEO in DB
  const { data: strats } = await sbFetch(
    '/rest/v1/property_marketing_strategies?property_id=eq.' + prop.id + '&select=id,content_themes,budget_allocation&limit=1'
  )
  const { data: seos } = await sbFetch(
    '/rest/v1/seo_content?property_id=eq.' + prop.id + '&select=id,slug,meta_title&limit=1'
  )
  console.log('  marketing_strategy:', strats?.length ? ('✓ id=' + strats[0].id?.slice(0,8) + '... themes=' + JSON.stringify(strats[0].content_themes?.themes)) : '✗ none')
  console.log('  seo_content:       ', seos?.length   ? ('✓ slug=' + (seos[0].slug || 'null') + ' title=' + seos[0].meta_title?.slice(0,40)) : '✗ none')

  const t5 = mlRes.status === 200
  console.log('  ' + (t5 ? '✅ TEST 5 PASS' : '❌ TEST 5 FAIL — HTTP ' + mlRes.status) + '\n')
  results.push(t5)

  // ── Summary ──────────────────────────────────────────────────────────────
  const passed = results.filter(Boolean).length
  const total  = results.length
  console.log('═══════════════════════════════════════════════════════════')
  console.log('RESULT:', passed === total ? '✅' : '⚠️ ', passed + ' / ' + total + ' tests passed | commit: 67ce844a')
  console.log('═══════════════════════════════════════════════════════════\n')

  if (passed < total) {
    console.log('Failed tests:')
    results.forEach((ok, i) => { if (!ok) console.log('  ✗ Test', i + 1) })
  }
}

run().catch(e => { console.error('Fatal:', e.message, e.stack); process.exit(1) })
