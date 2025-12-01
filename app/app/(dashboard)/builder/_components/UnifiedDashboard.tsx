"use client"

import { useMemo } from 'react'
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

// Glass panel styles - EXACT from pricing page
const glassPrimary = "relative group backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-lg transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 overflow-hidden"
const glassSecondary = "backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl shadow-lg"
const glassInteractive = "relative group backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:bg-white/[0.15] overflow-hidden"
const glassBadge = "backdrop-blur-sm bg-gold-500/20 border border-gold-500/30 rounded-full px-4 py-2 text-xs font-medium text-gold-300"

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

interface UnifiedDashboardProps {
  onNavigate?: (section: string) => void
}

export function UnifiedDashboard({ onNavigate }: UnifiedDashboardProps) {

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
    <div className="relative w-full">
      {/* Main Content - Background is handled by layout */}
      <div className="relative z-10 px-6 py-8 space-y-6">
        {/* Welcome Section */}
        <div className={cn(glassPrimary, "p-8")}>
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
                className={cn(glassBadge, "text-gold-400 hover:text-gold-300 cursor-pointer flex items-center gap-1")}
              >
                View All <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {leadsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className={cn(glassSecondary, "h-20 animate-pulse")} />
                ))}
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50 text-white" />
                <p className="text-white">No leads yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leads.slice(0, 5).map((lead) => (
                  <LeadCard key={lead.id} lead={lead} onNavigate={onNavigate} />
                ))}
              </div>
            )}
            </div>
          </section>

          {/* PROPERTIES SECTION */}
          <section className={cn(glassPrimary, "p-6")}>
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
                className={cn(glassBadge, "text-emerald-400 hover:text-emerald-300 cursor-pointer flex items-center gap-1")}
              >
                View All <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {propertiesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className={cn(glassSecondary, "h-24 animate-pulse")} />
                ))}
              </div>
            ) : properties.length === 0 ? (
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
                {properties.slice(0, 5).map((property) => (
                  <PropertyCard key={property.id} property={property} onNavigate={onNavigate} />
                ))}
              </div>
            )}
            </div>
          </section>

          {/* CLIENT OUTREACH SECTION */}
          <section className={cn(glassPrimary, "p-6")}>
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
                className={cn(glassBadge, "text-blue-400 hover:text-blue-300 cursor-pointer flex items-center gap-1")}
              >
                Open <ArrowUpRight className="w-3 h-3" />
              </button>
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
            </div>
          </section>

          {/* ANALYTICS & SETTINGS SECTION */}
          <section className={cn(glassPrimary, "p-6")}>
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
                className={cn(glassInteractive, "p-4 text-center w-full cursor-pointer")}
              >
                <BarChart3 className="w-6 h-6 text-gold-400 mx-auto mb-2" />
                <div className="text-sm font-medium text-white">Analytics</div>
              </button>
              <button 
                onClick={() => onNavigate?.('settings')}
                className={cn(glassInteractive, "p-4 text-center w-full cursor-pointer")}
              >
                <Settings className="w-6 h-6 text-gold-400 mx-auto mb-2" />
                <div className="text-sm font-medium text-white">Settings</div>
              </button>
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
            </div>
          </section>
        </div>

        {/* ULTRA AUTOMATION STATUS SECTION */}
        <section className={cn(glassPrimary, "p-6 border border-gold-500/20")}>
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
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">Active</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <div className={cn(glassSecondary, "p-3 text-center")}>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <div className="text-xs text-gray-400">Lead Gen</div>
            </div>
            <div className={cn(glassSecondary, "p-3 text-center")}>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <div className="text-xs text-gray-400">Journeys</div>
            </div>
            <div className={cn(glassSecondary, "p-3 text-center")}>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <div className="text-xs text-gray-400">Viewings</div>
            </div>
            <div className={cn(glassSecondary, "p-3 text-center")}>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <div className="text-xs text-gray-400">Contracts</div>
            </div>
            <div className={cn(glassSecondary, "p-3 text-center")}>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <div className="text-xs text-gray-400">Analytics</div>
            </div>
          </div>

          <div className={cn(glassSecondary, "p-4")}>
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
    <div className={cn(glassInteractive, "p-6")}>
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
          <div className="h-8 bg-white/5 rounded animate-pulse" />
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
      className={cn(glassSecondary, "p-4 block hover:bg-white/[0.04] transition-all group w-full text-left cursor-pointer")}
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
      className={cn(glassSecondary, "p-4 block hover:bg-white/[0.04] transition-all group w-full text-left cursor-pointer")}
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

