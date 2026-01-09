'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'
import { cn } from '@/lib/design-system'

interface StatsCardProps {
  icon: LucideIcon
  value: string | number
  label: string
  subtitle?: string
  trend?: {
    value: number
    positive: boolean
  }
  delay?: number
  className?: string
}

/**
 * Statistics Card Component
 * Displays key metrics with icons and trends
 */
export function StatsCard({
  icon: Icon,
  value,
  label,
  subtitle,
  trend,
  delay = 0,
  className = '',
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <GlassCard variant="dark" glow border hover className={cn('p-6', className)}>
        <div className="flex items-center justify-between mb-4">
          <Icon className="h-8 w-8 text-amber-300" />
          {trend && (
            <div className={cn(
              'flex items-center gap-1 text-sm font-semibold',
              trend.positive ? 'text-emerald-400' : 'text-red-400'
            )}>
              <span>{trend.positive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value).toFixed(1)}%</span>
            </div>
          )}
        </div>
        <p className="text-2xl sm:text-3xl font-bold text-white mb-1">{value}</p>
        <p className="text-sm text-slate-400">{label}</p>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        )}
      </GlassCard>
    </motion.div>
  )
}











