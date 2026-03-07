"use client"

import dynamic from 'next/dynamic'

const MarketAnalysis = dynamic(() => import('./MarketAnalysis').then(m => m.MarketAnalysis), { 
  ssr: false,
  loading: () => (
    <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <div className="h-4 w-4 rounded-full border-2 border-amber-500/30 border-t-amber-400 animate-spin" />
        <div className="h-4 w-40 bg-white/[0.05] rounded animate-pulse" />
      </div>
    </div>
  )
})

export default function ClientMarketAnalysis(props: any) {
  return <MarketAnalysis {...props} />
}
















































































