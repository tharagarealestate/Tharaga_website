'use client'

import { useState, useEffect, useCallback } from 'react'
import { Filter, Users, Crown, Award, Coins, Target, BarChart3, CheckCircle, X, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
// Select not needed in this component
import { getSupabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface Lead {
  id: number
  name: string
  email: string
  phone: string
  smartscore_v2: number
  priority_tier: string
  conversion_probability: number
  predicted_ltv: number
}

interface LeadTierManagerProps {
  builderId?: string
  onTierUpdate?: () => void
  variant?: 'full' | 'compact'
}

const TIER_CONFIG = {
  platinum: {
    label: 'Platinum',
    icon: Crown,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-400',
    minScore: 85
  },
  gold: {
    label: 'Gold',
    icon: Award,
    color: 'from-gold-500 to-amber-500',
    bgColor: 'bg-gold-500/20',
    borderColor: 'border-gold-500/30',
    textColor: 'text-gold-400',
    minScore: 70
  },
  silver: {
    label: 'Silver',
    icon: Coins,
    color: 'from-gray-400 to-gray-600',
    bgColor: 'bg-gray-500/20',
    borderColor: 'border-gray-500/30',
    textColor: 'text-gray-400',
    minScore: 50
  },
  bronze: {
    label: 'Bronze',
    icon: Target,
    color: 'from-orange-600 to-orange-800',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/30',
    textColor: 'text-orange-400',
    minScore: 30
  },
  standard: {
    label: 'Standard',
    icon: BarChart3,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
    minScore: 0
  }
}

export default function LeadTierManager({
  builderId,
  onTierUpdate,
  variant = 'full'
}: LeadTierManagerProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [selectedTier, setSelectedTier] = useState<string>('all')
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = getSupabase()

  useEffect(() => {
    loadLeads()
  }, [builderId])

  // Real-time subscription for lead updates
  useEffect(() => {
    if (!builderId) return

    const channel = supabase
      .channel('lead_tier_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads',
          filter: `builder_id=eq.${builderId}`
        },
        (payload) => {
          // If tier or score changed, refresh leads
          if (
            payload.new.priority_tier !== payload.old?.priority_tier ||
            payload.new.smartscore_v2 !== payload.old?.smartscore_v2
          ) {
            console.log('🔄 Lead tier/score updated, refreshing list')
            loadLeads()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
          filter: `builder_id=eq.${builderId}`
        },
        () => {
          // New lead added, refresh list
          loadLeads()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [builderId, supabase])

  // Filter leads based on tier and search
  useEffect(() => {
    let filtered = leads

    // Filter by tier
    if (selectedTier !== 'all') {
      filtered = filtered.filter(lead => lead.priority_tier === selectedTier)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(lead =>
        lead.name?.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.phone?.includes(query) ||
        lead.id.toString().includes(query)
      )
    }

    setFilteredLeads(filtered)
  }, [leads, selectedTier, searchQuery])

  const loadLeads = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const targetBuilderId = builderId || user.id

      const { data, error } = await supabase
        .from('leads')
        .select('id, name, email, phone, smartscore_v2, priority_tier, conversion_probability, predicted_ltv')
        .eq('builder_id', targetBuilderId)
        .order('smartscore_v2', { ascending: false, nullsFirst: false })
        .limit(500)

      if (error) throw error

      setLeads((data || []) as Lead[])
    } catch (error: any) {
      console.error('Failed to load leads:', error)
      toast.error('Failed to load leads')
    } finally {
      setLoading(false)
    }
  }, [builderId, supabase])

  const handleTierChange = useCallback(async (leadIds: number[], newTier: string) => {
    try {
      setUpdating(true)

      const updates = leadIds.map(id => ({
        id,
        priority_tier: newTier,
        updated_at: new Date().toISOString()
      }))

      // Batch update
      for (const update of updates) {
        const { error } = await supabase
          .from('leads')
          .update({ priority_tier: update.priority_tier })
          .eq('id', update.id)

        if (error) throw error
      }

      toast.success(`Updated ${leadIds.length} lead(s) to ${TIER_CONFIG[newTier as keyof typeof TIER_CONFIG]?.label || newTier}`)
      setSelectedLeads(new Set())
      await loadLeads()
      onTierUpdate?.()
    } catch (error: any) {
      console.error('Failed to update tiers:', error)
      toast.error('Failed to update lead tiers')
    } finally {
      setUpdating(false)
    }
  }, [supabase, loadLeads, onTierUpdate])

  const toggleLeadSelection = (leadId: number) => {
    setSelectedLeads(prev => {
      const newSet = new Set(prev)
      if (newSet.has(leadId)) {
        newSet.delete(leadId)
      } else {
        newSet.add(leadId)
      }
      return newSet
    })
  }

  const selectAll = () => {
    setSelectedLeads(new Set(filteredLeads.map(l => l.id)))
  }

  const deselectAll = () => {
    setSelectedLeads(new Set())
  }

  const getTierStats = () => {
    const stats = {
      platinum: 0,
      gold: 0,
      silver: 0,
      bronze: 0,
      standard: 0
    }

    leads.forEach(lead => {
      const tier = lead.priority_tier || 'standard'
      if (tier in stats) {
        stats[tier as keyof typeof stats]++
      }
    })

    return stats
  }

  const tierStats = getTierStats()

  if (loading && leads.length === 0) {
    return (
      <div className="relative group">
        <div className="relative h-full rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20">
          <div className="relative p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-white/10 rounded w-1/2" />
              <div className="h-64 bg-white/10 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative group">
      <div className="relative h-full rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20 hover:shadow-2xl">
        {/* Shimmer Effect */}
        <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none' />
        
        <div className='relative p-6'>
          {/* Header */}
          <div className='mb-6 flex items-center justify-between'>
            <div>
              <h3 className='text-xl font-bold text-white flex items-center gap-2 mb-1'>
                <Filter className='w-5 h-5 text-gold-400' />
                Lead Tier Management
              </h3>
              <p className='text-gray-400 text-sm'>Organize leads by priority tiers</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="invisible"
                size="sm"
                onClick={loadLeads}
                disabled={loading}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Tier Stats */}
          <div className='grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2 mb-4 sm:mb-6'>
            {Object.entries(TIER_CONFIG).map(([tier, config]) => {
              const Icon = config.icon
              const count = tierStats[tier as keyof typeof tierStats]
              return (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(selectedTier === tier ? 'all' : tier)}
                  className={`
                    relative rounded-xl p-2 sm:p-3 border-2 transition-all min-h-[44px]
                    ${selectedTier === tier
                      ? `${config.bgColor} ${config.borderColor} border-opacity-50`
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 ${config.textColor}`} />
                  <div className={`text-base sm:text-lg font-bold ${config.textColor}`}>{count}</div>
                  <div className="text-[10px] sm:text-xs text-white/60">{config.label}</div>
                </button>
              )
            })}
          </div>

          {/* Search and Bulk Actions */}
          <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mb-4'>
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-white/5 border border-white/20 rounded-lg px-3 sm:px-4 py-2.5 sm:py-2 text-white placeholder-white/40 focus:outline-none focus:border-gold-500/50 text-sm sm:text-base min-h-[44px]"
            />
            {selectedLeads.size > 0 && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <span className="text-xs sm:text-sm text-white/60 text-center sm:text-left">{selectedLeads.size} selected</span>
                <div className="flex flex-wrap gap-1 sm:gap-1">
                  {Object.keys(TIER_CONFIG).map(tier => (
                    <Button
                      key={tier}
                      variant="invisible"
                      size="sm"
                      onClick={() => handleTierChange(Array.from(selectedLeads), tier)}
                      disabled={updating}
                      className={`${TIER_CONFIG[tier as keyof typeof TIER_CONFIG].bgColor} ${TIER_CONFIG[tier as keyof typeof TIER_CONFIG].textColor} hover:opacity-80 text-xs sm:text-sm min-h-[36px] sm:min-h-[44px]`}
                    >
                      {TIER_CONFIG[tier as keyof typeof TIER_CONFIG].label}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="invisible"
                  size="sm"
                  onClick={deselectAll}
                  className="text-white/70 hover:text-white hover:bg-white/10 min-h-[36px] sm:min-h-[44px] min-w-[44px]"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            {selectedLeads.size === 0 && filteredLeads.length > 0 && (
              <Button
                variant="invisible"
                size="sm"
                onClick={selectAll}
                className="text-white/70 hover:text-white hover:bg-white/10 min-h-[44px] text-sm sm:text-base"
              >
                Select All
              </Button>
            )}
          </div>

          {/* Leads List */}
          <div className='space-y-2 max-h-96 overflow-y-auto'>
            {filteredLeads.length === 0 ? (
              <div className='text-center py-12 text-white/60'>
                <Users className='w-12 h-12 mx-auto mb-2 opacity-50' />
                <p>No leads found</p>
              </div>
            ) : (
              filteredLeads.map(lead => {
                const tierConfig = TIER_CONFIG[lead.priority_tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.standard
                const TierIcon = tierConfig.icon
                const isSelected = selectedLeads.has(lead.id)

                return (
                  <div
                    key={lead.id}
                    onClick={() => toggleLeadSelection(lead.id)}
                    className={`
                      relative rounded-xl p-4 border-2 transition-all cursor-pointer
                      ${isSelected
                        ? 'bg-gold-500/20 border-gold-500/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                      }
                    `}
                  >
                    <div className='flex items-center gap-4'>
                      <div className={`
                        flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border-2
                        ${tierConfig.bgColor} ${tierConfig.borderColor}
                      `}>
                        <TierIcon className={`w-5 h-5 ${tierConfig.textColor}`} />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 mb-1'>
                          <span className='font-semibold text-white truncate'>
                            {lead.name || `Lead #${lead.id}`}
                          </span>
                          <Badge className={`${tierConfig.bgColor} ${tierConfig.borderColor} ${tierConfig.textColor} text-xs`}>
                            {tierConfig.label}
                          </Badge>
                        </div>
                        <div className='flex items-center gap-4 text-sm text-white/60'>
                          <span>{lead.email || 'No email'}</span>
                          <span>Score: <span className='text-gold-400 font-semibold'>{parseFloat(lead.smartscore_v2?.toString() || '0').toFixed(1)}</span></span>
                          <span>LTV: <span className='text-emerald-400 font-semibold'>₹{(parseFloat(lead.predicted_ltv?.toString() || '0') / 100000).toFixed(1)}L</span></span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className='flex-shrink-0'>
                          <div className='w-6 h-6 rounded-full bg-gold-500 flex items-center justify-center'>
                            <CheckCircle className='w-4 h-4 text-white' />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Summary */}
          {variant === 'full' && (
            <div className='mt-6 pt-4 border-t border-white/10 grid grid-cols-5 gap-2 text-center'>
              {Object.entries(TIER_CONFIG).map(([tier, config]) => (
                <div key={tier}>
                  <div className={`text-2xl font-bold ${config.textColor}`}>
                    {tierStats[tier as keyof typeof tierStats]}
                  </div>
                  <div className="text-xs text-white/60">{config.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

