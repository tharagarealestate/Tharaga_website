import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Cache client instances to avoid multiple GoTrueClient instances
let clientInstance: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  // Return cached instance if available (client-side only)
  if (typeof window !== 'undefined' && clientInstance) {
    return clientInstance
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  // Prefer anon/public keys. On server, gracefully fall back to service role if anon is missing.
  let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (!key && typeof window === 'undefined') {
    key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || ''
  }
  if (!url || !key) {
    // Log the error for debugging but provide more context
    const missingVars = [];
    if (!url) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!key) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');

    console.error(`[Supabase Init Error] Missing environment variables: ${missingVars.join(', ')}`);
    console.error('Available env vars:', {
      hasNextPublicUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasNextPublicKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasUrl: !!process.env.SUPABASE_URL,
      hasKey: !!process.env.SUPABASE_ANON_KEY,
      isClient: typeof window !== 'undefined',
    });

    throw new Error(`Supabase initialization failed: Missing ${missingVars.join(', ')}`)
  }

  const client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  })

  // Cache client instance on client-side
  if (typeof window !== 'undefined') {
    clientInstance = client
  }

  return client
}
