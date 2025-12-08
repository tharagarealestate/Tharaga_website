'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { UnifiedSinglePageDashboard } from './_components/UnifiedSinglePageDashboard'

export default function DashboardContent() {
  const [user, setUser] = useState<any>({ id: 'verified', email: 'user@tharaga.co.in' })
  const [activeSection, setActiveSection] = useState<string>('overview')

  // Get section from URL params or default to overview
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const section = urlParams.get('section') || 'overview'
      if (section !== activeSection) {
        setActiveSection(section)
      }
    }
  }, [activeSection])
  
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

  // Fetch user in background - non-blocking, middleware already verified access
  useEffect(() => {
    let mounted = true

    const fetchUser = async () => {
      try {
        // Small delay to ensure Supabase is ready
        await new Promise(resolve => setTimeout(resolve, 100))
        
        if (!mounted) return
        
        const supabase = getSupabase()
        
        // Try to get user with short timeout
        const authPromise = supabase.auth.getUser()
        const result = await Promise.race([
          authPromise,
          new Promise((resolve) => setTimeout(() => resolve(null), 1000))
        ]) as any

        if (!mounted) return

        if (result && result.data && result.data.user) {
          setUser(result.data.user)
        }
      } catch (err) {
        // Silently fail - user already set to verified placeholder
        console.warn('Auth check error - using verified placeholder:', err)
      }
    }

    fetchUser()

    return () => {
      mounted = false
    }
  }, [])

  // Handle section change
  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    const url = new URL(window.location.href)
    url.searchParams.set('section', section)
    window.history.pushState({}, '', url.toString())
  }

  // Always render dashboard - never show loading state
  return (
    <UnifiedSinglePageDashboard 
      activeSection={activeSection} 
      onSectionChange={handleSectionChange}
    />
  )
}

