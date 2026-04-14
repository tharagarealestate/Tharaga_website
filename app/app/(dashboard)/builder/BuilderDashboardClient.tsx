'use client'

import { useState, useEffect, useCallback, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useBuilderAuth } from './_components/BuilderAuthProvider'

/**
 * BuilderDashboardClient — uses BuilderAuthProvider context (set in layout.tsx).
 *
 * Auth is entirely handled by BuilderAuthProvider in the layout:
 *  - loading  → full-screen spinner (provider renders that, NOT this component)
 *  - unauthed → BuilderAuthGate (provider renders that, NOT this component)
 *  - authed   → this component renders with full dashboard
 *
 * NO duplicate auth check / redirect here. The previous router.push('/?login=true')
 * was redundant AND caused a race-condition redirect in React 18 concurrent mode
 * when onAuthStateChange fired SIGNED_IN mid-flight and briefly flashed
 * isAuthenticated=false before the re-resolve completed.
 */

// Dynamic import — defers the heavy dashboard bundle until after auth resolves.
// This is the primary fix for the "initial load lag": auth check is fast (< 1s),
// then the dashboard JS chunk streams in in the background.
function DashboardLoadError() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 text-center px-6">
        <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <span className="text-red-400 text-lg font-bold">!</span>
        </div>
        <p className="text-zinc-400 text-sm">Dashboard failed to load.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/20 transition-colors"
        >
          Refresh page
        </button>
      </div>
    </div>
  )
}

const UnifiedSinglePageDashboard = dynamic(
  () =>
    import('./_components/UnifiedSinglePageDashboard')
      .then((m) => ({ default: m.UnifiedSinglePageDashboard }))
      .catch((err) => {
        console.error('[Dashboard] Failed to load dashboard chunk:', err)
        return { default: DashboardLoadError }
      }),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-2 border-amber-500/20" />
            <div className="absolute inset-0 rounded-full border-t-2 border-amber-500 animate-spin" />
          </div>
          <p className="text-zinc-500 text-sm animate-pulse">Loading dashboard…</p>
        </div>
      </div>
    ),
  }
)

function BuilderDashboardInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useBuilderAuth()
  const [chunkTimeout, setChunkTimeout] = useState(false)

  // Hard 10s timeout — if the dynamic chunk never resolves (CDN stall, import
  // error, missing export), show the error UI instead of spinning forever.
  useEffect(() => {
    const t = setTimeout(() => setChunkTimeout(true), 10000)
    return () => clearTimeout(t)
  }, [])

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

  // Handle section change — use Next.js router
  const handleSectionChange = useCallback(
    (section: string) => {
      setActiveSection(section)
      router.push(`/builder?section=${section}`, { scroll: false })
    },
    [router]
  )

  // Safety: if somehow mounted while unauthenticated — render nothing.
  if (!isAuthenticated) return null

  // If the dashboard chunk never loaded after 10 seconds, show error UI
  if (chunkTimeout) return <DashboardLoadError />

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
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-2 border-amber-500/20" />
            <div className="absolute inset-0 rounded-full border-t-2 border-amber-500 animate-spin" />
          </div>
        </div>
      }
    >
      <BuilderDashboardInner />
    </Suspense>
  )
}
