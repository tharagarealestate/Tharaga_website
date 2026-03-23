'use client'

import { useCallback, type ReactNode } from 'react'
import { openAuthModal as _openModal } from '@/components/auth/AuthModal'

/**
 * Opens the React auth modal.
 * @param next - Optional intended destination after auth (e.g. '/builder').
 *               When provided, OAuth redirects directly there after login.
 */
export function openAuthModal(next?: string) {
  _openModal(next)
}

/**
 * Client-side button that opens the auth modal.
 */
export function AuthButton({
  children,
  className,
  next,
}: {
  children: ReactNode
  className?: string
  next?: string
}) {
  const handleClick = useCallback(() => openAuthModal(next), [next])

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  )
}
