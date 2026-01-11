"use client"

import { ReactNode } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { GlassCard } from '@/components/ui/glass-card'
import { motion } from 'framer-motion'

interface BuilderPageWrapperProps {
  children: ReactNode
  title?: string
  description?: string
  className?: string
  noContainer?: boolean
}

/**
 * Consistent page wrapper for all builder dashboard pages
 * Uses the design system for uniform styling
 * Ensures uniform design, spacing, and styling across all pages
 */
export function BuilderPageWrapper({ 
  children, 
  title, 
  description, 
  className = "",
  noContainer = false 
}: BuilderPageWrapperProps) {
  return (
    <div className={`relative z-10 ${className}`}>
      {/* Page Header - Design System */}
      {(title || description) && (
        <PageHeader
          title={title || ''}
          description={description}
        />
      )}

      {/* Page Content - Design System Container */}
      {noContainer ? (
        children
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard variant="dark" glow border className="p-6 sm:p-8">
            {children}
          </GlassCard>
        </motion.div>
      )}
    </div>
  )
}

