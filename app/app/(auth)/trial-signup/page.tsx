'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import {
  ArrowRight,
  Phone,
  Mail,
  Building2,
  MapPin,
  Home,
  Users,
  CheckCircle2,
  Loader2,
  Sparkles,
  BarChart3,
  Shield,
  Megaphone,
} from 'lucide-react'

function generateSecurePassword(length: number = 16): string {
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?'
  const array = new Uint32Array(length)
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(array)
  } else {
    for (let i = 0; i < length; i++) array[i] = Math.floor(Math.random() * 4294967295)
  }
  let out = ''
  for (let i = 0; i < length; i++) out += alphabet[array[i] % alphabet.length]
  return out
}

type FormState = {
  companyName: string
  name: string
  phone: string
  email: string
  location: string
  properties: string
  accepted: boolean
}

const defaultForm: FormState = {
  companyName: '',
  name: '',
  phone: '',
  email: '',
  location: '',
  properties: '',
  accepted: false,
}

const locations = ['Chennai']
const propertyBands = ['1-5', '6-20', '21-50', '51-100', '100+']

export default function TrialSignupPage() {
  const router = useRouter()
  const supabase = useMemo(() => getSupabase(), [])

  const [form, setForm] = useState<FormState>({ ...defaultForm })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // OTP
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [resendIn, setResendIn] = useState<number>(0)

  const formRef = useRef<HTMLDivElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as any
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const canSubmit =
    !!form.companyName &&
    !!form.name &&
    !!form.phone &&
    !!form.email &&
    !!form.location &&
    !!form.properties &&
    !!form.accepted &&
    phoneVerified &&
    !loading

  const sendOtp = useCallback(async () => {
    setError(null)
    if (!form.phone) {
      setError('Enter your mobile number to receive OTP')
      return
    }
    const phoneOk = /^\+?[0-9]{10,13}$/.test(form.phone.replace(/\s|-/g, ''))
    if (!phoneOk) {
      setError('Enter a valid phone number with country code')
      return
    }
    if (resendIn > 0) return
    try {
      setOtpVerifying(true)
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        phone: form.phone,
        options: { channel: 'sms' } as any,
      })
      if (otpErr) throw otpErr
      setOtpSent(true)
      setSuccess('OTP sent to your mobile')
      setResendIn(30)
      const timer = setInterval(() => {
        setResendIn((n) => {
          if (n <= 1) { clearInterval(timer); return 0 }
          return n - 1
        })
        return undefined as unknown as number
      }, 1000)
    } catch (e: any) {
      if (process.env.NEXT_PUBLIC_FAKE_OTP === '1') {
        setOtpSent(true)
        setSuccess('Dev mode: use 000000 as OTP')
      } else {
        setError(e?.message || 'Could not send OTP. Try again.')
      }
    } finally {
      setOtpVerifying(false)
    }
  }, [form.phone, supabase.auth, resendIn])

  const verifyOtp = useCallback(async () => {
    setError(null)
    if (!otpCode || otpCode.length < 4) {
      setError('Enter the OTP you received')
      return
    }
    try {
      setOtpVerifying(true)
      if (process.env.NEXT_PUBLIC_FAKE_OTP === '1' && otpCode === '000000') {
        setPhoneVerified(true)
        setSuccess('Mobile verified')
        return
      }
      const { data, error: vErr } = await supabase.auth.verifyOtp({
        phone: form.phone,
        token: otpCode,
        type: 'sms',
      })
      if (vErr) throw vErr
      try {
        if (data?.session) await supabase.auth.signOut()
      } catch {}
      setPhoneVerified(true)
      setSuccess('Mobile verified')
    } catch (e: any) {
      setError(e?.message || 'Invalid OTP. Please try again.')
    } finally {
      setOtpVerifying(false)
    }
  }, [form.phone, otpCode, supabase.auth])

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()
      setError(null)
      setSuccess(null)
      if (!canSubmit) return
      setLoading(true)
      try {
        const password = generateSecurePassword()
        const { data, error: sErr } = await supabase.auth.signUp({
          email: form.email,
          password,
          options: {
            data: {
              name: form.name,
              company_name: form.companyName,
              phone: form.phone,
              location: form.location,
              properties_band: form.properties,
              phone_verified: phoneVerified,
              source: 'trial-signup',
            },
          },
        })
        if (sErr) {
          const msg = String(sErr.message || '').toLowerCase()
          if (msg.includes('registered') || msg.includes('already') || msg.includes('exists')) {
            setError('An account with this email already exists. You can sign in or reset your password.')
            return
          }
          throw sErr
        }
        const userId = data.user?.id
        if (userId) {
          await fetch('/api/trial/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ builderId: userId, email: form.email }),
          }).catch(() => undefined)
        }
        setSuccess('Account created! Check your email to verify.')
        router.push('/builder/trial')
      } catch (e: any) {
        setError(e?.message || 'Could not start trial. Try again.')
      } finally {
        setLoading(false)
      }
    },
    [canSubmit, form, phoneVerified, router, supabase.auth]
  )

  const inputClass =
    'w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-all'
  const selectClass =
    'w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-all appearance-none'
  const labelClass = 'block text-xs font-medium text-zinc-400 mb-1.5'

  return (
    <>
      <Header />

      <main className="min-h-screen bg-zinc-950 pt-16">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[100px]" />

          <div className="relative container-page py-12 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
              {/* LEFT — Value proposition */}
              <div className="space-y-8">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full">
                    <Sparkles className="w-3.5 h-3.5" />
                    Free 14-day trial
                  </div>

                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-100 leading-tight mb-4">
                    List your properties.{' '}
                    <span className="text-amber-400">We handle the rest.</span>
                  </h1>

                  <p className="text-base text-zinc-400 leading-relaxed max-w-lg">
                    You focus on building great projects. We bring you verified,
                    qualified buyers through our marketing engine — so you never
                    chase a lead again.
                  </p>
                </div>

                {/* How it works — clear value */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">How it works</h3>

                  <div className="space-y-3">
                    {[
                      {
                        icon: Building2,
                        title: 'You add your properties',
                        desc: 'Upload project details, images, and pricing. Or share with us — we\'ll set it up for you.',
                      },
                      {
                        icon: Megaphone,
                        title: 'We run your marketing',
                        desc: 'Our team handles buyer outreach, ad campaigns, and lead generation across channels.',
                      },
                      {
                        icon: BarChart3,
                        title: 'You get qualified leads',
                        desc: 'Every lead is verified and scored. Track everything from your dashboard.',
                      },
                    ].map((step, i) => (
                      <div key={i} className="flex gap-4 p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
                        <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                          <step.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-200">{step.title}</p>
                          <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trust signals */}
                <div className="flex flex-wrap items-center gap-4">
                  {[
                    { icon: Shield, text: 'RERA-aligned' },
                    { icon: CheckCircle2, text: 'Verified buyers only' },
                    { icon: Sparkles, text: 'AI-powered scoring' },
                  ].map((badge) => (
                    <div key={badge.text} className="flex items-center gap-2 text-xs text-zinc-500">
                      <badge.icon className="w-3.5 h-3.5 text-emerald-500" />
                      {badge.text}
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT — Form */}
              <div ref={formRef} id="trial-form">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8">
                  <h2 className="text-xl font-bold text-zinc-100 mb-1">Start your free trial</h2>
                  <p className="text-sm text-zinc-500 mb-6">No credit card required. 14 days, full access.</p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Company */}
                    <div>
                      <label className={labelClass}>
                        <Building2 className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                        Builder / Company Name
                      </label>
                      <input
                        required
                        name="companyName"
                        value={form.companyName}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="Your company name"
                      />
                    </div>

                    {/* Name */}
                    <div>
                      <label className={labelClass}>
                        <Users className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                        Your Name
                      </label>
                      <input
                        required
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="Full name"
                      />
                    </div>

                    {/* Phone + OTP */}
                    <div>
                      <label className={labelClass}>
                        <Phone className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                        Mobile Number
                      </label>
                      <div className="flex gap-2">
                        <input
                          required
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          className={`${inputClass} flex-1`}
                          placeholder="+91XXXXXXXXXX"
                          inputMode="tel"
                        />
                        <button
                          type="button"
                          onClick={sendOtp}
                          disabled={otpVerifying || !form.phone || resendIn > 0}
                          className="shrink-0 px-4 py-2.5 bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-300 rounded-lg hover:bg-zinc-700 hover:text-zinc-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {otpSent ? (resendIn > 0 ? `${resendIn}s` : 'Resend') : 'Send OTP'}
                        </button>
                      </div>
                    </div>

                    {otpSent && (
                      <div>
                        <label className={labelClass}>Enter OTP</label>
                        <div className="flex gap-2">
                          <input
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            className={`${inputClass} flex-1`}
                            placeholder="6-digit code"
                            inputMode="numeric"
                          />
                          <button
                            type="button"
                            onClick={verifyOtp}
                            disabled={otpVerifying || phoneVerified}
                            className={`shrink-0 px-4 py-2.5 text-xs font-medium rounded-lg transition-all ${
                              phoneVerified
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                            } disabled:cursor-not-allowed`}
                          >
                            {phoneVerified ? 'Verified' : 'Verify'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Email */}
                    <div>
                      <label className={labelClass}>
                        <Mail className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                        Email
                      </label>
                      <input
                        required
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="you@company.com"
                      />
                    </div>

                    {/* Location + Properties */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>
                          <MapPin className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                          City
                        </label>
                        <select
                          required
                          name="location"
                          value={form.location}
                          onChange={handleChange}
                          className={selectClass}
                        >
                          <option value="" disabled>Select</option>
                          {locations.map((loc) => (
                            <option key={loc} value={loc}>{loc}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>
                          <Home className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                          Properties
                        </label>
                        <select
                          required
                          name="properties"
                          value={form.properties}
                          onChange={handleChange}
                          className={selectClass}
                        >
                          <option value="" disabled>Select</option>
                          {propertyBands.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Terms */}
                    <label className="flex items-start gap-2.5 text-xs text-zinc-500 cursor-pointer">
                      <input
                        type="checkbox"
                        name="accepted"
                        checked={form.accepted}
                        onChange={handleChange}
                        className="mt-0.5 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500/25"
                      />
                      <span>
                        I agree to the{' '}
                        <a href="/terms" className="text-amber-400 hover:text-amber-300">Terms</a> and{' '}
                        <a href="/privacy" className="text-amber-400 hover:text-amber-300">Privacy Policy</a>
                      </span>
                    </label>

                    {/* Messages */}
                    {error && (
                      <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                        {error}
                      </div>
                    )}
                    {success && (
                      <div className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">
                        {success}
                      </div>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Starting trial...
                        </>
                      ) : (
                        <>
                          Start Free Trial
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
