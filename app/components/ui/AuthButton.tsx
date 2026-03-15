'use client'

import { useCallback, type ReactNode } from 'react'
import { openAuthModal as _openModal } from '@/components/auth/AuthModal'

/**
 * Opens the React auth modal (native Next.js component).
 * No iframe, no auth-gate.js dependency.
 */
export function openAuthModal() {
  _openModal()
}

/**
 * Client-side button that opens the auth modal.
 * Use this inside server components that can't have onClick handlers.
 */
export function AuthButton({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const handleClick = useCallback(() => openAuthModal(), [])

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  )
}
