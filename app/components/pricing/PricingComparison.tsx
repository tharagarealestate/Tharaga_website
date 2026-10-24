'use client'

import { Check, X } from 'lucide-react'
import { PRICING_CONFIG } from '@/lib/pricing-config'

interface PricingComparisonProps {
  activeTab: 'builder' | 'buyer'
}

export default function PricingComparison({ activeTab }: PricingComparisonProps) {
  const plans = activeTab === 'builder'
    ? [PRICING_CONFIG.builder.starter, PRICING_CONFIG.builder.pro, PRICING_CONFIG.builder.enterprise]
    : [PRICING_CONFIG.buyer.free, PRICING_CONFIG.buyer.premium, PRICING_CONFIG.buyer.vip]

  const features = activeTab === 'builder'
    ? [
        { name: 'Property Listings', starter: '1-5', pro: '6-15', enterprise: '16-50' },
        { name: 'AI Lead Scoring', starter: true, pro: true, enterprise: true },
        { name: 'Tamil + English Voice Search', starter: true, pro: true, enterprise: true },
        { name: 'Advanced Analytics', starter: false, pro: true, enterprise: true },
        { name: 'Support', starter: 'Community (24hr)', pro: 'Priority (4hr)', enterprise: 'Dedicated (1hr)' },
        { name: 'Team Members', starter: '1', pro: '3', enterprise: '10' },
        { name: 'Featured Listings', starter: '0', pro: '3/month', enterprise: '10/month' },
        { name: 'API Access', starter: false, pro: false, enterprise: true },
        { name: 'White-Label Branding', starter: false, pro: false, enterprise: true },
        { name: 'RERA Verification', starter: true, pro: true, enterprise: true },
        { name: 'Email + WhatsApp Automation', starter: true, pro: true, enterprise: true },
        { name: 'CRM Integration', starter: false, pro: true, enterprise: true },
        { name: 'Bulk Property Upload', starter: false, pro: true, enterprise: true },
      ]
    : [
        { name: 'Property Search', free: 'Unlimited', premium: 'Unlimited', vip: 'Unlimited' },
        { name: 'Saved Properties', free: '10', premium: '50', vip: 'Unlimited' },
        { name: 'Comparisons', free: '3', premium: '10', vip: 'Unlimited' },
        { name: 'Site Visit Scheduling', free: 'Basic', premium: 'Priority', vip: 'Concierge' },
        { name: 'AI Recommendations', free: 'Basic', premium: 'Advanced', vip: 'Personalized' },
        { name: 'Document Vault', free: false, premium: true, vip: true },
        { name: 'Lawyer Consultation', free: false, premium: '3 free', vip: 'Unlimited' },
        { name: 'Priority Support', free: false, premium: true, vip: 'Dedicated Manager' },
        { name: 'Market Insights', free: false, premium: true, vip: true },
        { name: 'Negotiation Support', free: false, premium: false, vip: true },
      ]

  return (
    <div className='max-w-7xl mx-auto'>
      <div className='text-center mb-12'>
        <h2 className='font-display text-4xl sm:text-5xl font-bold text-white mb-4'>
          Compare Plans
        </h2>
        <p className='text-xl text-gray-300'>
          See how our plans stack up against each other
        </p>
      </div>

      <div className='backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-white/10'>
                <th className='text-left p-6 text-white font-semibold'>Features</th>
                {plans.map((plan, index) => (
                  <th
                    key={index}
                    className={`text-center p-6 text-white font-bold ${
                      index === 1 ? 'bg-gold-500/20' : ''
                    }`}
                  >
                    <div className='text-lg'>{(plan as any).displayName}</div>
                    <div className='text-sm text-gray-400 font-normal mt-1'>
                      {(plan as any).tagline}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feature, featureIndex) => (
                <tr
                  key={featureIndex}
                  className='border-b border-white/5 hover:bg-white/5 transition-colors'
                >
                  <td className='p-6 text-gray-300 font-medium'>
                    {feature.name}
                  </td>
                  {plans.map((plan, planIndex) => {
                    const planKey = activeTab === 'builder'
                      ? planIndex === 0 ? 'starter' : planIndex === 1 ? 'pro' : 'enterprise'
                      : planIndex === 0 ? 'free' : planIndex === 1 ? 'premium' : 'vip'

                    const value = (feature as any)[planKey]
                    const hasFeature = value === true || (typeof value === 'string' && value !== '0' && value !== 'false')
                    const isUnlimited = value === 'Unlimited' || value === 'unlimited'

                    return (
                      <td
                        key={planIndex}
                        className={`text-center p-6 ${
                          planIndex === 1 ? 'bg-gold-500/10' : ''
                        }`}
                      >
                        {hasFeature ? (
                          <div className='flex items-center justify-center gap-2'>
                            {typeof value === 'boolean' ? (
                              <div className='w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center'>
                                <Check className='w-4 h-4 text-emerald-400' />
                              </div>
                            ) : (
                              <span className='text-white font-medium'>
                                {value}
                                {isUnlimited && <span className='text-gold-400 ml-1'>∞</span>}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className='w-6 h-6 rounded-full bg-gray-500/20 flex items-center justify-center mx-auto'>
                            <X className='w-4 h-4 text-gray-500' />
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

