'use client'

/**
 * Module 9: Lead Capture Form
 * - Full UTM + fbclid/gclid + fbc/fbp attribution
 * - Fires browser fbq pixel BEFORE server call (for CAPI dedup)
 * - Calls /api/leads/ingest (Next.js → FastAPI backend)
 * - Uses AI-world design system (zinc-950 bg, amber accents)
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Phone, User, MessageSquare, ChevronRight, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react'
import { getStoredAttribution, getMetaCookies, getTracker } from '@/lib/tracker'

interface LeadCaptureFormProps {
  propertyId?: string
  propertyTitle?: string
  builderId?: string
  onClose?: () => void
  onSuccess?: (leadId: string) => void
  className?: string
  trigger?: 'modal' | 'inline'
}

interface FormState {
  name: string
  phone: string
  message: string
  budget: string
  timeline: string
  purpose: string
}

const BUDGET_OPTIONS = [
  { label: '₹30–50L', value: '40' },
  { label: '₹50–80L', value: '65' },
  { label: '₹80–120L', value: '100' },
  { label: '₹120–200L', value: '160' },
  { label: '₹200L+', value: '250' },
]
const TIMELINE_OPTIONS = [
  { label: 'Immediately', value: '1' },
  { label: '3 months', value: '3' },
  { label: '6 months', value: '6' },
  { label: '1 year+', value: '12' },
]
const PURPOSE_OPTIONS = [
  { label: 'Self Use', value: 'self_use' },
  { label: 'Investment', value: 'investment' },
  { label: 'Rental', value: 'rental' },
]

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

function generateEventId(): string {
  return `lead_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export default function LeadCaptureForm({
  propertyId,
  propertyTitle,
  builderId,
  onClose,
  onSuccess,
  className = '',
  trigger = 'modal',
}: LeadCaptureFormProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState<FormState>({
    name: '',
    phone: '',
    message: '',
    budget: '',
    timeline: '',
    purpose: '',
  })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [leadId, setLeadId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const phoneRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    phoneRef.current?.focus()
    getTracker().trackLeadFormOpen(propertyId)
  }, [propertyId])

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim()) return
    setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const attribution = getStoredAttribution()
    const { fbc, fbp } = getMetaCookies()
    const eventId = generateEventId()

    // Fire browser-side fbq pixel FIRST (before server call for CAPI dedup)
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Lead', {
        event_id: eventId,
        content_name: propertyTitle || 'Property Inquiry',
        currency: 'INR',
        value: parseFloat(form.budget || '0') * 100000,
      })
    }

    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        phone: form.phone,
        message: form.message || `Interested in ${propertyTitle || 'your properties'} in Chennai.`,
        event_id: eventId,
        ...attribution,
        fbc,
        fbp,
      }
      if (propertyId) payload.property_id = propertyId
      if (builderId) payload.builder_id = builderId
      if (form.budget) payload.budget = parseFloat(form.budget)
      if (form.timeline) payload.timeline_months = parseInt(form.timeline)
      if (form.purpose) payload.purpose = form.purpose

      // Call FastAPI backend via Next.js proxy or directly
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''
      const resp = await fetch(`${backendUrl}/api/leads/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        throw new Error(err.detail || 'Failed to submit')
      }

      const data = await resp.json()
      setLeadId(data.lead_id)
      setStatus('success')
      getTracker().trackLeadFormSubmit(propertyId)
      onSuccess?.(data.lead_id)
    } catch (err) {
      console.error('[LeadCaptureForm] Error:', err)
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const update = (field: keyof FormState) => (val: string) => setForm(f => ({ ...f, [field]: val }))

  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex flex-col items-center justify-center gap-6 p-8 text-center ${className}`}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.1 }}
          className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center"
        >
          <CheckCircle2 className="w-8 h-8 text-amber-400" />
        </motion.div>
        <div>
          <h3 className="text-xl font-semibold text-zinc-100 mb-2">You're all set!</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Our AI assistant Priya will reach you on WhatsApp within minutes with personalised property options.
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Close
          </button>
        )}
      </motion.div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-0 right-0 p-2 text-zinc-500 hover:text-zinc-300 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-amber-400 font-medium tracking-wider uppercase">AI-Powered Matching</span>
        </div>
        <h2 className="text-xl font-semibold text-zinc-100">
          {propertyTitle ? `Inquire about ${propertyTitle}` : 'Find Your Dream Home'}
        </h2>
        <p className="text-sm text-zinc-400 mt-1">Zero commission • Direct builder connect • Instant response</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
              s === step ? 'bg-amber-500 text-black' :
              s < step ? 'bg-amber-500/30 text-amber-400' :
              'bg-white/5 text-zinc-500'
            }`}>
              {s}
            </div>
            {s < 2 && <div className={`h-px w-8 transition-colors ${s < step ? 'bg-amber-500/50' : 'bg-white/10'}`} />}
          </div>
        ))}
        <span className="text-xs text-zinc-500 ml-2">{step === 1 ? 'Contact details' : 'Preferences'}</span>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.form
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleStep1}
            className="space-y-4"
          >
            {/* Name */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Your name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={form.name}
                  onChange={e => update('name')(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.06] transition-all"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium">WhatsApp number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <span className="absolute left-9 top-1/2 -translate-y-1/2 text-sm text-zinc-400">+91</span>
                <input
                  ref={phoneRef}
                  type="tel"
                  value={form.phone}
                  onChange={e => update('phone')(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit number"
                  pattern="[0-9]{10}"
                  required
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-16 pr-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.06] transition-all"
                />
              </div>
              <p className="text-xs text-zinc-600 mt-1">Our AI assistant Priya will reach you on WhatsApp</p>
            </div>

            {/* Message (optional) */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Message <span className="text-zinc-600">(optional)</span></label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                <textarea
                  value={form.message}
                  onChange={e => update('message')(e.target.value)}
                  placeholder="Any specific requirements?"
                  rows={3}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.06] transition-all resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.form>
        ) : (
          <motion.form
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Budget */}
            <div>
              <label className="block text-xs text-zinc-400 mb-2 font-medium">Budget range</label>
              <div className="flex flex-wrap gap-2">
                {BUDGET_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update('budget')(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      form.budget === opt.value
                        ? 'bg-amber-500/20 border-amber-400/50 text-amber-400'
                        : 'bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div>
              <label className="block text-xs text-zinc-400 mb-2 font-medium">When are you looking to buy?</label>
              <div className="flex flex-wrap gap-2">
                {TIMELINE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update('timeline')(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      form.timeline === opt.value
                        ? 'bg-amber-500/20 border-amber-400/50 text-amber-400'
                        : 'bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-xs text-zinc-400 mb-2 font-medium">Purpose of purchase</label>
              <div className="flex gap-2">
                {PURPOSE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update('purpose')(opt.value)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                      form.purpose === opt.value
                        ? 'bg-amber-500/20 border-amber-400/50 text-amber-400'
                        : 'bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-xs text-red-400">{errorMsg}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-3 rounded-xl border border-white/[0.08] text-sm text-zinc-400 hover:text-zinc-200 hover:border-white/20 transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Connecting...
                  </span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Get Instant Callback
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-zinc-600 text-center">
              By submitting, you agree to be contacted via WhatsApp. Zero spam, guaranteed.
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
