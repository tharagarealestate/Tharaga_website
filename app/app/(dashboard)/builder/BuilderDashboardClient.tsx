'use client'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'
import { UnifiedSinglePageDashboard } from './_components/UnifiedSinglePageDashboard'

export default function BuilderDashboardClient() {
  const [user, setUser] = useState<any>({ id: 'verified', email: 'builder@tharaga.co.in' })
  const [activeSection, setActiveSection] = useState<string>('overview')

  // Non-blocking auth check - render immediately like admin dashboard
  useEffect(() => {
    // Only run in browser (prevent SSR errors)
    if (typeof window === 'undefined') return

    // Get URL section safely
    try {
      const urlParams = new URLSearchParams(window.location.search)
      setActiveSection(urlParams.get('section') || 'overview')
    } catch (e) {
      console.warn('[Builder] URL parse error:', e)
    }

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

  // Handle browser navigation
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handlePopState = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        setActiveSection(urlParams.get('section') || 'overview')
      } catch (e) {
        console.warn('[Builder] PopState URL parse error:', e)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
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
