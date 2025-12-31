"use client"

import { ReactNode } from 'react'
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
 * Uses the billing page design system for uniform styling
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
      {/* Page Header (optional) - Design System Typography */}
      {(title || description) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          {title && (
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{title}</h1>
          )}
          {description && (
            <p className="text-slate-300 text-base sm:text-lg">{description}</p>
          )}
        </motion.div>
      )}

      {/* Page Content - Design System Container */}
      {noContainer ? (
        children
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl"
        >
          <div className="p-6 sm:p-8">
            {children}
          </div>
        </motion.div>
      )}
    </div>
  )
}

