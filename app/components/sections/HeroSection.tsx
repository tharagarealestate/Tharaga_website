import React from 'react'
import { BuyerSearchHero } from '@/components/hero/BuyerSearchHero'
import { AIPredictedProperties } from '@/components/hero/AIPredictedProperties'

export function HeroSection() {
  return (
    <section className="hero-premium relative min-h-screen flex items-center py-20">
      {/* Background Gradient - Matching Pricing Page */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 -z-10" />
      
      {/* Animated Background Elements - Matching Pricing Page */}
      <div className="absolute inset-0 opacity-30 -z-10 overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gold-500 rounded-full blur-3xl animate-pulse-slow" />
        <div 
          className="absolute bottom-20 right-10 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl animate-pulse-slow" 
          style={{ animationDelay: '1s' }} 
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Headlines - Matching Pricing Page Style */}
        <div className="text-center mb-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500/20 backdrop-blur-sm border border-gold-500/30 rounded-full mb-6">
            <span className="w-2 h-2 bg-gold-500 rounded-full animate-pulse" />
            <span className="text-gold-300 text-sm font-medium">
              India's First AI-Powered Real Estate Platform
            </span>
          </div>
          
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6">
            Invest Smart.
            <span className="text-gradient-gold block mt-2">Live Well. Build Wealth.</span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-gray-300 leading-relaxed mb-8 max-w-3xl mx-auto">
            Smarter sourcing, verified builders, measurable outcomes — invest with confidence.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-[1.5fr,1fr] gap-8 items-start max-w-7xl mx-auto">
          {/* Left: Search Container */}
          <div>
            <BuyerSearchHero />
          </div>

          {/* Right: AI Predictions */}
          <div className="lg:sticky lg:top-24">
            <AIPredictedProperties />
          </div>
        </div>
      </div>
    </section>
  )
}

