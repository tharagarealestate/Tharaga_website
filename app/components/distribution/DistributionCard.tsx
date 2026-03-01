'use client'

import { useState } from 'react'
import { Sparkles, Send, TrendingUp, Users, Mail, MessageSquare, Smartphone, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface DistributionCardProps {
  listing: {
    id: string
    title: string
    price?: number | null
    location?: string
    listing_status?: string
    is_verified?: boolean
    metadata?: {
      last_distributed_at?: string
      total_distributions?: number
      distribution_stats?: any
    }
  }
  onDistribute?: () => Promise<void>
  variant?: 'glass' | 'highlighted'
}

export default function DistributionCard({
  listing,
  onDistribute,
  variant = 'glass'
}: DistributionCardProps) {
  const [isDistributing, setIsDistributing] = useState(false)
  const [distributionResult, setDistributionResult] = useState<{
    success: boolean
    message?: string
    data?: any
  } | null>(null)
  
  const isHighlighted = variant === 'highlighted'
  const canDistribute = listing.listing_status === 'active' && listing.is_verified
  const stats = listing.metadata?.distribution_stats || {}
  const lastDistributed = listing.metadata?.last_distributed_at
  const totalDistributions = listing.metadata?.total_distributions || stats.total_matches || 0
  
  const handleDistribute = async () => {
    if (!onDistribute || !canDistribute) return
    
    setIsDistributing(true)
    setDistributionResult(null)
    
    try {
      await onDistribute()
      setDistributionResult({
        success: true,
        message: 'Listing distributed successfully!'
      })
      // Clear message after 5 seconds
      setTimeout(() => setDistributionResult(null), 5000)
    } catch (error: any) {
      setDistributionResult({
        success: false,
        message: error.message || 'Failed to distribute listing'
      })
    } finally {
      setIsDistributing(false)
    }
  }
  
  return (
    <div className={`
      relative group
      ${isHighlighted ? 'lg:scale-110 lg:-translate-y-4 z-10' : ''}
    `}>
      {/* Card Container */}
      <div className={`
        relative h-full
        rounded-3xl overflow-hidden
        transition-all duration-500
        ${isHighlighted 
          ? 'bg-gradient-to-br from-gold-500/20 to-emerald-500/20 border-2 border-gold-500/50 shadow-2xl shadow-gold-500/30' 
          : 'backdrop-blur-xl bg-white/10 border border-white/20'
        }
        hover:shadow-2xl hover:-translate-y-2
      `}>
        {/* Shimmer Effect on Hover */}
        <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none' />
        
        <div className='relative p-6'>
          {/* Header */}
          <div className='mb-6'>
            <div className='flex items-center gap-3 mb-2 flex-wrap'>
              <h3 className='text-xl font-bold text-white flex items-center gap-2'>
                <Sparkles className='w-5 h-5 text-gold-500' />
                Smart Distribution
              </h3>
              {canDistribute && (
                <div className='flex-shrink-0'>
                  <div className='px-3 py-1 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap'>
                    <CheckCircle className='w-3 h-3' />
                    Ready
                  </div>
                </div>
              )}
            </div>
            <p className='text-gray-400 text-sm'>{listing.title}</p>
          </div>
          
          {/* Stats */}
          {totalDistributions > 0 && (
            <div className='grid grid-cols-2 gap-4 mb-6'>
              <div className='bg-white/5 rounded-xl p-3 border border-white/10'>
                <div className='flex items-center gap-2 mb-1'>
                  <Users className='w-4 h-4 text-emerald-400' />
                  <span className='text-xs text-gray-400'>Matched Buyers</span>
                </div>
                <div className='text-2xl font-bold text-white'>{totalDistributions}</div>
              </div>
              <div className='bg-white/5 rounded-xl p-3 border border-white/10'>
                <div className='flex items-center gap-2 mb-1'>
                  <Send className='w-4 h-4 text-gold-400' />
                  <span className='text-xs text-gray-400'>Sent</span>
                </div>
                <div className='text-2xl font-bold text-white'>{stats.instant_sent || 0}</div>
              </div>
            </div>
          )}
          
          {/* Channels Used */}
          {stats.channels_used && Object.keys(stats.channels_used).length > 0 && (
            <div className='mb-6'>
              <div className='text-xs text-gray-400 mb-2'>Distribution Channels</div>
              <div className='flex flex-wrap gap-2'>
                {Object.entries(stats.channels_used).map(([channel, count]) => (
                  <div key={channel} className='flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg border border-white/10'>
                    {channel === 'email' && <Mail className='w-3 h-3 text-blue-400' />}
                    {channel === 'whatsapp' && <MessageSquare className='w-3 h-3 text-green-400' />}
                    {channel === 'sms' && <Smartphone className='w-3 h-3 text-purple-400' />}
                    <span className='text-xs text-white font-semibold'>{channel}</span>
                    <span className='text-xs text-gray-400'>({count})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Last Distributed */}
          {lastDistributed && (
            <div className='mb-6 flex items-center gap-2 text-xs text-gray-400'>
              <Clock className='w-4 h-4' />
              <span>Last distributed: {new Date(lastDistributed).toLocaleDateString()}</span>
            </div>
          )}
          
          {/* Status Messages */}
          {distributionResult && (
            <div className={`mb-6 p-3 rounded-xl flex items-center gap-2 ${
              distributionResult.success 
                ? 'bg-emerald-500/20 border border-emerald-500/50' 
                : 'bg-red-500/20 border border-red-500/50'
            }`}>
              {distributionResult.success ? (
                <CheckCircle className='w-4 h-4 text-emerald-400' />
              ) : (
                <AlertCircle className='w-4 h-4 text-red-400' />
              )}
              <span className={`text-sm ${
                distributionResult.success ? 'text-emerald-300' : 'text-red-300'
              }`}>
                {distributionResult.message}
              </span>
            </div>
          )}
          
          {/* Action Button */}
          <button
            onClick={handleDistribute}
            disabled={!canDistribute || isDistributing}
            className={`
              w-full py-3 rounded-xl font-bold text-base mb-4
              transition-all duration-300
              ${canDistribute && !isDistributing
                ? isHighlighted
                  ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-primary-950 hover:shadow-2xl hover:shadow-gold-500/50 hover:-translate-y-1'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:shadow-2xl hover:shadow-emerald-500/50 hover:-translate-y-1'
                : 'bg-white/5 backdrop-blur-sm text-gray-500 border border-white/10 cursor-not-allowed'
              }
            `}
          >
            {isDistributing ? (
              <span className='flex items-center justify-center gap-2'>
                <div className='w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin' />
                Distributing...
              </span>
            ) : !canDistribute ? (
              <span className='flex items-center justify-center gap-2'>
                <XCircle className='w-4 h-4' />
                Verify Listing First
              </span>
            ) : totalDistributions > 0 ? (
              <span className='flex items-center justify-center gap-2'>
                <TrendingUp className='w-4 h-4' />
                Redistribute Listing
              </span>
            ) : (
              <span className='flex items-center justify-center gap-2'>
                <Send className='w-4 h-4' />
                Distribute Now
              </span>
            )}
          </button>
          
          {/* Info */}
          <p className='text-xs text-gray-500 text-center'>
            Auto-match qualified buyers based on preferences and behavior
          </p>
        </div>
      </div>
    </div>
  )
}

