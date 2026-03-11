"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  CreditCard, Check, Zap,
  Shield, Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTrialStatus } from '../TrialStatusManager'

interface BillingSectionProps {
  onNavigate?: (section: string) => void
}

export function BillingSection({ onNavigate }: BillingSectionProps) {
  const trialStatus = useTrialStatus()

  const proFeatures = [
    'Unlimited property listings',
    'Unlimited AI-scored leads',
    'Unlimited team members',
    'Full CRM & pipeline management',
    'Email + WhatsApp automation',
    'Advanced analytics dashboard',
    'RERA verification automation',
    'Bank loan integration',
    'Virtual property tours',
    'Priority support (2-hour response)',
    'API access + webhooks',
    'Dedicated account manager',
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
              <h2 className="text-sm font-semibold text-zinc-100">Current Plan: {trialStatus.isTrial ? '14-Day Free Trial' : 'Tharaga Pro'}</h2>
              <p className="text-xs text-zinc-500">
                {trialStatus.isTrial ? trialStatus.formattedDaysLeft : 'Subscription active'}
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

      {/* Tharaga Pro Plan */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="bg-zinc-900/60 border border-amber-500/40 ring-1 ring-amber-500/20 rounded-xl p-6 relative"
      >
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-amber-500 text-zinc-950 text-[10px] font-bold uppercase tracking-wider rounded-full">
          The Only Plan You Need
        </div>
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-100">Tharaga Pro</h3>
              <p className="text-xs text-zinc-500">Everything unlimited. No hidden limits.</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-zinc-100">₹4,999</span>
              <span className="text-sm text-zinc-500">/month</span>
            </div>
            <p className="text-xs text-emerald-400 mt-0.5">or ₹4,166/mo billed yearly</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
          {proFeatures.map(feature => (
            <div key={feature} className="flex items-center gap-2 text-sm text-zinc-300">
              <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              {feature}
            </div>
          ))}
        </div>
        {trialStatus.isTrial ? (
          <button className="w-full py-2.5 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-colors">
            Upgrade to Pro — ₹4,999/month
          </button>
        ) : (
          <div className="flex items-center gap-2 py-2.5 px-4 bg-zinc-800/60 rounded-lg">
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-zinc-300 font-medium">You're on Tharaga Pro</span>
          </div>
        )}
      </motion.div>

      {/* Security */}
      <div className="flex items-center gap-3 p-4 bg-zinc-900/40 border border-zinc-800/60 rounded-xl">
        <Shield className="w-5 h-5 text-emerald-400" />
        <p className="text-xs text-zinc-500">All payments are processed securely. Cancel anytime with no questions asked.</p>
      </div>
    </div>
  )
}
