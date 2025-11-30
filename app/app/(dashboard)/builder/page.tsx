'use client'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { UnifiedDashboard } from './_components/UnifiedDashboard'

export default function BuilderOverviewPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = getSupabase()
  const router = useRouter()

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

        // Check user roles - builder dashboard requires 'builder' or 'admin' role
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

  return <UnifiedDashboard />
}
