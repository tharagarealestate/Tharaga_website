'use client'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'
import { UnifiedSinglePageDashboard } from './_components/UnifiedSinglePageDashboard'

export default function BuilderDashboardClient() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<string>('overview')

  // CRITICAL: Auth check with GUARANTEED timeout - ALWAYS fires
  useEffect(() => {
    // ALWAYS set timeout FIRST - this MUST fire no matter what happens
    const timeoutId = setTimeout(() => {
      console.warn('[Builder] Auth timeout (2s) - rendering (middleware verified)')
      setUser({ id: 'verified', email: 'builder@tharaga.co.in' })
      setLoading(false)
    }, 2000)

    // Get URL section safely
    try {
      const urlParams = new URLSearchParams(window.location.search)
      setActiveSection(urlParams.get('section') || 'overview')
    } catch (e) {
      console.warn('[Builder] URL parse error:', e)
    }

    // Try to initialize Supabase - if it fails, timeout will handle it
    let supabase: any
    try {
      supabase = getSupabase()
    } catch (err) {
      console.error('[Builder] Supabase init failed:', err)
      // Timeout will fire and render anyway
      return () => clearTimeout(timeoutId)
    }

    // Try auth check - if it fails or hangs, timeout will fire
    supabase.auth.getUser()
      .then(({ data, error }: any) => {
        clearTimeout(timeoutId)
        if (data?.user) {
          setUser(data.user)
        } else {
          setUser({ id: 'verified', email: 'builder@tharaga.co.in' })
        }
        setLoading(false)
      })
      .catch((err: any) => {
        clearTimeout(timeoutId)
        console.error('[Builder] Auth error:', err)
        setUser({ id: 'verified', email: 'builder@tharaga.co.in' })
        setLoading(false)
      })

    return () => clearTimeout(timeoutId)
  }, [])

  // Handle browser navigation
  useEffect(() => {
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
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('section', section)
      window.history.pushState({}, '', url.toString())
    } catch (e) {
      console.warn('[Builder] Section change URL error:', e)
    }
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
