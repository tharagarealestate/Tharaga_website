"use client"

import { useMemo, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Users, Building2, MessageSquare, Settings, 
  TrendingUp, DollarSign, BarChart3, Zap,
  ArrowUpRight, ArrowDownRight, Phone, Mail,
  Search, Filter, Plus, MoreVertical,
  Clock, MapPin, Star, Eye, MessageCircle,
  Sparkles, CheckCircle2, Calendar, FileText, Handshake, Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LoadingSpinner, GlassLoadingOverlay } from '@/components/ui/loading-spinner'
import { getSupabase } from '@/lib/supabase'
import { useDemoMode, DEMO_DATA } from './DemoDataProvider'
import {
  builderGlassPrimary,
  builderGlassSecondary,
  builderGlassInteractive,
  builderGlassBadge,
} from './builderGlassStyles'

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
    <div className="relative w-full">
      {/* Main Content - Background is handled by layout */}
      <div className="relative z-10 px-6 pt-0 pb-8 space-y-6">
        {/* Welcome Section */}
        <div className={cn(builderGlassPrimary, "p-8")}>
          {/* Shimmer Effect on Hover - EXACT from pricing page */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back! 👋
              </h1>
              <p className="text-xl text-gray-300 leading-relaxed">Here's your portfolio at a glance</p>
            </div>
            <div className="flex items-center gap-3">
              <button className={cn(builderGlassInteractive, "px-6 py-3 text-white font-semibold")}>
                <Plus className="w-4 h-4 inline mr-2" />
                Quick Action
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Users}
            label="Total Leads"
            value={metrics.totalLeads}
            trend={{ 
              value: parseFloat(metrics.leadTrend), 
              positive: parseFloat(metrics.leadTrend) >= 0 
            }}
            loading={statsLoading}
          />
          <StatCard
            icon={Building2}
            label="Properties"
            value={metrics.totalProperties}
            subtitle={`${metrics.activeProperties} active`}
            loading={propertiesLoading}
          />
          <StatCard
            icon={TrendingUp}
            label="Conversion Rate"
            value={`${metrics.conversionRate}%`}
            trend={{ 
              value: parseFloat(metrics.conversionTrend), 
              positive: parseFloat(metrics.conversionTrend) >= 0 
            }}
            loading={statsLoading}
          />
          <StatCard
            icon={DollarSign}
            label="This Month"
            value={revenueData?.monthlyRevenue 
              ? revenueData.monthlyRevenue >= 10000000 
                ? `₹${(revenueData.monthlyRevenue / 10000000).toFixed(2)} Cr`
                : revenueData.monthlyRevenue >= 100000
                ? `₹${(revenueData.monthlyRevenue / 100000).toFixed(2)} L`
                : `₹${(revenueData.monthlyRevenue / 1000).toFixed(1)}K`
              : '₹0'}
            subtitle="Revenue"
            loading={revenueLoading}
          />
        </div>

        {/* Main Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEADS SECTION */}
          <section className={cn(builderGlassPrimary, "p-6")}>
            {/* Shimmer Effect on Hover - EXACT from pricing page */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-600 to-gold-500 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary-950" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Leads Management</h2>
                    <p className="text-sm text-gray-300">{metrics.hotLeads} hot • {metrics.warmLeads} warm</p>
                  </div>
                </div>
              <button 
                onClick={() => onNavigate?.('leads')}
                className={cn(builderGlassBadge, "text-gold-400 hover:text-gold-300 cursor-pointer flex items-center gap-1")}
              >
                View All <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {leadsLoading ? (
              <div className="relative min-h-[200px]">
                <GlassLoadingOverlay />
              </div>
            ) : mergedLeads.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50 text-white" />
                <p className="text-white">No leads yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mergedLeads.slice(0, 5).map((lead: any) => (
                  <LeadCard key={lead.id} lead={lead} onNavigate={onNavigate} />
                ))}
              </div>
            )}
            </div>
          </section>

          {/* PROPERTIES SECTION */}
          <section className={cn(builderGlassPrimary, "p-6")}>
            {/* Shimmer Effect on Hover - EXACT from pricing page */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">My Properties</h2>
                    <p className="text-sm text-gray-300">{metrics.activeProperties} active listings</p>
                  </div>
                </div>
              <button 
                onClick={() => onNavigate?.('properties')}
                className={cn(builderGlassBadge, "text-emerald-400 hover:text-emerald-300 cursor-pointer flex items-center gap-1")}
              >
                View All <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {propertiesLoading ? (
              <div className="relative min-h-[200px]">
                <GlassLoadingOverlay />
              </div>
            ) : mergedProperties.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50 text-white" />
                <p className="text-white">No properties yet</p>
                <button 
                  onClick={() => onNavigate?.('properties')}
                  className="text-gold-400 hover:text-gold-300 mt-2 inline-block cursor-pointer font-medium"
                >
                  Add your first property →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {mergedProperties.slice(0, 5).map((property: any) => (
                  <PropertyCard key={property.id} property={property} onNavigate={onNavigate} />
                ))}
              </div>
            )}
            </div>
          </section>

          {/* CLIENT OUTREACH SECTION */}
          <section className={cn(builderGlassPrimary, "p-6")}>
            {/* Shimmer Effect on Hover - EXACT from pricing page */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Client Outreach</h2>
                    <p className="text-sm text-gray-300">Send SMS and WhatsApp messages</p>
                  </div>
                </div>
              <button 
                onClick={() => onNavigate?.('client-outreach')}
                className={cn(builderGlassBadge, "text-blue-400 hover:text-blue-300 cursor-pointer flex items-center gap-1")}
              >
                Open <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button className={cn(builderGlassInteractive, "p-4 text-left")}>
                  <Phone className="w-5 h-5 text-gold-400 mb-2" />
                  <div className="text-sm font-medium text-white">Send SMS</div>
                  <div className="text-xs text-gray-400 mt-1">Quick message</div>
                </button>
                <button className={cn(builderGlassInteractive, "p-4 text-left")}>
                  <MessageCircle className="w-5 h-5 text-emerald-400 mb-2" />
                  <div className="text-sm font-medium text-white">WhatsApp</div>
                  <div className="text-xs text-gray-400 mt-1">Instant chat</div>
                </button>
              </div>
              
              <div className={cn(builderGlassSecondary, "p-4")}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-white">Recent Messages</span>
                  <span className="text-xs text-gray-400">3 sent today</span>
                </div>
                <div className="space-y-2">
                  {[1, 2].map(i => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-white">Rajesh Kumar</div>
                        <div className="text-xs text-gray-400">Site visit scheduled</div>
                      </div>
                      <div className="text-xs text-gray-500">2h ago</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </div>
          </section>

          {/* ANALYTICS & SETTINGS SECTION */}
          <section className={cn(builderGlassPrimary, "p-6")}>
            {/* Shimmer Effect on Hover - EXACT from pricing page */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Analytics & Settings</h2>
                    <p className="text-sm text-gray-300">Performance insights</p>
                  </div>
                </div>
              </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <button 
                onClick={() => onNavigate?.('behavior-analytics')}
                className={cn(builderGlassInteractive, "p-4 text-center w-full cursor-pointer")}
              >
                <BarChart3 className="w-6 h-6 text-gold-400 mx-auto mb-2" />
                <div className="text-sm font-medium text-white">Analytics</div>
              </button>
              <button 
                onClick={() => onNavigate?.('settings')}
                className={cn(builderGlassInteractive, "p-4 text-center w-full cursor-pointer")}
              >
                <Settings className="w-6 h-6 text-gold-400 mx-auto mb-2" />
                <div className="text-sm font-medium text-white">Settings</div>
              </button>
            </div>

            <div className={cn(builderGlassSecondary, "p-4")}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white">Quick Stats</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Views</span>
                  <span className="text-white font-medium">{metrics.totalViews.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Inquiries</span>
                  <span className="text-white font-medium">{metrics.totalInquiries}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg. Response</span>
                  <span className="text-emerald-400 font-medium">2.4hr</span>
                </div>
              </div>
            </div>
            </div>
          </section>
        </div>

        {/* ULTRA AUTOMATION STATUS SECTION */}
        <section className={cn(builderGlassPrimary, "p-6 border border-gold-500/20")}>
          {/* Shimmer Effect on Hover - EXACT from pricing page */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
          <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-600 to-gold-500 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary-950" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Ultra Automation</h2>
                <p className="text-sm text-gray-300">AI-powered automation active</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-emerald-400 font-medium">Active</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <div className={cn(builderGlassSecondary, "p-3 text-center")}>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <div className="text-xs text-gray-400">Lead Gen</div>
            </div>
            <div className={cn(builderGlassSecondary, "p-3 text-center")}>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <div className="text-xs text-gray-400">Journeys</div>
            </div>
            <div className={cn(builderGlassSecondary, "p-3 text-center")}>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <div className="text-xs text-gray-400">Viewings</div>
            </div>
            <div className={cn(builderGlassSecondary, "p-3 text-center")}>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <div className="text-xs text-gray-400">Contracts</div>
            </div>
            <div className={cn(builderGlassSecondary, "p-3 text-center")}>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <div className="text-xs text-gray-400">Analytics</div>
            </div>
          </div>

          <div className={cn(builderGlassSecondary, "p-4")}>
            <p className="text-sm text-gray-300 mb-2">
              All 10 automation layers are running automatically in the background. 
              Access data via API endpoints or database queries.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Activity className="w-3 h-3" />
              <span>Processing leads, emails, viewings, and contracts automatically</span>
            </div>
          </div>
          </div>
        </section>
      </div>
    </div>
  )
}

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
    <div className={cn(builderGlassInteractive, "p-6")}>
      {/* Shimmer Effect on Hover - EXACT from pricing page */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Icon className="w-6 h-6 text-gold-400" />
          </div>
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium",
              trend.positive ? "text-emerald-400" : "text-red-400"
            )}>
              {trend.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-12">
            <LoadingSpinner size="md" variant="gold" />
          </div>
        ) : (
          <>
            <div className="text-3xl font-bold text-white mb-1">{value}</div>
            <div className="text-sm text-gray-300">{label}</div>
            {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
          </>
        )}
      </div>
    </div>
  )
}

function LeadCard({ lead, onNavigate }: { lead: Lead; onNavigate?: (section: string) => void }) {
  const score = lead.score || 0
  const isHot = score >= 80
  const isWarm = score >= 50 && score < 80

  return (
    <button
      onClick={() => {
        // Navigate to leads section first, then could open detail modal
        onNavigate?.('leads')
        // Could also dispatch event for lead detail modal
        window.dispatchEvent(new CustomEvent('open-lead-detail', { detail: { leadId: lead.id } }))
      }}
      className={cn(builderGlassSecondary, "p-4 block hover:bg-white/[0.04] transition-all group w-full text-left cursor-pointer")}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-600 to-gold-500 flex items-center justify-center text-white font-semibold text-sm">
          {lead.name?.charAt(0) || 'L'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-white truncate">{lead.name}</span>
            {isHot && <span className="text-xs">🔥</span>}
          </div>
          <div className="text-xs text-gray-400 truncate">{lead.email}</div>
        </div>
        <div className={cn(
          "px-2 py-1 rounded-full text-xs font-bold",
          isHot ? "bg-gold-500/20 text-gold-400" : isWarm ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-500/20 text-gray-400"
        )}>
          {score}
        </div>
      </div>
      {lead.property_interest && (
        <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {lead.property_interest}
        </div>
      )}
    </button>
  )
}

function PropertyCard({ property, onNavigate }: { property: Property; onNavigate?: (section: string) => void }) {
  return (
    <button
      onClick={() => {
        onNavigate?.('properties')
        // Could dispatch event for property detail
        window.dispatchEvent(new CustomEvent('open-property-detail', { detail: { propertyId: property.id } }))
      }}
      className={cn(builderGlassSecondary, "p-4 block hover:bg-white/[0.04] transition-all group w-full text-left cursor-pointer")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white mb-1 truncate">{property.title}</div>
          <div className="text-xs text-gray-400 flex items-center gap-1 mb-2">
            <MapPin className="w-3 h-3" />
            {property.locality || property.city || 'Location'}
          </div>
          {property.priceINR && (
            <div className="text-sm font-semibold text-gold-400">
              ₹{(property.priceINR / 10000000).toFixed(2)}Cr
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {property.views !== undefined && (
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {property.views}
            </div>
          )}
          {property.inquiries !== undefined && (
            <div className="text-xs text-emerald-400 flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {property.inquiries}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

