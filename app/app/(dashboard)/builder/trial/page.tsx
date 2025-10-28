"use client";

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function BuilderTrialPage() {
  const [daysLeft, setDaysLeft] = useState<number | null>(14)

  useEffect(() => {
    // This page is a simple confirmation. In a full app we'd fetch subscription.
    const s = typeof window !== 'undefined' ? window.sessionStorage.getItem('trial_start') : null
    if (!s) {
      setDaysLeft(14)
    }
  }, [])

  return (
    <main className="min-h-screen bg-canvas text-fg">
      <section className="container py-16">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-primary-900">Welcome to your free trial</h1>
          <p className="mt-2 text-gray-700">You now have full access to the Builder Dashboard. We will send verified buyer leads to this account.</p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border bg-white p-4">
              <div className="text-sm text-gray-500">Leads in trial</div>
              <div className="text-2xl font-bold">10</div>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <div className="text-sm text-gray-500">Status</div>
              <div className="text-2xl font-bold text-emerald-600">Active</div>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <div className="text-sm text-gray-500">Days left</div>
              <div className="text-2xl font-bold">{daysLeft ?? 14}</div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/app/saas/dashboard" className="btn-primary">Go to Dashboard</Link>
            <Link href="/app/saas/pricing" className="btn-gold">View Plans</Link>
          </div>
        </motion.div>
      </section>
    </main>
  )
}
