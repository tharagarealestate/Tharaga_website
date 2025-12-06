'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { UnifiedSinglePageDashboard } from './_components/UnifiedSinglePageDashboard'

function DashboardContent() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [authModalReady, setAuthModalReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [supabase, setSupabase] = useState<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeSection, setActiveSection] = useState<string>('overview')
  const checkInProgress = useRef(false)
  const initAttempted = useRef(false)

  // Initialize Supabase client with error handling
  useEffect(() => {
    if (initAttempted.current) return
    initAttempted.current = true

    try {
      const client = getSupabase()
      setSupabase(client)
    } catch (err: any) {
      console.error('Failed to initialize Supabase:', err)
      setError(err?.message || 'Failed to initialize database connection')
      setLoading(false)
    }
  }, [])

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

  // Wait for auth modal system to be ready
  useEffect(() => {
    const checkAuthModalReady = () => {
      if (
        (typeof (window as any).__thgOpenAuthModal === 'function') ||
        ((window as any).authGate && typeof (window as any).authGate.openLoginModal === 'function')
      ) {
        setAuthModalReady(true)
        return true
      }
      return false
    }

    // Check immediately
    if (checkAuthModalReady()) {
      return
    }

    // Poll for auth modal to be ready (max 5 seconds)
    let attempts = 0
    const maxAttempts = 50 // 5 seconds at 100ms intervals
    const interval = setInterval(() => {
      attempts++
      if (checkAuthModalReady() || attempts >= maxAttempts) {
        clearInterval(interval)
        if (attempts >= maxAttempts) {
          console.warn('Auth modal system not ready after 5 seconds')
          setAuthModalReady(true) // Allow to proceed anyway
        }
      }
    }, 100)

    return () => clearInterval(interval)
  }, [])

  // Check authentication and roles
  useEffect(() => {
    if (!authModalReady || !supabase || checkInProgress.current) return
    checkInProgress.current = true

    const checkAuth = async () => {
      try {
        // Check authentication
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

        if (authError || !authUser) {
          console.log('User not authenticated, opening auth modal')
          setLoading(false)
          
          // Wait a bit more for auth modal to be fully ready
          await new Promise(resolve => setTimeout(resolve, 200))
          
          const next = window.location.pathname + window.location.search
          if ((window as any).authGate && typeof (window as any).authGate.openLoginModal === 'function') {
            (window as any).authGate.openLoginModal({ next })
          } else if (typeof (window as any).__thgOpenAuthModal === 'function') {
            (window as any).__thgOpenAuthModal({ next })
          }
          return
        }

        // Check user roles with timeout
        let roleCheckCompleted = false
        const roleCheckTimeout = setTimeout(() => {
          if (!roleCheckCompleted) {
            console.warn('Role check timeout, allowing access')
            roleCheckCompleted = true
            setUser(authUser)
            setLoading(false)
          }
        }, 5000)

        try {
          const { data: rolesData, error: rolesError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', authUser.id)

          clearTimeout(roleCheckTimeout)

          if (roleCheckCompleted) return

          if (rolesError) {
            console.warn('Error fetching roles (allowing access):', rolesError)
            setUser(authUser)
            setLoading(false)
            return
          }

          const roles = (rolesData || []).map((r: any) => r.role)
          const hasAccess = roles.includes('builder') || roles.includes('admin')

          if (!hasAccess) {
            console.warn('User does not have builder role. Roles:', roles)
            setLoading(false)
            router.push('/?error=unauthorized&message=You need builder role to access this page')
            return
          }

          roleCheckCompleted = true
          setUser(authUser)
          setLoading(false)
        } catch (err) {
          clearTimeout(roleCheckTimeout)
          if (!roleCheckCompleted) {
            console.warn('Role check error (allowing access):', err)
            setUser(authUser)
            setLoading(false)
          }
        }
      } catch (err) {
        console.error('Error checking auth:', err)
        setLoading(false)
        // Open auth modal on error
        const next = window.location.pathname + window.location.search
        if ((window as any).authGate && typeof (window as any).authGate.openLoginModal === 'function') {
          (window as any).authGate.openLoginModal({ next })
        } else if (typeof (window as any).__thgOpenAuthModal === 'function') {
          (window as any).__thgOpenAuthModal({ next })
        }
      }
    }

    checkAuth()
  }, [authModalReady, supabase, router])

  // Show error if Supabase failed to initialize
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md mx-auto p-6 bg-red-900/20 border border-red-500 rounded-lg">
          <h2 className="text-xl font-bold text-red-400 mb-4">Configuration Error</h2>
          <p className="text-red-200 mb-4">{error}</p>
          <p className="text-sm text-red-300">
            Please check the browser console for more details. This usually means environment variables are not configured correctly.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

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
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <p className="text-gray-400">Please log in to access the builder dashboard.</p>
        </div>
      </div>
    )
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
