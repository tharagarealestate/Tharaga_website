'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import {
  Search, MapPin, Shield, ArrowRight, Building2,
  CheckCircle2, Star, ChevronRight, Phone, Calculator,
  TrendingUp, Home, BarChart3, ChevronDown, LogIn, LogOut,
  LayoutDashboard, Bed, Maximize2, Heart, Eye, Zap, Menu, X,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { openAuthModal, openAuthModalSignup } from '@/components/ui/AuthButton'
import { getSupabase } from '@/lib/supabase'

const LeadCaptureForm = dynamic(() => import('@/components/LeadCaptureForm'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 rounded-full border-2 border-amber-500/30 border-t-amber-400 animate-spin" />
    </div>
  ),
})

// ─── Data ────────────────────────────────────────────────────────────────────
const LOCALITIES = [
  { id: 'anna-nagar', name: 'Anna Nagar', properties: '18+ listings', avg: '₹90L–₹1.3Cr', tag: 'Highly Sought' },
  { id: 'adyar', name: 'Adyar', properties: '12+ listings', avg: '₹95L–₹1.5Cr', tag: 'Premium' },
  { id: 'omr', name: 'OMR Corridor', properties: '31+ listings', avg: '₹60L–₹95L', tag: 'High Growth' },
  { id: 'velachery', name: 'Velachery', properties: '14+ listings', avg: '₹65L–₹1Cr', tag: 'Metro Linked' },
  { id: 'tnagar', name: 'T Nagar', properties: '7+ listings', avg: '₹75L–₹1.2Cr', tag: 'Central' },
  { id: 'porur', name: 'Porur', properties: '9+ listings', avg: '₹50L–₹80L', tag: 'Value Pick' },
  { id: 'chromepet', name: 'Chromepet', properties: '11+ listings', avg: '₹45L–₹65L', tag: 'Affordable' },
  { id: 'ecr', name: 'ECR', properties: '6+ listings', avg: '₹80L–₹2Cr', tag: 'Beachfront' },
]

const BUDGETS = [
  { label: 'Under ₹50L', range: 'Starter homes & studios', href: '/property-listing?max_price=5000000' },
  { label: '₹50L – ₹1Cr', range: 'Most popular range', href: '/property-listing?min_price=5000000&max_price=10000000', featured: true },
  { label: '₹1Cr – ₹2Cr', range: 'Premium apartments & villas', href: '/property-listing?min_price=10000000&max_price=20000000' },
  { label: 'Above ₹2Cr', range: 'Luxury & ultra-premium', href: '/property-listing?min_price=20000000' },
]

const WHY_THARAGA = [
  {
    icon: Shield,
    title: 'RERA Verified Only',
    desc: 'Every property is cross-checked with the Tamil Nadu RERA registry. No unverified listings, no surprises.',
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  },
  {
    icon: Building2,
    title: 'Direct from Builders',
    desc: 'Connect directly with verified developers and builders. Transparent pricing, no middlemen, no brokerage.',
    color: 'bg-amber-50 text-amber-600 border-amber-100',
  },
  {
    icon: Search,
    title: 'Smart Property Match',
    desc: 'Our system instantly matches your requirement — location, budget, size — to the most relevant listings.',
    color: 'bg-blue-50 text-blue-600 border-blue-100',
  },
  {
    icon: BarChart3,
    title: 'Market Intelligence',
    desc: 'Live price trends, locality insights, and demand signals. Make informed decisions with real data.',
    color: 'bg-purple-50 text-purple-600 border-purple-100',
  },
]

const TOOLS = [
  { icon: Calculator, title: 'EMI Calculator', desc: 'Plan your monthly payments', href: '/tools?t=emi' },
  { icon: TrendingUp, title: 'ROI Estimator', desc: 'Estimate rental & resale returns', href: '/tools?t=roi' },
  { icon: Home, title: 'Budget Planner', desc: 'Full cost breakdown for buyers', href: '/tools?t=budget' },
  { icon: Shield, title: 'Loan Eligibility', desc: 'Check your home loan limit', href: '/tools?t=loan' },
  { icon: MapPin, title: 'Locality Insights', desc: 'Compare areas across Chennai', href: '/tools?t=neighborhood' },
  { icon: BarChart3, title: 'Property Valuation', desc: 'RERA-based price benchmarks', href: '/tools?t=valuation' },
]

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [propertyType, setPropertyType] = useState('buy')
  const [showLeadModal, setShowLeadModal] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [displayName, setDisplayName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [activeBudget, setActiveBudget] = useState<number | null>(null)
  const [savedLocalities, setSavedLocalities] = useState<Set<string>>(new Set())
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const { scrollY } = useScroll()
  const navBg = useTransform(scrollY, [0, 80], ['rgba(11,28,52,0)', 'rgba(11,28,52,0.98)'])

  // Auth
  useEffect(() => {
    let mounted = true
    function applyUser(authUser: any) {
      if (!mounted) return
      if (!authUser) { setUser(null); setDisplayName(''); setUserEmail(''); return }
      setUser(authUser)
      setUserEmail(authUser.email || '')
      setDisplayName(
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        authUser.email?.split('@')[0] || 'User'
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
        return () => { mounted = false; subscription.unsubscribe() }
      } catch { return () => { mounted = false } }
    }
    const cleanup = init()
    return () => { mounted = false; cleanup.then(fn => fn?.()) }
  }, [])

  const handleSignOut = useCallback(async () => {
    setUserMenuOpen(false)
    setUser(null); setDisplayName(''); setUserEmail('')
    try { const supabase = getSupabase(); await supabase.auth.signOut() } catch {}
    window.location.href = '/'
  }, [])

  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery.trim()) params.set('q', searchQuery.trim())
    params.set('type', propertyType)
    router.push(`/property-listing?${params.toString()}`)
  }

  const toggleSaveLocality = (id: string) => {
    setSavedLocalities(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">

      {/* ── NAVIGATION ─────────────────────────────────────────── */}
      <motion.nav
        style={{ backgroundColor: navBg }}
        className="fixed top-0 left-0 right-0 z-50 transition-colors"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-lg leading-none tracking-tight">Tharaga</span>
              <span className="block text-[10px] text-white/50 leading-none font-normal tracking-wider uppercase">Real Estate</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {[
              { label: 'Properties', href: '/property-listing' },
              { label: 'Areas', href: '/property-listing?view=areas' },
              { label: 'Tools', href: '/tools' },
              { label: 'About', href: '/about' },
            ].map(link => (
              <Link
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileNavOpen(o => !o)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white/10 text-white transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            {user ? (
              <div className="relative" onMouseEnter={() => setUserMenuOpen(true)} onMouseLeave={() => setUserMenuOpen(false)}>
                <button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                    {initials}
                  </div>
                  <span className="text-sm font-medium text-white max-w-[100px] truncate hidden sm:block">{displayName}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-white/50" />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-gray-50">
                        <p className="text-sm font-semibold text-gray-800 truncate">{displayName}</p>
                        <p className="text-xs text-gray-400 truncate">{userEmail}</p>
                      </div>
                      <div className="p-1.5 space-y-0.5">
                        <Link href="/builder" className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors">
                          <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </Link>
                        <button onClick={handleSignOut} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                          <LogOut className="w-4 h-4" /> Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <button
                  onClick={() => openAuthModal()}
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  <LogIn className="w-4 h-4" /> Sign In
                </button>
                <button
                  onClick={() => openAuthModalSignup('/builder')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/30"
                >
                  Post Property
                </button>
              </>
            )}
          </div>
        </div>
      </motion.nav>

      {/* ── Mobile nav overlay ──────────────────────────────── */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-[#0B1C34]/97 backdrop-blur-xl flex flex-col md:hidden"
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 h-[72px]">
              <Link href="/" onClick={() => setMobileNavOpen(false)} className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-white text-lg">Tharaga</span>
              </Link>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-4 flex-1 overflow-y-auto">
              {[
                { label: 'Properties', href: '/property-listing' },
                { label: 'Areas', href: '/property-listing?view=areas' },
                { label: 'Tools', href: '/tools' },
                { label: 'About', href: '/about' },
              ].map((link, i) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileNavOpen(false)}
                    className="flex items-center gap-3 px-4 py-4 text-xl font-semibold text-white/80 hover:text-white hover:bg-white/10 rounded-2xl transition-all"
                  >
                    <ChevronRight className="w-5 h-5 text-amber-400" />
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className="p-4 pb-8 border-t border-white/10 space-y-3">
              <button
                onClick={() => { setMobileNavOpen(false); openAuthModal() }}
                className="w-full py-4 border-2 border-white/20 text-white font-semibold text-base rounded-2xl transition-all hover:border-white/40"
              >
                Sign In
              </button>
              <button
                onClick={() => { setMobileNavOpen(false); openAuthModalSignup('/builder') }}
                className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-white font-bold text-base rounded-2xl transition-all shadow-lg shadow-amber-500/30"
              >
                Post Property Free
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ HERO SECTION ════════════════════════════════════════ */}
      <section className="relative min-h-[88vh] flex flex-col items-center justify-center overflow-hidden bg-[#0B1C34]">
        {/* Background: layered depth */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0B1C34] via-[#0D2B52] to-[#0B1C34]" />
          <div className="absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage: 'radial-gradient(circle at 60% 40%, rgba(197,163,58,0.4) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(59,130,246,0.2) 0%, transparent 50%)',
            }}
          />
          {/* Subtle pattern */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(255,255,255,0.5) 60px, rgba(255,255,255,0.5) 61px), repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(255,255,255,0.5) 60px, rgba(255,255,255,0.5) 61px)' }}
          />
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-6">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-semibold text-amber-300 tracking-wider uppercase">Chennai's Most Trusted Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.06] mb-6 tracking-tight">
              Find Your Perfect<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300">
                Home in Chennai
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
              RERA-verified properties, directly from builders. Zero brokerage, complete transparency.
            </p>

            {/* Property Type Toggle */}
            <div className="flex items-center gap-1 bg-white/[0.08] border border-white/10 rounded-2xl p-1 mb-6 overflow-x-auto scrollbar-none max-w-full">
              {[
                { id: 'buy', label: 'Buy' },
                { id: 'rent', label: 'Rent' },
                { id: 'plots', label: 'Plots' },
                { id: 'commercial', label: 'Commercial' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setPropertyType(t.id)}
                  className={`shrink-0 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                    propertyType === t.id
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Search bar */}
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              onSubmit={handleSearch}
              className="max-w-3xl mx-auto"
            >
              <div className="flex flex-col sm:flex-row gap-2 p-2 bg-white/[0.06] backdrop-blur-xl border border-white/[0.12] rounded-2xl shadow-2xl">
                <div className="flex-1 relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search locality, project, or area…"
                    className="w-full bg-transparent pl-11 pr-4 py-4 text-white placeholder-white/30 text-base outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-500/30 whitespace-nowrap"
                >
                  <Search className="w-4 h-4" />
                  Search Properties
                </button>
              </div>

              {/* Quick filters */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                {['Anna Nagar', 'OMR', 'Adyar', 'Velachery', 'T Nagar', 'ECR'].map(loc => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => { setSearchQuery(loc); router.push(`/property-listing?q=${encodeURIComponent(loc)}`) }}
                    className="px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.10] text-white/60 hover:text-white text-xs rounded-full transition-all"
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </motion.form>

            {/* Trust strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-x-5 gap-y-4 sm:gap-6 mt-10 sm:mt-12 pt-8 sm:pt-10 border-t border-white/[0.08]"
            >
              {[
                { icon: Shield, label: 'RERA Verified', sub: 'Every listing' },
                { icon: Building2, label: 'Zero Brokerage', sub: 'Direct builders' },
                { icon: CheckCircle2, label: 'Verified Builders', sub: '100% authentic' },
                { icon: BarChart3, label: 'Live Market Data', sub: 'Updated daily' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.08] border border-white/[0.10] flex items-center justify-center">
                    <Icon className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-white/90">{label}</div>
                    <div className="text-[11px] text-white/40">{sub}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-6 h-9 rounded-full border-2 border-white/20 flex items-start justify-center pt-1.5">
            <motion.div
              className="w-1.5 h-2.5 rounded-full bg-white/40"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </div>
      </section>

      {/* ══ STATS STRIP ════════════════════════════════════════ */}
      <section className="bg-white border-y border-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '500+', label: 'Properties Listed', sub: 'And growing' },
              { value: '100%', label: 'RERA Verified', sub: 'Zero exceptions' },
              { value: '₹0', label: 'Brokerage', sub: 'Direct savings' },
              { value: '25+', label: 'Builder Partners', sub: 'Tamil Nadu' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="text-center py-2"
              >
                <div className="text-2xl sm:text-3xl font-bold text-[#0B1C34] mb-0.5">{stat.value}</div>
                <div className="text-sm font-semibold text-gray-700">{stat.label}</div>
                <div className="text-xs text-gray-400">{stat.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURED PROPERTIES ════════════════════════════════ */}
      <section className="py-20 bg-[#FAFAF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-2">Featured</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#0B1C34]">Curated Properties</h2>
              <p className="text-gray-500 mt-2">Handpicked verified listings from trusted builders</p>
            </div>
            <Link
              href="/property-listing"
              className="hidden sm:flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Coming soon / empty state */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              >
                {/* Property image placeholder */}
                <div className="relative h-52 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Building2 className="w-12 h-12 text-slate-300 mb-2" />
                    <span className="text-sm font-medium text-slate-400">Listing Coming Soon</span>
                    <span className="text-xs text-slate-300 mt-1">New property being verified</span>
                  </div>
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-2.5 py-1 bg-emerald-500 text-white text-[11px] font-bold rounded-lg">RERA ✓</span>
                  </div>
                  <button className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors">
                    <Heart className="w-4 h-4 text-gray-400 hover:text-rose-500 transition-colors" />
                  </button>
                </div>

                {/* Property info */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="h-5 bg-slate-100 rounded animate-pulse w-3/4 mb-1.5" />
                      <div className="h-4 bg-slate-100 rounded animate-pulse w-1/2" />
                    </div>
                    <div className="text-right">
                      <div className="h-6 bg-amber-50 rounded animate-pulse w-20 mb-1" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Bed className="w-3.5 h-3.5" />
                      <span>— BHK</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>— sqft</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Chennai</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA for empty state */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-10 bg-gradient-to-r from-[#0B1C34] to-[#0D2B52] rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6"
          >
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                New properties launching soon
              </h3>
              <p className="text-white/60 max-w-md">
                Be the first to know when verified properties matching your requirement go live.
              </p>
            </div>
            <button
              onClick={() => setShowLeadModal(true)}
              className="flex items-center gap-2 px-7 py-3.5 bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-500/30 whitespace-nowrap"
            >
              <Zap className="w-4 h-4" />
              Leave Your Requirement
            </button>
          </motion.div>

          <div className="sm:hidden text-center mt-8">
            <Link href="/property-listing" className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600">
              View all properties <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══ BROWSE BY BUDGET ════════════════════════════════════ */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-2">Find by Budget</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0B1C34]">What's Your Range?</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {BUDGETS.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.97 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y: -4 }}
              >
                <Link
                  href={b.href}
                  className={`block p-4 sm:p-6 rounded-2xl border-2 transition-all h-full group ${
                    b.featured
                      ? 'border-amber-400 bg-amber-50 shadow-lg shadow-amber-500/10'
                      : 'border-gray-100 bg-[#FAFAF8] hover:border-amber-200 hover:bg-amber-50/50'
                  }`}
                >
                  {b.featured && (
                    <span className="inline-block px-2.5 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full mb-3 uppercase tracking-wider">
                      Most Popular
                    </span>
                  )}
                  <div className={`text-lg sm:text-xl font-bold mb-1 ${b.featured ? 'text-amber-700' : 'text-[#0B1C34]'}`}>
                    {b.label}
                  </div>
                  <div className="text-sm text-gray-500 mb-3">{b.range}</div>
                  <div className={`flex items-center gap-1 text-xs font-semibold ${b.featured ? 'text-amber-600' : 'text-amber-500 opacity-0 group-hover:opacity-100'} transition-opacity`}>
                    Browse <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ EXPLORE LOCALITIES ══════════════════════════════════ */}
      <section className="py-20 bg-[#FAFAF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-2">Explore</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#0B1C34]">Chennai Localities</h2>
              <p className="text-gray-500 mt-2">Discover properties by neighbourhood</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {LOCALITIES.map((loc, i) => (
              <motion.div
                key={loc.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -4 }}
              >
                <Link
                  href={`/property-listing?q=${encodeURIComponent(loc.name)}`}
                  className="block bg-white rounded-2xl border border-gray-100 p-5 hover:border-amber-200 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B1C34] to-[#1D4ED8]/50 flex items-center justify-center">
                      <MapPin className="w-4.5 h-4.5 text-amber-400" style={{ width: '18px', height: '18px' }} />
                    </div>
                    <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                      {loc.tag}
                    </span>
                  </div>
                  <h3 className="font-bold text-[#0B1C34] mb-1 group-hover:text-amber-700 transition-colors">{loc.name}</h3>
                  <p className="text-xs text-gray-400 mb-0.5">{loc.properties}</p>
                  <p className="text-xs font-medium text-gray-600">{loc.avg}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ WHY THARAGA ════════════════════════════════════════ */}
      <section className="py-20 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-2">Our Promise</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0B1C34] mb-3">Why Buyers Trust Tharaga</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              We've built a platform that puts buyers first — transparent, verified, and completely brokerage-free.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_THARAGA.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#FAFAF8] rounded-2xl p-7 border border-gray-100 hover:shadow-lg transition-all group"
              >
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-5 ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#0B1C34] mb-2 text-lg">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TOOLS ═══════════════════════════════════════════════ */}
      <section className="py-20 bg-[#FAFAF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-2">Free Tools</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#0B1C34]">Plan Your Purchase</h2>
              <p className="text-gray-500 mt-2">Every tool you need to make the right decision</p>
            </div>
            <Link href="/tools" className="hidden sm:flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors">
              All tools <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {TOOLS.map((tool, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -4 }}
              >
                <Link
                  href={tool.href}
                  className="block bg-white border border-gray-100 hover:border-amber-200 rounded-2xl p-5 text-center hover:shadow-lg transition-all group"
                >
                  <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 group-hover:bg-amber-500 flex items-center justify-center mx-auto mb-3 transition-colors">
                    <tool.icon className="w-5 h-5 text-amber-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="text-sm font-bold text-[#0B1C34] mb-1">{tool.title}</div>
                  <div className="text-[11px] text-gray-400">{tool.desc}</div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS / TRUST ════════════════════════════════ */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-2">Testimonials</p>
            <h2 className="text-3xl font-bold text-[#0B1C34]">What Buyers Are Saying</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Priya Rajan', location: 'Anna Nagar', text: 'Found our dream home in 3 weeks. Zero brokerage saved us ₹2.5L. The RERA verification gave us complete peace of mind.', rating: 5 },
              { name: 'Karthik Subramaniam', location: 'OMR', text: 'The property matching was spot-on. Got exactly what I was looking for within my budget. Highly recommend to anyone buying in Chennai.', rating: 5 },
              { name: 'Divya Krishnamurthy', location: 'Adyar', text: 'Transparent, honest, and incredibly helpful. The team at Tharaga made the entire buying process smooth and stress-free.', rating: 5 },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="bg-[#FAFAF8] rounded-2xl p-7 border border-gray-100"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 leading-relaxed mb-5 text-sm">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-bold">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#0B1C34]">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.location}, Chennai</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ═══════════════════════════════════════════ */}
      <section className="py-24 bg-[#0B1C34] overflow-hidden relative">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(197,163,58,0.6) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(59,130,246,0.3) 0%, transparent 50%)' }}
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-8">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-sm font-medium text-amber-300">Chennai · Tamil Nadu · India</span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-[1.1]">
              Your dream home<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-400">
                starts here.
              </span>
            </h2>
            <p className="text-lg text-white/60 max-w-xl mx-auto mb-10">
              Share your requirement once. We'll match you to verified properties from trusted Chennai builders.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setShowLeadModal(true)}
                className="flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-white font-bold text-base rounded-xl transition-all shadow-xl shadow-amber-500/25"
              >
                <Zap className="w-5 h-5" />
                Leave My Requirement
                <ArrowRight className="w-5 h-5" />
              </button>
              <Link
                href="/property-listing"
                className="flex items-center gap-2 px-8 py-4 border-2 border-white/20 hover:border-white/40 text-white font-semibold text-base rounded-xl transition-all"
              >
                <Search className="w-5 h-5" />
                Browse Properties
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-xs text-white/40">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Free service for buyers</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> RERA-verified only</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Zero brokerage</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> No spam calls</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════ */}
      <footer className="bg-[#060E1C] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg text-white">Tharaga</span>
              </div>
              <p className="text-sm text-white/50 leading-relaxed mb-5">
                Chennai's most trusted real estate platform. RERA-verified properties, zero brokerage, directly from builders.
              </p>
              <div className="flex items-center gap-2 text-sm text-white/50">
                <Phone className="w-4 h-4 text-amber-400" />
                <a href="tel:+918870980839" className="hover:text-white transition-colors">+91 88709 80839</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white/90 mb-5 text-sm uppercase tracking-wider">Properties</h4>
              <ul className="space-y-3">
                {['Apartments', 'Villas', 'Plots', 'Penthouses', 'Commercial', 'New Launches'].map(item => (
                  <li key={item}>
                    <Link href={`/property-listing?type=${item.toLowerCase()}`} className="text-sm text-white/50 hover:text-white transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white/90 mb-5 text-sm uppercase tracking-wider">Areas</h4>
              <ul className="space-y-3">
                {['Anna Nagar', 'Adyar', 'OMR Corridor', 'Velachery', 'T Nagar', 'ECR'].map(area => (
                  <li key={area}>
                    <Link href={`/property-listing?q=${encodeURIComponent(area)}`} className="text-sm text-white/50 hover:text-white transition-colors">
                      {area}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white/90 mb-5 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-3">
                {[
                  { label: 'About Us', href: '/about' },
                  { label: 'For Builders', href: '/builder' },
                  { label: 'Pricing', href: '/pricing' },
                  { label: 'Tools', href: '/tools' },
                  { label: 'Privacy Policy', href: '/privacy' },
                  { label: 'Terms of Service', href: '/terms' },
                ].map(item => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-sm text-white/50 hover:text-white transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/[0.06]">
            <p className="text-xs text-white/30">
              © {new Date().getFullYear()} Tharaga Real Estate. Chennai, Tamil Nadu, India. All rights reserved.
            </p>
            <div className="flex items-center gap-5 text-xs text-white/30">
              <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
              <Link href="/sitemap.xml" className="hover:text-white/60 transition-colors">Sitemap</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Lead capture modal ── */}
      <AnimatePresence>
        {showLeadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setShowLeadModal(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 max-h-[90dvh] overflow-y-auto"
            >
              <LeadCaptureForm
                onClose={() => setShowLeadModal(false)}
                onSuccess={() => setTimeout(() => setShowLeadModal(false), 3000)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
