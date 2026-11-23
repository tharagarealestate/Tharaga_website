'use client'

import Link from 'next/link'
import { TharagaWordmark } from '@/components/brand/TharagaWordmark'
import { PortfolioShowcase } from '@/components/portfolio/PortfolioShowcase'

export default function PropertyListingPage() {
  return (
    <div className="min-h-screen bg-[#F7F3EC] text-[#15213A]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-8 flex items-center justify-between border-b border-[#B0834A]/30 pb-6">
        <Link
          href="/"
          className="font-sans text-[11px] uppercase tracking-[0.26em] text-[#4A5163] hover:text-[#15213A] transition-colors"
        >
          ← Home
        </Link>
        <TharagaWordmark height={56} priority />
      </div>
      <PortfolioShowcase />
    </div>
  )
}
