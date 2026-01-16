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
          <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
          {description && (
            <p className="text-sm text-slate-400">{description}</p>
          )}
        </motion.div>
      )}

      {/* Page Content - Fast Transition */}
      {noContainer ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 sm:p-8"
        >
          {children}
        </motion.div>
      )}
    </div>
  )
}

