'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { InstitutionalScreener } from '@/components/commercial/InstitutionalScreener'
import { ArrowLeft, Building2 } from 'lucide-react'

export default function ToolsRedirectPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#070709] text-white selection:bg-amber-400 selection:text-black py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between pb-6 border-b border-white/[0.08]">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Tharaga Institutional
          </Link>

          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-black font-bold text-xs">
              T
            </div>
            <span className="font-serif font-bold text-lg text-white">Tharaga</span>
          </Link>
        </div>

        {/* Executive Claude Screener */}
        <InstitutionalScreener />
      </div>
    </div>
  )
}
