'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import {
  Building2, Shield, ArrowRight, Sun, Mountain,
  Warehouse, Landmark, CheckCircle2, ChevronRight,
  Phone, LogIn, LogOut, Lock, MapPin,
  ExternalLink, Menu, X, ChevronDown, User, Sparkles, Search, Compass, SlidersHorizontal
} from 'lucide-react'
import { openAuthModal } from '@/components/ui/AuthButton'
import { getSupabase } from '@/lib/supabase'
import { CuratedCommercialShowcase } from '@/components/commercial/CuratedCommercialShowcase'
import { CommercialIntakeModal } from '@/components/commercial/CommercialIntakeModal'
import { InstitutionalScreener } from '@/components/commercial/InstitutionalScreener'
import { MandateTracker } from '@/components/commercial/MandateTracker'
import { CURATED_COMMERCIAL_MANDATES } from '@/app/api/commercial/mandates/route'

const CORRIDOR_OPTIONS = [
  { value: 'all', label: 'All Tamil Nadu Corridors' },
  { value: 'Tuticorin', label: 'Tuticorin – Tirunelveli (Renewable / Port)' },
  { value: 'Sriperumbudur', label: 'Sriperumbudur – Oragadam (Manufacturing)' },
  { value: 'Ariyalur', label: 'Ariyalur – Karur (Limestone & Cement Belt)' },
  { value: 'Hosur', label: 'Hosur – Krishnagiri (EV & Logistics)' },
  { value: 'OMR', label: 'Chennai OMR – Guindy (Commercial IT)' },
]

const SCALE_OPTIONS = [
  { value: 'all', label: 'Any Extent' },
  { value: '25', label: '25+ Acres' },
  { value: '50', label: '50+ Acres' },
  { value: '100', label: '100+ Acres' },
]

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [displayName, setDisplayName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false)
  const [showcaseMandates, setShowcaseMandates] = useState<any[]>(CURATED_COMMERCIAL_MANDATES)

  // Innovative Search & Filter State
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedCorridor, setSelectedCorridor] = useState('all')
  const [selectedScale, setSelectedScale] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { scrollY } = useScroll()
  const navBg = useTransform(
    scrollY,
    [0, 80],
    ['rgba(250, 248, 245, 0.85)', 'rgba(250, 248, 245, 0.98)']
  )

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

  // Scroll smoothly to projects section
  const scrollToProjects = () => {
    const el = document.getElementById('projects')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="min-h-screen bg-[#FAF8F5] text-[#1A1816] selection:bg-[#EAE2D2] selection:text-[#1A1816]"
    >

      {/* ── MASTER NAVIGATION ─────────────────────────────────────────── */}
      <motion.nav
        style={{ backgroundColor: navBg }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-[#E8E2D6] backdrop-blur-md transition-colors"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          {/* Brand Logo & Title */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#DDD5C5] shadow-sm bg-white shrink-0">
              <img
                src="/images/tharaga-logo.jpg"
                alt="Tharaga Real Estate"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <div>
              <span className="font-serif font-bold text-[#1A1816] text-xl tracking-tight block leading-tight">
                Tharaga
              </span>
              <span className="block text-[10px] font-sans text-[#7A5B32] tracking-[0.22em] uppercase font-semibold">
                Real Estate
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links — luxury underline style */}
          <div className="hidden lg:flex items-center gap-6">
            {[
              { label: 'Active Projects', href: '#projects' },
              { label: 'Feasibility Study', href: '#feasibility' },
              { label: 'Property Status', href: '#status' },
              { label: 'Advisory Standard', href: '#advisory' },
            ].map(link => (
              <a
                key={link.label}
                href={link.href}
                className="nav-link-luxury text-xs font-sans tracking-[0.08em] text-[#5A564F] transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {user ? (
              <div
                className="relative"
                onMouseEnter={() => setUserMenuOpen(true)}
                onMouseLeave={() => setUserMenuOpen(false)}
              >
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E8E2D6] hover:border-[#C5A059] transition-colors shadow-sm">
                  <div className="w-7 h-7 rounded-full bg-[#1A1816] flex items-center justify-center text-[#FAF8F5] text-xs font-bold">
                    {initials}
                  </div>
                  <span className="text-xs font-sans font-medium text-[#1A1816] max-w-[120px] truncate hidden sm:block">
                    {displayName}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[#8E887E]" />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      className="absolute right-0 top-full mt-2 w-60 bg-white border border-[#E8E2D6] rounded-2xl shadow-xl p-2 space-y-1 z-50 text-left"
                    >
                      <div className="px-3 py-2 border-b border-[#E8E2D6]">
                        <p className="text-xs font-bold text-[#1A1816] truncate">{displayName}</p>
                        <p className="text-[10px] text-[#8E887E] truncate">{userEmail}</p>
                      </div>
                      <a
                        href="#status"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-[#5A564F] hover:text-[#1A1816] hover:bg-[#FAF8F5] rounded-xl transition-colors font-medium"
                      >
                        <Shield className="w-3.5 h-3.5 text-[#9E7B4F]" /> My Property Status
                      </a>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-medium text-left"
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
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-xs font-sans uppercase tracking-wider text-[#1A1816] hover:bg-[#F4F0E8] rounded-full border border-[#DDD5C5] transition-all font-medium"
              >
                <LogIn className="w-3.5 h-3.5 text-[#9E7B4F]" /> Sign In
              </button>
            )}

            <button
              onClick={() => setIsIntakeModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1A1816] hover:bg-[#2D2926] text-[#FAF8F5] font-sans font-medium text-xs tracking-wider uppercase transition-all shadow-sm whitespace-nowrap"
            >
              <span>List Property</span>
              <ArrowRight className="w-3 h-3 text-[#C5A059]" />
            </button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileNavOpen(o => !o)}
              className="lg:hidden p-2 rounded-full bg-white border border-[#E8E2D6] text-[#1A1816]"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile full-screen overlay nav */}
        <AnimatePresence>
          {mobileNavOpen && (
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="lg:hidden fixed inset-0 z-40 bg-[#FAF8F5]/98 backdrop-blur-xl flex flex-col justify-center px-8"
            >
              <div className="space-y-1 mb-10">
                {[
                  { label: 'Active Projects', href: '#projects' },
                  { label: 'Feasibility Study', href: '#feasibility' },
                  { label: 'Property Status', href: '#status' },
                  { label: 'Advisory Standard', href: '#advisory' },
                ].map((link, i) => (
                  <motion.a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileNavOpen(false)}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.07, duration: 0.3 }}
                    className="mobile-nav-link block py-4 text-2xl font-serif font-bold text-[#1A1816] border-b border-[#E8E2D6]"
                  >
                    {link.label}
                  </motion.a>
                ))}
              </div>
              {!user && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.32 }}
                  onClick={() => {
                    setMobileNavOpen(false)
                    openAuthModal()
                  }}
                  className="flex items-center gap-2 text-sm font-sans text-[#9E7B4F] font-semibold tracking-wide"
                >
                  <LogIn className="w-4 h-4" /> Sign In with Google
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ── ARCHITECTURAL HERO SECTION (WARM PAPER & PERFUME AESTHETIC) ──── */}
      <section className="relative pt-36 pb-24 px-4 sm:px-6 overflow-hidden min-h-[92vh] flex items-center">
        {/* ── PREMIUM 4-STRIP HORIZONTAL COLLAGE BACKGROUND ──
            Layout math: 4 strips × 25% = 100%. Each strip height = 26% (1% seam overlap).
            Starts: 0%, 25%, 50%, 75%. background-size: cover fills the full-width panoramic band.
        ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Four terrain strips — full-width landscape panoramic bands */}
          {[
            // 1 · Quarry — raw limestone excavation, earthy texture
            { src: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1600&q=90&fit=crop', pos: '50% 58%' },
            // 2 · Land — golden harvest field, vast horizon
            { src: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=90&fit=crop', pos: '50% 52%' },
            // 3 · Farmhouse — lush green agricultural estate
            { src: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?w=1600&q=90&fit=crop', pos: '50% 42%' },
            // 4 · Industries — industrial land complex
            { src: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1600&q=90&fit=crop', pos: '50% 46%' },
          ].map((strip, i) => (
            <div
              key={i}
              className="absolute inset-x-0"
              style={{
                top: `${i * 25}%`,
                height: '26%',
                backgroundImage: `url(${strip.src})`,
                backgroundSize: 'cover',
                backgroundPosition: strip.pos,
                filter: 'blur(0.6px) brightness(0.74) saturate(1.35) contrast(1.10)',
                transform: 'scale(1.09)',
                transformOrigin: 'center',
              }}
            />
          ))}

          {/* Layer 1 — Top protective fade: covers badge + headline zone only */}
          <div
            className="absolute inset-x-0 top-0"
            style={{
              height: '48%',
              background: 'linear-gradient(to bottom, rgba(250,248,245,0.82) 0%, rgba(250,248,245,0.40) 55%, transparent 100%)',
            }}
          />

          {/* Layer 2 — Bottom anchor fade: lifts filter-console card out of the photo */}
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              height: '36%',
              background: 'linear-gradient(to top, rgba(250,248,245,0.78) 0%, transparent 100%)',
            }}
          />

          {/* Layer 3 — Ultra-thin mid tint: barely-there warmth, lets photos breathe */}
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(250,248,245,0.12)' }}
          />

          {/* Luxury gold bloom — wide warm radiance at text centroid */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 85% 68% at 50% 30%, rgba(197,160,89,0.17) 0%, transparent 60%)',
            }}
          />
        </div>

        {/* Hero Editorial Header */}
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-6 w-full">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F4EFE6] border border-[#DDD5C5] text-[#7A5B32] text-xs font-sans tracking-[0.2em] uppercase font-semibold"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#9E7B4F]" />
            Tharaga Real Estate · Commercial & Land Advisory
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-serif font-bold tracking-tight text-[#1A1816] leading-[1.08]"
            style={{ textShadow: '0 2px 32px rgba(250,248,245,0.96), 0 1px 8px rgba(250,248,245,0.90)' }}
          >
            Commercial Land, Solar Sites &<br />
            <span className="italic font-normal text-[#9E7B4F]">
              Operational Quarries Across Tamil Nadu.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-base sm:text-lg text-[#5A564F] max-w-3xl mx-auto leading-relaxed font-light"
            style={{ textShadow: '0 1px 20px rgba(250,248,245,0.94), 0 1px 6px rgba(250,248,245,0.80)' }}
          >
            We represent large-extent industrial land banks, grid-connected solar power parcels, and high-yield limestone reserves connecting directly with enterprise buyers and institutional capital. Clean patta, complete due diligence, and absolute discretion.
          </motion.p>

          {/* ── INNOVATIVE CONCIERGE SEARCH & FILTER CONSOLE ──────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-8 p-4 sm:p-6 rounded-3xl bg-white border border-[#E8E2D6] shadow-xl max-w-4xl mx-auto text-left space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D6]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#9E7B4F]" />
                <span className="text-xs font-sans uppercase tracking-[0.18em] text-[#7A5B32] font-semibold">
                  Asset & Corridor Filter Console
                </span>
              </div>
              <span className="text-xs text-[#8E887E]">
                Showing active placement assets
              </span>
            </div>

            {/* Row 1: Category Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All Assets' },
                { id: 'solar', label: 'Solar & Renewable' },
                { id: 'mines', label: 'Mines & Quarries' },
                { id: 'industrial', label: 'Industrial Land' },
                { id: 'logistics', label: 'Logistics Hubs' },
                { id: 'commercial', label: 'Commercial IT' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id)
                    scrollToProjects()
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-sans transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[#1A1816] text-[#FAF8F5] font-medium shadow-sm'
                      : 'bg-[#FAF8F5] border border-[#E8E2D6] text-[#5A564F] hover:bg-[#F4F0E8] hover:text-[#1A1816]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Row 2: Search Input + Corridor Select + Scale Select + Explore CTA */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
              {/* Keyword Search */}
              <div className="sm:col-span-5 relative">
                <Search className="w-4 h-4 text-[#8E887E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search district, corridor, or keyword..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-full bg-[#FAF8F5] border border-[#E8E2D6] text-xs text-[#1A1816] focus:outline-none focus:border-[#9E7B4F]"
                />
              </div>

              {/* Corridor Dropdown */}
              <div className="sm:col-span-4">
                <select
                  value={selectedCorridor}
                  onChange={e => {
                    setSelectedCorridor(e.target.value)
                    scrollToProjects()
                  }}
                  className="w-full px-4 py-2.5 rounded-full bg-[#FAF8F5] border border-[#E8E2D6] text-xs text-[#1A1816] focus:outline-none focus:border-[#9E7B4F]"
                >
                  {CORRIDOR_OPTIONS.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Scale Dropdown */}
              <div className="sm:col-span-3">
                <select
                  value={selectedScale}
                  onChange={e => {
                    setSelectedScale(e.target.value)
                    scrollToProjects()
                  }}
                  className="w-full px-4 py-2.5 rounded-full bg-[#FAF8F5] border border-[#E8E2D6] text-xs text-[#1A1816] focus:outline-none focus:border-[#9E7B4F]"
                >
                  {SCALE_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter Footer Action */}
            <div className="flex items-center justify-between pt-2 text-xs text-[#5A564F]">
              <span>
                Select filters to immediately update the projects below
              </span>
              <button
                onClick={scrollToProjects}
                className="flex items-center gap-1.5 font-sans font-semibold text-[#9E7B4F] hover:text-[#7A5B32]"
              >
                <span>View Matching Projects</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 1: RECENT ACTIVE PROJECTS (ZERO OVERLAP & FULL DOSSIER) ── */}
      <CuratedCommercialShowcase
        mandates={showcaseMandates}
        onOpenIntake={() => setIsIntakeModalOpen(true)}
        externalCategory={selectedCategory}
        externalCorridor={selectedCorridor}
        externalScale={selectedScale}
        searchQuery={searchQuery}
        onSelectCategory={setSelectedCategory}
      />

      {/* ── SECTION 2: LAND & INDUSTRIAL FEASIBILITY STUDY ──────────────── */}
      <motion.section
        id="feasibility"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="py-24 bg-[#F4F0E8] border-t border-[#E8E2D6]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <InstitutionalScreener />
        </div>
      </motion.section>

      {/* ── SECTION 3: SELLER PROPERTY STATUS & REVIEW HUB ─────────────── */}
      <motion.section
        id="status"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="py-24 bg-[#FAF8F5] border-t border-[#E8E2D6]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <MandateTracker
            user={user}
            onOpenIntake={() => setIsIntakeModalOpen(true)}
          />
        </div>
      </motion.section>

      {/* ── SECTION 4: THE THARAGA ADVISORY STANDARD ──────────────────── */}
      <section id="advisory" className="py-24 bg-white border-t border-[#E8E2D6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-center max-w-3xl mx-auto mb-16 space-y-4"
          >
            <div className="flex items-center justify-center gap-3">
              <div className="divider-gold" />
              <span className="text-[11px] font-sans uppercase tracking-[0.22em] text-[#9E7B4F] font-semibold">
                The Advisory Standard
              </span>
              <div className="divider-gold" />
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#1A1816] tracking-tight">
              Bespoke Commercial Placement.<br className="hidden sm:block" />
              <span className="italic font-normal text-[#9E7B4F]"> Zero Public Noise.</span>
            </h2>
            <p className="text-[#5A564F] text-sm sm:text-base leading-relaxed font-light max-w-2xl mx-auto">
              We do not operate mass consumer real estate classifieds. Tharaga provides private commercial advisory connecting land owners directly with corporate buyers and institutional investors.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                num: '01',
                title: 'Direct Corporate Access',
                desc: 'Whether placing an operational limestone quarry for cement manufacturing or 150 acres with utility solar developers, we transact directly through strategic corporate decision desks.',
                icon: Building2,
              },
              {
                num: '02',
                title: 'Technical & Grid Underwriting',
                desc: 'Every property submitted undergoes rigorous assessment: grid substation proximity (110kV/230kV), highway freight haulage access, statutory environmental zoning, and proven mineral reserve data.',
                icon: Compass,
              },
              {
                num: '03',
                title: 'Total Discretion & Live Tracking',
                desc: 'Asset owners maintain full control over sensitive commercial data. Track title verification, due diligence reports, and qualified buyer interest live through your verified Google account.',
                icon: Shield,
              },
            ].map((col, idx) => {
              const Icon = col.icon
              return (
                <motion.div
                  key={col.num}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.55, delay: idx * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="card-luxury p-8 rounded-3xl bg-[#FAF8F5] border border-[#E8E2D6] hover:border-[#C5A059] space-y-4 group cursor-default"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-serif font-bold text-[#9E7B4F]/30 group-hover:text-[#9E7B4F] transition-colors duration-300">
                      {col.num}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-[#F4F0E8] border border-[#DDD5C5] flex items-center justify-center text-[#9E7B4F] group-hover:bg-[#EAE2D2] transition-colors duration-300">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#1A1816]">{col.title}</h3>
                  <p className="text-xs sm:text-sm text-[#5A564F] leading-relaxed font-light">{col.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: DIRECT MANAGING DESK ───────────────────────────── */}
      <section className="py-24 bg-[#FAF8F5] border-t border-[#E8E2D6] relative overflow-hidden">
        {/* Soft background radial */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(197,160,89,0.07) 0%, transparent 70%)' }}
        />
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-5"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-14 h-14 rounded-full bg-[#F4EFE6] border border-[#DDD5C5] flex items-center justify-center mx-auto text-[#9E7B4F]"
          >
            <Phone className="w-5 h-5" />
          </motion.div>

          <div className="flex items-center justify-center gap-3">
            <div className="divider-gold" />
            <span className="text-[11px] font-sans uppercase tracking-[0.22em] text-[#9E7B4F] font-semibold">
              Direct Principal Line
            </span>
            <div className="divider-gold" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1A1816] tracking-tight">
            Initiate a Confidential Discussion
          </h2>

          <p className="text-[#5A564F] text-sm max-w-xl mx-auto leading-relaxed font-light">
            For institutional land acquisitions, commercial asset sales, or quarry concessions across Tamil Nadu. Direct communication with the Managing Desk under strict non-disclosure.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <a
              href="tel:+918870980839"
              className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#1A1816] hover:bg-[#2D2926] text-[#FAF8F5] font-sans text-xs uppercase tracking-wider font-semibold transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              style={{ transition: 'background-color 0.2s ease, box-shadow 0.3s ease, transform 0.2s ease' }}
            >
              <Phone className="w-4 h-4 text-[#C5A059]" /> Call Desk: +91 88709 80839
            </a>

            <a
              href="https://wa.me/918870980839?text=Hello%20Tharaga%20Real%20Estate,%20I%20wish%20to%20discuss%20a%20commercial%20mandate%20or%20land%20parcel."
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white hover:bg-[#F4F0E8] border border-[#E8E2D6] hover:border-[#C5A059] text-[#1A1816] font-sans text-xs font-semibold uppercase tracking-wider shadow-sm hover:-translate-y-0.5 active:translate-y-0"
              style={{ transition: 'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.3s ease, transform 0.2s ease' }}
            >
              <span>WhatsApp Managing Desk</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#9E7B4F]" />
            </a>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="py-12 bg-white border-t border-[#E8E2D6] text-[#5A564F] text-xs">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#E8E2D6] bg-white">
              <img
                src="/images/tharaga-logo.jpg"
                alt="Tharaga Real Estate"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div>
              <span className="font-serif font-bold text-[#1A1816] text-sm block">Tharaga Real Estate</span>
              <span className="text-[10px] text-[#8E887E]">Commercial Land & Industrial Asset Advisory · Tamil Nadu</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[11px] font-sans">
            {[
              { label: 'Active Projects', href: '#projects', external: false },
              { label: 'Feasibility Study', href: '#feasibility', external: false },
              { label: 'Property Status', href: '#status', external: false },
            ].map(l => (
              <a key={l.label} href={l.href} className="nav-link-luxury text-[#5A564F]">{l.label}</a>
            ))}
            <Link href="/privacy" className="nav-link-luxury text-[#5A564F]">Privacy Protocol</Link>
            <Link href="/terms" className="nav-link-luxury text-[#5A564F]">Terms of Placement</Link>
          </div>

          <p className="text-[10px] text-[#8E887E]">
            © {new Date().getFullYear()} Tharaga Real Estate. Chennai · Tamil Nadu · India.
          </p>
        </motion.div>
      </footer>

      {/* ── PROPERTY INTAKE MODAL (SILENT CLAUDE API INTAKE) ──────────── */}
      <CommercialIntakeModal
        isOpen={isIntakeModalOpen}
        onClose={() => setIsIntakeModalOpen(false)}
        user={user}
        onSuccess={() => {
          fetch('/api/commercial/mandates')
            .then(r => r.json())
            .then(d => {
              if (d.showcase) setShowcaseMandates(d.showcase)
            })
            .catch(() => {})
        }}
      />
    </motion.div>
  )
}