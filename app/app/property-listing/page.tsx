'use client'

import Link from 'next/link'
import { PortfolioShowcase } from '@/components/portfolio/PortfolioShowcase'

export default function PropertyListingPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1816]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-8 flex items-center justify-between border-b border-[#C5A059]/30 pb-6">
        <Link
          href="/"
          className="font-sans text-[11px] uppercase tracking-[0.26em] text-[#5A564F] hover:text-[#1A1816] transition-colors"
        >
          ← Tharaga
        </Link>
        <span className="font-serif text-xl">The Portfolio</span>
      </div>
      <PortfolioShowcase />
    </div>
  )
}
