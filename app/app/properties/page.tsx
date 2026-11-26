import type { Metadata } from 'next'
import { SiteFooter, SiteHeader } from '@/components/brand/SiteHeader'
import { SmoothScroll } from '@/components/brand/SmoothScroll'
import { PortfolioExplorer } from '@/components/portfolio/PortfolioExplorer'

export const metadata: Metadata = {
  title: 'Land, Solar & Commercial Property for Sale',
  description:
    'Land banks, solar and energy assets, quarries, commercial buildings and residences across Tamil Nadu, represented privately by Tharaga Estates.',
  alternates: { canonical: '/properties' },
}

export default function PropertiesPage() {
  return (
    <div className="min-h-screen bg-[#F7F3EC] text-[#15213A]">
      <SmoothScroll />
      <SiteHeader />
      <PortfolioExplorer />
      <SiteFooter />
    </div>
  )
}
