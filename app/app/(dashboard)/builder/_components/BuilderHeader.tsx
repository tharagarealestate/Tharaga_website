"use client"

import { useEffect, useState } from "react"
import { Search } from "lucide-react"

interface SubscriptionData {
  tier: "trial" | "pro" | "enterprise" | string
  days_remaining?: number
  builder_name?: string | null
}

export function BuilderHeader() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/builder/subscription", {
          next: { revalidate: 0 } as any,
        })
        if (!res.ok) throw new Error("Failed")
        const data = (await res.json()) as SubscriptionData
        if (!cancelled) setSubscription(data)
      } catch {
        if (!cancelled) {
          setSubscription({ tier: "trial", days_remaining: 14 })
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  // Simple Cmd/Ctrl+K focus for the search input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        const el = document.getElementById("builder-command-input")
        if (el && "focus" in el) {
          ;(el as HTMLInputElement).focus()
        }
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  return (
    <header className="h-[60px] border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center px-4 lg:px-8 justify-between">
      {/* Left: Logo */}
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-xl bg-primary-900 flex items-center justify-center shadow-sm">
          <span className="text-lg font-bold text-gold-400">T</span>
        </div>
        <div className="hidden sm:flex flex-col leading-tight">
          <span className="font-semibold text-slate-900 text-sm">Tharaga</span>
          <span className="text-xs text-slate-500">Builder Portal</span>
        </div>
      </div>

      {/* Center: Command/Search */}
      <div className="flex-1 max-w-xl mx-4">
        <div className="group flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            id="builder-command-input"
            className="flex-1 bg-transparent outline-none placeholder:text-slate-400 text-slate-800"
            placeholder="Search workflows or properties (Cmd+K)"
          />
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-400">
            <span className="font-mono">⌘</span>
            <span>K</span>
          </span>
        </div>
      </div>

      {/* Right: Trial + Profile placeholder */}
      <div className="flex items-center gap-4">
        {subscription && (
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-medium text-amber-800">
            <span>Trial</span>
            <span className="h-1 w-1 rounded-full bg-amber-500" />
            <span>{subscription.days_remaining ?? 0} days left</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex flex-col items-end leading-tight">
            <span className="text-xs text-slate-500">Builder</span>
            <span className="text-sm font-medium text-slate-900">
              {subscription?.builder_name || 'My Account'}
            </span>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary-900 to-primary-600 text-white flex items-center justify-center text-sm font-semibold shadow-sm">
            {(subscription?.builder_name || 'B').charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  )
}


