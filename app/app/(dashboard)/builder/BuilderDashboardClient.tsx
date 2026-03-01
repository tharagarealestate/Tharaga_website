'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { UnifiedSinglePageDashboard } from './_components/UnifiedSinglePageDashboard'

function BuilderDashboardInner() {
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Derive activeSection from URL search params — reactive, no polling needed
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

  // Auth check with role verification
  useEffect(() => {
    if (typeof window === 'undefined') return

    async function checkAuthAndRole() {
      try {
        const supabase = getSupabase()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          window.location.href = '/'
          return
        }

        const userEmail = user.email || ''
        const isAdminOwner = userEmail === 'tharagarealestate@gmail.com'

        if (!isAdminOwner) {
          const { data: roles, error: rolesError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'builder')

          if (rolesError || !roles || roles.length === 0) {
            window.location.href = '/?error=unauthorized'
            return
          }
        }

        setUser(user)
        setAuthLoading(false)
      } catch (err) {
        console.error('[Builder] Auth check failed:', err)
        window.location.href = '/?error=auth_error'
      }
    }

    checkAuthAndRole()
  }, [])

  // Handle section change — use Next.js router instead of window.history
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

  if (!user) return null

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
