'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { UnifiedSinglePageDashboard } from './_components/UnifiedSinglePageDashboard'

function DashboardContent() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = getSupabase()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeSection, setActiveSection] = useState<string>('overview')
  
  // Use ref to prevent multiple simultaneous role checks
  const roleCheckInProgress = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Get section from URL params or default to overview
  useEffect(() => {
    const section = searchParams.get('section') || 'overview'
    if (section !== activeSection) {
      setActiveSection(section)
    }
  }, [searchParams, activeSection])
  
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

  // Fetch user and check roles - RUN ONCE on mount
  useEffect(() => {
    // Prevent multiple simultaneous checks
    if (roleCheckInProgress.current) {
      return
    }

    const fetchUser = async () => {
      roleCheckInProgress.current = true
      
      try {
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
          console.error('Auth error:', error)
          roleCheckInProgress.current = false
          setLoading(false)
          // Open auth modal instead of redirecting
          const next = window.location.pathname + window.location.search
          if ((window as any).authGate && typeof (window as any).authGate.openLoginModal === 'function') {
            ;(window as any).authGate.openLoginModal({ next })
          } else if (typeof (window as any).__thgOpenAuthModal === 'function') {
            ;(window as any).__thgOpenAuthModal({ next })
          }
          return
        }

        if (!user) {
          roleCheckInProgress.current = false
          setLoading(false)
          // Open auth modal instead of redirecting
          const next = window.location.pathname + window.location.search
          if ((window as any).authGate && typeof (window as any).authGate.openLoginModal === 'function') {
            ;(window as any).authGate.openLoginModal({ next })
          } else if (typeof (window as any).__thgOpenAuthModal === 'function') {
            ;(window as any).__thgOpenAuthModal({ next })
          }
          return
        }

        // Set timeout for role check (3 seconds - faster than before)
        timeoutRef.current = setTimeout(() => {
          if (roleCheckInProgress.current) {
            console.warn('Role check timeout - allowing access (middleware already verified)')
            roleCheckInProgress.current = false
            setUser(user)
            setLoading(false)
          }
        }, 3000)

        try {
          // Use API endpoint instead of direct Supabase query (handles RLS properly)
          // API endpoint uses cookies automatically, no need for Authorization header
          // Call API endpoint with timeout protection
          // Use AbortController for proper fetch cancellation
          const controller = new AbortController()
          const fetchTimeout = setTimeout(() => controller.abort(), 2500)

          let rolesResult: any = { error: 'timeout' }
          try {
            const response = await fetch('/api/user/roles', {
              credentials: 'include', // Include cookies for authentication
              headers: {
                'Content-Type': 'application/json',
              },
              signal: controller.signal,
            })
            clearTimeout(fetchTimeout)
            
            if (response.ok) {
              rolesResult = await response.json()
            } else {
              rolesResult = { error: `API error: ${response.status}` }
            }
          } catch (fetchErr: any) {
            clearTimeout(fetchTimeout)
            if (fetchErr.name === 'AbortError') {
              rolesResult = { error: 'timeout' }
            } else {
              rolesResult = { error: fetchErr.message || 'fetch failed' }
            }
          }

          // Clear timeout if API call completed
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
          }

          // If still in progress, process result
          if (!roleCheckInProgress.current) return

          let roles: string[] = []
          let hasAccess = false

          // Process API response - but always allow access since middleware already verified
          // Client-side check is for UX only, middleware is security source of truth
          if (!rolesResult.error && rolesResult.roles && Array.isArray(rolesResult.roles) && rolesResult.roles.length > 0) {
            roles = rolesResult.roles
            const hasBuilderRole = roles.includes('builder') || roles.includes('admin')
            if (!hasBuilderRole) {
              console.warn('API shows no builder role, but middleware verified - allowing access')
            }
          } else {
            console.warn('API roles check failed or empty, but middleware verified - allowing access:', rolesResult.error)
          }

          // Always allow access - middleware already verified security
          // This prevents blocking legitimate users due to API/DB issues
          roleCheckInProgress.current = false
          setUser(user)
          setLoading(false)
        } catch (err) {
          // Clear timeout on error
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
          }
          
          if (roleCheckInProgress.current) {
            console.warn('Role check error (allowing access - middleware verified):', err)
            // If error, allow access anyway (user is authenticated, middleware already verified)
            roleCheckInProgress.current = false
            setUser(user)
            setLoading(false)
          }
        }
      } catch (err) {
        // Clear timeout on outer error
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
        
        console.error('Error fetching user:', err)
        roleCheckInProgress.current = false
        setLoading(false)
        // Open auth modal instead of redirecting
        const next = window.location.pathname + window.location.search
        if ((window as any).authGate && typeof (window as any).authGate.openLoginModal === 'function') {
          ;(window as any).authGate.openLoginModal({ next })
        } else if (typeof (window as any).__thgOpenAuthModal === 'function') {
          ;(window as any).__thgOpenAuthModal({ next })
        }
      }
    }

    fetchUser()

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
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

  if (!user) {
    return null
  }

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
