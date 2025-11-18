import React from 'react'
import Link from 'next/link'
import { ArrowRight, Users, Building2, TrendingUp, Shield, Zap, BarChart3 } from 'lucide-react'
import { GlassContainer } from '@/components/ui/GlassContainer'
import { ShimmerCard } from '@/components/ui/ShimmerCard'

export function DashboardCTASection() {
  return (
    <section className="py-24 bg-section-light relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-30" />
      
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
            Built for Both Sides of the Market
          </h2>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Whether you're building your dream home or building your portfolio, we've got you covered
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Buyer Card */}
          <ShimmerCard>
            <GlassContainer intensity="light" className="p-8 h-full bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-accent-blue to-brand-accent-purple flex items-center justify-center flex-shrink-0">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-text-primary mb-2">
                    Property Buyers
                  </h3>
                  <p className="text-text-secondary">
                    Discover your perfect property with zero broker fees
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-brand-accent-blue flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-text-primary">Verified Properties Only</p>
                    <p className="text-sm text-text-secondary">RERA-approved listings with document verification</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-brand-accent-blue flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-text-primary">AI-Powered Matching</p>
                    <p className="text-sm text-text-secondary">Get personalized property recommendations instantly</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-brand-accent-blue flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-text-primary">Save ₹3-5 Lakhs</p>
                    <p className="text-sm text-text-secondary">Zero brokerage. Direct builder pricing</p>
                  </div>
                </div>
              </div>

              <Link
                href="/my-dashboard"
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-brand-accent-blue to-brand-accent-purple text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 group"
              >
                Explore Buyer Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </GlassContainer>
          </ShimmerCard>

          {/* Builder Card */}
          <ShimmerCard>
            <GlassContainer intensity="light" className="p-8 h-full bg-gradient-to-br from-amber-50 to-orange-50 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-text-primary mb-2">
                    Property Builders
                  </h3>
                  <p className="text-text-secondary">
                    Connect with serious, qualified buyers directly
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <BarChart3 className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-text-primary">Pre-Qualified Leads</p>
                    <p className="text-sm text-text-secondary">AI-scored leads based on budget and intent</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-text-primary">Automated Follow-ups</p>
                    <p className="text-sm text-text-secondary">CRM automation to never miss an opportunity</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-text-primary">Higher Conversion</p>
                    <p className="text-sm text-text-secondary">3x faster sales cycle with matched buyers</p>
                  </div>
                </div>
              </div>

              <Link
                href="/builder"
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 group"
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

