'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import {
  Building2, Shield, ArrowRight, Sun, Mountain,
  Warehouse, Landmark, CheckCircle2, ChevronRight,
  Phone, LogIn, LogOut, Sparkles, Lock, MapPin,
  ExternalLink, Menu, X, ChevronDown, User, Zap
} from 'lucide-react'
import { openAuthModal } from '@/components/ui/AuthButton'
import { getSupabase } from '@/lib/supabase'
import { CuratedCommercialShowcase } from '@/components/commercial/CuratedCommercialShowcase'
import { CommercialIntakeModal } from '@/components/commercial/CommercialIntakeModal'
import { InstitutionalScreener } from '@/components/commercial/InstitutionalScreener'
import { MandateTracker } from '@/components/commercial/MandateTracker'
import { CURATED_COMMERCIAL_MANDATES } from '@/app/api/commercial/mandates/route'

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [displayName, setDisplayName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false)
  const [showcaseMandates, setShowcaseMandates] = useState<any[]>(CURATED_COMMERCIAL_MANDATES)

  const { scrollY } = useScroll()
  const navBg = useTransform(scrollY, [0, 80], ['rgba(10, 10, 13, 0)', 'rgba(10, 10, 13, 0.95)'])

  // Supabase Auth Integration
  useEffect(() => {
    let mounted = true
    function applyUser(authUser: any) {
      if (!mounted) return
      if (!authUser) {
        setUser(null)
        setDisplayName('')
        setUserEmail('')
        return
      }
      setUser(authUser)
      setUserEmail(authUser.email || '')
      setDisplayName(
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        authUser.email?.split('@')[0] || 'Principal'
      )
    }

    try {
      const raw = localStorage.getItem('sb-wedevtjjmdvngyshqdro-auth-token')
      if (raw) {
        const parsed = JSON.parse(raw)
        const notExpired = !parsed?.expires_at || parsed.expires_at * 1000 > Date.now()
        if (notExpired && parsed?.user) applyUser(parsed.user)
      }
    } catch {}

    async function init() {
      try {
        const supabase = getSupabase()
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
          applyUser(session?.user || null)
        })
        return () => {
          mounted = false
          subscription.unsubscribe()
        }
      } catch {
        return () => { mounted = false }
      }
    }

    const cleanup = init()
    return () => {
      mounted = false
      cleanup.then(fn => fn?.())
    }
  }, [])

  // Fetch updated showcase mandates from API
  useEffect(() => {
    fetch('/api/commercial/mandates')
      .then(r => r.json())
      .then(d => {
        if (d.showcase && d.showcase.length > 0) {
          setShowcaseMandates(d.showcase)
        }
      })
      .catch(() => {})
  }, [])

  const handleSignOut = useCallback(async () => {
    setUserMenuOpen(false)
    setUser(null)
    setDisplayName('')
    setUserEmail('')
    try {
      const supabase = getSupabase()
      await supabase.auth.signOut()
    } catch {}
    window.location.href = '/'
  }, [])

  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'P'

  return (
    <div className="min-h-screen bg-[#070709] text-white selection:bg-amber-400 selection:text-black">

      {/* ── MASTER NAVIGATION ─────────────────────────────────────────── */}
      <motion.nav
        style={{ backgroundColor: navBg }}
        className="fixed top-0 left-0 right-0 z-50 transition-colors border-b border-white/[0.06] backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5 text-black" />
            </div>
            <div>
              <span className="font-serif font-bold text-white text-xl tracking-tight block leading-tight">Tharaga</span>
              <span className="block text-[9px] font-mono text-amber-400/90 tracking-[0.25em] uppercase font-medium">Institutional Advisory</span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {[
              { label: 'Commercial Mandates', href: '#mandates' },
              { label: 'Feasibility Screener', href: '#screener' },
              { label: 'Track Status', href: '#tracker' },
              { label: 'Advisory Protocol', href: '#advisory' },
            ].map(link => (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-xs font-mono uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/[0.04] rounded-lg transition-all"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative" onMouseEnter={() => setUserMenuOpen(true)} onMouseLeave={() => setUserMenuOpen(false)}>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-amber-400/40 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-black text-xs font-bold">
                    {initials}
                  </div>
                  <span className="text-xs font-medium text-white max-w-[120px] truncate hidden sm:block">
                    {displayName}
                  </span>
                  <ChevronDown className="w-3 h-3 text-white/50" />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-[#111116] border border-white/10 rounded-2xl shadow-2xl p-1.5 space-y-1 z-50"
                    >
                      <div className="px-3 py-2 border-b border-white/[0.06]">
                        <p className="text-xs font-semibold text-white truncate">{displayName}</p>
                        <p className="text-[10px] text-white/40 truncate">{userEmail}</p>
                      </div>
                      <a
                        href="#tracker"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-white/80 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5 text-amber-400" /> My Mandates Status
                      </a>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => openAuthModal()}
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-xs font-mono uppercase tracking-wider text-white/80 hover:text-white hover:bg-white/5 rounded-xl border border-white/10 transition-all"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-400" /> Sign In
              </button>
            )}

            <button
              onClick={() => setIsIntakeModalOpen(true)}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs tracking-wider uppercase transition-all shadow-lg shadow-amber-500/25 whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              List Commercial Asset
            </button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileNavOpen(o => !o)}
              className="lg:hidden p-2 rounded-xl bg-white/5 text-white/70 hover:text-white"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {mobileNavOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden px-4 py-4 bg-[#0E0E12] border-t border-white/10 space-y-2"
            >
              {[
                { label: 'Commercial Mandates', href: '#mandates' },
                { label: 'Feasibility Screener', href: '#screener' },
                { label: 'Track Status', href: '#tracker' },
                { label: 'Advisory Protocol', href: '#advisory' },
              ].map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileNavOpen(false)}
                  className="block px-3 py-2 text-xs font-mono uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/5 rounded-lg"
                >
                  {link.label}
                </a>
              ))}
              {!user && (
                <button
                  onClick={() => {
                    setMobileNavOpen(false)
                    openAuthModal()
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-mono uppercase tracking-wider text-amber-400 hover:bg-white/5 rounded-lg"
                >
                  Sign In with Google
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ── ARCHITECTURAL HERO SECTION ─────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center pt-28 pb-16 px-4 sm:px-6 overflow-hidden">
        {/* Subtle Atmospheric Lighting Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Obsidian radial base */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_160%_100%_at_50%_0%,#16120E_0%,#09090C_60%,#050507_100%)]" />

          {/* Warm Champagne Spotlight */}
          <div
            className="absolute top-[-25%] left-1/2 -translate-x-1/2 w-[65vw] h-[75vh]"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(197,154,58,0.14) 0%, rgba(197,154,58,0.03) 55%, transparent 75%)',
              filter: 'blur(55px)',
            }}
          />

          {/* Hairline blueprint geometric grid */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
              backgroundSize: '80px 80px',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-mono tracking-widest uppercase"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Private Institutional Brokerage & Advisory
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.08]"
          >
            Institutional Commercial &<br />
            <span
              className="inline-block italic"
              style={{
                fontFamily: 'var(--font-serif), Georgia, serif',
                fontWeight: 700,
                background: 'linear-gradient(110deg, #F3E5AB 0%, #D4AF37 35%, #F59E0B 70%, #E6C280 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 28px rgba(197,154,58,0.35))',
              }}
            >
              Industrial Asset Syndication.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-base sm:text-xl text-white/60 max-w-3xl mx-auto leading-relaxed font-light"
          >
            We connect high-extent industrial land banks, grid-connected solar power parcels, and operational limestone quarries directly with Tier-1 MNC conglomerates and institutional capital through private advisory channels.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
          >
            <button
              onClick={() => setIsIntakeModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm tracking-wide uppercase transition-all shadow-xl shadow-amber-500/25 group"
            >
              <Sparkles className="w-4 h-4 text-black group-hover:rotate-12 transition-transform" />
              Mandate Commercial Asset
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <a
              href="#mandates"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-white font-medium text-sm tracking-wide transition-all"
            >
              View Curated Mandates
            </a>

            <a
              href="#screener"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-amber-500/20 text-amber-300 font-mono text-xs uppercase tracking-wider transition-all"
            >
              Run Feasibility Screener
            </a>
          </motion.div>

          {/* Blueprint Institutional Proof Chips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 border-t border-white/[0.08] max-w-4xl mx-auto text-left"
          >
            {[
              { code: 'MNC-OFFTAKERS', label: 'Tier-1 Conglomerates', sub: 'Chettinad, Renewables, PE' },
              { code: 'CLEAR-PATTA', label: '100% Audited Title', sub: '30-Year Revenue Verification' },
              { code: 'CONFIDENTIAL', label: 'Bilateral Discretion', sub: 'Mutual NDA Protocol' },
              { code: 'CAP-DEPLOYMENT', label: '₹500Cr+ Pipeline', sub: 'Tamil Nadu Strategic Belts' },
            ].map(chip => (
              <div key={chip.code} className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-[10px] font-mono text-amber-400/80 uppercase tracking-widest">{chip.code}</div>
                <div className="text-sm font-semibold text-white mt-1">{chip.label}</div>
                <div className="text-[11px] text-white/40">{chip.sub}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 1: THE TRANSACTION PHILOSOPHY ─────────────────────── */}
      <section id="advisory" className="py-20 bg-[#0A0A0D] border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400 block mb-2">
              The Advisory Difference
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
              Bespoke Commercial Syndication. Zero Public Noise.
            </h2>
            <p className="text-white/50 text-sm sm:text-base mt-3 leading-relaxed">
              We do not operate consumer real estate classifieds. Tharaga provides discreet transaction underwriting connecting sovereign asset holders with enterprise conglomerates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                num: '01',
                title: 'Direct MNC Boardroom Access',
                desc: 'Whether placing an operational limestone quarry with cement majors like Chettinad Cements or 150 acres with utility solar developers, we bypass intermediary chains to transact directly with corporate strategy desks.',
                icon: Building2,
              },
              {
                num: '02',
                title: 'Technical Underwriting with Claude',
                desc: 'Every asset submitted undergoes instant algorithmic and technical assessment — analyzing grid substation proximity (110kV/230kV), highway logistics latency, environmental zoning, and proven mineral reserve tenure.',
                icon: Sparkles,
              },
              {
                num: '03',
                title: 'Total Discretion & Realtime Tracking',
                desc: 'Principals maintain 100% control over mandate disclosure. Track title verification, due diligence packets, and active MNC buyer outreach live through your verified Google profile.',
                icon: Shield,
              },
            ].map(col => {
              const Icon = col.icon
              return (
                <div
                  key={col.num}
                  className="p-8 rounded-3xl bg-[#0F0F14] border border-white/[0.08] hover:border-amber-400/40 transition-all space-y-4 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-mono font-bold text-amber-400/40 group-hover:text-amber-400 transition-colors">
                      {col.num}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-amber-400">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-lg font-serif font-bold text-white">{col.title}</h3>
                  <p className="text-xs sm:text-sm text-white/50 leading-relaxed">{col.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION 2: CURATED COMMERCIAL SHOWCASE ───────────────────── */}
      <CuratedCommercialShowcase
        mandates={showcaseMandates}
        onOpenIntake={() => setIsIntakeModalOpen(true)}
      />

      {/* ── SECTION 3: REIMAGINED CLAUDE FEASIBILITY SCREENER ────────── */}
      <section id="screener" className="py-24 bg-[#070709] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <InstitutionalScreener />
        </div>
      </section>

      {/* ── SECTION 4: SELLER MANDATE STATUS TRACKER ─────────────────── */}
      <section id="tracker" className="py-20 bg-[#0A0A0D] border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <MandateTracker
            user={user}
            onOpenIntake={() => setIsIntakeModalOpen(true)}
          />
        </div>
      </section>

      {/* ── SECTION 5: EXECUTIVE ADVISORY DESK & CONTACT ─────────────── */}
      <section className="py-20 bg-[#0F0F14] border-t border-white/[0.08] relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
            <Phone className="w-5 h-5" />
          </div>
          <span className="text-xs font-mono uppercase tracking-widest text-amber-400">
            Direct Principal Line
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
            Initiate a Confidential Commercial Discussion
          </h2>
          <p className="text-white/60 text-sm max-w-xl mx-auto leading-relaxed">
            For institutional acquisitions, joint developments, or private asset syndication across Tamil Nadu. Direct communication with the Managing Desk under NDA.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href="tel:+918870980839"
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs tracking-wider uppercase transition-all shadow-lg shadow-amber-500/20"
            >
              <Phone className="w-4 h-4" /> Call Desk: +91 88709 80839
            </a>
            <a
              href="https://wa.me/918870980839?text=Hello%20Tharaga%20Advisory,%20I%20wish%20to%20discuss%20an%20institutional%20commercial%20mandate."
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-xs tracking-wider uppercase transition-colors"
            >
              WhatsApp Managing Desk <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="py-12 bg-[#050507] border-t border-white/[0.06] text-white/40 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-black font-bold text-xs">
              T
            </div>
            <div>
              <span className="font-serif font-bold text-white text-sm">Tharaga</span>
              <span className="text-[10px] text-white/40 ml-2 font-mono">Institutional Commercial Real Estate & Advisory</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-mono text-[11px]">
            <a href="#mandates" className="hover:text-white transition-colors">Mandates</a>
            <a href="#screener" className="hover:text-white transition-colors">Screener</a>
            <a href="#tracker" className="hover:text-white transition-colors">Status Hub</a>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Protocol</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Syndication</Link>
          </div>

          <p className="text-[10px] font-mono">
            © {new Date().getFullYear()} Tharaga Advisory. Chennai · Tamil Nadu · India. Confidential.
          </p>
        </div>
      </footer>

      {/* ── CLAUDE COMMERCIAL INTAKE ASSISTANT MODAL ────────────────── */}
      <CommercialIntakeModal
        isOpen={isIntakeModalOpen}
        onClose={() => setIsIntakeModalOpen(false)}
        user={user}
        onSuccess={(mandate) => {
          // Refresh list or trigger notification
          fetch('/api/commercial/mandates')
            .then(r => r.json())
            .then(d => {
              if (d.showcase) setShowcaseMandates(d.showcase)
            })
            .catch(() => {})
        }}
      />
    </div>
  )
}
