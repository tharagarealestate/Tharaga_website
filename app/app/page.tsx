import { HeroSection } from '@/components/sections/HeroSection'
import { DashboardCTASection } from '@/components/sections/DashboardCTASection'
import { FeaturesSection } from '@/components/sections/FeaturesSection'
import { Footer } from '@/components/sections/Footer'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tharaga - Invest Smart. Live Well. Build Wealth.',
  description: 'India\'s first AI-powered zero-commission real estate platform. Connect directly with verified builders. Save ₹3-5 lakhs on brokerage.',
  keywords: ['real estate', 'property', 'India', 'zero commission', 'AI', 'verified builders'],
}

export default function HomePage() {
  return (
    <>
      <main>
        <HeroSection />
        <DashboardCTASection />
        <FeaturesSection />
      </main>
      <Footer />
    </>
  )
}

