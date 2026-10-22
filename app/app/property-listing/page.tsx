'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Building2, Sparkles } from 'lucide-react'
import { CuratedCommercialShowcase } from '@/components/commercial/CuratedCommercialShowcase'
import { CommercialIntakeModal } from '@/components/commercial/CommercialIntakeModal'
import { CURATED_COMMERCIAL_MANDATES } from '@/app/api/commercial/mandates/route'

export default function CommercialPropertyListingPage() {
  const [isIntakeOpen, setIsIntakeOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#070709] text-white selection:bg-amber-400 selection:text-black py-8">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8 flex items-center justify-between border-b border-white/[0.08] pb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Tharaga Institutional Home
        </Link>

        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-black font-bold text-xs">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="font-serif font-bold text-lg text-white">Tharaga</span>
          <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest hidden sm:inline">Mandates</span>
        </Link>
      </div>

      {/* Main Commercial Showcase Area */}
      <CuratedCommercialShowcase
        mandates={CURATED_COMMERCIAL_MANDATES}
        onOpenIntake={() => setIsIntakeOpen(true)}
      />

      {/* Commercial Intake Assistant Modal */}
      <CommercialIntakeModal
        isOpen={isIntakeOpen}
        onClose={() => setIsIntakeOpen(false)}
        user={null}
      />
    </div>
  )
}
