'use client'

import { useState } from 'react'
import { Check, X, Sparkles, Crown } from 'lucide-react'
import { PRICING_CONFIG } from '@/lib/pricing-config'

type PlanType = typeof PRICING_CONFIG.builder.starter | typeof PRICING_CONFIG.builder.pro | typeof PRICING_CONFIG.builder.enterprise | typeof PRICING_CONFIG.buyer.free | typeof PRICING_CONFIG.buyer.premium | typeof PRICING_CONFIG.buyer.vip

interface PricingCardProps {
  plan: PlanType
  variant?: 'glass' | 'highlighted' | 'premium'
  badge?: string
}

export default function PricingCard({
  plan,
  variant = 'glass',
  badge
}: PricingCardProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const isHighlighted = variant === 'highlighted'
  const isPremium = variant === 'premium'

  // Get price based on selections
  const priceConfig = (plan as any).price

  const price = billingCycle === 'monthly' ? priceConfig.monthly : priceConfig.yearly
  const displayPrice = billingCycle === 'monthly' ? priceConfig.display : priceConfig.displayYearly

  // Calculate savings for yearly
  const monthlyTotal = priceConfig.monthly * 12
  const savings = monthlyTotal - priceConfig.yearly

  return (
    <div className={`
      relative group
      ${isHighlighted ? 'lg:scale-110 lg:-translate-y-4 z-10' : ''}
    `}>
      {/* Card Container */}
      <div className={`
        relative h-full
        rounded-3xl overflow-hidden
        transition-all duration-500
        ${isHighlighted
          ? 'bg-gradient-to-br from-gold-500/20 to-emerald-500/20 border-2 border-gold-500/50 shadow-2xl shadow-gold-500/30'
          : isPremium
          ? 'backdrop-blur-xl bg-white/10 border-2 border-emerald-500/30'
          : 'backdrop-blur-xl bg-white/10 border border-white/20'
        }
        hover:shadow-2xl hover:-translate-y-2
      `}>
        {/* Shimmer Effect on Hover */}
        <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none' />

        <div className='relative p-8'>
          {/* Plan Name with Badge */}
          <div className='mb-6'>
            <div className='flex items-center gap-3 mb-2 flex-wrap'>
              <h3 className='text-2xl font-bold text-white flex items-center gap-2'>
                {(plan as any).displayName}
                {isPremium && <Crown className='w-6 h-6 text-gold-500' />}
              </h3>
              {/* Badge - Positioned inline with plan name for perfect alignment */}
              {badge && (
                <div className='flex-shrink-0'>
                  <div className='px-3 py-1 bg-gradient-to-r from-gold-600 to-gold-500 text-primary-950 text-xs font-bold rounded-full shadow-gold flex items-center gap-1.5 whitespace-nowrap'>
                    {isHighlighted && <Sparkles className='w-3 h-3' />}
                    {isPremium && <Crown className='w-3 h-3' />}
                    {badge}
                  </div>
                </div>
              )}
            </div>
            <p className='text-gray-400'>{(plan as any).tagline}</p>
          </div>


          {/* Billing Cycle Toggle */}
          {price !== 0 && priceConfig.yearly && (
            <div className='mb-6 inline-flex items-center gap-2 p-1 bg-white/10 backdrop-blur-sm rounded-full'>
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-primary-950'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-primary-950'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Yearly
                {priceConfig.yearlyDiscount && (
                  <span className='ml-2 px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full'>
                    Save {priceConfig.yearlyDiscount}%
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Price Display */}
          <div className='mb-8'>
            {price === 0 ? (
              <div>
                <div className='text-5xl font-bold text-gold-500 mb-2'>Free</div>
                <div className='text-gray-400'>{priceConfig.badge}</div>
              </div>
            ) : (
              <div>
                <div className='text-5xl font-bold text-white mb-2'>
                  ₹{price.toLocaleString('en-IN')}
                  <span className='text-2xl text-gray-400 font-normal'>
                    /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                  </span>
                </div>
                {billingCycle === 'yearly' && savings > 0 && (
                  <div className='text-emerald-400 text-sm font-semibold'>
                    Save ₹{savings.toLocaleString('en-IN')} annually
                  </div>
                )}
                {priceConfig.perDay && (
                  <div className='text-gray-400 text-sm'>
                    Just {priceConfig.perDay}
                  </div>
                )}
              </div>
            )}

            {/* Commission Info */}
            {(plan as any).commission && (plan as any).commission.rate > 0 && (
              <div className='mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg'>
                <div className='text-amber-300 text-sm font-medium'>
                  + {(plan as any).commission.rate}% commission on deals
                </div>
                <div className='text-amber-400/70 text-xs mt-1'>
                  {(plan as any).commission.description}
                </div>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <button 
            onClick={async () => {
              if (price === 0) {
                // Free plan - redirect to signup
                window.location.href = '/trial-signup'
                return
              }
              if ((plan as any).id === 'builder_enterprise') {
                // Enterprise - contact sales
                window.location.href = 'mailto:sales@tharaga.co.in?subject=Enterprise Plan Inquiry'
                return
              }
              
              // Paid plan - create Razorpay subscription using new property-based pricing
              try {
                // Map plan ID to database plan slug
                const planId = (plan as any).id
                let planSlug = 'starter'
                if (planId.includes('pro') || planId.includes('growth')) {
                  planSlug = 'growth'
                } else if (planId.includes('enterprise') && !planId.includes('plus')) {
                  planSlug = 'scale'
                } else if (planId.includes('enterprise_plus')) {
                  planSlug = 'enterprise'
                }
                
                // Get plan ID from database
                const plansResponse = await fetch('/api/pricing/plans')
                const plansData = await plansResponse.json()
                
                if (!plansData.success) {
                  alert('Unable to load plans. Please try again.')
                  return
                }
                
                const dbPlan = plansData.plans.find((p: any) => p.slug === planSlug)
                if (!dbPlan) {
                  alert('Plan not found. Please contact support.')
                  return
                }
                
                const response = await fetch('/api/pricing/create-subscription', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    planId: dbPlan.id,
                    billingCycle: billingCycle
                  })
                })
                
                const data = await response.json()
                
                if (!data.success || !data.subscriptionId) {
                  alert(data.error || 'Unable to start checkout. Please try again.')
                  return
                }
                
                // Load Razorpay script if not loaded
                if (!(window as any).Razorpay) {
                  const script = document.createElement('script')
                  script.src = 'https://checkout.razorpay.com/v1/checkout.js'
                  script.onload = () => openRazorpayCheckout(data)
                  document.body.appendChild(script)
                } else {
                  openRazorpayCheckout(data)
                }
                
                function openRazorpayCheckout(subData: any) {
                  const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || (window as any).RAZORPAY_KEY_ID,
                    subscription_id: subData.subscriptionId,
                    name: 'Tharaga',
                    description: `${(plan as any).displayName} - ${billingCycle === 'monthly' ? 'Monthly' : 'Annual'}`,
                    prefill: {
                      email: (window as any).__thgUserEmail || '',
                    },
                    theme: {
                      color: '#D4AF37'
                    },
                    handler: function () {
                      window.location.href = '/builder/billing?success=1'
                    },
                    modal: {
                      ondismiss: function() {
                        window.location.href = '/pricing?canceled=1'
                      }
                    }
                  }
                  
                  const rzp = new (window as any).Razorpay(options)
                  rzp.open()
                }
              } catch (error) {
                console.error('Payment error:', error)
                alert('Unable to start checkout. Please try again.')
              }
            }}
            className={`
            w-full py-4 rounded-xl font-bold text-lg mb-8
            transition-all duration-300
            ${isHighlighted
              ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-primary-950 hover:shadow-2xl hover:shadow-gold-500/50 hover:-translate-y-1'
              : isPremium
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:shadow-2xl hover:shadow-emerald-500/50 hover:-translate-y-1'
              : 'bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20'
            }
          `}>
            {price === 0 ? 'Start Free' : (plan as any).id === 'builder_enterprise' ? 'Contact Sales' : 'Get Started'}
          </button>

          {/* Features List */}
          <div className='space-y-4'>
            <div className='text-white font-semibold mb-3'>What&rsquo;s included:</div>

            {(plan as any).features.included.map((feature: string, index: number) => (
              <div key={index} className='flex items-start gap-3'>
                <div className='flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center mt-0.5'>
                  <Check className='w-3 h-3 text-emerald-400' />
                </div>
                <div className='text-gray-300 text-sm leading-relaxed'>{feature}</div>
              </div>
            ))}

            {(plan as any).features.notIncluded && (plan as any).features.notIncluded.length > 0 && (
              <>
                <div className='border-t border-white/10 my-4' />
                {(plan as any).features.notIncluded.map((feature: string, index: number) => (
                  <div key={index} className='flex items-start gap-3 opacity-50'>
                    <div className='flex-shrink-0 w-5 h-5 rounded-full bg-gray-500/20 flex items-center justify-center mt-0.5'>
                      <X className='w-3 h-3 text-gray-500' />
                    </div>
                    <div className='text-gray-500 text-sm leading-relaxed'>{feature}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

