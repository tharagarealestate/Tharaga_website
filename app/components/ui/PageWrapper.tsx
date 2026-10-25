'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { backgrounds, layout } from '@/lib/design-system'

interface PageWrapperProps {
  children: ReactNode
  className?: string
  noContainer?: boolean
  noOrbs?: boolean
}

/**
 * Standard page wrapper with animated background
 * Applies consistent layout and background across all pages
 */
export function PageWrapper({ 
  children, 
  className = '',
  noContainer = false,
  noOrbs = false 
}: PageWrapperProps) {
  return (
    <div className={`${backgrounds.page.className} ${className}`}>
      {/* Animated Background Orbs */}
      {!noOrbs && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <motion.div
            className={backgrounds.orbs.amber}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.15, 0.1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className={backgrounds.orbs.emerald}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.1, 0.12, 0.1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>
      )}

      {/* Content Container */}
      <div className={`relative z-10 ${noContainer ? '' : `mobile-container ${layout.container.className}`}`}>
        {children}
      </div>
    </div>
  )
}



