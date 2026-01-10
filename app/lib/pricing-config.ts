// ============================================
// THARAGA PRICING CONFIGURATION
// Single Plan: Tharaga Pro - ₹4,999/month
// Everything Unlimited. One Simple Price.
// ============================================

export const THARAGA_PRO_PLAN = {
  id: 'tharaga_pro',
  name: 'Tharaga Pro',
  displayName: 'Tharaga Pro',
  tagline: 'Everything Unlimited. One Simple Price.',
  description: 'The only plan you\'ll ever need',
  
  pricing: {
    monthly: {
      amount: 499900, // ₹4,999 in paise
      display: '₹4,999',
      perMonth: '₹4,999/month',
      perDay: '₹166/day',
    },
    yearly: {
      amount: 4999200, // ₹49,992 in paise (₹4,166/month × 12)
      display: '₹4,166',
      perMonth: '₹4,166/month',
      totalYearly: '₹49,992/year',
      savings: '17%',
      savingsAmount: '₹9,996',
    },
    trial: {
      days: 14,
      requiresCreditCard: false,
    },
  },

  features: {
    // Core Features
    properties: {
      limit: -1, // unlimited
      display: 'Unlimited property listings',
    },
    leads: {
      limit: -1, // unlimited
      display: 'Unlimited AI-scored leads',
    },
    teamMembers: {
      limit: -1, // unlimited
      display: 'Unlimited team members',
    },
    storage: {
      limit: -1, // unlimited
      display: 'Unlimited storage',
    },

    // Automation & CRM
    crm: {
      enabled: true,
      display: 'Full CRM & pipeline management',
    },
    emailAutomation: {
      enabled: true,
      display: 'Email automation',
    },
    whatsappAutomation: {
      enabled: true,
      display: 'WhatsApp automation',
    },
    smsNotifications: {
      enabled: true,
      display: 'SMS notifications',
    },

    // AI & Analytics
    aiScoring: {
      enabled: true,
      display: 'AI-powered lead scoring',
    },
    analytics: {
      level: 'advanced',
      display: 'Advanced analytics dashboard',
    },
    voiceSearch: {
      languages: ['tamil', 'english'],
      display: 'Tamil + English voice search',
    },

    // Property Features
    virtualTours: {
      enabled: true,
      display: 'Virtual property tours',
    },
    propertyComparison: {
      limit: 4,
      display: '4-property comparison tool',
    },
    featuredListings: {
      limit: -1, // unlimited
      display: 'Featured listings (unlimited)',
    },

    // Integrations
    reraVerification: {
      enabled: true,
      display: 'RERA verification automation',
    },
    bankLoanIntegration: {
      enabled: true,
      display: 'Bank loan integration',
    },
    apiAccess: {
      enabled: true,
      display: 'API access + webhooks',
    },
    customIntegrations: {
      enabled: true,
      display: 'Custom integrations',
    },

    // Support
    prioritySupport: {
      responseTime: '2-hour',
      display: 'Priority support (2-hour response)',
    },
    whatsappSupport: {
      enabled: true,
      display: 'WhatsApp support channel',
    },
    phoneSupport: {
      enabled: true,
      display: 'Phone support (callback)',
    },
    dedicatedManager: {
      enabled: true,
      display: 'Dedicated account manager',
    },

    // Branding
    whiteLabel: {
      enabled: true,
      display: 'White-label branding',
    },
    customDomain: {
      enabled: true,
      display: 'Custom domain',
    },

    // Operations
    multiLocation: {
      enabled: true,
      display: 'Multi-location management',
    },
    bulkImportExport: {
      enabled: true,
      display: 'Bulk property import/export',
    },
    uptimeSLA: {
      percentage: 99.9,
      display: '99.9% uptime SLA',
    },

    // Services
    onboarding: {
      enabled: true,
      display: 'Free onboarding & training',
    },
    migration: {
      enabled: true,
      display: 'Free migration assistance',
    },
    businessReviews: {
      frequency: 'monthly',
      display: 'Monthly business reviews',
    },
    earlyAccess: {
      enabled: true,
      display: 'Early access to new features',
    },
  },

  // Feature list for display
  featuresList: [
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
    'Early access to new features',
  ],

  // Value Proposition
  valueProposition: {
    savings: {
      traditionalBroker: {
        min: 1200000, // ₹12L (for 10 properties at 1% commission)
        max: 3000000, // ₹30L (for 10 properties at 2% commission)
        display: '₹12-30L per year',
      },
      tharaga: {
        yearly: 59988, // ₹60K per year
        display: '₹60K per year',
      },
      savingsAmount: {
        min: 1140012, // ₹11.4L minimum savings
        max: 2940012, // ₹29.4L maximum savings
        display: '₹11-29 LAKHS annually',
      },
    },
    roi: {
      breakEven: '0.2-0.6 properties per year',
      message: 'ROI paid back with just ONE property sale',
    },
  },
}

// Helper Functions
export function formatCurrency(amount: number): string {
  if (amount === 0) return '₹0'
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`
  return `₹${amount.toLocaleString('en-IN')}`
}

export function calculateYearlySavings(): number {
  const monthlyTotal = THARAGA_PRO_PLAN.pricing.monthly.amount * 12
  const yearlyAmount = THARAGA_PRO_PLAN.pricing.yearly.amount
  return monthlyTotal - yearlyAmount
}

export function getPricingDisplay(billingCycle: 'monthly' | 'yearly') {
  if (billingCycle === 'yearly') {
    return {
      amount: THARAGA_PRO_PLAN.pricing.yearly.amount,
      display: THARAGA_PRO_PLAN.pricing.yearly.display,
      perMonth: THARAGA_PRO_PLAN.pricing.yearly.perMonth,
      savings: THARAGA_PRO_PLAN.pricing.yearly.savings,
    }
  }
  return {
    amount: THARAGA_PRO_PLAN.pricing.monthly.amount,
    display: THARAGA_PRO_PLAN.pricing.monthly.display,
    perMonth: THARAGA_PRO_PLAN.pricing.monthly.perMonth,
  }
}

// Type Definitions
export type BillingCycle = 'monthly' | 'yearly'
export type PlanId = 'tharaga_pro'

// Export default
export default THARAGA_PRO_PLAN



















