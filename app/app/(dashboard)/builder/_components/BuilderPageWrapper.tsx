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
 * Modern page wrapper for all builder dashboard pages
 * Matches sidebar background: bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95
 * Fast transitions with zero lag
 * Consistent styling across all pages
 */
/**
 * Modern page wrapper - FULL WIDTH, NO CONTAINER RESTRICTIONS
 * All pages use entire width after sidebar (260px)
 * Matches messaging page pattern exactly
 */
export function BuilderPageWrapper({ 
  children, 
  title, 
  description, 
  className = "",
  noContainer = false 
}: BuilderPageWrapperProps) {
  return (
    <div className={`relative z-10 w-full ${className}`}>
      {/* Page Header - Modern Design */}
      {(title || description) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mb-6"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{title}</h1>
          {description && (
            <p className="text-base sm:text-lg text-slate-300">{description}</p>
          )}
        </motion.div>
      )}

      {/* Page Content - FULL WIDTH, Fast Transition */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full"
      >
        {children}
      </motion.div>
    </div>
  )
}

