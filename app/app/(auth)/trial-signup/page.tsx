'use client'

import { useState } from 'react'
import { Building2, ArrowRight, CheckCircle2 } from 'lucide-react'

export default function TrialSignupPage() {
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({})

  function validate() {
    const e: typeof errors = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email format'
    if (!form.phone.trim()) e.phone = 'Phone is required'
    return e
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <CheckCircle2 className="w-16 h-16 text-amber-400 mx-auto" />
          <h1 className="text-2xl font-bold text-zinc-100">Verify your number</h1>
          <p className="text-zinc-400">We sent an OTP to <strong className="text-zinc-200">{form.phone}</strong></p>
          <input
            name="otp"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter 6-digit OTP"
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 text-center text-xl tracking-widest"
          />
          <button
            type="button"
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all"
            onClick={() => { window.location.href = '/builder' }}
          >
            Verify &amp; Get Started
          </button>
          <a href="/trial-signup" className="block text-sm text-zinc-500 hover:text-zinc-400 transition-colors">
            ← Back
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-amber-500/8 blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full bg-amber-600/5 blur-[140px]" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 justify-center">
          <Building2 className="w-6 h-6 text-amber-400" />
          <span className="font-bold text-lg text-zinc-100 tracking-tight">Tharaga</span>
        </a>

        {/* Heading */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-zinc-100">
            Start Your Free Trial
          </h1>
          <p className="text-zinc-400">14 days free. No credit card required.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
          <div>
            <label htmlFor="trial-name" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Full Name
            </label>
            <input
              id="trial-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Your full name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="trial-email" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Work Email
            </label>
            <input
              id="trial-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@yourcompany.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="trial-phone" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Mobile Number
            </label>
            <input
              id="trial-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="9876543210"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone}</p>}
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all mt-2 shadow-lg shadow-amber-500/20"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500">
          Already have an account?{' '}
          <a href="/builder" className="text-amber-400 hover:text-amber-300 transition-colors font-medium">
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}
