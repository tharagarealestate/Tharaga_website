import 'dotenv/config'

export type Tier = 'free' | 'growth' | 'pro' | 'enterprise'

export const config = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/tharaga',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    plan: {
      growthMonthly: process.env.RAZORPAY_PLAN_GROWTH_MONTHLY || '',
      proMonthly: process.env.RAZORPAY_PLAN_PRO_MONTHLY || '',
      growthYearly: process.env.RAZORPAY_PLAN_GROWTH_YEARLY || '',
      proYearly: process.env.RAZORPAY_PLAN_PRO_YEARLY || ''
    },
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || ''
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'no-reply@tharaga.co.in'
  },
  twilio: {
    sid: process.env.TWILIO_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    from: process.env.TWILIO_FROM || ''
  },
  jwt: {
    supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET || ''
  },
  recommendations: {
    autoApplyTierRecommendations: process.env.AUTO_APPLY_TIER_RECOMMENDATIONS === 'true'
  },
  trialDays: 14,
  downgradeGraceDays: 30
} as const
