import { Footer } from '@/components/sections/Footer'
import SiteHeader from '@/components/SiteHeader'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Tharaga - Invest Smart. Live Well. Build Wealth.',
  description: 'India\'s first AI-powered zero-commission real estate platform. Connect directly with verified builders. Save ₹3-5 lakhs on brokerage.',
  keywords: ['real estate', 'property', 'India', 'zero commission', 'AI', 'verified builders'],
}

export default function HomePage() {
  return (
    <div className="homepage-header min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden">
      <SiteHeader />
      {/* Animated Background Elements - EXACT from pricing page */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gold-500 rounded-full blur-3xl animate-pulse-slow" />
        <div
          className="absolute bottom-20 right-10 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDelay: '1s' }}
        />
      </div>

      <div className="relative z-10">
        <main className="hero-premium">
          <div className="inner">
            {/* Hero Section */}
            <div className="text-center lg:text-left">
              <div className="eyebrow mb-6">
                <span className="dot"></span>
                <span>Tamil Nadu • Broker-Free • AI-Powered</span>
              </div>
              
              <h1 className="headline mb-6">
                The Operating System for
                <span className="text-gradient-gold block mt-2">Tamil Nadu Real Estate</span>
              </h1>
              
              <p className="subhead mb-8">
                India's first AI-powered zero-commission real estate platform. 
                <strong> Connect directly with verified builders</strong> and save ₹3-5 lakhs on brokerage.
              </p>
              
              <div className="cta-row">
                <a href="/property-listing" className="btn-gold">
                  Explore Properties
                </a>
                <a href="/pricing" className="btn-glass">
                  For Builders
                </a>
              </div>
              
              <div className="trust-grid mt-8">
                <div className="trust-card">
                  <div className="k">12k+</div>
                  <div className="t">Verified Properties</div>
                </div>
                <div className="trust-card">
                  <div className="k">₹3-5L</div>
                  <div className="t">Avg. Savings</div>
                </div>
                <div className="trust-card">
                  <div className="k">100%</div>
                  <div className="t">Zero Brokerage</div>
                </div>
              </div>
            </div>
          </div>
        </main>
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}



