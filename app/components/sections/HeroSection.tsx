import React from 'react'
import { BuyerSearchHero } from '@/components/hero/BuyerSearchHero'
import { AIPredictedProperties } from '@/components/hero/AIPredictedProperties'

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center py-20">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-section-dark-from via-blue-900/40 to-section-dark-to -z-10" />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4">
        {/* Headlines */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Invest Smart. <span className="text-yellow-500">Live Well.</span>
            <br />
            Build Wealth.
          </h1>
          <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto">
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

