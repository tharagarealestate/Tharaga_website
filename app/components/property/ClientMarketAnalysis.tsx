"use client"

import dynamic from 'next/dynamic'

const MarketAnalysis = dynamic(() => import('./MarketAnalysis').then(m => m.MarketAnalysis), { 
  ssr: false,
  loading: () => (
    <div className="rounded-xl border-2 border-amber-300 bg-slate-900/95 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-5 w-5 bg-amber-300/20 rounded animate-pulse" />
        <div className="h-6 w-48 bg-slate-700/50 rounded animate-pulse" />
      </div>
    </div>
  )
})

export default function ClientMarketAnalysis(props: any) {
  return <MarketAnalysis {...props} />
}


































