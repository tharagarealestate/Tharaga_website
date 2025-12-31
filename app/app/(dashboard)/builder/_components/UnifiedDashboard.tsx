"use client"

import { useMemo, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Users, Building2, Settings,
  TrendingUp, DollarSign, BarChart3,
  ArrowUpRight, ArrowDownRight,
  MapPin, Eye, MessageCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSupabase } from '@/lib/supabase'
import { useDemoMode, DEMO_DATA } from './DemoDataProvider'

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  property_interest?: string
  score?: number
  category?: string
  created_at: string
}

interface Property {
  id: string
  title: string
  locality?: string
  city?: string
  priceINR?: number
  status?: string
  views?: number
  inquiries?: number
}

// Fetch functions
async function fetchLeads() {
  const res = await fetch('/api/builder/leads?limit=10', { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch leads')
  const data = await res.json()
  return (data?.data?.leads || []) as Lead[]
}

async function fetchProperties() {
  const res = await fetch('/api/builder/properties', { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch properties')
  const data = await res.json()
  return (data?.items || []) as Property[]
}

async function fetchStats() {
  const res = await fetch('/api/builder/stats/realtime', { cache: 'no-store' })
  if (!res.ok) return { total: 0, hot: 0, warm: 0, conversionRate: 0 }
  const data = await res.json()
  return {
    total: data.totalLeads || 0,
    hot: data.hotLeads || 0,
    warm: data.warmLeads || 0,
    conversionRate: data.conversionRate || 0,
    totalProperties: data.totalProperties || 0,
    activeProperties: data.activeProperties || 0,
    totalViews: data.totalViews || 0,
    totalInquiries: data.totalInquiries || 0,
  }
}

async function fetchRevenue() {
  try {
    const res = await fetch('/api/builder/revenue', { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    return data.success ? data.data : null
  } catch (error) {
    console.error('[UnifiedDashboard] Revenue fetch error:', error)
    return null
  }
}

interface UnifiedDashboardProps {
  onNavigate?: (section: string) => void
}

export function UnifiedDashboard({ onNavigate }: UnifiedDashboardProps) {
  const router = useRouter()
  const { isDemoMode, builderId: demoBuilderId, userId: demoUserId } = useDemoMode()
  const [builderId, setBuilderId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [previousStats, setPreviousStats] = useState({ total: 0, hot: 0, warm: 0, conversionRate: 0 })

  // Get user and builder ID - non-blocking (skip if demo mode)
  useEffect(() => {
    if (isDemoMode) {
      setBuilderId(demoBuilderId)
      setUserId(demoUserId)
      return
    }
    
    let mounted = true
    async function initAuth() {
      try {
        const supabase = getSupabase()
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (!mounted) return
        
        if (userError || !user) {
          console.log('[UnifiedDashboard] User not authenticated (non-blocking)')
          return
        }
        
        setUserId(user.id)
        // Get builder profile - non-blocking
        const { data, error: profileError } = await supabase
          .from('builder_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single()
        
        if (!mounted) return
        
        if (profileError) {
          console.warn('[UnifiedDashboard] Builder profile not found (non-blocking):', profileError)
          return
        }
        
        if (data) setBuilderId(data.id)
      } catch (err) {
        console.error('[UnifiedDashboard] Auth init error (non-blocking):', err)
      }
    }
    
    initAuth()
    return () => { mounted = false }
  }, [isDemoMode, demoBuilderId, demoUserId])

  // Fetch data with real-time updates - non-blocking with error handling
  const { data: leads = [], isLoading: leadsLoading, error: leadsError } = useQuery({
    queryKey: ['unified-leads', isDemoMode],
    queryFn: async () => {
      if (isDemoMode) {
        return DEMO_DATA.leads.leads
      }
      return fetchLeads()
    },
    refetchInterval: isDemoMode ? false : 15000,
    staleTime: isDemoMode ? Infinity : 0,
    retry: isDemoMode ? 0 : 1,
    retryDelay: 1000,
    onError: (err) => {
      console.warn('[UnifiedDashboard] Leads fetch error (non-blocking):', err)
    }
  })

  const { data: properties = [], isLoading: propertiesLoading, error: propertiesError } = useQuery({
    queryKey: ['unified-properties'],
    queryFn: fetchProperties,
    refetchInterval: 30000,
    retry: 1,
    retryDelay: 1000,
    onError: (err) => {
      console.warn('[UnifiedDashboard] Properties fetch error (non-blocking):', err)
    }
  })

  const { data: stats = { total: 0, hot: 0, warm: 0, conversionRate: 0 }, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['unified-stats'],
    queryFn: fetchStats,
    refetchInterval: 5000, // Real-time updates every 5 seconds
    retry: 1,
    retryDelay: 1000,
    onError: (err) => {
      console.warn('[UnifiedDashboard] Stats fetch error (non-blocking):', err)
    }
  })

  // Fetch revenue data - real-time
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['unified-revenue'],
    queryFn: fetchRevenue,
    refetchInterval: 30000, // Update every 30 seconds
    retry: 1,
    retryDelay: 1000,
    onError: (err) => {
      console.warn('[UnifiedDashboard] Revenue fetch error (non-blocking):', err)
    }
  })

  // Real-time leads subscription - using Supabase realtime directly for better performance
  const [realtimeLeads, setRealtimeLeads] = useState<any[]>([])
  const [realtimeProperties, setRealtimeProperties] = useState<any[]>([])
  
  useEffect(() => {
    if (!builderId) return

    let mounted = true
    try {
      const supabase = getSupabase()
      
      // Subscribe to leads changes - non-blocking
      const leadsChannel = supabase
        .channel(`builder-leads-${builderId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'leads',
            filter: `builder_id=eq.${builderId}`,
          },
          (payload: any) => {
            if (!mounted) return
            if (payload.eventType === 'INSERT') {
              setRealtimeLeads((prev) => [payload.new, ...prev])
            } else if (payload.eventType === 'UPDATE') {
              setRealtimeLeads((prev) =>
                prev.map((l: any) => (l.id === payload.new.id ? payload.new : l))
              )
            } else if (payload.eventType === 'DELETE') {
              setRealtimeLeads((prev) => prev.filter((l: any) => l.id !== payload.old.id))
            }
          }
        )
        .subscribe()

      // Subscribe to properties changes - non-blocking
      const propertiesChannel = supabase
        .channel(`builder-properties-${builderId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'properties',
            filter: `builder_id=eq.${builderId}`,
          },
          (payload: any) => {
            if (!mounted) return
            if (payload.eventType === 'INSERT') {
              setRealtimeProperties((prev) => [payload.new, ...prev])
            } else if (payload.eventType === 'UPDATE') {
              setRealtimeProperties((prev) =>
                prev.map((p: any) => (p.id === payload.new.id ? payload.new : p))
              )
            } else if (payload.eventType === 'DELETE') {
              setRealtimeProperties((prev) => prev.filter((p: any) => p.id !== payload.old.id))
            }
          }
        )
        .subscribe()

      return () => {
        mounted = false
        try {
          supabase.removeChannel(leadsChannel)
          supabase.removeChannel(propertiesChannel)
        } catch (err) {
          console.warn('[UnifiedDashboard] Error cleaning up channels:', err)
        }
      }
    } catch (err) {
      console.error('[UnifiedDashboard] Realtime subscription error (non-blocking):', err)
      return () => { mounted = false }
    }
  }, [builderId])

  // Merge real-time data with fetched data
  const mergedLeads = useMemo(() => {
    // Real-time updates are handled by state, so we merge with initial fetch
    if (realtimeLeads.length > 0) {
      const leadMap = new Map(leads.map((l: any) => [l.id, l]))
      realtimeLeads.forEach((lead: any) => {
        leadMap.set(lead.id, lead)
      })
      return Array.from(leadMap.values())
    }
    return leads
  }, [leads, realtimeLeads])

  const mergedProperties = useMemo(() => {
    // Real-time updates are handled by state, so we merge with initial fetch
    if (realtimeProperties.length > 0) {
      const propertyMap = new Map(properties.map((p: any) => [p.id, p]))
      realtimeProperties.forEach((property: any) => {
        propertyMap.set(property.id, property)
      })
      return Array.from(propertyMap.values())
    }
    return properties
  }, [properties, realtimeProperties])

  // Update previous stats when stats change (separate from metrics calculation to prevent infinite loop)
  useEffect(() => {
    const totalProperties = stats.totalProperties ?? mergedProperties.length
    const totalViews = stats.totalViews ?? mergedProperties.reduce((sum: number, p: any) => sum + (p.views || p.view_count || 0), 0)
    const totalInquiries = stats.totalInquiries ?? mergedProperties.reduce((sum: number, p: any) => sum + (p.inquiries || p.inquiry_count || 0), 0)
    const conversionRate = stats.conversionRate ?? (totalViews > 0 ? parseFloat(((totalInquiries / totalViews) * 100).toFixed(1)) : 0)
    
    setPreviousStats({
      total: stats.total,
      hot: stats.hot,
      warm: stats.warm,
      conversionRate
    })
  }, [stats.total, stats.hot, stats.warm, stats.conversionRate, stats.totalProperties, stats.totalViews, stats.totalInquiries, mergedProperties])

  // Calculate metrics with real-time updates and trend calculation
  const metrics = useMemo(() => {
    // Use stats from API if available, otherwise calculate from merged data
    const totalProperties = stats.totalProperties ?? mergedProperties.length
    const activeProperties = stats.activeProperties ?? mergedProperties.filter((p: any) => p.status === 'active' || p.listing_status === 'active').length
    const totalViews = stats.totalViews ?? mergedProperties.reduce((sum: number, p: any) => sum + (p.views || p.view_count || 0), 0)
    const totalInquiries = stats.totalInquiries ?? mergedProperties.reduce((sum: number, p: any) => sum + (p.inquiries || p.inquiry_count || 0), 0)
    const conversionRate = stats.conversionRate ?? (totalViews > 0 ? parseFloat(((totalInquiries / totalViews) * 100).toFixed(1)) : 0)
    
    // Calculate trends (compare with previous stats)
    const leadTrend = previousStats.total > 0 
      ? ((stats.total - previousStats.total) / previousStats.total) * 100 
      : 0
    
    const conversionTrend = previousStats.conversionRate > 0
      ? conversionRate - previousStats.conversionRate
      : 0
    
    return {
      totalLeads: stats.total,
      hotLeads: stats.hot,
      warmLeads: stats.warm,
      totalProperties,
      activeProperties,
      totalViews,
      totalInquiries,
      conversionRate: conversionRate.toFixed(1),
      leadTrend: Math.abs(leadTrend).toFixed(1),
      conversionTrend: Math.abs(conversionTrend).toFixed(1),
    }
  }, [mergedLeads, mergedProperties, stats, previousStats])

  return (
    <div className="space-y-6">
      {/* Header - Design System Typography */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Welcome back! 👋</h1>
        <p className="text-slate-300 text-base sm:text-lg">Here's what's happening with your properties today</p>
      </motion.div>

      {/* Stats Grid - Admin Design System with Advanced Animations */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { icon: Users, label: "Total Leads", value: metrics.totalLeads, subtitle: `${metrics.hotLeads} hot • ${metrics.warmLeads} warm`, trend: { value: parseFloat(metrics.leadTrend), positive: parseFloat(metrics.leadTrend) >= 0 }, loading: statsLoading },
          { icon: Building2, label: "Properties", value: metrics.totalProperties, subtitle: `${metrics.activeProperties} active`, loading: propertiesLoading },
          { icon: TrendingUp, label: "Conversion Rate", value: `${metrics.conversionRate}%`, trend: { value: parseFloat(metrics.conversionTrend), positive: parseFloat(metrics.conversionTrend) >= 0 }, loading: statsLoading },
          { icon: DollarSign, label: "This Month", value: revenueData?.monthlyRevenue ? revenueData.monthlyRevenue >= 10000000 ? `₹${(revenueData.monthlyRevenue / 10000000).toFixed(2)} Cr` : revenueData.monthlyRevenue >= 100000 ? `₹${(revenueData.monthlyRevenue / 100000).toFixed(2)} L` : `₹${(revenueData.monthlyRevenue / 1000).toFixed(1)}K` : '₹0', subtitle: "Revenue", loading: revenueLoading },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
          >
            <StatCard {...stat} />
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads Card - Design System */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl"
        >
          <div className="bg-gradient-to-r from-amber-500/20 via-amber-600/20 to-amber-500/20 border-b glow-border border-b-amber-300/25 p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Recent Leads</h2>
                  <p className="text-sm text-slate-300">{metrics.hotLeads} hot • {metrics.warmLeads} warm</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/builder/leads')}
                className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 glow-border text-slate-900 font-semibold rounded-lg transition-all duration-300 text-sm shadow-lg hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-1"
              >
                View All
              </motion.button>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {leadsLoading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-300 mx-auto mb-4"></div>
                  <p className="text-slate-400">Loading leads...</p>
                </div>
              </div>
            ) : mergedLeads.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="p-4 bg-slate-700/30 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Users className="h-10 w-10 text-slate-500" />
                </div>
                <h4 className="text-xl font-semibold text-white mb-2">No leads yet</h4>
                <p className="text-slate-400 mb-6">Share your property listings to start receiving inquiries</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mergedLeads.slice(0, 6).map((lead: any, index: number) => (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <LeadCard lead={lead} onNavigate={onNavigate} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Properties Card - Design System */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl"
        >
          <div className="bg-gradient-to-r from-amber-500/20 via-amber-600/20 to-amber-500/20 border-b glow-border border-b-amber-300/25 p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">My Properties</h2>
                  <p className="text-sm text-slate-300">{metrics.activeProperties} active listings</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate?.('properties')}
                className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 glow-border text-slate-900 font-semibold rounded-lg transition-all duration-300 text-sm shadow-lg hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-1"
              >
                View All
              </motion.button>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {propertiesLoading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-300 mx-auto mb-4"></div>
                  <p className="text-slate-400">Loading properties...</p>
                </div>
              </div>
            ) : mergedProperties.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="p-4 bg-slate-700/30 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Building2 className="h-10 w-10 text-slate-500" />
                </div>
                <h4 className="text-xl font-semibold text-white mb-2">No properties yet</h4>
                <p className="text-slate-400 mb-6">Get started by adding your first property</p>
                <button
                  onClick={() => onNavigate?.('properties')}
                  className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 glow-border text-slate-900 font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-1 inline-flex items-center gap-2"
                >
                  Add your first property
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {mergedProperties.slice(0, 6).map((property: any, index: number) => (
                  <motion.div
                    key={property.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <PropertyCard property={property} onNavigate={onNavigate} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions Card - Design System */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Quick Actions</h3>
            <p className="text-sm text-slate-300">Access your most used features</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => router.push('/builder/leads')}
              className="px-6 py-3 glow-border bg-slate-800/95 text-slate-200 hover:bg-slate-700/50 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 hover:-translate-y-0.5"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Manage </span>Leads
            </button>
            <button
              onClick={() => onNavigate?.('properties')}
              className="px-6 py-3 glow-border bg-slate-800/95 text-slate-200 hover:bg-slate-700/50 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 hover:-translate-y-0.5"
            >
              <Building2 className="w-4 h-4" />
              Properties
            </button>
            <button
              onClick={() => router.push('/builder/analytics')}
              className="px-6 py-3 glow-border bg-slate-800/95 text-slate-200 hover:bg-slate-700/50 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 hover:-translate-y-0.5"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
            <button
              onClick={() => onNavigate?.('behavior-analytics')}
              className="px-6 py-3 glow-border bg-slate-800/95 text-slate-200 hover:bg-slate-700/50 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 hover:-translate-y-0.5"
            >
              <Settings className="w-4 h-4" />
              Behavior Analytics
            </button>
          </div>
        </div>
        </div>
      </motion.div>
    </div>
  )
}

// Stat Card - Design System Statistics Card Pattern
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subtitle, 
  trend, 
  loading 
}: { 
  icon: any
  label: string
  value: string | number
  subtitle?: string
  trend?: { value: number; positive: boolean }
  loading: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="relative p-6 bg-slate-800/95 glow-border rounded-lg border border-slate-700/50 overflow-hidden group cursor-pointer"
    >
      {/* Hover Glow Effect */}
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent pointer-events-none"
      />
      
      {/* Icon with Animation */}
      <motion.div
        whileHover={{ rotate: 5, scale: 1.1 }}
        className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity"
      >
        <Icon className="w-16 h-16 text-amber-300" />
      </motion.div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <Icon className="h-8 w-8 text-amber-300" />
          {trend && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                trend.positive ? "text-emerald-300" : "text-red-300"
              )}
            >
              {trend.positive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            </motion.div>
          )}
        </div>
        <h3 className="text-xs text-slate-400 mb-2 uppercase tracking-wide">{label}</h3>
        {loading ? (
          <div className="flex items-center justify-center h-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-300"></div>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-1"
            >
              <p className="text-2xl font-bold text-white mb-1 tabular-nums">{value}</p>
              {subtitle && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="text-sm text-slate-400"
                >
                  {subtitle}
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  )
}

// Lead Card - Design System Card Pattern
function LeadCard({ lead, onNavigate }: { lead: Lead; onNavigate?: (section: string) => void }) {
  const score = lead.score || 0
  const isHot = score >= 70
  const isWarm = score >= 40 && score < 70

  return (
    <motion.button
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        router.push('/builder/leads')
        // Optional: Open lead detail after navigation
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('open-lead-detail', { detail: { leadId: lead.id } }))
        }, 100)
      }}
      className="w-full p-4 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/30 hover:glow-border rounded-lg transition-all duration-300 text-left relative overflow-hidden group"
    >
      {/* Hover Glow */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileHover={{ opacity: 1, x: 0 }}
        className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent pointer-events-none"
      />
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
          {lead.name?.charAt(0)?.toUpperCase() || 'L'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-white truncate">{lead.name}</span>
            {isHot && <span className="text-xs">🔥</span>}
          </div>
          <div className="text-xs text-slate-300 truncate">{lead.email}</div>
          {lead.property_interest && (
            <div className="mt-1.5 text-xs text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{lead.property_interest}</span>
            </div>
          )}
        </div>
        <span className={cn(
          "px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 border",
          isHot 
            ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30" 
            : isWarm 
            ? "bg-amber-500/20 text-amber-300 border-amber-400/30" 
            : "bg-slate-700/50 text-slate-300 border-slate-600/50"
        )}>
          {score}
        </span>
      </div>
    </motion.button>
  )
}

// Property Card - Design System Card Pattern
function PropertyCard({ property, onNavigate }: { property: Property; onNavigate?: (section: string) => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        onNavigate?.('properties')
        window.dispatchEvent(new CustomEvent('open-property-detail', { detail: { propertyId: property.id } }))
      }}
      className="w-full p-4 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/30 hover:glow-border rounded-lg transition-all duration-300 text-left relative overflow-hidden group"
    >
      {/* Hover Glow */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileHover={{ opacity: 1, x: 0 }}
        className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent pointer-events-none"
      />
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white mb-1.5 truncate">{property.title}</div>
          <div className="text-xs text-slate-300 flex items-center gap-1.5 mb-2">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{property.locality || property.city || 'Location'}</span>
          </div>
          {property.priceINR && (
            <div className="text-sm font-bold text-amber-300">
              {property.priceINR >= 10000000 
                ? `₹${(property.priceINR / 10000000).toFixed(2)} Cr`
                : property.priceINR >= 100000
                ? `₹${(property.priceINR / 100000).toFixed(1)} L`
                : `₹${(property.priceINR / 1000).toFixed(0)}K`}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {property.views !== undefined && (
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{property.views}</span>
            </div>
          )}
          {property.inquiries !== undefined && (
            <div className="text-xs text-emerald-300 flex items-center gap-1 font-medium">
              <MessageCircle className="w-3 h-3" />
              <span>{property.inquiries}</span>
            </div>
          )}
        </div>
      </div>
    </motion.button>
  )
}
