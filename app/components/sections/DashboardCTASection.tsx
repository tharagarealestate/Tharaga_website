import React from 'react'
import Link from 'next/link'
import { ArrowRight, Users, Building2, TrendingUp, Shield, Zap, BarChart3 } from 'lucide-react'
import { GlassContainer } from '@/components/ui/GlassContainer'
import { ShimmerCard } from '@/components/ui/ShimmerCard'

export function DashboardCTASection() {
  return (
    <section className="py-24 bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden">
      {/* Animated Background Elements - Matching Pricing Page */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gold-500 rounded-full blur-3xl animate-pulse-slow" />
        <div 
          className="absolute bottom-20 right-10 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl animate-pulse-slow" 
          style={{ animationDelay: '1s' }} 
        />
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
            Built for Both Sides of the Market
          </h2>
          <p className="text-xl sm:text-2xl text-gray-300 leading-relaxed max-w-2xl mx-auto">
            Whether you're building your dream home or building your portfolio, we've got you covered
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Buyer Card */}
          <ShimmerCard>
            <GlassContainer intensity="medium" className="p-8 h-full backdrop-blur-xl bg-white/10 border-2 border-white/20 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-accent-blue to-brand-accent-purple flex items-center justify-center flex-shrink-0">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Property Buyers
                  </h3>
                  <p className="text-gray-300">
                    Discover your perfect property with zero broker fees
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-white">Verified Properties Only</p>
                    <p className="text-sm text-gray-300">RERA-approved listings with document verification</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-white">AI-Powered Matching</p>
                    <p className="text-sm text-gray-300">Get personalized property recommendations instantly</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-white">Save ₹3-5 Lakhs</p>
                    <p className="text-sm text-gray-300">Zero brokerage. Direct builder pricing</p>
                  </div>
                </div>
              </div>

              <Link
                href="/my-dashboard"
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl hover:shadow-2xl hover:shadow-blue-500/50 hover:-translate-y-1 transition-all duration-300 group"
              >
                Explore Buyer Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </GlassContainer>
          </ShimmerCard>

          {/* Builder Card */}
          <ShimmerCard>
            <GlassContainer intensity="medium" className="p-8 h-full backdrop-blur-xl bg-white/10 border-2 border-white/20 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Property Builders
                  </h3>
                  <p className="text-gray-300">
                    Connect with serious, qualified buyers directly
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <BarChart3 className="w-5 h-5 text-gold-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-white">Pre-Qualified Leads</p>
                    <p className="text-sm text-gray-300">AI-scored leads based on budget and intent</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-gold-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-white">Automated Follow-ups</p>
                    <p className="text-sm text-gray-300">CRM automation to never miss an opportunity</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-gold-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-white">Higher Conversion</p>
                    <p className="text-sm text-gray-300">3x faster sales cycle with matched buyers</p>
                  </div>
                </div>
              </div>

              <Link
                href="/builder"
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-gold-600 to-gold-500 text-primary-950 font-semibold rounded-xl hover:shadow-2xl hover:shadow-gold-500/50 hover:-translate-y-1 transition-all duration-300 group"
              >
                Explore Builder Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </GlassContainer>
          </ShimmerCard>
        </div>
      </div>
    </section>
  )
}

