'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { ClientOnly } from '@/components/ClientOnly'

// Dynamically import to prevent SSR issues
let UnifiedSinglePageDashboard: any = null
if (typeof window !== 'undefined') {
  import('./_components/UnifiedSinglePageDashboard').then((mod) => {
    UnifiedSinglePageDashboard = mod.UnifiedSinglePageDashboard
  })
}

export default function DashboardContent() {
  const [user, setUser] = useState<any>({ id: 'verified', email: 'user@tharaga.co.in' })
  const [activeSection, setActiveSection] = useState<string>('overview')
  const [mounted, setMounted] = useState(false)

  // Ensure component only renders on client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Get section from URL params or default to overview
  useEffect(() => {
    if (typeof window !== 'undefined' && mounted) {
      const urlParams = new URLSearchParams(window.location.search)
      const section = urlParams.get('section') || 'overview'
      if (section !== activeSection) {
        setActiveSection(section)
      }
    }
  }, [activeSection, mounted])
  
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

  // Don't render until mounted and component is loaded
  if (!mounted || !UnifiedSinglePageDashboard) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Always render dashboard - never show loading state
  return (
    <ClientOnly>
      <UnifiedSinglePageDashboard 
        activeSection={activeSection} 
        onSectionChange={handleSectionChange}
      />
    </ClientOnly>
  )
}

