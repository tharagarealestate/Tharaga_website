'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { UnifiedSinglePageDashboard } from './_components/UnifiedSinglePageDashboard'

export default function BuilderDashboardClient() {
  const [user, setUser] = useState<any>({ id: 'verified', email: 'builder@tharaga.co.in' })
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
    
    // Initial read (in case URL changed before component mounted)
    updateSectionFromUrl()
    
    // Listen for popstate (browser back/forward)
    const handlePopState = () => {
      updateSectionFromUrl()
    }
    window.addEventListener('popstate', handlePopState)
    
    // Poll for URL changes (catches all navigation including window.location.href)
    // Reduced interval for faster response
    const interval = setInterval(updateSectionFromUrl, 30)
    
    return () => {
      window.removeEventListener('popstate', handlePopState)
      clearInterval(interval)
    }
  }, [pathname]) // Only depend on pathname, not activeSection to avoid loops

  // Non-blocking auth check - render immediately like admin dashboard
  useEffect(() => {
    // Only run in browser (prevent SSR errors)
    if (typeof window === 'undefined') return

    // Try to initialize Supabase and get user - non-blocking
    try {
      const supabase = getSupabase()
      supabase.auth.getUser()
        .then(({ data, error }: any) => {
          if (data?.user) {
            setUser(data.user)
          }
        })
        .catch((err: any) => {
          console.error('[Builder] Auth error:', err)
        })
    } catch (err) {
      console.error('[Builder] Supabase init failed:', err)
    }
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

  // Render immediately - NO blocking loading state (matches admin dashboard pattern)
  return (
    <UnifiedSinglePageDashboard
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
    />
  )
}
