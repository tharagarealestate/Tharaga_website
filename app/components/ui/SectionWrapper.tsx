'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { layout } from '@/lib/design-system'
import { cn } from '@/lib/design-system'

interface SectionWrapperProps {
  children: ReactNode
  title?: string
  description?: string
  className?: string
  noPadding?: boolean
}

/**
 * Standard section wrapper
 * Provides consistent spacing and layout for page sections
 */
export function SectionWrapper({
  children,
  title,
  description,
  className = '',
  noPadding = false,
}: SectionWrapperProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(layout.section.className, className)}
    >
      {(title || description) && (
        <div className={cn('mb-6', noPadding ? '' : 'px-4 sm:px-6')}>
          {title && (
            <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-2">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-lg text-slate-300">
              {description}
            </p>
          )}
        </div>
      )}
      <div className={noPadding ? '' : 'px-4 sm:px-6'}>
        {children}
      </div>
    </motion.section>
  )
}





