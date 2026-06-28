'use client'

/**
 * Module 6: Site Visit QR Check-in Page
 * - No authentication required (public URL, scanned at property)
 * - Calls FastAPI /api/visits/checkin/[qr_code]
 * - AI-world design — fits on any mobile screen
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Loader2, MapPin, Clock, Sparkles, Building2 } from 'lucide-react'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || ''

type CheckinStatus = 'loading' | 'success' | 'already' | 'error'

interface CheckinResult {
  status: CheckinStatus
  message: string
  checked_in_at?: string
  booking_id?: string
}

export default function VisitCheckinPage({ params }: { params: { qr: string } }) {
  const [result, setResult] = useState<CheckinResult | null>(null)

  useEffect(() => {
    const doCheckin = async () => {
      try {
        const resp = await fetch(`${BACKEND_URL}/api/visits/checkin/${params.qr}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
        const data = await resp.json()

        if (!resp.ok) {
          setResult({ status: 'error', message: data.detail || 'Invalid QR code. Please contact our team.' })
          return
        }

        if (data.status === 'already_checked_in') {
          setResult({
            status: 'already',
            message: 'You have already checked in for this visit.',
            checked_in_at: data.checked_in_at,
            booking_id: data.booking_id,
          })
        } else {
          setResult({
            status: 'success',
            message: data.message || 'Welcome! Your site visit has been confirmed.',
            checked_in_at: data.checked_in_at,
            booking_id: data.booking_id,
          })
        }
      } catch {
        setResult({ status: 'error', message: 'Network error. Please try again or show this page to our team.' })
      }
    }
    doCheckin()
  }, [params.qr])

  const formatTime = (iso?: string) => {
    if (!iso) return ''
    try {
      return new Date(iso).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    } catch {
      return iso
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-amber-600/3 blur-[80px]" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <Building2 className="w-6 h-6 text-amber-400" />
            <span className="text-lg font-bold text-zinc-100">Tharaga</span>
          </div>
          <p className="text-xs text-zinc-500">Site Visit Check-in</p>
        </div>

        <AnimatePresence mode="wait">
          {!result ? (
            // Loading state
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-400/20 flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              </div>
              <h2 className="text-lg font-semibold text-zinc-100 mb-2">Verifying your QR code</h2>
              <p className="text-sm text-zinc-400">Please wait a moment...</p>
            </motion.div>
          ) : result.status === 'success' ? (
            // Success state
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/[0.04] backdrop-blur-xl border border-amber-400/20 rounded-2xl p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1, stiffness: 200 }}
                className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400/40 flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 className="w-10 h-10 text-amber-400" />
              </motion.div>

              <div className="mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-amber-400 font-medium tracking-wider uppercase">Check-in Successful</span>
                </div>
                <h2 className="text-2xl font-bold text-zinc-100 mb-2">Welcome!</h2>
                <p className="text-sm text-zinc-400 leading-relaxed">{result.message}</p>
              </div>

              {result.checked_in_at && (
                <div className="bg-white/[0.03] rounded-xl p-4 mb-4 text-left">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Checked in at</span>
                  </div>
                  <p className="text-sm font-medium text-zinc-200 mt-1">{formatTime(result.checked_in_at)}</p>
                </div>
              )}

              <div className="bg-amber-500/10 border border-amber-400/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <div className="text-left">
                    <p className="text-xs font-medium text-amber-400 mb-0.5">Next steps</p>
                    <p className="text-xs text-zinc-400">Our team will guide you through the property. Please show this screen to our executive.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : result.status === 'already' ? (
            // Already checked in
            <motion.div
              key="already"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-zinc-100 mb-2">Already checked in</h2>
              <p className="text-sm text-zinc-400">{result.message}</p>
              {result.checked_in_at && (
                <p className="text-xs text-zinc-500 mt-3">
                  Original check-in: {formatTime(result.checked_in_at)}
                </p>
              )}
            </motion.div>
          ) : (
            // Error state
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/[0.04] backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-lg font-semibold text-zinc-100 mb-2">Check-in failed</h2>
              <p className="text-sm text-zinc-400">{result.message}</p>
              <div className="mt-6 p-4 bg-white/[0.03] rounded-xl">
                <p className="text-xs text-zinc-500">Need help? Contact us:</p>
                <a
                  href="tel:+914400000000"
                  className="text-sm text-amber-400 font-medium hover:text-amber-300 transition-colors"
                >
                  +91 44 0000 0000
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-xs text-zinc-600 text-center mt-6">
          Powered by Tharaga • India's AI Real Estate Platform
        </p>
      </div>
    </div>
  )
}
