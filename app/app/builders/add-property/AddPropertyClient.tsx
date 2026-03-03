"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
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
    <main className="min-h-screen bg-zinc-950">
      {/* Top nav bar */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 sm:px-6 py-3 bg-zinc-950/95 backdrop-blur border-b border-zinc-800/60">
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          ← Back to Dashboard
        </button>
        <span className="text-sm text-zinc-500">New Property Listing</span>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AdvancedPropertyUploadForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </motion.div>
      </div>
    </main>
  )
}
