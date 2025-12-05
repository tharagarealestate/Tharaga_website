'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { getSupabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// Import all components
import DashboardHeader from '@/components/dashboard/buyer/DashboardHeader'
import PerfectMatches from '@/components/dashboard/buyer/PerfectMatches'
import SavedProperties from '@/components/dashboard/buyer/SavedProperties'
import DocumentVault from '@/components/dashboard/buyer/DocumentVault'
import MarketInsights from '@/components/dashboard/buyer/MarketInsights'

export default function Page() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState('Hello')
  const supabase = getSupabase()
  const router = useRouter()
  
  // Use ref to prevent multiple simultaneous role checks
  const roleCheckInProgress = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch user, check roles, and set greeting - RUN ONCE on mount
  useEffect(() => {
    // Prevent multiple simultaneous checks
    if (roleCheckInProgress.current) {
      return
    }

    const fetchUser = async () => {
      roleCheckInProgress.current = true
      
      try {
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
          console.error('Auth error:', error)
          roleCheckInProgress.current = false
          setLoading(false)
          // Open auth modal instead of redirecting
          const next = window.location.pathname + window.location.search
          if ((window as any).authGate && typeof (window as any).authGate.openLoginModal === 'function') {
            ;(window as any).authGate.openLoginModal({ next })
          } else if (typeof (window as any).__thgOpenAuthModal === 'function') {
            ;(window as any).__thgOpenAuthModal({ next })
          }
          return
        }

        if (!user) {
          roleCheckInProgress.current = false
          setLoading(false)
          // Open auth modal instead of redirecting
          const next = window.location.pathname + window.location.search
          if ((window as any).authGate && typeof (window as any).authGate.openLoginModal === 'function') {
            ;(window as any).authGate.openLoginModal({ next })
          } else if (typeof (window as any).__thgOpenAuthModal === 'function') {
            ;(window as any).__thgOpenAuthModal({ next })
          }
          return
        }

        // Set timeout for role check (3 seconds - faster than before)
        timeoutRef.current = setTimeout(() => {
          if (roleCheckInProgress.current) {
            console.warn('Role check timeout - allowing access (middleware already verified)')
            roleCheckInProgress.current = false
            setUser(user)
            setLoading(false)
            // Set greeting
            const hour = new Date().getHours()
            if (hour < 12) setGreeting('Good morning')
            else if (hour < 17) setGreeting('Good afternoon')
            else setGreeting('Good evening')
          }
        }, 3000)

        try {
          // Try user_roles table first (primary source) with timeout
          const rolesPromise = supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)

          // Race between query and timeout
          const rolesResult = await Promise.race([
            rolesPromise,
            new Promise<{ data: null; error: { message: 'timeout' } }>((resolve) => 
              setTimeout(() => resolve({ data: null, error: { message: 'timeout' } }), 2500)
            )
          ])

          // Clear timeout if query completed
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
          }

          // If still in progress, process result
          if (!roleCheckInProgress.current) return

          const { data: rolesData, error: rolesError } = rolesResult
          let roles: string[] = []
          let hasAccess = false

          if (rolesError || !rolesData || rolesData.length === 0) {
            // Fallback: Check profiles table for backward compatibility
            console.warn('user_roles check failed, checking profiles table:', rolesError)
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

              if (profile?.role === 'buyer' || profile?.role === 'admin') {
                hasAccess = true
                roles = [profile.role]
              } else {
                // No roles found - redirect
                console.warn('User does not have buyer role in user_roles or profiles')
                roleCheckInProgress.current = false
                setLoading(false)
                router.push('/?error=unauthorized&message=You need buyer role to access this page')
                return
              }
            } catch (profileErr) {
              // Profile check failed - allow access (middleware already verified)
              console.warn('Profile check failed, allowing access:', profileErr)
              hasAccess = true
            }
          } else {
            roles = (rolesData || []).map(r => r.role)
            hasAccess = roles.includes('buyer') || roles.includes('admin')
          }

          if (!hasAccess) {
            console.warn('User does not have buyer role. Roles:', roles)
            roleCheckInProgress.current = false
            setLoading(false)
            router.push('/?error=unauthorized&message=You need buyer role to access this page')
            return
          }

          roleCheckInProgress.current = false
          setUser(user)
          setLoading(false)

          // Set time-based greeting
          const hour = new Date().getHours()
          if (hour < 12) setGreeting('Good morning')
          else if (hour < 17) setGreeting('Good afternoon')
          else setGreeting('Good evening')
        } catch (err) {
          // Clear timeout on error
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
          }
          
          if (roleCheckInProgress.current) {
            console.warn('Role check error (allowing access - middleware verified):', err)
            // If error, allow access anyway (middleware already checked)
            roleCheckInProgress.current = false
            setUser(user)
            setLoading(false)
            // Set greeting
            const hour = new Date().getHours()
            if (hour < 12) setGreeting('Good morning')
            else if (hour < 17) setGreeting('Good afternoon')
            else setGreeting('Good evening')
          }
        }
      } catch (err) {
        // Clear timeout on outer error
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
        
        console.error('Error fetching user:', err)
        roleCheckInProgress.current = false
        setLoading(false)
        router.push('/')
      }
    }

    fetchUser()

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      roleCheckInProgress.current = false
    }
  }, []) // Empty deps - run once on mount

  // Get user's first name
  const getFirstName = () => {
    if (!user) return ''
    const fullName = user.user_metadata?.full_name || user.email
    return fullName.split(' ')[0].split('@')[0]
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden">
        {/* Animated Background Elements - EXACT from pricing page */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-96 h-96 bg-gold-500 rounded-full blur-3xl animate-pulse-slow" />
          <div
            className="absolute bottom-20 right-10 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl animate-pulse-slow"
            style={{ animationDelay: '1s' }}
          />
        </div>
        
        <div className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400">Loading your dashboard...</p>
            </div>
          </div>
        </div>
        </div>
      </div>
    )
  }
  
  // Show nothing while redirecting or if no user
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden">
      {/* Animated Background Elements - EXACT from pricing page */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gold-500 rounded-full blur-3xl animate-pulse-slow" />
        <div
          className="absolute bottom-20 right-10 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDelay: '1s' }}
        />
      </div>
      
      <div className="relative z-10">
      {/* Notification Header - Fixed */}
      <DashboardHeader />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 pt-20">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {greeting}, <span className="text-gradient-gold">{getFirstName()}</span>
          </h1>
          <p className="text-gray-400">
            Welcome back to your personalized property dashboard
          </p>
        </motion.div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-8">
            {/* Perfect Matches Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <PerfectMatches />
            </motion.section>

            {/* Saved Properties Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <SavedProperties />
            </motion.section>
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-6">
            {/* Document Vault */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <DocumentVault />
            </motion.section>

            {/* Market Insights */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <MarketInsights />
            </motion.section>
          </div>
        </div>
      </div>
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        .text-gradient-gold {
          background: linear-gradient(135deg, #D4AF37, #F0D78C, #D4AF37);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
