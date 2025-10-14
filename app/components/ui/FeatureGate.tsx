"use client"
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type Tier = 'free'|'growth'|'pro'|'enterprise'
export type Entitlements = {
  tier: Tier
  listingLimit: number|null
  monthlyLeadLimit: number|null
  features: Record<string, boolean>
}

export type EntitlementsState = {
  loading: boolean
  tier: Tier
  entitlements: Entitlements | null
}

const EntitlementsCtx = createContext<EntitlementsState>({ loading: true, tier: 'free', entitlements: null })

export function EntitlementsProvider({ children }: { children: React.ReactNode }){
  const [state, setState] = useState<EntitlementsState>({ loading: true, tier: 'free', entitlements: null })

  useEffect(() => {
    let aborted = false
    async function load(){
      try {
        const headers: Record<string,string> = {}
        try {
          const url = new URL(location.href)
          const org = (url.searchParams.get('org')||'').toLowerCase()
          const map: Record<string,string> = {
            free: '00000000-0000-0000-0000-000000000001',
            growth: '00000000-0000-0000-0000-000000000002',
            pro: '00000000-0000-0000-0000-000000000003',
          }
          if (map[org]) headers['x-demo-org'] = map[org]
        } catch {}
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/me/entitlements`, { credentials: 'include', headers })
        if (!res.ok) throw new Error('entitlements')
        const data = await res.json()
        if (!aborted) setState({ loading: false, tier: data.tier, entitlements: data.entitlements })
      } catch {
        if (!aborted) setState({ loading: false, tier: 'free', entitlements: null })
      }
    }
    load()
    return () => { aborted = true }
  }, [])

  const value = useMemo(()=>state,[state])
  return <EntitlementsCtx.Provider value={value}>{children}</EntitlementsCtx.Provider>
}

export function useEntitlements(){ return useContext(EntitlementsCtx) }

export function FeatureGate({ feature, fallback, children }: { feature: string; fallback?: React.ReactNode; children: React.ReactNode }){
  const { loading, entitlements } = useEntitlements()
  if (loading) return null
  const allowed = entitlements?.features?.[feature]
  if (!allowed) return <>{fallback || null}</>
  return <>{children}</>
}
