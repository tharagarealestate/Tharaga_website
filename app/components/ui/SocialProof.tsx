'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Star, Users, Award, TrendingUp } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'
import { cn } from '@/lib/design-system'

interface SocialProofProps {
  statistics?: Array<{
    value: string
    label: string
    icon?: ReactNode
  }>
  testimonials?: Array<{
    name: string
    role: string
    company?: string
    quote: string
    rating?: number
  }>
  className?: string
}

/**
 * Social Proof Component
 * Displays statistics, testimonials, and trust signals
 */
export function SocialProof({ 
  statistics, 
  testimonials,
  className = '' 
}: SocialProofProps) {
  const defaultStats = statistics || [
    { value: '500+', label: 'Active Builders', icon: <Users className="w-5 h-5" /> },
    { value: '12k+', label: 'Verified Properties', icon: <Award className="w-5 h-5" /> },
    { value: '₹3-5L', label: 'Avg. Savings', icon: <TrendingUp className="w-5 h-5" /> },
    { value: '100%', label: 'Zero Brokerage', icon: <Star className="w-5 h-5" /> },
  ]

  return (
    <div className={cn('space-y-8', className)}>
      {/* Statistics */}
      {statistics && statistics.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {defaultStats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard variant="dark" glow border className="p-4 text-center">
                {stat.icon && (
                  <div className="flex justify-center mb-2 text-amber-300">
                    {stat.icon}
                  </div>
                )}
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Testimonials */}
      {testimonials && testimonials.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard variant="dark" glow border className="p-6">
                {testimonial.rating && (
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'w-4 h-4',
                          i < testimonial.rating! ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                        )}
                      />
                    ))}
                  </div>
                )}
                <p className="text-slate-200 mb-4 italic">"{testimonial.quote}"</p>
                <div className="border-t border-slate-700/50 pt-4">
                  <div className="font-semibold text-white">{testimonial.name}</div>
                  <div className="text-sm text-slate-400">
                    {testimonial.role}
                    {testimonial.company && ` at ${testimonial.company}`}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}



















