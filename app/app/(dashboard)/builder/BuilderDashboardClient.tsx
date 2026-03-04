'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useBuilderAuth } from './_components/BuilderAuthProvider'
import { UnifiedSinglePageDashboard } from './_components/UnifiedSinglePageDashboard'

/**
 * BuilderDashboardClient — uses BuilderAuthProvider context (set in layout.tsx).
 * NO duplicate auth check here — BuilderAuthProvider handles auth for ALL children.
 * This eliminates the race condition / infinite spinner caused by a second
 * standalone supabase.auth.getUser() call that could hang independently.
 */
function BuilderDashboardInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Consume auth from BuilderAuthProvider (already wraps us via layout.tsx)
  const { isAuthenticated, isLoading: authLoading } = useBuilderAuth()

  // Derive activeSection from URL search params
  const sectionFromUrl = searchParams.get('section') || 'overview'
  const [activeSection, setActiveSection] = useState<string>(sectionFromUrl)

  // Sync when URL search params change (Next.js handles this reactively)
  useEffect(() => {
    setActiveSection(sectionFromUrl)
  }, [sectionFromUrl])

  // Listen for custom section change events from sidebar
  useEffect(() => {
    const handleCustomSectionChange = (event: CustomEvent<{ section: string }>) => {
      if (event.detail?.section) {
        setActiveSection(event.detail.section)
      }
    }

    window.addEventListener('dashboard-section-change', handleCustomSectionChange as EventListener)
    return () => {
      window.removeEventListener('dashboard-section-change', handleCustomSectionChange as EventListener)
    }
  }, [])

  // Redirect if not authenticated after auth resolves
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/?login=true')
    }
  }, [authLoading, isAuthenticated, router])

  // Handle section change — use Next.js router
  const handleSectionChange = useCallback((section: string) => {
    setActiveSection(section)
    router.push(`/builder?section=${section}`, { scroll: false })
  }, [router])

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-zinc-700 border-t-amber-400" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <UnifiedSinglePageDashboard
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
    />
  )
}

// Wrap in Suspense because useSearchParams needs it
export default function BuilderDashboardClient() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-zinc-700 border-t-amber-400" />
      </div>
    }>
      <BuilderDashboardInner />
    </Suspense>
  )
}
