'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Shield, CheckCircle2, Award, Star } from 'lucide-react'
import { cn } from '@/lib/design-system'

interface TrustBadgeProps {
  icon?: ReactNode
  text: string
  variant?: 'default' | 'premium' | 'success'
  className?: string
}

const iconMap = {
  default: Shield,
  premium: Award,
  success: CheckCircle2,
}

/**
 * Trust Badge Component
 * Displays trust signals and social proof
 */
export function TrustBadge({ 
  icon, 
  text, 
  variant = 'default',
  className = '' 
}: TrustBadgeProps) {
  const IconComponent = iconMap[variant]
  const displayIcon = icon || <IconComponent className="w-4 h-4" />

  const variantStyles = {
    default: 'bg-amber-500/20 border-amber-400/50 text-amber-100',
    premium: 'bg-emerald-500/20 border-emerald-400/50 text-emerald-100',
    success: 'bg-blue-500/20 border-blue-400/50 text-blue-100',
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-full glow-border',
        variantStyles[variant],
        className
      )}
    >
      {displayIcon}
      <span className="text-sm font-semibold">{text}</span>
    </motion.div>
  )
}





