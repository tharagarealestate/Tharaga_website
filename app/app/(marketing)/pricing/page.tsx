'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { PRICING_CONFIG } from '@/lib/pricing-config'
import PricingCard from '@/components/pricing/PricingCard'
import PricingComparison from '@/components/pricing/PricingComparison'
import PricingFAQ from '@/components/pricing/PricingFAQ'

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState<'builder' | 'buyer'>('builder')

  return (
    <div className='min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden'>
      {/* Animated Background Elements */}
      <div className='absolute inset-0 opacity-30'>
        <div className='absolute top-20 left-10 w-96 h-96 bg-gold-500 rounded-full blur-3xl animate-pulse-slow' />
        <div 
          className='absolute bottom-20 right-10 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl animate-pulse-slow' 
          style={{ animationDelay: '1s' }} 
        />
      </div>
      
      <div className='relative z-10'>
        {/* Hero Section */}
        <section className='container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16'>
          <div className='text-center max-w-4xl mx-auto'>
            {/* Badge */}
            <div className='inline-flex items-center gap-2 px-4 py-2 bg-gold-500/20 backdrop-blur-sm border border-gold-500/30 rounded-full mb-6'>
              <span className='w-2 h-2 bg-gold-500 rounded-full animate-pulse' />
              <span className='text-gold-300 text-sm font-medium'>
                Transparent Pricing, Zero Hidden Fees
              </span>
            </div>
            
            {/* Headline */}
            <h1 className='font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6'>
              Choose Your
              <span className='text-gradient-gold block mt-2'>Growth Path</span>
            </h1>
            
            {/* Subheadline */}
            <p className='text-xl sm:text-2xl text-gray-300 leading-relaxed mb-8'>
              Whether you're a builder scaling your business or a buyer finding your dream home,
              <br className='hidden sm:block' />
              we have the perfect plan for you.
            </p>
            
            {/* Toggle: Builder vs Buyer */}
            <div className='inline-flex items-center gap-2 p-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20'>
              <button 
                onClick={() => setActiveTab('builder')}
                className={`px-8 py-3 font-semibold rounded-full transition-all duration-300 ${
                  activeTab === 'builder'
                    ? 'bg-gold-500 text-primary-950'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                For Builders
              </button>
              <button 
                onClick={() => setActiveTab('buyer')}
                className={`px-8 py-3 font-semibold rounded-full transition-all duration-300 ${
                  activeTab === 'buyer'
                    ? 'bg-gold-500 text-primary-950'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                For Buyers
              </button>
            </div>
          </div>
        </section>
        
        {/* Builder Pricing Cards */}
        {activeTab === 'builder' && (
          <section className='container mx-auto px-4 sm:px-6 lg:px-8 pb-24'>
            <div className='grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto'>
              {/* Free Plan */}
              <PricingCard
                plan={PRICING_CONFIG.builder.free}
                variant='glass'
              />
              
              {/* Pro Plan - HIGHLIGHTED */}
              <PricingCard
                plan={PRICING_CONFIG.builder.pro}
                variant='highlighted'
                badge='Most Popular'
              />
              
              {/* Enterprise Plan */}
              <PricingCard
                plan={PRICING_CONFIG.builder.enterprise}
                variant='premium'
              />
            </div>
          </section>
        )}

        {/* Buyer Pricing Cards */}
        {activeTab === 'buyer' && (
          <section className='container mx-auto px-4 sm:px-6 lg:px-8 pb-24'>
            <div className='grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto'>
              {/* Free Plan */}
              <PricingCard
                plan={PRICING_CONFIG.buyer.free}
                variant='glass'
              />
              
              {/* Premium Plan - HIGHLIGHTED */}
              <PricingCard
                plan={PRICING_CONFIG.buyer.premium}
                variant='highlighted'
                badge='Best Value'
              />
              
              {/* VIP Plan */}
              <PricingCard
                plan={PRICING_CONFIG.buyer.vip}
                variant='premium'
              />
            </div>
          </section>
        )}
        
        {/* Feature Comparison Table */}
        <section className='container mx-auto px-4 sm:px-6 lg:px-8 pb-24'>
          <PricingComparison activeTab={activeTab} />
        </section>
        
        {/* FAQ Section */}
        <section className='container mx-auto px-4 sm:px-6 lg:px-8 pb-24'>
          <PricingFAQ activeTab={activeTab} />
        </section>
        
        {/* Final CTA */}
        <section className='container mx-auto px-4 sm:px-6 lg:px-8 pb-24'>
          <div className='max-w-4xl mx-auto glass-card p-12 rounded-3xl text-center border-2 border-gold-500/30'>
            <h2 className='font-display text-4xl font-bold text-white mb-4'>
              Still Have Questions?
            </h2>
            <p className='text-xl text-gray-300 mb-8'>
              Schedule a demo with our team to find the perfect plan for your business.
            </p>
            <button className='btn-gold text-lg px-10 py-4 inline-flex items-center gap-2'>
              Schedule Free Demo
              <ArrowRight className='w-5 h-5' />
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

