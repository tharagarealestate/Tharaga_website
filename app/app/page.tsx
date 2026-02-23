'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/sections/Footer'
import { AuthButton } from '@/components/ui/AuthButton'
import {
  Shield,
  Zap,
  Building2,
  TrendingUp,
  Brain,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  MessageSquare,
  Target,
  Calculator,
  Sparkles,
  Search,
  Home,
  Users,
  Star,
  MapPin,
  IndianRupee,
  Clock,
  HeartHandshake,
} from 'lucide-react'

/* ─── Data ─── */

const builderFeatures = [
  {
    icon: Brain,
    title: 'AI Lead Scoring',
    description: 'Automatically score and classify leads using behavioral signals, budget alignment, and engagement patterns.',
    badge: 'AI-Powered',
    href: '/builder?section=leads',
  },
  {
    icon: Target,
    title: 'Smart Pipeline',
    description: 'Kanban-style pipeline with 9 stages, automated stage tracking, and weighted deal values.',
    badge: 'CRM',
    href: '/builder?section=contacts',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Real-time metrics, conversion funnels, geographic heat maps, and revenue forecasting.',
    badge: 'Analytics',
    href: '/builder?section=analytics',
  },
  {
    icon: MessageSquare,
    title: 'Multi-Channel Messaging',
    description: 'Send personalized messages via Email, WhatsApp, and SMS — all from one dashboard.',
    badge: 'Automation',
    href: '/builder?section=client-outreach',
  },
  {
    icon: Zap,
    title: 'Workflow Automation',
    description: 'Visual workflow builder with behavioral triggers, AI-generated nurture sequences, and auto-assignment.',
    badge: 'AI-Powered',
    href: '/builder?section=overview',
  },
  {
    icon: Shield,
    title: 'RERA Compliance',
    description: 'Built-in RERA verification, project monitoring, and compliance tracking for Tamil Nadu.',
    badge: 'Trust',
    href: '/tools/verification',
  },
]

const buyerBenefits = [
  {
    icon: IndianRupee,
    title: 'Zero Brokerage',
    description: 'Connect directly with builders. No middlemen, no hidden fees, no commission.',
  },
  {
    icon: Shield,
    title: 'RERA Verified Only',
    description: 'Every property is verified with RERA compliance. Your investment is protected.',
  },
  {
    icon: Brain,
    title: 'AI Recommendations',
    description: 'Get personalized property suggestions based on your budget, lifestyle, and preferences.',
  },
  {
    icon: Calculator,
    title: 'Smart Financial Tools',
    description: 'EMI calculator, ROI analysis, loan eligibility — plan your finances with AI.',
  },
]

const tools = [
  { icon: TrendingUp, title: 'ROI Calculator', desc: 'Rental yield, appreciation, and total returns', href: '/tools/roi' },
  { icon: Calculator, title: 'EMI Calculator', desc: 'Home loan EMI, interest, and amortization', href: '/tools/emi' },
  { icon: Building2, title: 'Budget Planner', desc: 'Plan budget and find affordable properties', href: '/tools/budget-planner' },
  { icon: Shield, title: 'Loan Eligibility', desc: 'Check home loan eligibility with TN banks', href: '/tools/loan-eligibility' },
  { icon: Target, title: 'Neighborhood Finder', desc: 'Find the perfect area for your needs', href: '/tools/neighborhood-finder' },
  { icon: BarChart3, title: 'Property Valuation', desc: 'Accurate valuation with RERA data', href: '/tools/property-valuation' },
]

const stats = [
  { value: '0%', label: 'Brokerage', icon: IndianRupee },
  { value: '100%', label: 'RERA Verified', icon: Shield },
  { value: '500+', label: 'Properties', icon: Home },
  { value: '50+', label: 'Builders', icon: Building2 },
]

const testimonials = [
  {
    name: 'Rajesh Kumar',
    role: 'Home Buyer, Chennai',
    quote: 'Found my dream home without paying a single rupee in brokerage. The AI recommendations were spot-on.',
    rating: 5,
  },
  {
    name: 'Priya Constructions',
    role: 'Builder, Coimbatore',
    quote: 'Our lead conversion improved dramatically with the AI scoring. We close 3x faster now.',
    rating: 5,
  },
  {
    name: 'Arun Shankar',
    role: 'First-time Buyer, Madurai',
    quote: 'The EMI calculator and RERA verification gave me complete confidence in my purchase.',
    rating: 5,
  },
]

/* ─── Component ─── */

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'buyer' | 'builder'>('buyer')

  return (
    <>
      <Header />

      <main>
        {/* ════════ HERO ════════ */}
        <section className="relative min-h-[92vh] flex items-center pt-16 overflow-hidden">
          {/* Layered background */}
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-amber-500/5 rounded-full blur-[140px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-500/3 rounded-full blur-[100px]" />

          <div className="relative container-page py-20 md:py-28">
            <div className="max-w-5xl mx-auto text-center">
              {/* Pill badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-sm font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full backdrop-blur-sm">
                <Sparkles className="w-4 h-4" />
                AI-Powered &middot; Zero Commission &middot; RERA Verified
              </div>

              <h1 className="mb-6">
                <span className="block text-zinc-100 text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
                  Your real estate journey,
                </span>
                <span className="block text-gradient-brand text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mt-2">
                  reimagined with AI
                </span>
              </h1>

              <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                India&apos;s first AI-powered zero-commission platform. Buyers find dream homes.
                Builders close deals faster. No brokers. No hidden fees.
              </p>

              {/* ── Dual Audience Toggle ── */}
              <div className="flex items-center justify-center mb-8">
                <div className="inline-flex bg-zinc-900 border border-zinc-800 rounded-2xl p-1.5">
                  <button
                    onClick={() => setActiveTab('buyer')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      activeTab === 'buyer'
                        ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Search className="w-4 h-4" />
                    I&apos;m Buying
                  </button>
                  <button
                    onClick={() => setActiveTab('builder')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      activeTab === 'builder'
                        ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    I&apos;m a Builder
                  </button>
                </div>
              </div>

              {/* ── Audience-specific CTA ── */}
              <div className="min-h-[140px]">
                {activeTab === 'buyer' ? (
                  <div className="animate-fade-in">
                    <p className="text-zinc-400 mb-6 text-base">
                      Browse 500+ RERA-verified properties across Tamil Nadu — zero brokerage, direct from builders.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <Link
                        href="/property-listing"
                        className="inline-flex items-center gap-2 h-13 px-8 bg-amber-500 text-zinc-950 font-bold rounded-2xl hover:bg-amber-400 transition-all active:scale-[0.98] shadow-lg shadow-amber-500/25 text-base"
                      >
                        <Search className="w-5 h-5" />
                        Explore Properties
                      </Link>
                      <Link
                        href="/tools/emi"
                        className="inline-flex items-center gap-2 h-13 px-8 border border-zinc-700 text-zinc-200 font-medium rounded-2xl hover:bg-zinc-800 hover:border-zinc-600 transition-all text-base"
                      >
                        <Calculator className="w-5 h-5" />
                        EMI Calculator
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="animate-fade-in">
                    <p className="text-zinc-400 mb-6 text-base">
                      AI-powered CRM, lead scoring, and marketing automation built for Indian real estate builders.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <Link
                        href="/trial-signup"
                        className="inline-flex items-center gap-2 h-13 px-8 bg-amber-500 text-zinc-950 font-bold rounded-2xl hover:bg-amber-400 transition-all active:scale-[0.98] shadow-lg shadow-amber-500/25 text-base"
                      >
                        <Zap className="w-5 h-5" />
                        Start Free Trial
                      </Link>
                      <Link
                        href="/builder"
                        className="inline-flex items-center gap-2 h-13 px-8 border border-zinc-700 text-zinc-200 font-medium rounded-2xl hover:bg-zinc-800 hover:border-zinc-600 transition-all text-base"
                      >
                        <BarChart3 className="w-5 h-5" />
                        View Dashboard
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Stats Row ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto mt-12">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="group bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 text-center hover:border-amber-500/30 transition-all duration-300"
                  >
                    <stat.icon className="w-5 h-5 text-amber-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-2xl md:text-3xl font-extrabold font-mono text-amber-400 mb-1">{stat.value}</p>
                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ════════ SOCIAL PROOF / TESTIMONIALS ════════ */}
        <section className="py-16 border-t border-zinc-800/50 bg-zinc-900/20">
          <div className="container-page">
            <div className="text-center mb-10">
              <p className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">TRUSTED BY</p>
              <h2 className="text-2xl md:text-3xl font-bold text-zinc-100">
                Real people, real results
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {testimonials.map((t) => (
                <div
                  key={t.name}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-amber-500/20 transition-all duration-300"
                >
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed mb-4 italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xs font-bold">
                      {t.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-200">{t.name}</p>
                      <p className="text-xs text-zinc-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════ FOR BUYERS ════════ */}
        <section className="section-gap border-t border-zinc-800/50">
          <div className="container-page">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full uppercase tracking-wider">
                <Home className="w-3.5 h-3.5" />
                For Home Buyers
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4">
                Find your dream home, commission-free
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto text-base">
                Browse verified properties directly from builders. No middlemen, no hidden charges, no brokerage.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {buyerBenefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="group bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-emerald-500/30 hover:bg-zinc-900/80 transition-all duration-300"
                >
                  <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 w-fit mb-4 group-hover:bg-emerald-500/20 group-hover:scale-105 transition-all">
                    <benefit.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-100 mb-2">{benefit.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link
                href="/property-listing"
                className="inline-flex items-center gap-2 h-12 px-8 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-400 transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20"
              >
                Browse Properties <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ════════ FOR BUILDERS ════════ */}
        <section className="section-gap bg-zinc-900/30 border-t border-zinc-800/50">
          <div className="container-page">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5" />
                For Builders
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4">
                Close deals faster with AI
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto text-base">
                A complete operating system for real estate — from lead capture to closing, powered by AI at every step.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {builderFeatures.map((feature) => (
                <Link
                  key={feature.title}
                  href={feature.href}
                  className="group bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-amber-500/30 hover:bg-zinc-900/80 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 group-hover:bg-amber-500/20 group-hover:scale-105 transition-all">
                      <feature.icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-zinc-500 bg-zinc-800 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {feature.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-zinc-100 mb-2 group-hover:text-amber-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed mb-3">
                    {feature.description}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
                    Learn more <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link
                href="/trial-signup"
                className="inline-flex items-center gap-2 h-12 px-8 bg-amber-500 text-zinc-950 font-bold rounded-2xl hover:bg-amber-400 transition-all active:scale-[0.98] shadow-lg shadow-amber-500/20"
              >
                Start Free 14-Day Trial <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ════════ SMART CALCULATORS ════════ */}
        <section className="section-gap border-t border-zinc-800/50">
          <div className="container-page">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full uppercase tracking-wider">
                <Calculator className="w-3.5 h-3.5" />
                Free Tools
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4">
                Smart calculators for informed decisions
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto text-base">
                AI-powered financial tools built for the Indian real estate market.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tools.map((tool) => (
                <Link
                  key={tool.title}
                  href={tool.href}
                  className="group bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300"
                >
                  <div className="p-3 bg-zinc-800 rounded-xl text-zinc-400 group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-all w-fit mb-4">
                    <tool.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-100 mb-1.5 group-hover:text-blue-400 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-zinc-500 mb-4">{tool.desc}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
                    Calculate Now <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ════════ HOW IT WORKS ════════ */}
        <section className="section-gap bg-zinc-900/30 border-t border-zinc-800/50">
          <div className="container-page">
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">HOW IT WORKS</p>
              <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4">From sign-up to closing in 3 steps</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                {
                  step: '01',
                  icon: Users,
                  title: 'Create your account',
                  desc: 'Sign up as a builder or buyer in 30 seconds. No credit card required. Get instant access.',
                },
                {
                  step: '02',
                  icon: Home,
                  title: 'Add properties & capture leads',
                  desc: 'Upload listings, configure lead forms, and let AI score every inquiry automatically.',
                },
                {
                  step: '03',
                  icon: HeartHandshake,
                  title: 'Close deals with AI',
                  desc: 'Smart pipeline, automated follow-ups, and AI insights to convert leads into buyers faster.',
                },
              ].map((item, idx) => (
                <div key={item.step} className="relative text-center group">
                  {/* Connector line */}
                  {idx < 2 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-amber-500/30 to-transparent" />
                  )}
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-5 group-hover:bg-amber-500/20 group-hover:scale-105 transition-all">
                    <item.icon className="w-7 h-7" />
                  </div>
                  <div className="text-xs font-mono font-bold text-amber-500/60 mb-2">{item.step}</div>
                  <h3 className="text-lg font-bold text-zinc-100 mb-2">{item.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                href="/trial-signup"
                className="inline-flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors"
              >
                Get started now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ════════ FINAL CTA ════════ */}
        <section className="section-gap border-t border-zinc-800/50">
          <div className="container-page">
            <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border border-zinc-800 rounded-3xl p-8 md:p-16 text-center overflow-hidden">
              {/* Glow effects */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-amber-500/10 rounded-full blur-[100px]" />
              <div className="absolute bottom-0 right-0 w-[300px] h-[200px] bg-amber-500/5 rounded-full blur-[80px]" />

              <div className="relative">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full">
                  <Sparkles className="w-3.5 h-3.5" />
                  Free 14-day trial
                </div>

                <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4">
                  Ready to transform your real estate journey?
                </h2>
                <p className="text-zinc-400 max-w-xl mx-auto mb-8 text-base">
                  Join thousands of buyers and builders who are already using Tharaga to buy, sell, and manage properties smarter.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/trial-signup"
                    className="inline-flex items-center gap-2 h-13 px-8 bg-amber-500 text-zinc-950 font-bold rounded-2xl hover:bg-amber-400 transition-all active:scale-[0.98] shadow-lg shadow-amber-500/25"
                  >
                    Start Free Trial <ArrowRight className="w-4 h-4" />
                  </Link>
                  <AuthButton
                    className="inline-flex items-center gap-2 h-13 px-8 border border-zinc-700 text-zinc-300 hover:text-zinc-100 hover:border-zinc-600 font-medium rounded-2xl transition-all"
                  >
                    Sign In
                  </AuthButton>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-xs text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 14-day free trial
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> No credit card required
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Cancel anytime
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> RERA compliant
                  </span>
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
