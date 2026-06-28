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
function DashboardLoadError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 text-center px-6 max-w-sm">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <span className="text-red-400 text-xl font-bold">!</span>
        </div>
        <div>
          <p className="text-zinc-200 text-sm font-semibold mb-1">Dashboard took too long to load</p>
          <p className="text-zinc-500 text-xs">This usually happens on slow connections or first visits. Your data is safe.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onRetry ?? (() => window.location.reload())}
            className="px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/20 transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-700 transition-colors"
          >
            Hard refresh
          </button>
        </div>
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
  const [retryCount,   setRetryCount]   = useState(0)

  // Safety timeout — 45s gives Netlify cold starts time to stream the chunk.
  // The dynamic import .catch() already handles import errors; this only fires
  // when the import silently hangs (very slow CDN / offline scenario).
  // Cleared and reset on retry so each attempt gets a fresh 45s window.
  useEffect(() => {
    setChunkTimeout(false)
    const t = setTimeout(() => setChunkTimeout(true), 45000)
    return () => clearTimeout(t)
  }, [retryCount])

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

  // If the dashboard chunk never loaded after 45 seconds, show error UI with retry
  if (chunkTimeout) return <DashboardLoadError onRetry={() => setRetryCount(c => c + 1)} />

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
