import { NextResponse } from 'next/server';

const BILLING_PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for individual builders getting started',
    pricing: {
      monthly: { amount: 299900, display: '₹2,999' }, // in paise
      quarterly: { amount: 809700, display: '₹8,097', savings: '10%' },
      yearly: { amount: 2879280, display: '₹28,793', savings: '20%' }
    },
    features: {
      properties_limit: 5,
      leads_limit: 100,
      email_quota: 500,
      storage_gb: 10,
      team_members_limit: 2,
      analytics: 'basic',
      crm_integration: true,
      whatsapp_integration: true,
      custom_branding: false,
      priority_support: false,
      api_access: false
    },
    features_list: [
      'Up to 5 property listings',
      '100 leads per month',
      '500 marketing emails/month',
      '10GB storage',
      '2 team members',
      'Basic analytics',
      'Zoho CRM integration',
      'WhatsApp integration',
      'Email support'
    ]
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'For growing real estate businesses',
    pricing: {
      monthly: { amount: 799900, display: '₹7,999' },
      quarterly: { amount: 2159730, display: '₹21,597', savings: '10%' },
      yearly: { amount: 7679040, display: '₹76,790', savings: '20%' }
    },
    features: {
      properties_limit: 25,
      leads_limit: 500,
      email_quota: 2500,
      storage_gb: 50,
      team_members_limit: 10,
      analytics: 'advanced',
      crm_integration: true,
      whatsapp_integration: true,
      custom_branding: true,
      priority_support: true,
      api_access: true
    },
    features_list: [
      'Up to 25 property listings',
      '500 leads per month',
      '2,500 marketing emails/month',
      '50GB storage',
      '10 team members',
      'Advanced analytics & reporting',
      'Zoho CRM integration',
      'WhatsApp Business API',
      'Custom branding',
      'Priority support',
      'API access'
    ],
    popular: true
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large-scale real estate operations',
    pricing: {
      monthly: { amount: 1999900, display: '₹19,999' },
      quarterly: { amount: 5399730, display: '₹53,997', savings: '10%' },
      yearly: { amount: 19199040, display: '₹1,91,990', savings: '20%' }
    },
    features: {
      properties_limit: -1, // unlimited
      leads_limit: -1,
      email_quota: 10000,
      storage_gb: 200,
      team_members_limit: -1,
      analytics: 'enterprise',
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
      'Unlimited leads',
      '10,000 marketing emails/month',
      '200GB storage',
      'Unlimited team members',
      'Enterprise analytics & BI',
      'Full CRM integration',
      'WhatsApp Business API',
      'White-label solution',
      'Dedicated account manager',
      '24/7 priority support',
      'Custom integrations',
      'API access with higher limits'
    ]
  }
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    plans: Object.values(BILLING_PLANS)
  });
}






