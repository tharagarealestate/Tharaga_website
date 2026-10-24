"use client"
import React, { useState, useEffect } from 'react'
import { useEntitlements } from '@/components/ui/FeatureGate'
import { getSupabase } from '@/lib/supabase'
import { openAuthModal } from '@/components/auth/AuthModal'

export function HeaderAuth(){
  const { entitlements } = useEntitlements()
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Check authentication state
  useEffect(() => {
    if (typeof window === 'undefined') return

    async function checkAuth() {
      try {
        const supabase = getSupabase()
        const { data: { user: authUser }, error } = await supabase.auth.getUser()
        
        if (error || !authUser) {
          setUser(null)
          setUserProfile(null)
          setLoading(false)
          return
        }

        setUser(authUser)

        // Fetch user profile to get name
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, email, phone')
          .eq('id', authUser.id)
          .single()

        if (!profileError && profile) {
          setUserProfile(profile)
        } else {
          // Fallback to user metadata or email
          setUserProfile({
            full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
            email: authUser.email || ''
          })
        }

        setLoading(false)
      } catch (err) {
        console.error('Error checking auth:', err)
        setUser(null)
        setUserProfile(null)
        setLoading(false)
      }
    }

    checkAuth()

    // Listen for auth state changes
    const supabase = getSupabase()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        // Fetch profile
        supabase
          .from('profiles')
          .select('full_name, email, phone')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile) {
              setUserProfile(profile)
            } else {
              setUserProfile({
                full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
                email: session.user.email || ''
              })
            }
          })
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setUserProfile(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  function openAuth(){
    openAuthModal()
  }

  function handleLogout() {
    async function logout() {
      try {
        const supabase = getSupabase()
        await supabase.auth.signOut()
        window.location.href = '/'
      } catch (err) {
        console.error('Error logging out:', err)
      }
    }
    logout()
  }

  // Show user name/profile when authenticated
  if (loading) {
    return (
      <div className="flex items-center gap-3">
        {entitlements?.features?.admin_dashboard ? (
          <a href="/admin" className="hover:text-accent hidden md:inline">Admin</a>
        ) : null}
        <div className="rounded-md border border-border px-2 py-1 text-xs text-fg">
          Loading...
        </div>
      </div>
    )
  }

  if (user && userProfile) {
    const displayName = userProfile.full_name || userProfile.email?.split('@')[0] || 'User'
    const initials = displayName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

    return (
      <div className="flex items-center gap-3">
        {entitlements?.features?.admin_dashboard ? (
          <a href="/admin" className="hover:text-accent hidden md:inline">Admin</a>
        ) : null}
        <div className="relative group">
          <button className="rounded-md border border-border px-3 py-1.5 text-xs text-fg hover:text-accent flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold text-[10px]">
              {initials}
            </div>
            <span className="hidden sm:inline">{displayName}</span>
          </button>
          <div className="absolute right-0 top-full mt-2 bg-slate-900 border border-amber-300/25 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[150px]">
            <div className="p-2 border-b border-amber-300/25">
              <div className="text-xs text-slate-300 px-2 py-1">{userProfile.email}</div>
            </div>
            <a
              href="/builder"
              className="block px-3 py-2 text-xs text-fg hover:bg-slate-800 hover:text-accent transition-colors"
            >
              Builder Dashboard
            </a>
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-xs text-fg hover:bg-slate-800 hover:text-accent transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show login button when not authenticated
  return (
    <div className="flex items-center gap-3">
      {entitlements?.features?.admin_dashboard ? (
        <a href="/admin" className="hover:text-accent hidden md:inline">Admin</a>
      ) : null}
      <button onClick={openAuth} className="rounded-md border border-border px-2 py-1 text-xs text-fg hover:text-accent">
        Sign in
      </button>
    </div>
  )
}
