/**
 * GET /api/health/env-check
 *
 * Comprehensive environment variable validation endpoint.
 * Returns which vars are set, which are missing, and an overall readiness status.
 *
 * Tier system:
 *   critical  — app cannot boot without these
 *   required  — specific features completely non-functional without these
 *   optional  — degrades gracefully when absent
 *
 * Response is safe to expose internally; no actual values are returned.
 */

import { NextResponse } from 'next/server'

interface VarSpec {
  key: string
  tier: 'critical' | 'required' | 'optional'
  feature: string
  hint?: string
}

const ENV_SPECS: VarSpec[] = [
  // ── Critical ─────────────────────────────────────────────────────────────
  { key: 'NEXT_PUBLIC_SUPABASE_URL',       tier: 'critical', feature: 'Database', hint: 'Supabase project URL' },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',  tier: 'critical', feature: 'Database', hint: 'Supabase anon/public key' },
  { key: 'SUPABASE_SERVICE_ROLE_KEY',      tier: 'critical', feature: 'Database (server)', hint: 'Supabase service role key — required for server-to-server automation calls' },

  // ── Required: AI (at least one) ──────────────────────────────────────────
  { key: 'ANTHROPIC_API_KEY',              tier: 'required', feature: 'AI (Claude)', hint: 'sk-ant-... — primary AI for marketing intelligence engine' },
  { key: 'GROQ_API_KEY',                   tier: 'optional', feature: 'AI (Groq fallback)', hint: 'gsk_... — free tier Groq as AI fallback' },
  { key: 'OPENAI_API_KEY',                 tier: 'optional', feature: 'AI (OpenAI fallback)', hint: 'sk-... — OpenAI as secondary AI fallback' },

  // ── Required: Marketing channels ─────────────────────────────────────────
  { key: 'META_PAGE_ACCESS_TOKEN',         tier: 'required', feature: 'Facebook/Meta posting', hint: 'From Meta Business Suite → Page → Access Token' },
  { key: 'META_WEBHOOK_VERIFY_TOKEN',      tier: 'optional', feature: 'Meta Lead Ads webhook', hint: 'Random string set in Meta App webhook config' },
  { key: 'META_APP_SECRET',                tier: 'optional', feature: 'Meta webhook signature', hint: 'App secret for verifying X-Hub-Signature-256' },

  // ── Required: WhatsApp / SMS ──────────────────────────────────────────────
  { key: 'TWILIO_ACCOUNT_SID',             tier: 'required', feature: 'WhatsApp broadcast', hint: 'AC... from Twilio console' },
  { key: 'TWILIO_AUTH_TOKEN',              tier: 'required', feature: 'WhatsApp broadcast', hint: 'Auth token from Twilio console' },
  { key: 'TWILIO_WHATSAPP_NUMBER',         tier: 'required', feature: 'WhatsApp broadcast', hint: 'e.g. +14155238886 — Twilio sandbox or production number' },
  { key: 'TWILIO_PHONE_NUMBER_SID',        tier: 'optional', feature: 'WhatsApp chatbot webhook', hint: 'PN... SID for auto-configuring incoming webhook' },

  // ── Required: Email ───────────────────────────────────────────────────────
  { key: 'RESEND_API_KEY',                 tier: 'required', feature: 'Transactional email', hint: 're_... from Resend.com dashboard' },

  // ── Required: Payments ────────────────────────────────────────────────────
  { key: 'RAZORPAY_KEY_ID',                tier: 'required', feature: 'Payments', hint: 'rzp_live_... or rzp_test_...' },
  { key: 'RAZORPAY_KEY_SECRET',            tier: 'required', feature: 'Payments', hint: 'Razorpay key secret' },
  { key: 'RAZORPAY_WEBHOOK_SECRET',        tier: 'optional', feature: 'Payment webhooks', hint: 'Webhook secret from Razorpay dashboard' },

  // ── Required: App config ─────────────────────────────────────────────────
  { key: 'NEXT_PUBLIC_APP_URL',            tier: 'required', feature: 'Internal webhooks', hint: 'e.g. https://tharaga.co.in — used for server-to-server calls' },
  { key: 'CRON_SECRET',                    tier: 'required', feature: 'Cron job security', hint: 'Random secret to secure /api/cron/* endpoints' },
  { key: 'INTERNAL_API_KEY',               tier: 'required', feature: 'Internal API auth', hint: 'Random secret for server-to-server workflow triggers' },

  // ── Optional ─────────────────────────────────────────────────────────────
  { key: 'NEXT_PUBLIC_SITE_URL',           tier: 'optional', feature: 'SEO / canonical URLs' },
  { key: 'NEXT_PUBLIC_GA_ID',              tier: 'optional', feature: 'Google Analytics' },
  { key: 'ZOHO_CLIENT_ID',                 tier: 'optional', feature: 'Zoho CRM integration' },
  { key: 'ZOHO_CLIENT_SECRET',             tier: 'optional', feature: 'Zoho CRM integration' },
]

type Tier = 'critical' | 'required' | 'optional'

interface CheckResult {
  key: string
  present: boolean
  tier: Tier
  feature: string
  hint?: string
}

export async function GET() {
  const results: CheckResult[] = ENV_SPECS.map((spec) => ({
    key:     spec.key,
    present: !!process.env[spec.key],
    tier:    spec.tier,
    feature: spec.feature,
    ...(spec.hint ? { hint: spec.hint } : {}),
  }))

  const missing = results.filter((r) => !r.present)
  const missingCritical  = missing.filter((r) => r.tier === 'critical')
  const missingRequired  = missing.filter((r) => r.tier === 'required')
  const missingOptional  = missing.filter((r) => r.tier === 'optional')

  // AI provider: need at least one
  const hasAI =
    !!process.env.ANTHROPIC_API_KEY ||
    !!process.env.GROQ_API_KEY      ||
    !!process.env.OPENAI_API_KEY

  // Marketing channels: can partially operate
  const hasMeta      = !!process.env.META_PAGE_ACCESS_TOKEN
  const hasWhatsApp  = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER)
  const hasEmail     = !!process.env.RESEND_API_KEY

  // Overall readiness
  let status: 'ready' | 'degraded' | 'blocked'
  if (missingCritical.length > 0) {
    status = 'blocked'
  } else if (missingRequired.length > 0 || !hasAI) {
    status = 'degraded'
  } else {
    status = 'ready'
  }

  const channelStatus = {
    facebook_posting:    hasMeta     ? 'active'  : 'inactive — add META_PAGE_ACCESS_TOKEN',
    whatsapp_broadcast:  hasWhatsApp ? 'active'  : 'inactive — add TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_WHATSAPP_NUMBER',
    email_marketing:     hasEmail    ? 'active'  : 'inactive — add RESEND_API_KEY',
    ai_content:          hasAI       ? 'active'  : 'inactive — add ANTHROPIC_API_KEY (or GROQ_API_KEY)',
  }

  return NextResponse.json({
    status,
    timestamp: new Date().toISOString(),
    summary: {
      total:            results.length,
      present:          results.filter((r) => r.present).length,
      missing_critical: missingCritical.length,
      missing_required: missingRequired.length,
      missing_optional: missingOptional.length,
    },
    channels: channelStatus,
    missing: {
      critical: missingCritical.map(({ key, feature, hint }) => ({ key, feature, ...(hint ? { hint } : {}) })),
      required: missingRequired.map(({ key, feature, hint }) => ({ key, feature, ...(hint ? { hint } : {}) })),
      optional: missingOptional.map(({ key, feature }) => ({ key, feature })),
    },
    all_vars: results.map(({ key, present, tier, feature }) => ({ key, present, tier, feature })),
  })
}
