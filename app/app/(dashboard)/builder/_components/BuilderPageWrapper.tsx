"use client"

import { ReactNode } from 'react'
import { DashboardPageHeader, ContentCard } from './ui/DashboardDesignSystem'

interface BuilderPageWrapperProps {
  children: ReactNode
  title?: string
  description?: string
  emoji?: string
  action?: ReactNode
  className?: string
  noContainer?: boolean
}

/**
 * Consistent page wrapper for all builder dashboard pages
 * Updated to use the new design system (dark slate + amber theme)
 * Ensures uniform design, spacing, and styling across all pages
 */
export function BuilderPageWrapper({
  children,
  title,
  description,
  emoji,
  action,
  className = "",
  noContainer = false
}: BuilderPageWrapperProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Page Header using Design System */}
      {(title || description) && (
        <DashboardPageHeader
          title={title || ''}
          subtitle={description}
          emoji={emoji}
          action={action}
        />
      )}

      {/* Page Content using Design System */}
      {noContainer ? (
        children
      ) : (
        <ContentCard>
          {children}
        </ContentCard>
      )}
    </div>
  )
}

