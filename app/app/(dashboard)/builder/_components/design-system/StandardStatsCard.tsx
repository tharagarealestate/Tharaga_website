"use client"

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'

interface StandardStatsCardProps {
  title: string
  value: string | number
  icon: ReactNode
  className?: string
  subtitle?: string
  trend?: {
    value: number
    label?: string
  }
}

/**
 * Standard Statistics Card - Matches Leads Page Design
 * Gold border glow effect, consistent styling across all pages
 */
export function StandardStatsCard({ title, value, icon, className, subtitle, trend }: StandardStatsCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null
    if (trend.value > 0) return <ArrowUpRight className="w-4 h-4 text-emerald-500" />
    if (trend.value < 0) return <ArrowDownRight className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-gray-500" />
  }

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
        <div className="flex-1">
          <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
          {subtitle && (
            <div className="text-xs text-slate-400 mt-1">{subtitle}</div>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              {getTrendIcon()}
              <span className={`text-xs font-semibold ${
                trend.value > 0 ? 'text-emerald-400' : trend.value < 0 ? 'text-red-400' : 'text-slate-400'
              }`}>
                {Math.abs(trend.value).toFixed(1)}%
              </span>
              {trend.label && (
                <span className="text-xs text-slate-500">{trend.label}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
