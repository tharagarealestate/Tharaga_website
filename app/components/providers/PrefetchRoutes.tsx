"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function PrefetchRoutes() {
  const router = useRouter()
  useEffect(() => {
    try {
      router.prefetch('/builder/leads')
      router.prefetch('/builder/properties')
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}


