// ============================================
// THARAGA PRICING CONFIGURATION
// All prices in INR
// ============================================

export const PRICING_CONFIG = {
  // BUILDER PLANS
  builder: {
    starter: {
      id: 'builder_starter',
      name: 'Starter',
      displayName: 'Builder Starter',
      tagline: 'Perfect for micro builders',
      price: {
        monthly: 999,
        yearly: 9988, // 17% discount (₹11,988 - ₹2,000 = ₹9,988)
        yearlyDiscount: 17,
        display: '₹999/month',
        displayYearly: '₹9,988/year (Save ₹2,000)',
        perDay: '₹33/day'
      },
      commission: {
        rate: 0,
        description: 'Zero commission on deals'
      },
      features: {
        included: [
          'Up to 5 property listings',
          'Unlimited photos per property',
          'AI lead scoring (85% accuracy)',
          'Tamil + English voice search',
          'Advanced search filters',
          'Property comparison tools',
          'Email + WhatsApp automation',
          'Basic analytics dashboard',
          'Mobile app access',
          'Community support (24-hour response)',
          'RERA verification',
          'Bank loan integration',
          'EMI calculator',
          'Virtual property tours'
        ],
        notIncluded: [
          'Advanced analytics',
          'Priority support',
          'API access',
          'Team collaboration',
          'Custom branding',
          'Featured listings'
        ]
      },
      limits: {
        projects: null,
        propertiesPerProject: 5, // Property-based: 1-5 properties
        leadsPerMonth: null, // Unlimited
        teamMembers: 1,
        featuredListings: 0
      },
      propertyRange: {
        min: 1,
        max: 5
      }
    },
    pro: {
      id: 'builder_pro',
      name: 'Growth',
      displayName: 'Builder Growth',
      tagline: 'Best for small builders',
      badge: 'MOST POPULAR',
      price: {
        monthly: 2999,
        yearly: 29988, // 17% discount (₹35,988 - ₹6,000 = ₹29,988)
        yearlyDiscount: 17,
        display: '₹2,999/month',
        displayYearly: '₹29,988/year (Save ₹6,000)',
        perDay: '₹100/day'
      },
      commission: {
        rate: 0,
        description: 'Zero commission on deals'
      },
      features: {
        included: [
          'Everything in Starter',
          'Up to 15 property listings',
          'AI-powered lead recommendations',
          'Advanced analytics (conversion funnels)',
          'Priority support (4-hour response)',
          '3 team member seats',
          'CRM integration',
          'Bulk property upload',
          'Custom email templates',
          '3 featured listings/month',
          'Performance insights',
          'Lead source tracking'
        ],
        notIncluded: [
          'White-label branding',
          'Dedicated account manager',
          'Custom integrations',
          'SLA guarantee'
        ]
      },
      limits: {
        projects: null,
        propertiesPerProject: 15, // Property-based: 6-15 properties
        leadsPerMonth: null, // Unlimited
        teamMembers: 3,
        featuredListings: 3
      },
      propertyRange: {
        min: 6,
        max: 15
      }
    },
    enterprise: {
      id: 'builder_enterprise',
      name: 'Scale',
      displayName: 'Builder Scale',
      tagline: 'Built for medium builders',
      badge: 'Premium',
      price: {
        monthly: 5999,
        yearly: 59988, // 17% discount (₹71,988 - ₹12,000 = ₹59,988)
        yearlyDiscount: 17,
        display: '₹5,999/month',
        displayYearly: '₹59,988/year (Save ₹12,000)',
        perDay: '₹200/day'
      },
      commission: {
        rate: 0,
        description: 'Zero commission, pure subscription'
      },
      features: {
        included: [
          'Everything in Growth',
          'Up to 50 property listings',
          'Predictive analytics',
          '10 team member seats',
          'API access + webhooks',
          '10 featured listings/month',
          'White-label branding',
          'Multi-location management',
          'Dedicated account manager',
          'Priority phone support',
          'Custom integrations',
          'Quarterly business reviews'
        ],
        notIncluded: [
          'Unlimited properties',
          'Custom feature development',
          '99.9% SLA guarantee',
          'On-site training'
        ]
      },
      limits: {
        projects: null,
        propertiesPerProject: 50, // Property-based: 16-50 properties
        leadsPerMonth: null,
        teamMembers: 10,
        featuredListings: 10
      },
      propertyRange: {
        min: 16,
        max: 50
      }
    },
    enterprisePlus: {
      id: 'builder_enterprise_plus',
      name: 'Enterprise',
      displayName: 'Builder Enterprise',
      tagline: 'For large developers',
      badge: 'Enterprise',
      price: {
        monthly: 15000,
        yearly: 150000, // 17% discount
        yearlyDiscount: 17,
        display: '₹15,000+/month',
        displayYearly: '₹1,50,000+/year',
        perDay: '₹500+/day',
        custom: 'Custom pricing for 50+ properties'
      },
      commission: {
        rate: 0,
        description: 'Zero commission, pure subscription'
      },
      features: {
        included: [
          'Everything in Scale',
          'Unlimited property listings',
          'Unlimited team members',
          'Custom feature development',
          '99.9% SLA guarantee',
          'On-site training',
          'Monthly business reviews',
          'Custom branding & domain',
          'Dedicated tech support',
          'Custom analytics reports',
          'Direct API access'
        ],
        notIncluded: []
      },
      limits: {
        projects: null,
        propertiesPerProject: null, // Unlimited
        leadsPerMonth: null,
        teamMembers: null,
        featuredListings: null // Unlimited
      },
      propertyRange: {
        min: 51,
        max: null // Unlimited
      }
    }
  },

  // BUYER PLANS
  buyer: {
    free: {
      id: 'buyer_free',
      name: 'Free',
      displayName: 'Buyer Free',
      tagline: 'Start your property search',
      price: {
        monthly: 0,
        yearly: 0,
        display: '₹0',
        badge: 'Forever Free'
      },
      features: {
        included: [
          'Unlimited property search',
          'Save up to 10 properties',
          'Compare up to 3 properties',
          'Basic site visit scheduling',
          'Basic AI recommendations',
          'Email notifications',
          'Mobile app access'
        ],
        notIncluded: [
          'Document vault',
          'Lawyer consultation',
          'Priority scheduling',
          'Market insights',
          'Price alerts'
        ]
      },
      limits: {
        savedProperties: 10,
        comparisons: 3,
        freeLawyerQuestions: 0
      }
    },
    premium: {
      id: 'buyer_premium',
      name: 'Premium',
      displayName: 'Buyer Premium',
      tagline: 'Advanced search and insights',
      badge: 'Best Value',
      price: {
        monthly: 99,
        yearly: 999, // 58% discount (from ₹1,188)
        yearlyDiscount: 58,
        display: '₹99/month',
        displayYearly: '₹999/year (Save ₹189)',
        perDay: '₹3.3/day',
        coffeeEquivalent: 'Less than 1 coffee per month'
      },
      features: {
        included: [
          'Unlimited property search',
          'Save up to 50 properties',
          'Compare up to 10 properties',
          'Priority site visit scheduling',
          'Advanced AI recommendations',
          'Document vault (secure storage)',
          '3 free lawyer questions',
          'Priority support',
          'Market insights',
          'Price drop alerts',
          'Investment ROI calculator',
          'Neighborhood analytics',
          'Push notifications'
        ],
        notIncluded: [
          'Unlimited lawyer consultation',
          'Concierge service',
          'Negotiation support'
        ]
      },
      limits: {
        savedProperties: 50,
        comparisons: 10,
        freeLawyerQuestions: 3
      }
    },
    vip: {
      id: 'buyer_vip',
      name: 'VIP',
      displayName: 'Buyer VIP',
      tagline: 'Complete purchase assistance',
      badge: 'Concierge',
      price: {
        monthly: 999,
        yearly: 9999, // 17% discount (from ₹11,988)
        yearlyDiscount: 17,
        display: '₹999/month',
        displayYearly: '₹9,999/year (Save ₹1,989)',
        perDay: '₹33/day'
      },
      features: {
        included: [
          'Everything in Premium',
          'Unlimited saved properties',
          'Unlimited comparisons',
          'Concierge site visit service',
          'Personalized AI assistant',
          'Unlimited lawyer consultation',
          'Dedicated relationship manager',
          'Property visit coordination',
          'Negotiation support',
          'End-to-end purchase assistance',
          'Document verification support',
          'Registration support',
          'Post-purchase support (30 days)'
        ],
        notIncluded: []
      },
      limits: {
        savedProperties: null, // Unlimited
        comparisons: null,
        freeLawyerQuestions: null
      }
    }
  },

  // LAWYER SERVICES
  lawyerServices: {
    verification: {
      rera_certificate: {
        buyerPays: 500,
        lawyerReceives: 400,
        platformFee: 100,
        turnaroundHours: 24,
        description: 'RERA certificate verification'
      },
      title_deed: {
        buyerPays: 1000,
        lawyerReceives: 800,
        platformFee: 200,
        turnaroundHours: 48,
        description: 'Title deed verification'
      },
      sale_agreement: {
        buyerPays: 800,
        lawyerReceives: 650,
        platformFee: 150,
        turnaroundHours: 48,
        description: 'Sale agreement review'
      },
      encumbrance_certificate: {
        buyerPays: 600,
        lawyerReceives: 480,
        platformFee: 120,
        turnaroundHours: 72,
        description: 'Encumbrance certificate check'
      },
      property_tax_receipt: {
        buyerPays: 300,
        lawyerReceives: 240,
        platformFee: 60,
        turnaroundHours: 12,
        description: 'Property tax receipt verification'
      },
      building_approval: {
        buyerPays: 700,
        lawyerReceives: 560,
        platformFee: 140,
        turnaroundHours: 36,
        description: 'Building approval verification'
      }
    },
    consultation: {
      text_question: {
        buyerPays: 199,
        lawyerReceives: 150,
        platformFee: 49,
        description: 'Ask a question (text-based)'
      },
      call_15min: {
        buyerPays: 499,
        lawyerReceives: 399,
        platformFee: 100,
        description: '15-minute consultation call'
      },
      call_30min: {
        buyerPays: 899,
        lawyerReceives: 719,
        platformFee: 180,
        description: '30-minute consultation call'
      },
      call_60min: {
        buyerPays: 1499,
        lawyerReceives: 1199,
        platformFee: 300,
        description: '1-hour consultation call'
      }
    }
  },

  // AFFILIATE COMMISSIONS
  affiliates: {
    bank_loan: {
      commissionType: 'fixed',
      amount: 5000,
      minLoanValue: 1000000, // ₹10 Lakh minimum
      description: 'Per successful loan sanction',
      partners: ['HDFC', 'ICICI', 'SBI', 'Axis']
    },
    insurance: {
      commissionType: 'percentage',
      rate: 2.0, // 2% of premium
      description: 'Per insurance policy sold',
      partners: ['General Insurance Partners']
    },
    interior_design: {
      commissionType: 'percentage',
      rate: 10.0, // 10% of project value
      description: 'Per interior design project',
      partners: ['Interior Design Network']
    },
    legal_services: {
      commissionType: 'percentage',
      rate: 15.0, // 15% of service fee
      description: 'Per legal service transaction'
    },
    packers_movers: {
      commissionType: 'percentage',
      rate: 8.0, // 8% of moving cost
      description: 'Per moving service'
    }
  },

  // COMMISSION RATES
  commissionRates: {
    standard: 12.5, // For Free plan
    promotional: 10.0, // For Pro hybrid model
    premium: 15.0, // For high-value deals (₹5Cr+)
    capPerDeal: 500000 // Maximum ₹5L commission per deal
  },

  // GST & TAX
  gst: {
    rate: 18, // 18% GST in India
    applicable: true
  }
}

// REVENUE PROJECTIONS (Year 1)
export const REVENUE_PROJECTIONS = {
  year1: {
    baseCase: {
      totalRevenue: 20000000, // ₹2 Crore
      breakdown: {
        builderSubscriptions: 12000000, // ₹1.2 Cr (60%)
        commissions: 5000000, // ₹50L (25%)
        lawyerServices: 2000000, // ₹20L (10%)
        affiliates: 1000000 // ₹10L (5%)
      },
      assumptions: {
        builders: {
          starter: 500, // 500 starter users (₹999/month)
          pro: 150, // 150 pro users (₹2,999/month)
          enterprise: 10 // 10 enterprise users (₹5,999/month)
        },
        buyers: {
          free: 5000,
          premium: 200, // 200 × ₹99 × 12 = ₹2.38L
          vip: 20 // 20 × ₹999 × 12 = ₹2.4L
        }
      }
    },
    optimistic: {
      totalRevenue: 35000000, // ₹3.5 Cr
      assumptions: {
        builders: {
          starter: 1000,
          pro: 300,
          enterprise: 25
        }
      }
    },
    conservative: {
      totalRevenue: 12000000, // ₹1.2 Cr
      assumptions: {
        builders: {
          starter: 300,
          pro: 80,
          enterprise: 5
        }
      }
    }
  }
}

// HELPER FUNCTIONS
export function calculateYearlyDiscount(monthly: number, yearly: number): number {
  const monthlyTotal = monthly * 12
  return Math.round(((monthlyTotal - yearly) / monthlyTotal) * 100)
}

export function formatCurrency(amount: number): string {
  if (amount === 0) return '₹0'
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`
  return `₹${amount.toLocaleString('en-IN')}`
}

export function calculateGST(amount: number): { subtotal: number; gst: number; total: number } {
  const gstAmount = Math.round(amount * PRICING_CONFIG.gst.rate / 100)
  return {
    subtotal: amount,
    gst: gstAmount,
    total: amount + gstAmount
  }
}

// Type definitions for better TypeScript support
export type BuilderPlan = 'builder_starter' | 'builder_pro' | 'builder_enterprise'
export type BuyerPlan = 'buyer_free' | 'buyer_premium' | 'buyer_vip'
export type PricingModel = 'subscription' | 'commission' | 'hybrid'
export type DocumentType = 'rera_certificate' | 'title_deed' | 'sale_agreement' | 'encumbrance_certificate' | 'property_tax_receipt' | 'building_approval'
export type ConsultationType = 'text_question' | 'call_15min' | 'call_30min' | 'call_60min'
export type AffiliateType = 'bank_loan' | 'insurance' | 'interior_design' | 'legal_services' | 'packers_movers'

// Helper to get plan by ID
export function getBuilderPlan(planId: BuilderPlan) {
  const plans = PRICING_CONFIG.builder
  if (planId === 'builder_starter') return plans.starter
  if (planId === 'builder_pro') return plans.pro
  if (planId === 'builder_enterprise') return plans.enterprise
  return null
}

export function getBuyerPlan(planId: BuyerPlan) {
  const plans = PRICING_CONFIG.buyer
  if (planId === 'buyer_free') return plans.free
  if (planId === 'buyer_premium') return plans.premium
  if (planId === 'buyer_vip') return plans.vip
  return null
}

// Helper to get lawyer service pricing
export function getLawyerVerificationPricing(documentType: DocumentType) {
  return PRICING_CONFIG.lawyerServices.verification[documentType]
}

export function getLawyerConsultationPricing(consultationType: ConsultationType) {
  return PRICING_CONFIG.lawyerServices.consultation[consultationType]
}

// Helper to get affiliate commission
export function getAffiliateCommission(affiliateType: AffiliateType) {
  return PRICING_CONFIG.affiliates[affiliateType]
}

