"use client"

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

/**
 * Dashboard Design System Components
 *
 * Extracted from UnifiedDashboard.tsx to ensure consistent UI across all builder pages
 * Following the admin design system with amber accents and slate dark theme
 */

// ==================== PAGE LAYOUT ====================

interface DashboardPageHeaderProps {
  title: string
  subtitle?: string
  emoji?: string
  action?: ReactNode
}

export function DashboardPageHeader({ title, subtitle, emoji, action }: DashboardPageHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          {title} {emoji}
        </h1>
        {subtitle && <p className="text-slate-300">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

// ==================== STAT CARDS ====================

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    positive: boolean
  }
  loading?: boolean
  delay?: number
}

export function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  trend,
  loading = false,
  delay = 0
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="relative bg-slate-800/95 glow-border rounded-lg p-4 overflow-hidden group cursor-pointer"
    >
      {/* Hover Glow Effect */}
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent pointer-events-none"
      />

      {/* Icon with Animation */}
      <motion.div
        whileHover={{ rotate: 5, scale: 1.1 }}
        className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity"
      >
        <Icon className="w-16 h-16 text-amber-300" />
      </motion.div>

      <div className="relative z-10">
        <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">{label}</h3>
        {loading ? (
          <div className="flex items-center justify-center h-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-300"></div>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + 0.1 }}
              className="flex items-baseline gap-2 mb-1"
            >
              <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
              {trend && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay + 0.2 }}
                  className={cn(
                    "flex items-center gap-1 text-xs font-medium",
                    trend.positive ? "text-emerald-300" : "text-red-300"
                  )}
                >
                  {trend.positive ? "↗" : "↘"}
                  {Math.abs(trend.value)}%
                </motion.div>
              )}
            </motion.div>
            {subtitle && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay + 0.15 }}
                className="text-xs text-slate-400"
              >
                {subtitle}
              </motion.div>
            )}
          </>
        )}
      </div>
    </motion.div>
  )
}

interface StatsGridProps {
  children: ReactNode
  cols?: 1 | 2 | 3 | 4
}

export function StatsGrid({ children, cols = 4 }: StatsGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn("grid gap-4 mb-6", gridCols[cols])}
    >
      {children}
    </motion.div>
  )
}

// ==================== CONTENT CARDS ====================

interface ContentCardProps {
  children: ReactNode
  className?: string
}

export function ContentCard({ children, className }: ContentCardProps) {
  return (
    <div className={cn("bg-slate-800/95 glow-border rounded-lg overflow-hidden", className)}>
      {children}
    </div>
  )
}

interface ContentCardHeaderProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  action?: ReactNode
}

export function ContentCardHeader({ icon: Icon, title, subtitle, action }: ContentCardHeaderProps) {
  return (
    <div className="p-6 border-b glow-border border-b-amber-300/25">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
            <Icon className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            {subtitle && <p className="text-sm text-slate-300">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  )
}

interface ContentCardBodyProps {
  children: ReactNode
  loading?: boolean
  loadingMessage?: string
  empty?: boolean
  emptyIcon?: LucideIcon
  emptyTitle?: string
  emptyMessage?: string
  emptyAction?: ReactNode
}

export function ContentCardBody({
  children,
  loading = false,
  loadingMessage = "Loading...",
  empty = false,
  emptyIcon: EmptyIcon,
  emptyTitle,
  emptyMessage,
  emptyAction
}: ContentCardBodyProps) {
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-300 mx-auto mb-4"></div>
            <p className="text-slate-400">{loadingMessage}</p>
          </div>
        </div>
      </div>
    )
  }

  if (empty && EmptyIcon) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <EmptyIcon className="w-12 h-12 mx-auto mb-3 text-slate-400" />
          {emptyTitle && <p className="text-white mb-2">{emptyTitle}</p>}
          {emptyMessage && <p className="text-sm text-slate-400">{emptyMessage}</p>}
          {emptyAction && <div className="mt-4">{emptyAction}</div>}
        </div>
      </div>
    )
  }

  return <div className="p-6">{children}</div>
}

// ==================== BUTTONS ====================

interface PrimaryButtonProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
  type?: "button" | "submit" | "reset"
}

export function PrimaryButton({
  children,
  onClick,
  disabled = false,
  className,
  type = "button"
}: PrimaryButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={cn(
        "px-4 py-2 bg-amber-500 hover:bg-amber-600 glow-border text-slate-900 font-semibold rounded-lg transition-all text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {children}
    </motion.button>
  )
}

interface SecondaryButtonProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
  icon?: LucideIcon
}

export function SecondaryButton({
  children,
  onClick,
  disabled = false,
  className,
  icon: Icon
}: SecondaryButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-4 py-2 glow-border bg-slate-800/95 text-slate-200 hover:bg-slate-700/50 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  )
}

// ==================== ITEM CARDS ====================

interface ItemCardProps {
  children: ReactNode
  onClick?: () => void
  className?: string
}

export function ItemCard({ children, onClick, className }: ItemCardProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-full p-4 bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600/50 hover:glow-border rounded-lg transition-all text-left relative overflow-hidden group",
        className
      )}
    >
      {/* Hover Glow */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileHover={{ opacity: 1, x: 0 }}
        className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent pointer-events-none"
      />
      <div className="relative z-10">{children}</div>
    </motion.button>
  )
}

// ==================== QUICK ACTIONS ====================

interface QuickActionsCardProps {
  children: ReactNode
}

export function QuickActionsCard({ children }: QuickActionsCardProps) {
  return (
    <div className="bg-slate-800/95 glow-border rounded-lg p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Quick Actions</h3>
          <p className="text-sm text-slate-300">Access your most used features</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">{children}</div>
      </div>
    </div>
  )
}

// ==================== EMPTY STATES ====================

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  message: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <Icon className="w-12 h-12 mx-auto mb-3 text-slate-400" />
      <p className="text-white mb-2">{title}</p>
      <p className="text-sm text-slate-400">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ==================== LOADING STATES ====================

export function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-300 mx-auto mb-4"></div>
        <p className="text-slate-400">{message}</p>
      </div>
    </div>
  )
}

// ==================== GRID LAYOUTS ====================

interface TwoColumnGridProps {
  children: ReactNode
}

export function TwoColumnGrid({ children }: TwoColumnGridProps) {
  return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{children}</div>
}

interface ThreeColumnGridProps {
  children: ReactNode
}

export function ThreeColumnGrid({ children }: ThreeColumnGridProps) {
  return <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">{children}</div>
}
