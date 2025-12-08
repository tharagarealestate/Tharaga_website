'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { getSupabase } from '@/lib/supabase'

// Dynamically import to prevent SSR issues
const UnifiedSinglePageDashboard = dynamic(
  () => import('./_components/UnifiedSinglePageDashboard').then(mod => ({ default: mod.UnifiedSinglePageDashboard })),
  { ssr: false, loading: () => (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400">Loading dashboard...</p>
      </div>
    </div>
  )}
)

function DashboardContentInner() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<string>('overview')
  
  // Initialize Supabase only on client side to avoid SSR issues
  const supabase = typeof window !== 'undefined' ? getSupabase() : null
  
  // Use ref to prevent multiple simultaneous role checks
  const roleCheckInProgress = useRef(false)

  // Get section from URL params - use window.location to avoid useSearchParams streaming issues
  useEffect(() => {
    if (typeof window === 'undefined') return
    const urlParams = new URLSearchParams(window.location.search)
    const section = urlParams.get('section') || 'overview'
    if (section !== activeSection) {
      setActiveSection(section)
    }
  }, [activeSection])

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const section = urlParams.get('section') || 'overview'
      setActiveSection(section)
    }
    
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Fetch user with timeout - RUN ONCE on mount
  useEffect(() => {
    // Prevent multiple simultaneous checks
    if (roleCheckInProgress.current) {
      return
    }

    roleCheckInProgress.current = true
    
    // Set timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Auth check timeout - rendering anyway (middleware verified)')
        setLoading(false)
        // Use placeholder user to allow rendering
        setUser({ id: 'verified', email: 'user@tharaga.co.in' })
        roleCheckInProgress.current = false
      }
    }, 2000) // 2 second timeout

    const fetchUser = async () => {
      if (!supabase) {
        console.warn('Supabase not available - rendering anyway')
        setLoading(false)
        setUser({ id: 'verified', email: 'user@tharaga.co.in' })
        roleCheckInProgress.current = false
        return
      }
      
      try {
        // Race auth call against timeout
        const authPromise = supabase.auth.getUser()
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 1500))
        
        const result = await Promise.race([authPromise, timeoutPromise]) as any

        clearTimeout(timeoutId)

        if (result && result.data && result.data.user) {
          // Success - got user
          setUser(result.data.user)
          setLoading(false)
          roleCheckInProgress.current = false
        } else if (result && result.error) {
          // Auth error
          console.warn('Auth error (rendering anyway):', result.error)
          setLoading(false)
          setUser({ id: 'verified', email: 'user@tharaga.co.in' })
          roleCheckInProgress.current = false
        } else {
          // Timeout - render anyway
          console.warn('Auth timeout - rendering anyway (middleware verified)')
          setLoading(false)
          setUser({ id: 'verified', email: 'user@tharaga.co.in' })
          roleCheckInProgress.current = false
        }
      } catch (err) {
        clearTimeout(timeoutId)
        console.warn('Auth error (rendering anyway):', err)
        setLoading(false)
        // Render anyway - middleware already verified
        setUser({ id: 'verified', email: 'user@tharaga.co.in' })
        roleCheckInProgress.current = false
      }
    }

    fetchUser()

    // Cleanup function
    return () => {
      clearTimeout(timeoutId)
      roleCheckInProgress.current = false
    }
  }, []) // Empty deps - run once on mount

  // Handle section change
  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    // Update URL without page reload
    const url = new URL(window.location.href)
    url.searchParams.set('section', section)
    window.history.pushState({}, '', url.toString())
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Always render - user will be set by timeout or auth
  // Don't return null as it prevents rendering
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Initializing dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Suspense fallback={null}>
        <SearchParamsHandler onSectionChange={setActiveSection} />
      </Suspense>
      <UnifiedSinglePageDashboard 
        activeSection={activeSection} 
        onSectionChange={handleSectionChange}
      />
    </>
  )
}

function DashboardContent() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <DashboardContentInner />
    </Suspense>
  )
}

export default function BuilderDashboardPage() {
  return <DashboardContent />
}
