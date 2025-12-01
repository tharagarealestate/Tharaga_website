import { Footer } from '@/components/sections/Footer'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Tharaga - Invest Smart. Live Well. Build Wealth.',
  description: 'India\'s first AI-powered zero-commission real estate platform. Connect directly with verified builders. Save ₹3-5 lakhs on brokerage.',
  keywords: ['real estate', 'property', 'India', 'zero commission', 'AI', 'verified builders'],
}

export default function HomePage() {
  return (
    <div className="homepage-header min-h-screen">
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
  )
}

