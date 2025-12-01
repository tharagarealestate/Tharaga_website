'use client'

import { useState, useEffect, Suspense } from 'react'
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

  // Fetch user and check roles
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
          console.error('Auth error:', error)
          setLoading(false)
          router.push('/')
          return
        }

        if (!user) {
          setLoading(false)
          router.push('/')
          return
        }

        // Check user roles
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)

        if (rolesError) {
          console.error('Error fetching roles:', rolesError)
          setLoading(false)
          router.push('/')
          return
        }

        const roles = (rolesData || []).map(r => r.role)
        const hasAccess = roles.includes('builder') || roles.includes('admin')

        if (!hasAccess) {
          console.warn('User does not have builder role. Roles:', roles)
          setLoading(false)
          router.push('/')
          return
        }

        setUser(user)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching user:', err)
        setLoading(false)
        router.push('/')
      }
    }

    fetchUser()
  }, [supabase, router])

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
