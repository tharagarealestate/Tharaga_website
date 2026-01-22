'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { typography } from '@/lib/design-system'
import { cn } from '@/lib/design-system'

interface PageHeaderProps {
  title: string | ReactNode
  description?: string | ReactNode
  emoji?: string
  actions?: ReactNode
  className?: string
  children?: ReactNode
}

/**
 * Standard page header component
 * Ensures consistent typography and spacing
 */
export function PageHeader({
  title,
  description,
  emoji,
  actions,
  className = '',
  children,
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('mb-8 sm:mb-12', className)}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={cn(typography.h1.className, 'mb-4')}>
            {emoji && <span className="mr-3">{emoji}</span>}
            {title}
          </h1>
          {description && (
            <p className={cn(typography.bodyLarge.className, 'max-w-2xl')}>
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
      {children && <div className="mt-6">{children}</div>}
    </motion.div>
  )
}



















