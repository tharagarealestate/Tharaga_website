import { NextResponse } from 'next/server';

// Match the pricing page structure: Single "Tharaga Pro" plan
const THARAGA_PRO_PLAN = {
  id: 'tharaga_pro',
  name: 'Tharaga Pro',
  description: 'The only plan you\'ll ever need',
  pricing: {
    monthly: { 
      amount: 499900, // ₹4,999 in paise
      display: '₹4,999',
      perMonth: '₹4,999/month'
    },
    yearly: { 
      amount: 4999200, // ₹4,166/month × 12 = ₹49,992 in paise
      display: '₹4,166',
      perMonth: '₹4,166/month',
      savings: '17%',
      totalYearly: '₹49,992/year'
    }
  },
  features: {
    properties_limit: -1, // unlimited
    leads_limit: -1, // unlimited
    email_quota: -1, // unlimited
    storage_gb: -1, // unlimited
    team_members_limit: -1, // unlimited
    analytics: 'advanced',
    crm_integration: true,
    whatsapp_integration: true,
    custom_branding: true,
    priority_support: true,
    api_access: true,
    dedicated_account_manager: true,
    white_label: true,
    custom_integrations: true
  },
  features_list: [
    'Unlimited property listings',
    'Unlimited AI-scored leads',
    'Unlimited team members',
    'Full CRM & pipeline management',
    'Email + WhatsApp automation',
    'SMS notifications',
    'Tamil + English voice search',
    'Advanced analytics dashboard',
    'RERA verification automation',
    'Bank loan integration',
    'Virtual property tours',
    '4-property comparison tool',
    'Priority support (2-hour response)',
    'WhatsApp support channel',
    'Phone support (callback)',
    'Dedicated account manager',
    'API access + webhooks',
    'White-label branding',
    'Custom domain',
    'Multi-location management',
    'Bulk property import/export',
    'Featured listings (unlimited)',
    'Custom integrations',
    '99.9% uptime SLA',
    'Free onboarding & training',
    'Free migration assistance',
    'Monthly business reviews',
    'Early access to new features'
  ]
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    plan: THARAGA_PRO_PLAN
  });
}






