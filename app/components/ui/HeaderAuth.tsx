"use client"
import React from 'react'
import { useEntitlements } from '@/components/ui/FeatureGate'

export function HeaderAuth(){
  const { entitlements } = useEntitlements()

  function openAuth(){
    try {
      const next = location.pathname + location.search
      const g = (window as any).authGate
      if (g && typeof g.openLoginModal === 'function') {
        g.openLoginModal({ next })
        return
      }
      if (typeof (window as any).__thgOpenAuthModal === 'function') {
        ;(window as any).__thgOpenAuthModal({ next })
        return
      }
      location.href = `/login?next=${encodeURIComponent(next)}`
    } catch {
      location.href = '/login'
    }
  }

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
