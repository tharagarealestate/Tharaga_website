'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Shield, BarChart3, FileText, Building2, Users, MessageSquare,
  CheckCircle2, ArrowRight, Brain, Target, Zap, Sparkles, Globe,
} from 'lucide-react'

// ── Neural Background (same as homepage / tools) ──────────────────────────────
function NeuralBg() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950 to-black" />
      <div
        className="absolute inset-0 opacity-[0.022]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(251,191,36,1) 1px,transparent 1px),' +
            'linear-gradient(90deg,rgba(251,191,36,1) 1px,transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[360px]"
        style={{ background: 'radial-gradient(ellipse,rgba(251,191,36,0.05) 0%,transparent 65%)' }}
      />
      <div
        className="absolute w-96 h-96 rounded-full blur-3xl"
        style={{ background: 'rgba(251,191,36,0.05)', top: '12%', left: '2%', animation: 'tool-orb-1 22s ease-in-out infinite' }}
      />
      <div
        className="absolute w-72 h-72 rounded-full blur-3xl"
        style={{ background: 'rgba(168,85,247,0.04)', bottom: '18%', right: '4%', animation: 'tool-orb-2 28s ease-in-out infinite' }}
      />
      <div
        className="absolute w-56 h-56 rounded-full blur-3xl"
        style={{ background: 'rgba(16,185,129,0.03)', top: '55%', left: '60%', animation: 'tool-orb-1 35s ease-in-out infinite reverse' }}
      />
    </div>
  )
}

// ── Fade-up variants ──────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
}

// ── Data ──────────────────────────────────────────────────────────────────────
const builderCards = [
  {
    icon: Shield,
    iconColor: 'text-amber-400',
    badge: 'Lead Quality',
    badgeColor: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
    title: 'Serious buyers only',
    body: 'Every inquiry is OTP-verified and filtered by budget, location, and intent before it reaches the builder. No raw lead dumps.',
    check: 'Verified & Filtered',
    checkColor: 'text-emerald-400',
  },
  {
    icon: BarChart3,
    iconColor: 'text-amber-400',
    badge: 'Operational Excellence',
    badgeColor: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
    title: 'Workflows, not spreadsheets',
    body: 'Site visits, follow-ups, WhatsApp conversations, and document sharing all run through Tharaga — standardized, every time.',
    check: 'Standardized Processes',
    checkColor: 'text-emerald-400',
    featured: true,
  },
  {
    icon: FileText,
    iconColor: 'text-emerald-400',
    badge: 'Legal Trust',
    badgeColor: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
    title: 'Legal and trust built-in',
    body: 'Properties are paired with lawyer-verified document sets and clear checklists, turning a chaotic handover into a repeatable process.',
    check: 'Lawyer-Verified Docs',
    checkColor: 'text-emerald-400',
  },
]

const buyerCards = [
  {
    icon: Shield,
    iconColor: 'text-amber-400',
    badge: 'Transparency',
    badgeColor: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
    title: 'Verified projects & builders',
    body: 'Profiles, documents, and project data are structured and surfaced so families can quickly understand where they\'re putting their life savings.',
    check: 'Transparent Data',
    checkColor: 'text-emerald-400',
  },
  {
    icon: Users,
    iconColor: 'text-amber-400',
    badge: 'Buyer Focused',
    badgeColor: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
    title: 'Context, not pressure',
    body: 'Cinematic walkthroughs, locality insights, and finance helpers give buyers clarity before they ever speak to a sales person.',
    check: 'Informed Decisions',
    checkColor: 'text-emerald-400',
    featured: true,
  },
  {
    icon: MessageSquare,
    iconColor: 'text-emerald-400',
    badge: 'Direct Channel',
    badgeColor: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
    title: 'Direct, traceable conversations',
    body: 'Buyers talk to builders over secure, logged channels so promises and pricing don\'t get lost in the broker chain.',
    check: 'Secure & Logged',
    checkColor: 'text-emerald-400',
  },
]

const stats = [
  { label: 'Chennai Focus', value: '#1', sub: 'Builder Platform' },
  { label: 'Commission', value: '0%', sub: 'Broker-Free' },
  { label: 'Vision Year', value: '2035', sub: 'Tamil Nadu Default' },
  { label: 'Verification', value: 'RERA', sub: 'Certified Data' },
]

// ── Feature Card ──────────────────────────────────────────────────────────────
function FeatureCard({
  card, delay,
}: {
  card: (typeof builderCards)[0]
  delay: number
}) {
  const Icon = card.icon
  return (
    <motion.div
      custom={delay}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      className={[
        'relative rounded-2xl p-7 flex flex-col gap-5 overflow-hidden',
        'bg-white/[0.03] backdrop-blur-xl border transition-all duration-300',
        'hover:bg-white/[0.05] group',
        card.featured
          ? 'border-amber-500/30 shadow-lg shadow-amber-500/[0.08]'
          : 'border-white/[0.07] hover:border-white/[0.12]',
      ].join(' ')}
    >
      {/* Featured top accent */}
      {card.featured && (
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
      )}

      {/* Icon + badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="w-11 h-11 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
          <Icon className={`w-5 h-5 ${card.iconColor}`} />
        </div>
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${card.badgeColor}`}>
          <Zap className="w-2.5 h-2.5 opacity-70" />
          {card.badge}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1">
        <h3 className="text-base font-bold text-zinc-100 mb-2.5 leading-snug">{card.title}</h3>
        <p className="text-sm text-zinc-500 leading-relaxed">{card.body}</p>
      </div>

      {/* Check badge */}
      <div className={`flex items-center gap-2 ${card.checkColor}`}>
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
        <span className="text-xs font-semibold">{card.check}</span>
      </div>
    </motion.div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AboutPage() {
  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100">
      <NeuralBg />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-20">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold mb-6"
          >
            <Brain className="w-3.5 h-3.5" />
            Tamil Nadu · Broker-Free · AI-Powered
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-6"
          >
            The Operating System for
            <span className="block mt-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 bg-clip-text text-transparent">
              Tamil Nadu Real Estate
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.45 }}
            className="max-w-2xl mx-auto text-lg text-zinc-400 leading-relaxed"
          >
            Tharaga is a broker-free platform that behaves like an operations layer for builders
            and an assurance layer for buyers — not just a CRM or listing site.
          </motion.p>
        </div>

        {/* ── Stats Row ────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.45 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-20"
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.07] rounded-2xl p-5 text-center"
            >
              <div className="text-2xl font-black text-amber-400 mb-0.5">{s.value}</div>
              <div className="text-xs font-semibold text-zinc-300">{s.sub}</div>
              <div className="text-[10px] text-zinc-600 mt-0.5 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* ── For Builders ─────────────────────────────────────────────────── */}
        <section className="mb-20">
          {/* Section header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="h-4 w-[3px] rounded-full bg-amber-500/60" />
            <span className="text-[11px] uppercase tracking-widest font-semibold text-zinc-500">For Builders</span>
          </div>
          <div className="mb-8">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">From Leads to Closings</h2>
            <p className="text-zinc-500 mt-2 text-base">Tharaga plugs directly into a builder's day-to-day work</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            {builderCards.map((card, i) => (
              <FeatureCard key={card.title} card={card} delay={i} />
            ))}
          </div>

          {/* Summary quote */}
          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="mt-5 relative rounded-2xl p-7 bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <p className="text-base text-zinc-300 leading-relaxed text-center max-w-3xl mx-auto">
              Instead of running 10 disconnected tools, a builder runs Tharaga as the single system that
              <span className="text-amber-400 font-semibold"> standardizes how projects are launched, marketed, and closed.</span>
            </p>
          </motion.div>
        </section>

        {/* ── For Buyers ───────────────────────────────────────────────────── */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-4 w-[3px] rounded-full bg-emerald-500/60" />
            <span className="text-[11px] uppercase tracking-widest font-semibold text-zinc-500">For Buyers</span>
          </div>
          <div className="mb-8">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Confidence Instead of Confusion</h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            {buyerCards.map((card, i) => (
              <FeatureCard key={card.title} card={card} delay={i} />
            ))}
          </div>

          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="mt-5 relative rounded-2xl p-7 bg-white/[0.02] backdrop-blur-xl border border-white/[0.06]"
          >
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <p className="text-base text-zinc-300 leading-relaxed text-center max-w-3xl mx-auto">
              The result: fewer wasted visits, fewer surprises, and a home-buying journey that feels
              <span className="text-emerald-400 font-semibold"> professional instead of chaotic.</span>
            </p>
          </motion.div>
        </section>

        {/* ── Why Tharaga Exists ────────────────────────────────────────────── */}
        <section className="mb-20">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="relative rounded-3xl p-10 sm:p-14 bg-white/[0.03] backdrop-blur-xl border border-amber-500/20 overflow-hidden"
          >
            {/* Glow */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-48 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse,rgba(251,191,36,0.06) 0%,transparent 65%)' }}
            />

            <div className="relative text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-semibold mb-6">
                <Sparkles className="w-3 h-3" />
                Our Mission
              </div>
              <h2 className="text-3xl sm:text-4xl font-black mb-6 tracking-tight">Why Tharaga Exists</h2>
              <p className="text-zinc-400 leading-relaxed mb-8 text-base">
                Tharaga was started in Tamil Nadu after watching families and builders lose time, money, and trust
                in long broker chains and unstructured sales processes.
              </p>

              {/* Quote */}
              <div className="relative rounded-2xl p-7 bg-white/[0.03] border border-white/[0.08] mb-8">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
                <p className="text-xl sm:text-2xl font-bold text-zinc-100 leading-snug">
                  If the operations of real estate become transparent, standardized, and data-driven,
                  <span className="text-amber-400"> trust will follow.</span>
                </p>
              </div>

              <p className="text-sm text-zinc-500 leading-relaxed">
                By <span className="text-amber-400 font-bold">2035</span>, Tharaga aims to be the default
                operational layer for new-home sales in Tamil Nadu — where every serious project and every
                serious buyer eventually passes through the same reliable rails.
              </p>
            </div>
          </motion.div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <motion.section
          custom={0}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="relative rounded-3xl p-10 sm:p-14 bg-white/[0.02] backdrop-blur-xl border border-white/[0.07] overflow-hidden text-center"
        >
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-zinc-400 text-[11px] font-semibold mb-5">
            <Globe className="w-3 h-3" />
            Tamil Nadu · Chennai · India
          </div>

          <h2 className="text-3xl sm:text-4xl font-black mb-3 tracking-tight">
            Ready to Transform Real Estate?
          </h2>
          <p className="text-zinc-400 mb-8 text-base max-w-xl mx-auto">
            Join builders and buyers who trust Tharaga for transparent, broker-free real estate operations.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLScVrrMf7voKVXGz9d2giOje_p-nyt9yEdxJgWkVc0Mc1-PN1Q/viewform?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all duration-200 hover:shadow-xl hover:shadow-amber-500/25 text-sm"
            >
              <Building2 className="w-4 h-4" />
              List My Project
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <Link
              href="/property-listing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.12] text-zinc-100 font-semibold rounded-xl transition-all duration-200 text-sm"
            >
              <Target className="w-4 h-4" />
              Explore Verified Homes
            </Link>
          </div>
        </motion.section>

      </div>
    </div>
  )
}
