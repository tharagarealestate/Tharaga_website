'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useInView } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const RING: Record<string, string> = {
  amber:  'ring-amber-500/25 shadow-amber-500/15',
  emerald:'ring-emerald-500/25 shadow-emerald-500/15',
  blue:   'ring-blue-500/25 shadow-blue-500/15',
  purple: 'ring-purple-500/25 shadow-purple-500/15',
}
const ICON_COLOR: Record<string, string> = {
  amber: 'text-amber-400', emerald: 'text-emerald-400',
  blue: 'text-blue-400', purple: 'text-purple-400',
}

export default function ToolCard({
  children,
  accent = 'amber',
}: {
  children: ReactNode
  accent?: 'amber' | 'emerald' | 'blue' | 'purple'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pb-24"
    >
      {/* Card */}
      <div className={cn(
        'rounded-3xl backdrop-blur-2xl bg-white/[0.04] border border-white/10',
        'shadow-2xl ring-1',
        RING[accent],
      )}>
        {/* Top strip */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-white/[0.07]">
          <Sparkles size={12} className={cn(ICON_COLOR[accent], 'opacity-70')} />
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest select-none">
            AI-Powered · Real-Time · Tharaga Intelligence
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] text-zinc-600">Live</span>
          </div>
        </div>

        <div className="p-4 sm:p-8">
          {children}
        </div>
      </div>

      {/* Trust strip */}
      <div className="flex flex-wrap items-center justify-center gap-6 mt-5 opacity-50">
        {[
          { label: 'RERA Compliant' },
          { label: 'Real-time Data' },
          { label: 'Chennai Market Intelligence' },
        ].map(({ label }) => (
          <span key={label} className="text-xs text-zinc-500 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-amber-500/60 inline-block" />
            {label}
          </span>
        ))}
      </div>
    </motion.div>
  )
}
