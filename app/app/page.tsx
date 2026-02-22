import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
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
} from 'lucide-react'

const features = [
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

const tools = [
  { icon: TrendingUp, title: 'ROI Calculator', desc: 'Rental yield, appreciation, and total returns', href: '/tools/roi' },
  { icon: Calculator, title: 'EMI Calculator', desc: 'Home loan EMI, interest, and amortization', href: '/tools/emi' },
  { icon: Building2, title: 'Budget Planner', desc: 'Plan budget and find affordable properties', href: '/tools/budget-planner' },
  { icon: Shield, title: 'Loan Eligibility', desc: 'Check home loan eligibility with TN banks', href: '/tools/loan-eligibility' },
  { icon: Target, title: 'Neighborhood Finder', desc: 'Find the perfect area for your needs', href: '/tools/neighborhood-finder' },
  { icon: BarChart3, title: 'Property Valuation', desc: 'Accurate valuation with RERA data', href: '/tools/property-valuation' },
]

export default function HomePage() {
  return (
    <>
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center pt-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px]" />

          <div className="relative container-page py-20 md:py-32">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-sm font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full">
                <Sparkles className="w-4 h-4" />
                AI-Powered &middot; Zero Commission &middot; RERA Verified
              </div>

              <h1 className="mb-6">
                <span className="block text-zinc-100">Build your real estate</span>
                <span className="block text-gradient-brand">empire with AI</span>
              </h1>

              <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                India&apos;s AI-powered zero-commission platform.
                Builders list properties, we handle marketing.
                Buyers connect directly — no brokers, no hidden fees.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                <Link
                  href="/property-listing"
                  className="inline-flex items-center gap-2 h-12 px-8 bg-amber-500 text-zinc-950 font-semibold rounded-xl hover:bg-amber-400 transition-all active:scale-[0.98] shadow-lg shadow-amber-500/20"
                >
                  Explore Properties
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <AuthButton
                  className="inline-flex items-center gap-2 h-12 px-8 border border-zinc-700 text-zinc-200 font-medium rounded-xl hover:bg-zinc-800 hover:border-zinc-600 transition-all"
                >
                  Sign In
                </AuthButton>
              </div>

              <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                {[
                  { value: '0%', label: 'Brokerage' },
                  { value: 'RERA', label: 'Verified Only' },
                  { value: 'Tamil Nadu', label: 'Coverage' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
                    <p className="text-xl md:text-2xl font-bold font-mono text-amber-400 mb-1">{stat.value}</p>
                    <p className="text-xs text-zinc-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section — clickable cards */}
        <section className="section-gap border-t border-zinc-800/50">
          <div className="container-page">
            <div className="text-center mb-12">
              <p className="text-sm font-medium text-amber-400 mb-3">PLATFORM</p>
              <h2 className="text-zinc-100 mb-4">Everything you need to close deals faster</h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                A complete operating system for real estate — from lead capture to closing, powered by AI at every step.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature) => (
                <Link
                  key={feature.title}
                  href={feature.href}
                  className="group bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-amber-500/30 hover:bg-zinc-900/80 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                      <feature.icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-zinc-500 bg-zinc-800 px-2.5 py-1 rounded-full">
                      {feature.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-100 mb-2 group-hover:text-amber-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed mb-3">
                    {feature.description}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Learn more <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Smart Calculators */}
        <section className="section-gap bg-zinc-900/30 border-t border-zinc-800/50">
          <div className="container-page">
            <div className="text-center mb-12">
              <p className="text-sm font-medium text-amber-400 mb-3">TOOLS</p>
              <h2 className="text-zinc-100 mb-4">Smart calculators for informed decisions</h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                AI-powered financial tools built for the Indian real estate market.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tools.map((tool) => (
                <Link
                  key={tool.title}
                  href={tool.href}
                  className="group bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-amber-500/30 transition-all duration-200"
                >
                  <div className="p-2.5 bg-zinc-800 rounded-lg text-zinc-400 group-hover:bg-amber-500/10 group-hover:text-amber-400 transition-colors w-fit mb-4">
                    <tool.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-zinc-100 mb-1.5 group-hover:text-amber-400 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-zinc-500 mb-4">{tool.desc}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Calculate Now <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="section-gap border-t border-zinc-800/50">
          <div className="container-page">
            <div className="text-center mb-12">
              <p className="text-sm font-medium text-amber-400 mb-3">HOW IT WORKS</p>
              <h2 className="text-zinc-100 mb-4">From sign-up to closing in 3 steps</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { step: '01', title: 'Create your account', desc: 'Sign up as a builder or buyer in 30 seconds. No credit card required. Get instant access to all features.' },
                { step: '02', title: 'Add properties & capture leads', desc: 'Upload your listings, configure lead forms, and let AI score and classify every inquiry automatically.' },
                { step: '03', title: 'Close deals with AI', desc: 'Use smart pipeline, automated follow-ups, and AI insights to convert leads into buyers faster.' },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono font-bold text-sm mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-100 mb-2">{item.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link
                href="/trial-signup"
                className="inline-flex items-center gap-2 text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors"
              >
                Get started now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* For Buyers Section */}
        <section className="section-gap bg-zinc-900/30 border-t border-zinc-800/50">
          <div className="container-page">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-sm font-medium text-amber-400 mb-3">FOR BUYERS</p>
                <h2 className="text-zinc-100 mb-4">Find your dream home, commission-free</h2>
                <p className="text-zinc-400 mb-8 leading-relaxed">
                  Browse verified properties directly from builders. No middlemen, no hidden charges,
                  no brokerage. Deal directly and save.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    'RERA-verified properties only',
                    'Direct builder connection — zero brokerage',
                    'AI-powered property recommendations',
                    'Smart calculators for financial planning',
                    'Real-time property market insights',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/property-listing"
                  className="inline-flex items-center gap-2 h-11 px-6 bg-amber-500 text-zinc-950 font-semibold rounded-xl hover:bg-amber-400 transition-all active:scale-[0.98]"
                >
                  Browse Properties <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
                <div className="space-y-4">
                  {[
                    { label: 'Brokerage fees', value: '₹0', color: 'text-emerald-400' },
                    { label: 'Property verification', value: 'RERA Only', color: 'text-amber-400' },
                    { label: 'Region coverage', value: 'Tamil Nadu', color: 'text-blue-400' },
                    { label: 'AI-powered features', value: 'Lead Scoring', color: 'text-purple-400' },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                      <span className="text-sm text-zinc-400">{stat.label}</span>
                      <span className={`text-lg font-bold font-mono ${stat.color}`}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section-gap border-t border-zinc-800/50">
          <div className="container-page">
            <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-8 md:p-16 text-center overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-amber-500/10 rounded-full blur-[80px]" />

              <div className="relative">
                <h2 className="text-zinc-100 mb-4">Ready to transform your real estate business?</h2>
                <p className="text-zinc-400 max-w-xl mx-auto mb-8">
                  Join builders who are closing deals faster with AI-powered lead scoring,
                  automated workflows, and real-time analytics.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/trial-signup"
                    className="inline-flex items-center gap-2 h-12 px-8 bg-amber-500 text-zinc-950 font-semibold rounded-xl hover:bg-amber-400 transition-all active:scale-[0.98] shadow-lg shadow-amber-500/20"
                  >
                    Start Free Trial <ArrowRight className="w-4 h-4" />
                  </Link>
                  <AuthButton
                    className="inline-flex items-center gap-2 h-12 px-8 border border-zinc-700 text-zinc-300 hover:text-zinc-100 hover:border-zinc-600 font-medium rounded-xl transition-all"
                  >
                    Sign In
                  </AuthButton>
                </div>
                <div className="flex items-center justify-center gap-6 mt-6 text-xs text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 14-day free trial
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> No credit card required
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Cancel anytime
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
