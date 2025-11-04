// ============================================
// THARAGA PRICING CONFIGURATION
// All prices in INR
// ============================================

export const PRICING_CONFIG = {
  // BUILDER PLANS
  builder: {
    free: {
      id: 'builder_free',
      name: 'Free',
      displayName: 'Builder Free',
      tagline: 'Perfect for getting started',
      price: {
        monthly: 0,
        yearly: 0,
        display: '₹0',
        badge: 'Forever Free'
      },
      commission: {
        rate: 12.5, // 12.5%
        description: 'Pay 12.5% only on successful deals'
      },
      features: {
        included: [
          'Up to 5 property listings',
          'Basic lead scoring (1-10)',
          'Basic analytics dashboard',
          'Community support',
          '20 leads per month',
          'Mobile app access',
          'Email notifications'
        ],
        notIncluded: [
          'Advanced AI analytics',
          'Priority support',
          'API access',
          'Team collaboration',
          'Custom branding'
        ]
      },
      limits: {
        projects: 1,
        propertiesPerProject: 5,
        leadsPerMonth: 20,
        teamMembers: 1,
        featuredListings: 0
      }
    },
    pro: {
      id: 'builder_pro',
      name: 'Pro',
      displayName: 'Builder Pro',
      tagline: 'For growing businesses',
      badge: 'Most Popular',
      models: {
        subscription: {
          price: {
            monthly: 4999,
            yearly: 49990, // 17% discount
            yearlyDiscount: 17,
            display: '₹4,999/month',
            displayYearly: '₹49,990/year (Save ₹9,998)',
            perDay: '₹166/day'
          },
          commission: {
            rate: 0,
            description: 'Zero commission on deals'
          }
        },
        hybrid: {
          price: {
            monthly: 2999,
            yearly: 29990,
            yearlyDiscount: 17,
            display: '₹2,999/month + 10% commission',
            displayYearly: '₹29,990/year + 10% commission'
          },
          commission: {
            rate: 10.0, // 10% (promotional)
            description: 'Lower subscription + 10% on deals'
          }
        }
      },
      features: {
        included: [
          'Up to 50 property listings',
          'Advanced AI lead scoring',
          'Advanced analytics + forecasting',
          'Priority support (4-hour response)',
          'Unlimited leads',
          'API access',
          '5 team members',
          '3 featured listings/month',
          'CRM integration',
          'Automated follow-ups',
          'Bulk upload properties',
          'Custom email templates'
        ],
        notIncluded: [
          'White-label branding',
          'Dedicated account manager',
          'Custom integrations',
          'SLA guarantee'
        ]
      },
      limits: {
        projects: 10,
        propertiesPerProject: 50,
        leadsPerMonth: null, // Unlimited
        teamMembers: 5,
        featuredListings: 3
      }
    },
    enterprise: {
      id: 'builder_enterprise',
      name: 'Enterprise',
      displayName: 'Builder Enterprise',
      tagline: 'For large organizations',
      badge: 'Premium',
      price: {
        monthly: 14999,
        yearly: 149990, // 17% discount
        yearlyDiscount: 17,
        display: '₹14,999/month',
        displayYearly: '₹1,49,990/year (Save ₹29,998)',
        perDay: '₹500/day',
        custom: 'Custom pricing available for 100+ properties'
      },
      commission: {
        rate: 0,
        description: 'Zero commission, pure subscription'
      },
      features: {
        included: [
          'Unlimited property listings',
          'AI-powered predictive analytics',
          'Custom analytics dashboards',
          'Dedicated account manager',
          'Unlimited team members',
          'API access + webhooks',
          '10 featured listings/month',
          'White-label branding',
          'Multi-location management',
          'Custom integrations',
          '99.9% SLA guarantee',
          'Priority phone support',
          'On-site training',
          'Quarterly business reviews'
        ],
        notIncluded: []
      },
      limits: {
        projects: null, // Unlimited
        propertiesPerProject: null,
        leadsPerMonth: null,
        teamMembers: null,
        featuredListings: 10
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
          free: 500, // 500 free users
          pro: 150, // 150 pro users (₹4,999 avg)
          enterprise: 10 // 10 enterprise users
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
          free: 1000,
          pro: 300,
          enterprise: 25
        }
      }
    },
    conservative: {
      totalRevenue: 12000000, // ₹1.2 Cr
      assumptions: {
        builders: {
          free: 300,
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
export type BuilderPlan = 'builder_free' | 'builder_pro' | 'builder_enterprise'
export type BuyerPlan = 'buyer_free' | 'buyer_premium' | 'buyer_vip'
export type PricingModel = 'subscription' | 'commission' | 'hybrid'
export type DocumentType = 'rera_certificate' | 'title_deed' | 'sale_agreement' | 'encumbrance_certificate' | 'property_tax_receipt' | 'building_approval'
export type ConsultationType = 'text_question' | 'call_15min' | 'call_30min' | 'call_60min'
export type AffiliateType = 'bank_loan' | 'insurance' | 'interior_design' | 'legal_services' | 'packers_movers'

// Helper to get plan by ID
export function getBuilderPlan(planId: BuilderPlan) {
  const plans = PRICING_CONFIG.builder
  if (planId === 'builder_free') return plans.free
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

