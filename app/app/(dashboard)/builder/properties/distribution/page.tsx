'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Sparkles, Send, TrendingUp, Users, Mail, MessageSquare, Smartphone, BarChart3, Clock, CheckCircle, AlertCircle, Eye, MousePointerClick, Target } from 'lucide-react'
import DistributionCard from '@/components/distribution/DistributionCard'

async function fetchDistributions(listingId: string) {
  const res = await fetch(`/api/ai/distribution?listing_id=${listingId}`)
  if (!res.ok) throw new Error('Failed to fetch distributions')
  const data = await res.json()
  return data.data
}

async function triggerDistribution(listingId: string, forceRedistribute = false) {
  const res = await fetch('/api/ai/distribution', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ listing_id: listingId, force_redistribute: forceRedistribute })
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to distribute listing')
  }
  return res.json()
}

async function fetchBuilderProperties() {
  const res = await fetch('/api/builder/properties')
  if (!res.ok) throw new Error('Failed to fetch properties')
  const data = await res.json()
  return data.items || []
}

type Property = {
  id: string
  title: string
  price?: number | null
  location?: string
  listing_status?: string
  is_verified?: boolean
  metadata?: any
}

export default function DistributionPage() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [distributionData, setDistributionData] = useState<any>(null)
  
  const { data: properties = [] } = useQuery({
    queryKey: ['builder-properties'],
    queryFn: fetchBuilderProperties,
  })
  
  const { data: distributions, isLoading, refetch } = useQuery({
    queryKey: ['distributions', selectedProperty?.id],
    queryFn: () => selectedProperty ? fetchDistributions(selectedProperty.id) : null,
    enabled: !!selectedProperty,
  })
  
  useEffect(() => {
    if (properties.length > 0 && !selectedProperty) {
      setSelectedProperty(properties[0])
    }
  }, [properties, selectedProperty])
  
  useEffect(() => {
    if (distributions) {
      setDistributionData(distributions)
    }
  }, [distributions])
  
  const handleDistribute = async () => {
    if (!selectedProperty) return
    
    try {
      const hasDistributed = selectedProperty.metadata?.last_distributed_at
      await triggerDistribution(selectedProperty.id, !!hasDistributed)
      
      // Refetch distributions and properties
      await refetch()
      
      // Refetch properties to update metadata
      const propsRes = await fetch('/api/builder/properties')
      if (propsRes.ok) {
        const propsData = await propsRes.json()
        const updated = propsData.items?.find((p: Property) => p.id === selectedProperty.id)
        if (updated) {
          setSelectedProperty(updated)
        }
      }
    } catch (error: any) {
      throw error
    }
  }
  
  const stats = distributionData?.stats || {}
  const distributionsList = distributionData?.distributions || []
  
  return (
    <div className='min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-950'>
      {/* Header */}
      <div className='bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-[60px] z-30'>
        <div className='max-w-7xl mx-auto px-6 py-6'>
          <div className='flex items-center gap-3 mb-2'>
            <Sparkles className='w-8 h-8 text-gold-500' />
            <h1 className='text-3xl font-bold bg-gradient-to-r from-gold-400 to-emerald-400 bg-clip-text text-transparent'>
              Smart Distribution
            </h1>
          </div>
          <p className='text-gray-400'>Auto-match listings to qualified buyers in real-time</p>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-6 py-8'>
        <div className='grid lg:grid-cols-3 gap-8'>
          {/* Left Sidebar - Property Selector & Distribution Card */}
          <div className='lg:col-span-1 space-y-6'>
            {/* Property Selector */}
            <div className='backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6'>
              <h3 className='text-lg font-semibold text-white mb-4'>Select Property</h3>
              <div className='space-y-2 max-h-64 overflow-y-auto'>
                {properties
                  .filter(p => p.listing_status === 'active' && p.is_verified)
                  .map((property) => (
                    <button
                      key={property.id}
                      onClick={() => setSelectedProperty(property)}
                      className={`w-full text-left p-3 rounded-xl transition-all ${
                        selectedProperty?.id === property.id
                          ? 'bg-gold-500/20 border-2 border-gold-500 text-white'
                          : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <div className='font-semibold text-sm'>{property.title}</div>
                      <div className='text-xs text-gray-400 mt-1'>{property.location}</div>
                    </button>
                  ))}
              </div>
            </div>
            
            {/* Distribution Card */}
            {selectedProperty && (
              <DistributionCard
                listing={selectedProperty}
                onDistribute={handleDistribute}
                variant={selectedProperty.metadata?.last_distributed_at ? 'glass' : 'highlighted'}
              />
            )}
          </div>
          
          {/* Right Side - Analytics */}
          <div className='lg:col-span-2 space-y-6'>
            {selectedProperty ? (
              <>
                {/* Stats Grid */}
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                  <StatCard
                    icon={Users}
                    label='Total Matches'
                    value={stats.total_sent || 0}
                    color='from-blue-500 to-blue-600'
                  />
                  <StatCard
                    icon={Eye}
                    label='Opened'
                    value={stats.opened || 0}
                    color='from-purple-500 to-purple-600'
                  />
                  <StatCard
                    icon={MousePointerClick}
                    label='Clicked'
                    value={stats.clicked || 0}
                    color='from-emerald-500 to-emerald-600'
                  />
                  <StatCard
                    icon={Target}
                    label='Conversions'
                    value={stats.conversions || 0}
                    color='from-gold-500 to-gold-600'
                  />
                </div>
                
                {/* Average Match Score */}
                {stats.avg_match_score > 0 && (
                  <div className='backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6'>
                    <div className='flex items-center justify-between mb-4'>
                      <h3 className='text-lg font-semibold text-white'>Average Match Score</h3>
                      <div className='text-3xl font-bold text-gold-400'>{stats.avg_match_score.toFixed(1)}%</div>
                    </div>
                    <div className='w-full bg-white/5 rounded-full h-3 overflow-hidden'>
                      <div 
                        className='h-full bg-gradient-to-r from-gold-500 to-emerald-500 transition-all duration-500'
                        style={{ width: `${stats.avg_match_score}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Channel Breakdown */}
                {stats.channel_breakdown && Object.keys(stats.channel_breakdown).length > 0 && (
                  <div className='backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6'>
                    <h3 className='text-lg font-semibold text-white mb-4'>Distribution Channels</h3>
                    <div className='space-y-3'>
                      {Object.entries(stats.channel_breakdown).map(([channel, count]: [string, any]) => (
                        <div key={channel} className='flex items-center justify-between'>
                          <div className='flex items-center gap-3'>
                            {channel === 'email' && <Mail className='w-5 h-5 text-blue-400' />}
                            {channel === 'whatsapp' && <MessageSquare className='w-5 h-5 text-green-400' />}
                            {channel === 'sms' && <Smartphone className='w-5 h-5 text-purple-400' />}
                            <span className='text-white font-medium capitalize'>{channel}</span>
                          </div>
                          <span className='text-gray-400 font-semibold'>{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Distribution List */}
                {isLoading ? (
                  <div className='backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6'>
                    <div className='text-center text-gray-400'>Loading distributions...</div>
                  </div>
                ) : distributionsList.length > 0 ? (
                  <div className='backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6'>
                    <h3 className='text-lg font-semibold text-white mb-4'>Distribution History</h3>
                    <div className='space-y-3 max-h-96 overflow-y-auto'>
                      {distributionsList.map((dist: any) => (
                        <div 
                          key={dist.id}
                          className='bg-white/5 rounded-xl p-4 border border-white/10'
                        >
                          <div className='flex items-center justify-between mb-2'>
                            <div className='flex items-center gap-2'>
                              <div className='w-10 h-10 rounded-full bg-gradient-to-r from-gold-500 to-emerald-500 flex items-center justify-center text-white font-bold'>
                                {parseFloat(dist.match_score || 0).toFixed(0)}
                              </div>
                              <div>
                                <div className='text-white font-semibold'>
                                  {dist.buyer?.full_name || dist.buyer?.email || 'Unknown Buyer'}
                                </div>
                                <div className='text-xs text-gray-400'>
                                  {dist.buyer?.email}
                                </div>
                              </div>
                            </div>
                            <div className='text-right'>
                              <div className={`text-xs px-2 py-1 rounded-full ${
                                dist.conversion_status === 'converted' ? 'bg-emerald-500/20 text-emerald-400' :
                                dist.conversion_status === 'clicked' ? 'bg-blue-500/20 text-blue-400' :
                                dist.conversion_status === 'opened' ? 'bg-purple-500/20 text-purple-400' :
                                'bg-gray-500/20 text-gray-400'
                              }`}>
                                {dist.conversion_status}
                              </div>
                            </div>
                          </div>
                          <div className='text-xs text-gray-400 mt-2'>
                            Channel: {dist.distribution_channel} • {new Date(dist.sent_at).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className='backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 text-center'>
                    <Sparkles className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                    <p className='text-gray-400'>No distributions yet. Click "Distribute Now" to get started!</p>
                  </div>
                )}
              </>
            ) : (
              <div className='backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 text-center'>
                <BarChart3 className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-400'>Select a property to view distribution analytics</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number | string
  color: string
}) {
  return (
    <div className='backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 relative group overflow-hidden'>
      {/* Shimmer Effect */}
      <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none' />
      <div className='relative'>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${color} flex items-center justify-center mb-4`}>
          <Icon className='w-6 h-6 text-white' />
        </div>
        <div className='text-2xl font-bold text-white mb-1'>{value}</div>
        <div className='text-sm text-gray-400'>{label}</div>
      </div>
    </div>
  )
}

