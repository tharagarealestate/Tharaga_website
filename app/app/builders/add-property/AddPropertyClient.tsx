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
    <main className="min-h-screen bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95">
      <div className="mx-auto max-w-5xl px-6 py-8 sm:px-8 sm:py-12">
        {/* Header Section with Billing Design System */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            List your property
          </h1>
        </motion.div>

        {/* Form Container with Billing Design System */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-slate-800/95 glow-border rounded-xl shadow-2xl border border-slate-700/50 p-6 sm:p-8"
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
