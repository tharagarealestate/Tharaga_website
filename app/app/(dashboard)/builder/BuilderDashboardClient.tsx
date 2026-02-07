'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { UnifiedSinglePageDashboard } from './_components/UnifiedSinglePageDashboard'

export default function BuilderDashboardClient() {
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const pathname = usePathname()
  
  // Initialize activeSection from URL on mount
  const getInitialSection = () => {
    if (typeof window === 'undefined') return 'overview'
    try {
      const urlParams = new URLSearchParams(window.location.search)
      return urlParams.get('section') || 'overview'
    } catch (e) {
      return 'overview'
    }
  }
  
  const [activeSection, setActiveSection] = useState<string>(getInitialSection)

  // Sync activeSection with URL parameter - reacts to all navigation changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const updateSectionFromUrl = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const section = urlParams.get('section') || 'overview'
        setActiveSection((prev) => {
          if (prev !== section) {
            return section
          }
          return prev
        })
      } catch (e) {
        console.warn('[Builder] URL parse error:', e)
      }
    }
    
    // Listen for custom section change events from sidebar
    const handleCustomSectionChange = (event: CustomEvent<{ section: string }>) => {
      if (event.detail?.section) {
        setActiveSection(event.detail.section)
      }
    }
    
    // Initial read (in case URL changed before component mounted)
    updateSectionFromUrl()
    
    // Listen for popstate (browser back/forward)
    const handlePopState = () => {
      updateSectionFromUrl()
    }
    window.addEventListener('popstate', handlePopState)
    window.addEventListener('dashboard-section-change', handleCustomSectionChange as EventListener)
    
    // Poll for URL changes (catches all navigation including window.location.href)
    // Increased interval for better performance (100ms is still very responsive)
    const interval = setInterval(updateSectionFromUrl, 100)
    
    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('dashboard-section-change', handleCustomSectionChange as EventListener)
      clearInterval(interval)
    }
  }, [pathname]) // Only depend on pathname, not activeSection to avoid loops

  // ADVANCED SECURITY: Enhanced auth check with role verification
  useEffect(() => {
    // Only run in browser (prevent SSR errors)
    if (typeof window === 'undefined') return

    async function checkAuthAndRole() {
      try {
        const supabase = getSupabase()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          // User not authenticated - redirect to home and show login modal
          console.log('[Builder] User not authenticated, redirecting to home')
          if (typeof window !== 'undefined') {
            window.location.href = '/'
            // Trigger login modal on homepage
            setTimeout(() => {
              if (window.__thgOpenAuthModal) {
                window.__thgOpenAuthModal({ next: '/builder' })
              } else if (window.showLoginPromptModal) {
                window.showLoginPromptModal()
              }
            }, 100)
          }
          return
        }

        // ADVANCED: Verify user has builder role or is admin owner
        const userEmail = user.email || ''
        const isAdminOwner = userEmail === 'tharagarealestate@gmail.com'
        
        if (!isAdminOwner) {
          // Check if user has builder role
          try {
            const { data: roles, error: rolesError } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', user.id)
              .eq('role', 'builder')

            if (rolesError || !roles || roles.length === 0) {
              // User doesn't have builder role - redirect to home
              console.log('[Builder] User does not have builder role, redirecting')
              if (typeof window !== 'undefined') {
                window.location.href = '/?error=unauthorized&message=You need builder role to access Builder Dashboard'
              }
              return
            }
          } catch (roleError) {
            console.error('[Builder] Role check error:', roleError)
            // On error, redirect to home for security
            if (typeof window !== 'undefined') {
              window.location.href = '/?error=unauthorized&message=Unable to verify builder role'
            }
            return
          }
        }

        // User is authenticated and has builder role (or is admin owner)
        setUser(user)
        setAuthLoading(false)
      } catch (err) {
        console.error('[Builder] Auth check failed:', err)
        // On error, redirect to home for security
        if (typeof window !== 'undefined') {
          window.location.href = '/?error=auth_error'
        }
      }
    }

    checkAuthAndRole()
  }, [])

  // Handle section change
  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    if (typeof window === 'undefined') return

    try {
      const url = new URL(window.location.href)
      url.searchParams.set('section', section)
      window.history.pushState({}, '', url.toString())
    } catch (e) {
      console.warn('[Builder] Section change URL error:', e)
    }
  }

  // Show minimal loading state during auth check
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
      </div>
    )
  }

  // Don't render if no user (will redirect)
  if (!user) {
    return null
  }

  // Render dashboard only for authenticated users
  return (
    <UnifiedSinglePageDashboard
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
    />
  )
}
