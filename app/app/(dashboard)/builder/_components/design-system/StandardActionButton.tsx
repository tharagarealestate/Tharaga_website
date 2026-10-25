"use client"

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StandardActionButtonProps {
  label: string
  onClick: () => void
  icon?: ReactNode
  badge?: number | null
  variant?: 'default' | 'primary'
  className?: string
}

/**
 * Standard Action Button - Matches Leads Page Design
 * Gold border glow effect, badge notifications, consistent styling
 */
export function StandardActionButton({ 
  label, 
  onClick, 
  icon, 
  badge,
  variant = 'default',
  className 
}: StandardActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 lg:flex-initial px-4 py-2 glow-border rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 relative",
        variant === 'primary'
          ? "bg-amber-500 hover:bg-amber-600 text-slate-900"
          : "bg-slate-800/95 text-slate-200 hover:bg-slate-700/50",
        className
      )}
    >
      {icon && icon}
      <span>{label}</span>
      {badge !== null && badge !== undefined && badge > 0 && (
        <span className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 text-slate-900 text-xs font-bold rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  )
}
