'use client'

import { useCallback, type ReactNode } from 'react'

/**
 * Opens the auth-gate login modal popup (iframe overlay).
 * Falls back to direct navigation if auth-gate hasn't loaded yet.
 */
export function openAuthModal() {
  try {
    const next = location.pathname + location.search
    // Primary: auth-gate iframe modal
    const g = (window as any).authGate
    if (g && typeof g.openLoginModal === 'function') {
      g.openLoginModal({ next })
      return
    }
    // Fallback: legacy global
    if (typeof (window as any).__thgOpenAuthModal === 'function') {
      ;(window as any).__thgOpenAuthModal({ next })
      return
    }
    // Last resort: navigate to glassdrop page directly
    location.href = '/login_signup_glassdrop/'
  } catch {
    location.href = '/login_signup_glassdrop/'
  }
}

/**
 * Client-side button that opens the auth-gate popup.
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
