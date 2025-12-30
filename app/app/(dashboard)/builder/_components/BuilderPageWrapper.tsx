"use client"

import { ReactNode } from 'react'

interface BuilderPageWrapperProps {
  children: ReactNode
  title?: string
  description?: string
  className?: string
  noContainer?: boolean
}

/**
 * Consistent page wrapper for all builder dashboard pages
 * Note: Background is handled by layout.tsx, this wrapper just provides consistent content structure
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
      {/* Page Header (optional) */}
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
          )}
          {description && (
            <p className="text-gray-300 text-lg">{description}</p>
          )}
        </div>
      )}

      {/* Page Content */}
      {noContainer ? (
        children
      ) : (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg">
          {children}
        </div>
      )}
    </div>
  )
}

