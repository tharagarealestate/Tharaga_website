'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabase } from '@/lib/supabase'
import {
  Heart,
  Search,
  TrendingUp,
  Calculator,
  MapPin,
  Bell,
  ArrowRight,
  Building2,
  Sparkles,
  Clock,
} from 'lucide-react'
import { Card, MetricCard } from '@/components/ui/Card'

export default function BuyerDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState('Welcome')
  const [savedCount, setSavedCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good Morning')
    else if (hour < 18) setGreeting('Good Afternoon')
    else setGreeting('Good Evening')
  }, [])

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = getSupabase()
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) {
          router.push('/')
          return
        }
        setUser(user)

        // Fetch saved properties count
        const { count } = await supabase
          .from('saved_properties')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
        setSavedCount(count || 0)
      } catch {
        router.push('/')
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-zinc-700 border-t-amber-400" />
      </div>
    )
  }

  if (!user) return null

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Buyer'

  const quickActions = [
    { icon: Search, label: 'Browse Properties', href: '/property-listing', color: 'text-amber-400' },
    { icon: Calculator, label: 'EMI Calculator', href: '/tools/emi', color: 'text-blue-400' },
    { icon: TrendingUp, label: 'ROI Calculator', href: '/tools/roi', color: 'text-emerald-400' },
    { icon: MapPin, label: 'Find Neighborhoods', href: '/tools/neighborhood-finder', color: 'text-purple-400' },
  ]

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Simple header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
            </div>
            <span className="text-sm font-bold text-zinc-100">Tharaga</span>
          </Link>
          <div className="flex items-center gap-3">
            <button className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-400">
              {displayName[0]?.toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-1">
            {greeting}, {displayName}
          </h1>
          <p className="text-zinc-500">Find your perfect home, commission-free</p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Saved Properties"
            value={savedCount}
            icon={<Heart className="w-5 h-5" />}
          />
          <MetricCard
            label="Avg. Savings"
            value="₹3-5L"
            change="vs brokerage"
            changeType="positive"
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <MetricCard
            label="Brokerage"
            value="0%"
            change="Zero commission"
            changeType="positive"
            icon={<Building2 className="w-5 h-5" />}
          />
          <MetricCard
            label="Tools Used"
            value="6"
            change="AI-powered"
            changeType="neutral"
            icon={<Calculator className="w-5 h-5" />}
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-zinc-100 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="group bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-all"
              >
                <div className={`p-2 rounded-lg bg-zinc-800 w-fit mb-3 group-hover:bg-amber-500/10 transition-colors`}>
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <p className="text-sm font-medium text-zinc-200 group-hover:text-amber-400 transition-colors">
                  {action.label}
                </p>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-600 mt-2 group-hover:text-amber-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity & Smart Tools */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Saved Properties */}
          <Card hover padding="md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-zinc-100">Saved Properties</h3>
              <Link
                href="/saved"
                className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
              >
                View all
              </Link>
            </div>
            {savedCount === 0 ? (
              <div className="text-center py-8">
                <Heart className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-500 mb-3">No saved properties yet</p>
                <Link
                  href="/property-listing"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300"
                >
                  Browse Properties <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-zinc-400">
                  You have {savedCount} saved {savedCount === 1 ? 'property' : 'properties'}
                </p>
                <Link
                  href="/saved"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300"
                >
                  View saved properties <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </Card>

          {/* AI Tools */}
          <Card hover padding="md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-zinc-100">Smart Tools</h3>
              <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                AI-Powered
              </span>
            </div>
            <div className="space-y-2">
              {[
                { label: 'EMI Calculator', desc: 'Plan your home loan', href: '/tools/emi', icon: Calculator },
                { label: 'ROI Calculator', desc: 'Check investment returns', href: '/tools/roi', icon: TrendingUp },
                { label: 'Budget Planner', desc: 'Find affordable homes', href: '/tools/budget-planner', icon: Building2 },
              ].map((tool) => (
                <Link
                  key={tool.label}
                  href={tool.href}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800/60 transition-colors group"
                >
                  <div className="p-1.5 bg-zinc-800 rounded-lg group-hover:bg-amber-500/10 transition-colors">
                    <tool.icon className="w-4 h-4 text-zinc-500 group-hover:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200">{tool.label}</p>
                    <p className="text-xs text-zinc-500">{tool.desc}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-amber-400 transition-colors" />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
