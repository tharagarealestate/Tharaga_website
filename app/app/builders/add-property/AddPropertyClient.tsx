"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdvancedPropertyUploadForm } from '@/components/property/AdvancedPropertyUploadForm'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null
function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    if (!url || !anonKey) {
      throw new Error('Supabase environment variables are not configured')
    }
    supabaseClient = createClient(url, anonKey)
  }
  return supabaseClient
}

export default function AddPropertyPage() {
  const router = useRouter()
  const [tier, setTier] = useState<'starter'|'growth'|'scale'|'trial'>('starter')
  const [limit, setLimit] = useState<number>(1)

  // Load entitlement to display plan info
  useEffect(() => {
    async function loadEntitlement() {
      try {
        const { data: { session } } = await getSupabase().auth.getSession()
        if (!session?.user?.email) return
        
        // Try to get subscription info
        const { data } = await getSupabase()
          .from('org_subscriptions')
          .select('tier,status')
          .eq('email', session.user.email)
          .maybeSingle()
        
        const t = (data?.tier as any) || 'starter'
        setTier(t)
        setLimit(t === 'scale' ? Number.POSITIVE_INFINITY : (t === 'growth' ? 5 : 1))
      } catch(_) { 
        // Ignore errors, use defaults
      }
    }
    loadEntitlement()
  }, [])

  const handleSuccess = (propertyId: string) => {
    // Optionally redirect to property page or show success
    // For now, the AdvancedPropertyUploadForm handles its own success UI
    console.log('Property uploaded successfully:', propertyId)
  }

  const handleCancel = () => {
    router.push('/builder')
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-bold text-fg mb-2">List your property</h1>
      <p className="text-fgMuted mb-2">
        Simple onboarding for builders. Logged in users can save drafts and submit for verification.
      </p>
      <div className="mb-6 text-sm text-fgMuted">
        Your plan: <b className="text-fg">{tier}</b>. Active project limit: {Number.isFinite(limit) ? limit : 'Unlimited'} • <a className="underline" href="/pricing/">See pricing</a>
      </div>

      <AdvancedPropertyUploadForm
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </main>
  )
}
