'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { UnifiedSinglePageDashboard } from './_components/UnifiedSinglePageDashboard'

function DashboardContent() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = getSupabase()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeSection, setActiveSection] = useState<string>('overview')
  
  // Use ref to prevent multiple simultaneous role checks
  const roleCheckInProgress = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  // CRITICAL FIX: Render immediately, do checks in background
  // Trust middleware - it already verified access
  useEffect(() => {
    if (roleCheckInProgress.current) return
    roleCheckInProgress.current = true

    // Immediately allow rendering - middleware already verified
    setLoading(false)
    setUser({ id: 'verified', email: 'user@tharaga.co.in' }) // Placeholder to allow render

    // Get real user in background (non-blocking)
    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (!error && user) {
          setUser(user) // Update with real user
        }
      } catch (err) {
        // Silent fail - already rendered
      }
    }
    
    fetchUser()
    
    return () => {
      roleCheckInProgress.current = false
    }
  }, [])

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
    return null
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
