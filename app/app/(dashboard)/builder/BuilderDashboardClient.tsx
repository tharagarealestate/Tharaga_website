'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { UnifiedSinglePageDashboard } from './_components/UnifiedSinglePageDashboard'

export default function BuilderDashboardClient() {
  const [user, setUser] = useState<any>({ id: 'verified', email: 'builder@tharaga.co.in' })
  const pathname = usePathname()
  const [activeSection, setActiveSection] = useState<string>('overview')

  // Sync activeSection with URL parameter - reacts to all navigation changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const updateSectionFromUrl = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const section = urlParams.get('section') || 'overview'
        if (section !== activeSection) {
          setActiveSection(section)
        }
      } catch (e) {
        console.warn('[Builder] URL parse error:', e)
      }
    }
    
    // Initial read
    updateSectionFromUrl()
    
    // Listen for navigation events (Next.js router navigation)
    const handleRouteChange = () => {
      // Small delay to ensure URL is updated
      setTimeout(updateSectionFromUrl, 0)
    }
    
    // Listen for popstate (browser back/forward)
    window.addEventListener('popstate', handleRouteChange)
    
    // Poll for URL changes (fallback for Next.js navigation)
    const interval = setInterval(updateSectionFromUrl, 100)
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange)
      clearInterval(interval)
    }
  }, [activeSection, pathname])

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
