'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { UnifiedSinglePageDashboard } from './_components/UnifiedSinglePageDashboard'

export default function DashboardContent() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
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

  // Fetch user with timeout - middleware already verified access
  useEffect(() => {
    let mounted = true
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const fetchUser = async () => {
      try {
        const supabase = getSupabase()
        
        // Set timeout to prevent infinite loading (3 seconds)
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn('Auth check timeout - rendering dashboard anyway (middleware verified)')
            setUser({ id: 'verified', email: 'user@tharaga.co.in' })
            setLoading(false)
          }
        }, 3000)

        // Try to get user, but don't block rendering
        const authPromise = supabase.auth.getUser()
        const result = await Promise.race([
          authPromise,
          new Promise((resolve) => setTimeout(() => resolve(null), 2500))
        ]) as any

        clearTimeout(timeoutId)

        if (result && result.data && result.data.user) {
          if (mounted) {
            setUser(result.data.user)
            setLoading(false)
          }
        } else {
          if (mounted) {
            setUser({ id: 'verified', email: 'user@tharaga.co.in' })
            setLoading(false)
          }
        }
      } catch (err) {
        clearTimeout(timeoutId)
        console.warn('Auth check error - rendering dashboard anyway:', err)
        if (mounted) {
          setUser({ id: 'verified', email: 'user@tharaga.co.in' })
          setLoading(false)
        }
      }
    }

    fetchUser()

    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading your dashboard...</p>
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

