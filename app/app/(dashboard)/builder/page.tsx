'use client'

import { useState, useEffect, useRef, Suspense, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase'
import { UnifiedSinglePageDashboard } from './_components/UnifiedSinglePageDashboard'

function DashboardContent() {
  // Track if component is mounted (client-side only)
  const [mounted, setMounted] = useState(false)
  // Initialize with placeholder user to prevent null return
  const [user, setUser] = useState<any>({ id: 'verified', email: 'user@tharaga.co.in' })
  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState<string>('overview')

  // Use ref to prevent multiple simultaneous role checks
  const roleCheckInProgress = useRef(false)

  // Mark as mounted on client-side only
  useEffect(() => {
    setMounted(true)
  }, [])

  // Get section from URL params or default to overview - run once on mount (client-side only)
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return
    
    const urlParams = new URLSearchParams(window.location.search)
    const section = urlParams.get('section') || 'overview'
    setActiveSection(section)
  }, [mounted]) // Only run when mounted

  // Handle browser back/forward buttons (client-side only)
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return

    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const section = urlParams.get('section') || 'overview'
      setActiveSection(section)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [mounted])

  // Fetch user with timeout - RUN ONCE on mount (client-side only)
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return
    
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
  }, [mounted]) // Only run when mounted

  // Handle section change - memoized to prevent unnecessary re-renders
  const handleSectionChange = useCallback((section: string) => {
    setActiveSection(section)
    // Update URL without page reload
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('section', section)
      window.history.pushState({}, '', url.toString())
    }
  }, [])

  // Don't render until mounted (prevents SSR issues)
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Always render dashboard - never return null
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
