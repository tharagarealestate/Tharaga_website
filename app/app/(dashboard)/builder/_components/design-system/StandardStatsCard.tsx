"use client"

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StandardStatsCardProps {
  title: string
  value: string | number
  icon: ReactNode
  className?: string
}

/**
 * Standard Statistics Card - Matches Leads Page Design
 * Gold border glow effect, consistent styling across all pages
 */
export function StandardStatsCard({ title, value, icon, className }: StandardStatsCardProps) {
  return (
    <div className={cn(
      "bg-slate-800/95 glow-border rounded-lg p-4",
      className
    )}>
      <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">{title}</h3>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center text-amber-300 flex-shrink-0">
          {icon}
        </div>
        <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
      </div>
    </div>
  )
}
