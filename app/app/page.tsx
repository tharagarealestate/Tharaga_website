'use client'

/**
 * THARAGA — Neural Command Center Homepage
 * Concept: AI Intelligence Terminal meets real estate
 *
 * Unique features no other SaaS has:
 * 1. AI Command Prompt as primary CTA (type requirements like talking to AI)
 * 2. Real-time Intelligence Ticker (horizontal scroll data feed)
 * 3. Property Constellation (3D CSS perspective floating nodes)
 * 4. Neural locality map of Chennai (animated connections)
 * 5. Floating ghost nav (appears on scroll, not on load)
 * 6. Terminal-style builder metrics (Bloomberg aesthetic)
 * 7. Mouse-tracked amber glow orb
 *
 * Design: bg-zinc-950, amber glow, monospace data, breathing animations
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import {
  Brain, Target, BarChart3, Zap, Shield, ArrowRight, CheckCircle2,
  Building2, Sparkles, TrendingUp, ChevronRight, Activity,
  MessageSquare, Calculator, Star, Users, Search, Eye,
  LogIn, LogOut, LayoutDashboard, ChevronDown,
} from 'lucide-react'
import { openAuthModal } from '@/components/ui/AuthButton'
import { getSupabase } from '@/lib/supabase'
import LeadCaptureForm from '@/components/LeadCaptureForm'

// ─── Intelligence Feed Data ──────────────────────────────────────────────────
const FEED_ITEMS = [
  { label: 'Anna Nagar 3BHK', value: '₹92L', change: '+2.4%', type: 'price' },
  { label: 'New lead scored', value: '78/100', change: '🦁 Lion', type: 'lead' },
  { label: 'OMR corridor demand', value: 'HIGH', change: '↑ 34%', type: 'demand' },
  { label: 'Adyar avg sqft rate', value: '₹8,400', change: '+1.2%', type: 'price' },
  { label: 'Lead qualified via AI', value: 'Tharaga AI', change: '6/6 fields', type: 'ai' },
  { label: 'Porur 2BHK', value: '₹55L', change: 'RERA ✓', type: 'price' },
  { label: 'WhatsApp response', value: '4min', change: 'avg today', type: 'metric' },
  { label: 'Velachery appreciation', value: '11.2%', change: 'YoY', type: 'demand' },
  { label: 'Leads converted', value: '23', change: 'this week', type: 'metric' },
  { label: 'T Nagar villa', value: '₹2.1Cr', change: '+5.8%', type: 'price' },
  { label: 'Meta CAPI accuracy', value: '94%', change: 'event match', type: 'ai' },
  { label: 'Chromepet 2BHK', value: '₹48L', change: 'RERA ✓', type: 'price' },
]

const TYPE_COLORS: Record<string, string> = {
  price: 'text-amber-400',
  lead: 'text-emerald-400',
  demand: 'text-blue-400',
  metric: 'text-purple-400',
  ai: 'text-amber-300',
}

// ─── Locality Nodes ──────────────────────────────────────────────────────────
const LOCALITIES = [
  { id: 'anna-nagar', name: 'Anna Nagar', x: 30, y: 25, demand: 92, price: '₹85-120L', properties: 18 },
  { id: 'adyar', name: 'Adyar', x: 45, y: 70, demand: 88, price: '₹90-150L', properties: 12 },
  { id: 'omr', name: 'OMR', x: 75, y: 60, demand: 95, price: '₹60-90L', properties: 31 },
  { id: 'porur', name: 'Porur', x: 20, y: 60, demand: 78, price: '₹50-75L', properties: 9 },
  { id: 'velachery', name: 'Velachery', x: 60, y: 55, demand: 85, price: '₹65-95L', properties: 14 },
  { id: 'tnagar', name: 'T Nagar', x: 40, y: 45, demand: 80, price: '₹70-120L', properties: 7 },
  { id: 'chromepet', name: 'Chromepet', x: 55, y: 80, demand: 72, price: '₹40-60L', properties: 11 },
]

// ─── Property Constellation Data ─────────────────────────────────────────────
const PROPERTY_NODES = [
  { id: 1, title: '3BHK Villa', locality: 'Anna Nagar', price: '₹1.2Cr', score: 94, type: 'Villa', sqft: 2200 },
  { id: 2, title: '2BHK Apt', locality: 'OMR', price: '₹68L', score: 87, type: 'Apartment', sqft: 950 },
  { id: 3, title: '3BHK Premium', locality: 'Adyar', price: '₹95L', score: 91, type: 'Apartment', sqft: 1450 },
  { id: 4, title: '2BHK Smart', locality: 'Velachery', price: '₹72L', score: 83, type: 'Apartment', sqft: 1050 },
  { id: 5, title: 'Studio', locality: 'T Nagar', price: '₹38L', score: 76, type: 'Studio', sqft: 420 },
  { id: 6, title: '4BHK Bungalow', locality: 'Porur', price: '₹2.1Cr', score: 96, type: 'Villa', sqft: 3200 },
]

// ─── AI Command Suggestions ───────────────────────────────────────────────────
const SUGGESTIONS = [
  '2BHK in Anna Nagar under 80 lakhs',
  '3BHK villa near OMR with garden',
  'Investment property with good rental yield',
  'RERA verified flat in Adyar',
]

// ─── Typewriter Hook ─────────────────────────────────────────────────────────
function useTypewriter(texts: string[], speed = 60, pause = 2000) {
  const [display, setDisplay] = useState('')
  const [textIdx, setTextIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = texts[textIdx]
    let timer: ReturnType<typeof setTimeout>

    if (!deleting && charIdx < current.length) {
      timer = setTimeout(() => setCharIdx(c => c + 1), speed)
    } else if (!deleting && charIdx === current.length) {
      timer = setTimeout(() => setDeleting(true), pause)
    } else if (deleting && charIdx > 0) {
      timer = setTimeout(() => setCharIdx(c => c - 1), speed / 2)
    } else if (deleting && charIdx === 0) {
      setDeleting(false)
      setTextIdx(i => (i + 1) % texts.length)
    }

    setDisplay(current.slice(0, charIdx))
    return () => clearTimeout(timer)
  }, [charIdx, deleting, textIdx, texts, speed, pause])

  return display
}

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 40 }: { score: number; size?: number }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 80 ? '#f59e0b' : score >= 60 ? '#3b82f6' : '#6b7280'
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#27272a" strokeWidth={4} fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        stroke={color} strokeWidth={4} fill="none"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em"
        fill={color} fontSize={size * 0.25} fontFamily="monospace"
        className="rotate-90" style={{ transform: `rotate(90deg) translateX(${-size / 2}px) translateY(${-size / 2}px)` }}>
      </text>
    </svg>
  )
}

// ─── Neural Network Lines (SVG overlay) ──────────────────────────────────────
function NeuralLines({ nodes }: { nodes: typeof LOCALITIES }) {
  const connections = [
    [0, 5], [5, 1], [5, 4], [4, 1], [4, 6], [2, 4], [2, 6], [0, 3], [3, 4],
  ]
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.25 }}>
      {connections.map(([a, b], i) => {
        const na = nodes[a], nb = nodes[b]
        if (!na || !nb) return null
        return (
          <line key={i}
            x1={`${na.x}%`} y1={`${na.y}%`}
            x2={`${nb.x}%`} y2={`${nb.y}%`}
            stroke="#f59e0b" strokeWidth="1"
            style={{
              animation: `neural-pulse ${1.5 + i * 0.3}s ease-in-out infinite alternate`,
            }}
          />
        )
      })}
    </svg>
  )
}

// ─── Main HomePage ────────────────────────────────────────────────────────────
export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const [commandInput, setCommandInput] = useState('')
  const [commandFocused, setCommandFocused] = useState(false)
  const [showLeadModal, setShowLeadModal] = useState(false)
  const [activeLocality, setActiveLocality] = useState<string | null>(null)
  const [navVisible, setNavVisible] = useState(true)
  const [hoveredProperty, setHoveredProperty] = useState<number | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // ── Auth state ──
  const [user, setUser] = useState<any>(null)
  const [displayName, setDisplayName] = useState('')
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    let mounted = true
    async function loadUser(authUser: any) {
      if (!authUser) { if (mounted) { setUser(null); setDisplayName(''); setUserEmail('') } return }
      if (mounted) {
        setUser(authUser)
        setUserEmail(authUser.email || '')
        setDisplayName(authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User')
      }
      try {
        const supabase = getSupabase()
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', authUser.id).single()
        if (mounted && profile?.full_name) setDisplayName(profile.full_name)
      } catch {}
    }
    async function init() {
      try {
        const supabase = getSupabase()
        const { data: { user: authUser } } = await supabase.auth.getUser()
        loadUser(authUser)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => loadUser(session?.user || null))
        return () => { mounted = false; subscription.unsubscribe() }
      } catch { return () => { mounted = false } }
    }
    const cleanup = init()
    return () => { mounted = false; cleanup.then(fn => fn?.()) }
  }, [])

  const handleSignOut = useCallback(async () => {
    setUserMenuOpen(false)
    // Reset UI immediately — never wait for the signOut() network call
    setUser(null)
    setDisplayName('')
    setUserEmail('')
    try {
      const supabase = getSupabase()
      await supabase.auth.signOut()
    } catch { /* ignore — UI already cleared */ }
    // Hard reload guarantees fully clean client state (no stale React state)
    window.location.href = '/'
  }, [])

  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20 })

  const placeholder = useTypewriter([
    '2BHK in Anna Nagar under 80 lakhs...',
    'RERA verified villa near OMR...',
    'Investment property with high yield...',
    '3BHK flat in Adyar below 1 crore...',
  ])

  const { scrollY } = useScroll()
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0])
  const heroY = useTransform(scrollY, [0, 400], [0, -60])

  // Nav is always visible — no scroll-based toggle

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    mouseX.set(e.clientX)
    mouseY.set(e.clientY)
  }, [mouseX, mouseY])

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (commandInput.trim()) setShowLeadModal(true)
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-zinc-950 overflow-x-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* ── Cursor glow orb ── */}
      <motion.div
        className="fixed pointer-events-none z-0 w-[400px] h-[400px] rounded-full blur-[120px] bg-amber-500/8"
        style={{ left: springX, top: springY, transform: 'translate(-50%, -50%)' }}
      />

      {/* ── Sticky nav — always visible ── */}
      <AnimatePresence>
        {navVisible && (
          <motion.nav
            initial={{ y: 0, opacity: 1 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed top-0 left-0 right-0 z-50 px-6 py-3 backdrop-blur-2xl bg-zinc-950/85 border-b border-white/[0.06]"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-amber-400" />
                </div>
                <span className="font-bold text-zinc-100 text-sm">Tharaga</span>
              </Link>
              <div className="hidden md:flex items-center gap-6 text-xs text-zinc-400">
                <Link href="/property-listing" className="hover:text-zinc-100 transition-colors">Properties</Link>
                <Link href="/tools" className="hover:text-zinc-100 transition-colors">Tools</Link>
                <Link href="/pricing" className="hover:text-zinc-100 transition-colors">Pricing</Link>
                {user
                  ? <Link href="/builder" className="hover:text-zinc-100 transition-colors">Builder</Link>
                  : <button onClick={() => openAuthModal('/builder')} className="hover:text-zinc-100 transition-colors">Builder</button>
                }
              </div>
              <div className="flex items-center gap-3">
                {user ? (
                  /* ── Logged in: avatar + dropdown ── */
                  <div
                    className="relative"
                    onMouseEnter={() => setUserMenuOpen(true)}
                    onMouseLeave={() => setUserMenuOpen(false)}
                  >
                    <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors">
                      <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-[11px] font-bold">
                        {initials}
                      </div>
                      <span className="text-xs font-medium text-zinc-300 max-w-[100px] truncate">{displayName}</span>
                      <ChevronDown className="w-3 h-3 text-zinc-500" />
                    </button>
                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.97 }}
                          transition={{ duration: 0.15, ease: 'easeOut' }}
                          className="absolute right-0 top-full mt-1.5 w-52 bg-zinc-900 border border-zinc-700/60 rounded-xl shadow-2xl overflow-hidden z-50"
                        >
                          <div className="px-4 py-3 border-b border-zinc-800">
                            <p className="text-xs font-semibold text-zinc-200 truncate">{displayName}</p>
                            <p className="text-[10px] text-zinc-500 truncate">{userEmail}</p>
                          </div>
                          <div className="p-1.5 space-y-0.5">
                            <Link
                              href="/builder"
                              className="flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                              <LayoutDashboard className="w-3.5 h-3.5" />
                              Dashboard
                            </Link>
                            <button
                              onClick={handleSignOut}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              Sign out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  /* ── Not logged in: Sign In button ── */
                  <button
                    onClick={() => openAuthModal()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold rounded-lg transition-all"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════
          SECTION 1: NEURAL HERO — Command Terminal
      ══════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-8">
        {/* Background: neural grid */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(rgba(245,158,11,1) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
          />
          {/* Animated orbs */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-amber-500/[0.06] blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-amber-600/[0.04] blur-[80px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
          <div className="absolute top-3/4 left-1/2 w-[300px] h-[300px] rounded-full bg-amber-400/[0.03] blur-[60px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        </div>

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 w-full max-w-5xl mx-auto px-6 text-center"
        >
          {/* Headline — types itself */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-4"
          >
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight">
              <span className="text-zinc-100">Your property</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500">
                intelligence engine
              </span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-lg text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            India&apos;s first AI that scores every lead, qualifies via WhatsApp, distributes to the right exec
            — and closes deals autonomously. Zero commission, RERA-verified, Chennai-first.
          </motion.p>

          {/* ── AI Command Input — the core CTA ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="max-w-2xl mx-auto mb-8"
          >
            <form onSubmit={handleCommandSubmit} className="relative">
              {/* Terminal cursor blink */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-amber-400 text-sm select-none z-10">
                {'>'}
              </div>
              <input
                type="text"
                value={commandInput}
                onChange={e => setCommandInput(e.target.value)}
                onFocus={() => setCommandFocused(true)}
                onBlur={() => setTimeout(() => setCommandFocused(false), 200)}
                placeholder={placeholder}
                className="w-full bg-white/[0.04] backdrop-blur-xl border border-white/[0.10] focus:border-amber-500/60 rounded-2xl pl-10 pr-36 py-5 text-base text-zinc-100 placeholder-zinc-600 outline-none transition-all font-mono caret-amber-400"
                style={{ caretColor: '#f59e0b' }}
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-xl transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Ask AI
              </button>
              {/* Glow border on focus */}
              <div className={`absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300 ${commandFocused ? 'opacity-100' : 'opacity-0'}`}
                style={{ boxShadow: '0 0 0 1px rgba(245,158,11,0.3), 0 0 40px rgba(245,158,11,0.1)' }}
              />
            </form>

            {/* Quick suggestions */}
            <AnimatePresence>
              {commandFocused && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute left-0 right-0 mt-2 bg-zinc-900/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-2 z-20"
                >
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { setCommandInput(s); setCommandFocused(false); setTimeout(() => setShowLeadModal(true), 100) }}
                      className="w-full text-left px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] rounded-xl transition-all flex items-center gap-2"
                    >
                      <Search className="w-3.5 h-3.5 text-amber-400" />
                      {s}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Or links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-4 text-sm"
          >
            <Link href="/property-listing" className="flex items-center gap-1.5 text-zinc-400 hover:text-amber-400 transition-colors group">
              <Eye className="w-3.5 h-3.5 group-hover:text-amber-400" />
              Browse properties
            </Link>
            <span className="text-zinc-700">·</span>
            {user ? (
              <Link href="/builder" className="flex items-center gap-1.5 text-zinc-400 hover:text-amber-400 transition-colors group">
                <Zap className="w-3.5 h-3.5 group-hover:text-amber-400" />
                Start as Builder
              </Link>
            ) : (
              <button onClick={() => openAuthModal('/builder')} className="flex items-center gap-1.5 text-zinc-400 hover:text-amber-400 transition-colors group">
                <Zap className="w-3.5 h-3.5 group-hover:text-amber-400" />
                Start as Builder
              </button>
            )}
            <span className="text-zinc-700">·</span>
            <Link href="/tools" className="flex items-center gap-1.5 text-zinc-400 hover:text-amber-400 transition-colors group">
              <Calculator className="w-3.5 h-3.5 group-hover:text-amber-400" />
              AI Tools
            </Link>
          </motion.div>

          {/* Trust bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex flex-wrap items-center justify-center gap-6 mt-12 pt-8 border-t border-white/[0.06]"
          >
            {[
              { icon: Shield, label: 'RERA Verified Only' },
              { icon: TrendingUp, label: '₹0 Brokerage' },
              { icon: Brain, label: 'AI Lead Scoring' },
              { icon: Activity, label: 'Live Market Data' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-zinc-500">
                <Icon className="w-3.5 h-3.5 text-amber-400/60" />
                <span>{label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-zinc-600 font-mono tracking-wider">SCROLL TO EXPLORE</span>
          <div className="w-px h-12 bg-gradient-to-b from-amber-400/50 to-transparent" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════
          INTELLIGENCE TICKER — Horizontal scroll feed
          (Unique: no other SaaS platform has this)
      ══════════════════════════════════════════════════ */}
      <section className="relative py-4 border-y border-white/[0.06] overflow-hidden bg-zinc-950/50 backdrop-blur-sm">
        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-zinc-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />
        <div className="flex gap-12 animate-ticker whitespace-nowrap">
          {[...FEED_ITEMS, ...FEED_ITEMS, ...FEED_ITEMS].map((item, i) => (
            <div key={i} className="inline-flex items-center gap-3 shrink-0">
              <span className="text-xs text-zinc-600 font-mono">{item.label}</span>
              <span className={`text-xs font-bold font-mono ${TYPE_COLORS[item.type] || 'text-zinc-400'}`}>{item.value}</span>
              <span className="text-xs text-zinc-500 font-mono">{item.change}</span>
              <span className="text-zinc-800 mx-2">⟡</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 2: PROPERTY CONSTELLATION
          3D floating property nodes — unique UX concept
      ══════════════════════════════════════════════════ */}
      <section className="relative py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-mono text-amber-400 tracking-widest uppercase">Live Inventory</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-zinc-100 mb-4">
              Properties in your orbit
            </h2>
            <p className="text-zinc-400 max-w-xl">Each node is a verified property. AI score, price, and demand visible at a glance.</p>
          </motion.div>

          {/* Constellation grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PROPERTY_NODES.map((prop, i) => (
              <motion.div
                key={prop.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.03, y: -4 }}
                onHoverStart={() => setHoveredProperty(prop.id)}
                onHoverEnd={() => setHoveredProperty(null)}
                className="relative cursor-pointer"
              >
                <Link href="/property-listing">
                  <div className={`relative bg-white/[0.03] backdrop-blur-xl border rounded-2xl p-5 transition-all duration-300 ${
                    hoveredProperty === prop.id
                      ? 'border-amber-400/40 bg-white/[0.06]'
                      : 'border-white/[0.06]'
                  }`}>
                    {/* Glow on hover */}
                    <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 pointer-events-none ${hoveredProperty === prop.id ? 'opacity-100' : 'opacity-0'}`}
                      style={{ boxShadow: 'inset 0 0 40px rgba(245,158,11,0.05), 0 0 40px rgba(245,158,11,0.05)' }}
                    />

                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-zinc-500">{prop.type.toUpperCase()}</span>
                          <span className="w-1 h-1 rounded-full bg-zinc-700" />
                          <span className="text-xs font-mono text-zinc-500">{prop.sqft} sqft</span>
                        </div>
                        <h3 className="font-semibold text-zinc-100">{prop.title}</h3>
                        <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3" /> {prop.locality}
                        </p>
                      </div>
                      {/* AI Score ring */}
                      <div className="flex flex-col items-center gap-1">
                        <div className="relative w-10 h-10">
                          <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                            <circle cx="20" cy="20" r="16" stroke="#27272a" strokeWidth="3" fill="none" />
                            <circle cx="20" cy="20" r="16" stroke="#f59e0b" strokeWidth="3" fill="none"
                              strokeDasharray={2 * Math.PI * 16}
                              strokeDashoffset={2 * Math.PI * 16 * (1 - prop.score / 100)}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-amber-400">{prop.score}</span>
                        </div>
                        <span className="text-[9px] text-zinc-600 font-mono">AI SCORE</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-amber-400 font-mono">{prop.price}</span>
                      <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 rounded-lg">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span className="text-xs text-emerald-400 font-mono">RERA</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-8"
          >
            <Link
              href="/property-listing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/[0.04] border border-white/[0.08] hover:border-amber-500/30 text-zinc-300 hover:text-amber-400 text-sm rounded-xl transition-all"
            >
              View all properties <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 3: AI PIPELINE VISUALIZATION
          How the AI funnel actually works — animated flow
      ══════════════════════════════════════════════════ */}
      <section className="relative py-24 border-t border-white/[0.06] overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/[0.02] to-transparent" />

        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full mb-4">
              <Brain className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-medium text-amber-400">Autonomous AI Pipeline</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-zinc-100 mb-4">
              AI does the heavy lifting
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto">From click to close — every step automated, scored, and optimized in real time.</p>
          </motion.div>

          {/* Pipeline flow */}
          <div className="relative">
            {/* Connector line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent -translate-y-1/2" />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {[
                { icon: Search, label: 'Lead Capture', desc: 'Web + Meta + WhatsApp', color: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500/30', num: '01' },
                { icon: Brain, label: 'SmartScore AI', desc: 'Scored 0–100 in 2 seconds', color: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/30', num: '02' },
                { icon: MessageSquare, label: 'Tharaga AI', desc: 'AI qualifies in 6 questions', color: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/30', num: '03' },
                { icon: Target, label: 'Auto Distribute', desc: 'Lion → Monkey → Dog tiers', color: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-500/30', num: '04' },
                { icon: TrendingUp, label: 'Close & Track', desc: 'CAPI + CRM + analytics', color: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500/30', num: '05' },
              ].map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative flex flex-col items-center text-center"
                >
                  <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} border ${step.border} flex items-center justify-center mb-4`}>
                    <step.icon className="w-7 h-7 text-zinc-100" />
                    <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                      <span className="text-[9px] font-mono font-bold text-zinc-400">{step.num}</span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-zinc-100 mb-1 text-sm">{step.label}</h3>
                  <p className="text-xs text-zinc-500">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Metrics strip below pipeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16"
          >
            {[
              { value: '< 2s', label: 'Lead Score Time', sub: 'SmartScore AI' },
              { value: '15 min', label: 'Lion SLA', sub: 'Response guarantee' },
              { value: '6', label: 'Questions', sub: 'WhatsApp qualification' },
              { value: '94%', label: 'CAPI Match Rate', sub: 'Meta deduplication' },
            ].map((m, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 text-center">
                <div className="text-3xl font-bold font-mono text-amber-400 mb-1">{m.value}</div>
                <div className="text-sm font-medium text-zinc-300 mb-0.5">{m.label}</div>
                <div className="text-xs text-zinc-600">{m.sub}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 4: CHENNAI NEURAL MAP
          Locality nodes as neural network — unique visual
      ══════════════════════════════════════════════════ */}
      <section className="relative py-24 border-t border-white/[0.06] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-mono text-amber-400 tracking-widest uppercase">Chennai Intelligence</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-zinc-100 mb-6">
                Every locality,<br />mapped by AI
              </h2>
              <p className="text-zinc-400 mb-8 leading-relaxed">
                Our AI tracks price movements, demand signals, RERA activity, and buyer preferences across every Chennai locality — updated daily.
              </p>

              {/* Locality list */}
              <div className="space-y-3">
                {LOCALITIES.map(loc => (
                  <motion.button
                    key={loc.id}
                    whileHover={{ x: 4 }}
                    onClick={() => setActiveLocality(activeLocality === loc.id ? null : loc.id)}
                    className={`w-full text-left flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                      activeLocality === loc.id
                        ? 'border-amber-400/40 bg-amber-500/10'
                        : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${loc.demand >= 90 ? 'bg-amber-400' : loc.demand >= 80 ? 'bg-blue-400' : 'bg-zinc-500'} animate-pulse`} />
                      <span className="font-medium text-zinc-200 text-sm">{loc.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <div className="text-xs font-mono text-zinc-400">{loc.price}</div>
                        <div className="text-xs text-zinc-600">{loc.properties} properties</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full"
                            style={{ width: `${loc.demand}%`, transition: 'width 0.5s ease' }}
                          />
                        </div>
                        <span className="text-xs font-mono text-zinc-500">{loc.demand}</span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Neural map visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative h-[400px] bg-white/[0.02] border border-white/[0.06] rounded-3xl overflow-hidden"
            >
              {/* Grid background */}
              <div className="absolute inset-0 opacity-[0.04]"
                style={{ backgroundImage: 'linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
              />
              {/* Neural connection lines */}
              <NeuralLines nodes={LOCALITIES} />

              {/* Locality nodes */}
              {LOCALITIES.map((loc, i) => (
                <motion.button
                  key={loc.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1, type: 'spring' }}
                  onClick={() => setActiveLocality(activeLocality === loc.id ? null : loc.id)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group"
                  style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
                >
                  <div className={`relative w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                    activeLocality === loc.id
                      ? 'border-amber-400 bg-amber-500/20 scale-125'
                      : 'border-amber-400/30 bg-amber-500/10 group-hover:border-amber-400/70 group-hover:scale-110'
                  }`}>
                    <span className="text-[9px] font-bold text-amber-400 font-mono">{loc.demand}</span>
                    {/* Pulse ring */}
                    <div className="absolute inset-0 rounded-full border border-amber-400/20 animate-ping" style={{ animationDuration: `${2 + i * 0.5}s` }} />
                  </div>
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-zinc-400 whitespace-nowrap font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    {loc.name}
                  </div>
                </motion.button>
              ))}

              {/* Active locality tooltip */}
              <AnimatePresence>
                {activeLocality && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute bottom-4 left-4 right-4 bg-zinc-900/95 backdrop-blur-xl border border-amber-400/20 rounded-xl p-4"
                  >
                    {(() => {
                      const loc = LOCALITIES.find(l => l.id === activeLocality)
                      if (!loc) return null
                      return (
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-zinc-100 text-sm">{loc.name}</h4>
                            <p className="text-xs text-zinc-500 mt-0.5">{loc.properties} active listings</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold font-mono text-amber-400">{loc.price}</div>
                            <div className="text-xs text-zinc-500">Demand: {loc.demand}/100</div>
                          </div>
                        </div>
                      )
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Label */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-mono text-zinc-500">LIVE · Chennai Metro</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 5: BUILDER TERMINAL
          Bloomberg-style metrics for builders
      ══════════════════════════════════════════════════ */}
      <section className="relative py-24 border-t border-white/[0.06] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/[0.03] to-transparent" />

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Builder terminal UI */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden">
                {/* Terminal header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono text-zinc-500">BUILDER INTELLIGENCE — LIVE</span>
                  </div>
                  <span className="text-xs font-mono text-zinc-600">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST</span>
                </div>

                {/* Metrics grid */}
                <div className="p-5 grid grid-cols-2 gap-3">
                  {[
                    { label: 'Active Leads', value: '47', delta: '+8 today', color: 'text-amber-400' },
                    { label: 'Pipeline Value', value: '₹14.2Cr', delta: '+12%', color: 'text-emerald-400' },
                    { label: 'Lion Leads', value: '12', delta: 'SLA: 15min', color: 'text-amber-400' },
                    { label: 'Conversion Rate', value: '24%', delta: '+4.2% MoM', color: 'text-blue-400' },
                  ].map((m, i) => (
                    <motion.div
                      key={m.label}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 }}
                      className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4"
                    >
                      <div className="text-xs text-zinc-500 font-mono mb-1">{m.label}</div>
                      <div className={`text-2xl font-bold font-mono ${m.color} mb-0.5`}>{m.value}</div>
                      <div className="text-xs text-zinc-600 font-mono">{m.delta}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Activity feed */}
                <div className="px-5 pb-5">
                  <div className="text-xs font-mono text-zinc-600 mb-3">RECENT ACTIVITY</div>
                  <div className="space-y-2">
                    {[
                      { time: '14:32', event: 'Lead scored 82/100 — Lion tier', color: 'text-amber-400' },
                      { time: '14:18', event: 'Priya qualified lead via WhatsApp', color: 'text-emerald-400' },
                      { time: '13:55', event: 'CAPI event fired — Meta confirmed', color: 'text-blue-400' },
                      { time: '13:40', event: 'New property view · Anna Nagar', color: 'text-zinc-400' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-xs font-mono">
                        <span className="text-zinc-600 shrink-0">{item.time}</span>
                        <span className={item.color}>{item.event}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Builder copy */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-mono text-amber-400 tracking-widest uppercase">For Builders</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-zinc-100 mb-6">
                Your AI sales<br />team, 24/7
              </h2>
              <p className="text-zinc-400 mb-8 leading-relaxed">
                Lead scoring, WhatsApp qualification, auto-distribution, SLA enforcement, CAPI tracking, and Zoho CRM sync — all autonomous.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { icon: Brain, title: 'SmartScore AI', desc: 'Scores every lead 0–100 based on budget, timeline, intent, and behavioral signals' },
                  { icon: MessageSquare, title: 'Tharaga AI', desc: 'AI assistant qualifies leads in 6 questions — 24/7, zero manual effort' },
                  { icon: Target, title: 'Auto Distribution', desc: 'Lion → Senior exec (15-min SLA) · Monkey → Round robin · Dog → Channel partners' },
                  { icon: BarChart3, title: 'Full Attribution', desc: 'Meta CAPI + Google Ads + UTM tracking — see exactly where every lead came from' },
                ].map((feature, i) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-3"
                  >
                    <div className="p-2 bg-amber-500/10 rounded-lg shrink-0 mt-0.5">
                      <feature.icon className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <div className="font-medium text-zinc-200 text-sm">{feature.title}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{feature.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                {user ? (
                  <Link
                    href="/builder"
                    className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-xl transition-all"
                  >
                    <Zap className="w-4 h-4" /> Start Free Trial
                  </Link>
                ) : (
                  <button
                    onClick={() => openAuthModal('/builder')}
                    className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-xl transition-all"
                  >
                    <Zap className="w-4 h-4" /> Start Free Trial
                  </button>
                )}
                <Link
                  href="/pricing"
                  className="flex items-center gap-2 px-6 py-3 border border-white/[0.08] hover:border-white/[0.15] text-zinc-300 text-sm rounded-xl transition-all"
                >
                  View Pricing <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 6: AI TOOLS GRID
      ══════════════════════════════════════════════════ */}
      <section className="relative py-24 border-t border-white/[0.06] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-full mb-4">
              <Calculator className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-medium text-zinc-400">AI-Powered Tools</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-zinc-100 mb-4">
              Tools built for<br />Indian real estate
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto">Financial calculators, RERA verification, market intelligence — all in one command center.</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { icon: TrendingUp, title: 'ROI', desc: 'Return analysis', href: '/tools?t=roi', accent: 'amber' },
              { icon: Calculator, title: 'EMI', desc: 'Loan planner', href: '/tools?t=emi', accent: 'amber' },
              { icon: Building2, title: 'Budget', desc: 'Plan your home', href: '/tools?t=budget', accent: 'emerald' },
              { icon: Shield, title: 'Loan', desc: 'Eligibility check', href: '/tools?t=loan', accent: 'blue' },
              { icon: Star, title: 'Locality', desc: 'Area insights', href: '/tools?t=neighborhood', accent: 'purple' },
              { icon: BarChart3, title: 'Valuation', desc: 'RERA-based', href: '/tools?t=valuation', accent: 'amber' },
            ].map((tool, i) => (
              <motion.div
                key={tool.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -4 }}
              >
                <Link
                  href={tool.href}
                  className="block group bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-amber-500/30 rounded-2xl p-5 text-center transition-all h-full"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 group-hover:bg-amber-500/20 border border-amber-500/20 flex items-center justify-center mx-auto mb-3 transition-all">
                    <tool.icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="font-semibold text-zinc-200 text-sm mb-1">{tool.title}</div>
                  <div className="text-xs text-zinc-600">{tool.desc}</div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
            >
              Open all AI tools <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 7: FINAL CTA — Immersive
      ══════════════════════════════════════════════════ */}
      <section className="relative py-32 border-t border-white/[0.06] overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-amber-500/[0.07] blur-[150px]" />
          <div className="absolute inset-0 opacity-[0.015]"
            style={{ backgroundImage: 'linear-gradient(rgba(245,158,11,1) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-8">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-sm font-medium text-amber-400">Chennai · Tamil Nadu · India</span>
            </div>

            <h2 className="text-5xl md:text-7xl font-bold text-zinc-100 mb-6 leading-[1.05]">
              Feel the intelligence.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-300">
                Close deals faster.
              </span>
            </h2>

            <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
              Join builders using Tharaga AI to turn cold leads into signed deals — automatically, intelligently, and without a single broker.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              {user ? (
                <Link
                  href="/builder"
                  className="flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold text-base rounded-xl transition-all shadow-lg shadow-amber-500/20"
                >
                  <Zap className="w-5 h-5" />
                  Start 14-Day Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <button
                  onClick={() => openAuthModal('/builder')}
                  className="flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold text-base rounded-xl transition-all shadow-lg shadow-amber-500/20"
                >
                  <Zap className="w-5 h-5" />
                  Start 14-Day Free Trial
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
              <Link
                href="/property-listing"
                className="flex items-center gap-2 px-8 py-4 border border-white/[0.12] hover:border-white/[0.25] text-zinc-300 font-medium text-base rounded-xl transition-all backdrop-blur-sm"
              >
                <Search className="w-5 h-5" />
                Browse Properties
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-600">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 14-day free trial</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> No credit card required</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Setup in 5 minutes</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Cancel anytime</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Minimal footer ── */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-zinc-400">Tharaga</span>
            <span className="text-xs text-zinc-700">· Chennai, Tamil Nadu</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-zinc-600">
            <Link href="/privacy" className="hover:text-zinc-400 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-zinc-400 transition-colors">Terms</Link>
            <Link href="/pricing" className="hover:text-zinc-400 transition-colors">Pricing</Link>
            <Link href="/about" className="hover:text-zinc-400 transition-colors">About</Link>
          </div>
          <div className="text-xs text-zinc-700 flex items-center gap-1">
            <Brain className="w-3 h-3 text-amber-400/60" />
            Powered by Claude AI
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setShowLeadModal(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-zinc-950 border border-white/[0.10] rounded-2xl p-6"
            >
              <LeadCaptureForm
                onClose={() => setShowLeadModal(false)}
                onSuccess={(id) => {
                  setTimeout(() => setShowLeadModal(false), 3000)
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
