"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  CreditCard, Check, Zap, Crown, Star,
  ArrowRight, Shield, Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTrialStatus } from '../TrialStatusManager'

interface BillingSectionProps {
  onNavigate?: (section: string) => void
}

export function BillingSection({ onNavigate }: BillingSectionProps) {
  const trialStatus = useTrialStatus()

  const plans = [
    {
      name: 'Starter',
      price: '₹2,999',
      period: '/month',
      description: 'For individual builders getting started',
      features: ['50 leads/month', '5 properties', 'Basic analytics', 'Email support', 'Kanban pipeline'],
      current: trialStatus.isTrial,
      color: 'border-zinc-700',
      icon: Star,
    },
    {
      name: 'Professional',
      price: '₹7,999',
      period: '/month',
      description: 'For growing real estate businesses',
      features: ['Unlimited leads', '50 properties', 'Advanced analytics', 'AI automations', 'Marketing hub', 'Priority support', 'WhatsApp integration'],
      recommended: true,
      color: 'border-amber-500/40',
      icon: Zap,
    },
    {
      name: 'Enterprise',
      price: '₹19,999',
      period: '/month',
      description: 'For large builders and developers',
      features: ['Everything in Pro', 'Unlimited properties', 'Custom automations', 'API access', 'Dedicated account manager', 'Custom integrations', 'White-label options'],
      color: 'border-purple-500/40',
      icon: Crown,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Billing</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage your subscription and payments</p>
      </div>

      {/* Current Plan */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Current Plan: {trialStatus.isTrial ? 'Free Trial' : 'Professional'}</h2>
              <p className="text-xs text-zinc-500">
                {trialStatus.isTrial ? trialStatus.formattedDaysLeft : 'Next billing: March 1, 2024'}
              </p>
            </div>
          </div>
          {trialStatus.isTrial && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-amber-400 font-medium">{trialStatus.formattedDaysLeft}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan, i) => {
          const Icon = plan.icon
          return (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                'bg-zinc-900/60 border rounded-xl p-6 relative',
                plan.recommended ? plan.color : 'border-zinc-800/60',
                plan.recommended && 'ring-1 ring-amber-500/20'
              )}
            >
              {plan.recommended && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-amber-500 text-zinc-950 text-[10px] font-bold uppercase tracking-wider rounded-full">
                  Recommended
                </div>
              )}
              <div className="flex items-center gap-2 mb-3">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  plan.recommended ? 'bg-amber-500/15' : 'bg-zinc-800'
                )}>
                  <Icon className={cn('w-4 h-4', plan.recommended ? 'text-amber-400' : 'text-zinc-500')} />
                </div>
                <h3 className="text-base font-semibold text-zinc-100">{plan.name}</h3>
              </div>
              <div className="mb-3">
                <span className="text-3xl font-bold text-zinc-100">{plan.price}</span>
                <span className="text-sm text-zinc-500">{plan.period}</span>
              </div>
              <p className="text-xs text-zinc-500 mb-4">{plan.description}</p>
              <ul className="space-y-2 mb-5">
                {plan.features.map(feature => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-zinc-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                className={cn(
                  'w-full py-2.5 rounded-lg text-sm font-semibold transition-colors',
                  plan.current
                    ? 'bg-zinc-800 text-zinc-400 cursor-default'
                    : plan.recommended
                    ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                )}
                disabled={plan.current}
              >
                {plan.current ? 'Current Plan' : 'Upgrade'}
              </button>
            </motion.div>
          )
        })}
      </div>

      {/* Security */}
      <div className="flex items-center gap-3 p-4 bg-zinc-900/40 border border-zinc-800/60 rounded-xl">
        <Shield className="w-5 h-5 text-emerald-400" />
        <p className="text-xs text-zinc-500">All payments are processed securely. Cancel anytime with no questions asked.</p>
      </div>
    </div>
  )
}
