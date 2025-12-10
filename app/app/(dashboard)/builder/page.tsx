'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { getSupabase } from '@/lib/supabase'
import { UnifiedSinglePageDashboard } from './_components/UnifiedSinglePageDashboard'

function DashboardContent() {
  // Initialize with placeholder user to prevent null return
  const [user, setUser] = useState<any>({ id: 'verified', email: 'user@tharaga.co.in' })
  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState<string>('overview')

  // Use ref to prevent multiple simultaneous role checks
  const roleCheckInProgress = useRef(false)

  // Get section from URL params or default to overview - run once on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const urlParams = new URLSearchParams(window.location.search)
    const section = urlParams.get('section') || 'overview'
    setActiveSection(section)
  }, []) // Run once on mount

  // Handle browser back/forward buttons
  useEffect(() => {
    if (typeof window === 'undefined') return

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
    if (typeof window === 'undefined') return
    
    // Prevent multiple simultaneous checks
    if (roleCheckInProgress.current) {
      return
    }

    roleCheckInProgress.current = true
    const supabase = getSupabase() // Get supabase client only on client-side

    // Set timeout to prevent infinite loading - use functional update to avoid stale closure
    const timeoutId = setTimeout(() => {
      setLoading((currentLoading) => {
        if (currentLoading) {
          console.warn('Auth check timeout - rendering anyway (middleware verified)')
          setUser({ id: 'verified', email: 'user@tharaga.co.in' })
          roleCheckInProgress.current = false
          return false
        }
        return currentLoading
      })
    }, 2000) // 2 second timeout

    const fetchUser = async () => {
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
  }, []) // Run once on mount

  // Use ref to store the latest setActiveSection to avoid dependency issues
  const setActiveSectionRef = useRef(setActiveSection)
  setActiveSectionRef.current = setActiveSection

  // Stable handler function that won't change between renders
  const handleSectionChangeRef = useRef((section: string) => {
    setActiveSectionRef.current(section)
    // Update URL without page reload
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('section', section)
      window.history.pushState({}, '', url.toString())
    }
  })

  const handleSectionChange = handleSectionChangeRef.current

  // Always render dashboard immediately - never return null
  return (
    <UnifiedSinglePageDashboard
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
    />
  )
}

export default function BuilderDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
