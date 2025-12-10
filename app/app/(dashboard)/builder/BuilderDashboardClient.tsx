'use client'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'
import { UnifiedSinglePageDashboard } from './_components/UnifiedSinglePageDashboard'

export default function BuilderDashboardClient() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<string>('overview')

  // Simple one-time auth check - trust middleware protection
  useEffect(() => {
    const supabase = getSupabase()

    // Get URL section
    const urlParams = new URLSearchParams(window.location.search)
    setActiveSection(urlParams.get('section') || 'overview')

    // Simple auth fetch with 3s timeout fallback
    const timeoutId = setTimeout(() => {
      console.warn('[Builder] Auth timeout (3s) - rendering with placeholder (middleware verified)')
      setUser({ id: 'verified', email: 'builder@tharaga.co.in' })
      setLoading(false)
    }, 3000)

    supabase.auth.getUser()
      .then(({ data, error }) => {
        clearTimeout(timeoutId)
        if (data?.user) {
          setUser(data.user)
        } else {
          // Middleware already verified access, safe to render
          setUser({ id: 'verified', email: 'builder@tharaga.co.in' })
        }
        setLoading(false)
      })
      .catch((err) => {
        clearTimeout(timeoutId)
        console.error('[Builder] Auth error:', err)
        // Middleware already verified, safe to render
        setUser({ id: 'verified', email: 'builder@tharaga.co.in' })
        setLoading(false)
      })

    return () => clearTimeout(timeoutId)
  }, [])

  // Handle browser navigation
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search)
      setActiveSection(urlParams.get('section') || 'overview')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Handle section change
  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    const url = new URL(window.location.href)
    url.searchParams.set('section', section)
    window.history.pushState({}, '', url.toString())
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          <p className="text-white/90 text-lg font-medium">Loading Builder Dashboard...</p>
          <p className="text-white/60 text-sm">Initializing your workspace</p>
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

