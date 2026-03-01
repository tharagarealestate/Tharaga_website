'use client'

import { useState, useEffect, type ReactNode } from 'react'

/**
 * ClientOnly wrapper - ensures component only renders on client side
 * Prevents SSR/streaming issues that cause React error #423
 */
export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

