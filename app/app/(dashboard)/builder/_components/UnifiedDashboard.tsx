"use client"

import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Users, Building2, MessageSquare, Settings, 
  TrendingUp, DollarSign, BarChart3, Zap,
  ArrowUpRight, ArrowDownRight, Phone, Mail,
  Search, Filter, Plus, MoreVertical,
  Clock, MapPin, Star, Eye, MessageCircle
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// Glass panel styles
const glassPrimary = "bg-white/[0.03] backdrop-blur-[20px] saturate-180 border border-white/[0.08] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] shadow-inner-[0_1px_0_rgba(255,255,255,0.05)]"
const glassSecondary = "bg-white/[0.02] backdrop-blur-[12px] border border-white/[0.05] rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
const glassInteractive = "bg-white/[0.03] backdrop-blur-[20px] border border-white/[0.08] rounded-2xl transition-all duration-300 hover:bg-white/[0.05] hover:border-gold-500/20 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)]"
const glassBadge = "bg-white/[0.08] backdrop-blur-[8px] border border-white/[0.12] rounded-full px-3 py-1 text-xs font-medium"

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
  const res = await fetch('/api/leads/count', { cache: 'no-store' })
  if (!res.ok) return { total: 0, hot: 0, warm: 0 }
  const data = await res.json()
  return data?.data || { total: 0, hot: 0, warm: 0 }
}

export function UnifiedDashboard() {
  const [activeSection, setActiveSection] = useState<string | null>(null)

  // Fetch data
  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['unified-leads'],
    queryFn: fetchLeads,
    refetchInterval: 15000
  })

  const { data: properties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: ['unified-properties'],
    queryFn: fetchProperties,
    refetchInterval: 30000
  })

  const { data: stats = { total: 0, hot: 0, warm: 0 }, isLoading: statsLoading } = useQuery({
    queryKey: ['unified-stats'],
    queryFn: fetchStats,
    refetchInterval: 10000
  })

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalProperties = properties.length
    const activeProperties = properties.filter(p => p.status === 'active').length
    const totalViews = properties.reduce((sum, p) => sum + (p.views || 0), 0)
    const totalInquiries = properties.reduce((sum, p) => sum + (p.inquiries || 0), 0)
    const conversionRate = totalViews > 0 ? ((totalInquiries / totalViews) * 100).toFixed(1) : '0'
    
    return {
      totalLeads: stats.total,
      hotLeads: stats.hot,
      warmLeads: stats.warm,
      totalProperties,
      activeProperties,
      totalViews,
      totalInquiries,
      conversionRate
    }
  }, [leads, properties, stats])

  return (
    <div className="relative min-h-screen">
      {/* Layered Background System */}
      <div className="fixed inset-0 -z-10">
        {/* Layer 1: Base Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0d2847] to-[#071422]" />
        
        {/* Layer 2: Atmospheric Orbs */}
        <div className="absolute top-20 left-10 w-[400px] h-[400px] bg-[#D4AF37] opacity-25 blur-[120px] rounded-full animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-20 right-10 w-[350px] h-[350px] bg-[#10B981] opacity-15 blur-[100px] rounded-full animate-pulse" style={{ animationDuration: '12s', animationDelay: '1s' }} />
        <div className="absolute top-40 right-20 w-[300px] h-[300px] bg-[#1e40af] opacity-20 blur-[80px] rounded-full animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        
        {/* Layer 3: Subtle Grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-6 py-8 space-y-6">
        {/* Welcome Section */}
        <div className={cn(glassPrimary, "p-8")}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back! 👋
              </h1>
              <p className="text-gray-300">Here's your portfolio at a glance</p>
            </div>
            <div className="flex items-center gap-3">
              <button className={cn(glassInteractive, "px-6 py-3 text-white font-semibold")}>
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
            trend={{ value: 12, positive: true }}
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
            trend={{ value: 5.2, positive: true }}
            loading={statsLoading}
          />
          <StatCard
            icon={DollarSign}
            label="This Month"
            value="₹2.4Cr"
            subtitle="Revenue"
            loading={false}
          />
        </div>

        {/* Main Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEADS SECTION */}
          <section className={cn(glassPrimary, "p-6")}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-600 to-gold-500 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary-950" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Leads Management</h2>
                  <p className="text-sm text-gray-400">{metrics.hotLeads} hot • {metrics.warmLeads} warm</p>
                </div>
              </div>
              <Link href="/builder/leads" className={cn(glassBadge, "text-gold-400 hover:text-gold-300")}>
                View All <ArrowUpRight className="w-3 h-3 inline ml-1" />
              </Link>
            </div>

            {leadsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className={cn(glassSecondary, "h-20 animate-pulse")} />
                ))}
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No leads yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leads.slice(0, 5).map((lead) => (
                  <LeadCard key={lead.id} lead={lead} />
                ))}
              </div>
            )}
          </section>

          {/* PROPERTIES SECTION */}
          <section className={cn(glassPrimary, "p-6")}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">My Properties</h2>
                  <p className="text-sm text-gray-400">{metrics.activeProperties} active listings</p>
                </div>
              </div>
              <Link href="/builder/properties" className={cn(glassBadge, "text-emerald-400 hover:text-emerald-300")}>
                View All <ArrowUpRight className="w-3 h-3 inline ml-1" />
              </Link>
            </div>

            {propertiesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className={cn(glassSecondary, "h-24 animate-pulse")} />
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No properties yet</p>
                <Link href="/builder/properties" className="text-gold-400 hover:text-gold-300 mt-2 inline-block">
                  Add your first property →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {properties.slice(0, 5).map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            )}
          </section>

          {/* CLIENT OUTREACH SECTION */}
          <section className={cn(glassPrimary, "p-6")}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Client Outreach</h2>
                  <p className="text-sm text-gray-400">Send SMS and WhatsApp messages</p>
                </div>
              </div>
              <Link href="/builder/messaging" className={cn(glassBadge, "text-blue-400 hover:text-blue-300")}>
                Open <ArrowUpRight className="w-3 h-3 inline ml-1" />
              </Link>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button className={cn(glassInteractive, "p-4 text-left")}>
                  <Phone className="w-5 h-5 text-gold-400 mb-2" />
                  <div className="text-sm font-medium text-white">Send SMS</div>
                  <div className="text-xs text-gray-400 mt-1">Quick message</div>
                </button>
                <button className={cn(glassInteractive, "p-4 text-left")}>
                  <MessageCircle className="w-5 h-5 text-emerald-400 mb-2" />
                  <div className="text-sm font-medium text-white">WhatsApp</div>
                  <div className="text-xs text-gray-400 mt-1">Instant chat</div>
                </button>
              </div>
              
              <div className={cn(glassSecondary, "p-4")}>
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
          </section>

          {/* ANALYTICS & SETTINGS SECTION */}
          <section className={cn(glassPrimary, "p-6")}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Analytics & Settings</h2>
                  <p className="text-sm text-gray-400">Performance insights</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <Link href="/builder/analytics" className={cn(glassInteractive, "p-4 text-center")}>
                <BarChart3 className="w-6 h-6 text-gold-400 mx-auto mb-2" />
                <div className="text-sm font-medium text-white">Analytics</div>
              </Link>
              <Link href="/builder/settings" className={cn(glassInteractive, "p-4 text-center")}>
                <Settings className="w-6 h-6 text-gold-400 mx-auto mb-2" />
                <div className="text-sm font-medium text-white">Settings</div>
              </Link>
            </div>

            <div className={cn(glassSecondary, "p-4")}>
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
          </section>
        </div>
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
    <div className={cn(glassInteractive, "p-6")}>
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
        <div className="h-8 bg-white/5 rounded animate-pulse" />
      ) : (
        <>
          <div className="text-3xl font-bold text-white mb-1">{value}</div>
          <div className="text-sm text-gray-400">{label}</div>
          {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
        </>
      )}
    </div>
  )
}

function LeadCard({ lead }: { lead: Lead }) {
  const score = lead.score || 0
  const isHot = score >= 80
  const isWarm = score >= 50 && score < 80

  return (
    <Link 
      href={`/builder/leads/${lead.id}`}
      className={cn(glassSecondary, "p-4 block hover:bg-white/[0.04] transition-all group")}
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
    </Link>
  )
}

function PropertyCard({ property }: { property: Property }) {
  return (
    <Link 
      href={`/builder/properties/${property.id}`}
      className={cn(glassSecondary, "p-4 block hover:bg-white/[0.04] transition-all group")}
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
    </Link>
  )
}

