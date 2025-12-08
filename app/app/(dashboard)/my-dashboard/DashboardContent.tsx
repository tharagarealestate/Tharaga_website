'use client'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// Import all components
import DashboardHeader from '@/components/dashboard/buyer/DashboardHeader'
import PerfectMatches from '@/components/dashboard/buyer/PerfectMatches'
import SavedProperties from '@/components/dashboard/buyer/SavedProperties'
import DocumentVault from '@/components/dashboard/buyer/DocumentVault'
import MarketInsights from '@/components/dashboard/buyer/MarketInsights'

export default function DashboardContent() {
  const [user, setUser] = useState<any>({ id: 'verified', email: 'user@tharaga.co.in' })
  const [greeting, setGreeting] = useState('Hello')
  const router = useRouter()

  // Set greeting immediately
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 17) setGreeting('Good afternoon')
    else setGreeting('Good evening')
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

  // Get user's first name
  const getFirstName = () => {
    if (!user) return 'User'
    const fullName = user.user_metadata?.full_name || user.email || 'User'
    return fullName.split(' ')[0].split('@')[0]
  }

  // Always render dashboard - never show loading state
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gold-500 rounded-full blur-3xl animate-pulse-slow" />
        <div
          className="absolute bottom-20 right-10 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDelay: '1s' }}
        />
      </div>
      
      <div className="relative z-10">
        <DashboardHeader />

        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {greeting}, <span className="text-gradient-gold">{getFirstName()}</span>
            </h1>
            <p className="text-gray-400">
              Welcome back to your personalized property dashboard
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-8">
              <section>
                <PerfectMatches />
              </section>
              <section>
                <SavedProperties />
              </section>
            </div>

            <div className="space-y-6">
              <section>
                <DocumentVault />
              </section>
              <section>
                <MarketInsights />
              </section>
            </div>
          </div>
        </div>
      </div>

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

