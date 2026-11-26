'use client'

import { useCallback, type ReactNode } from 'react'
import {
  openAuthModal    as _openModal,
  openAuthModalSignup as _openSignup,
} from '@/components/auth/AuthModal'

/**
 * Opens the auth modal on the Sign-in tab.
 * @param next - Optional destination after auth (e.g. '/builder').
 */
export function openAuthModal(next?: string) {
  _openModal(next)
}

/**
 * Opens the auth modal pre-selected on the Sign-up tab.
 * Use for "Start Free Trial" / "Get Started" CTAs targeting new users.
 */
export function openAuthModalSignup(next?: string) {
  _openSignup(next)
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
