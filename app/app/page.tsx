'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion'
import { Shield, LogOut, ChevronDown } from 'lucide-react'
import { openAuthModal } from '@/components/ui/AuthButton'
import { getSupabase } from '@/lib/supabase'
import { CinematicHero } from '@/components/portfolio/CinematicHero'
import { PortfolioShowcase } from '@/components/portfolio/PortfolioShowcase'
import { Eyebrow, Grain } from '@/components/portfolio/primitives'
import { TharagaWordmark } from '@/components/brand/TharagaWordmark'
import { SmoothScroll } from '@/components/brand/SmoothScroll'
import { DESK_PHONE_DISPLAY, telLink, whatsappLink } from '@/lib/mandates'
import { CommercialIntakeModal } from '@/components/commercial/CommercialIntakeModal'
import { InstitutionalScreener } from '@/components/commercial/InstitutionalScreener'
import { MandateTracker } from '@/components/commercial/MandateTracker'

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [displayName, setDisplayName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false)

  // Navigation sits transparent over the hero and settles into ivory once scrolled
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  useMotionValueEvent(scrollY, 'change', v => setScrolled(v > 48))

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

  const NAV = [
    { label: 'Portfolio', href: '/properties' },
    { label: 'Acquiring', href: '#acquiring' },
    { label: 'Feasibility', href: '#feasibility' },
    { label: 'The Standard', href: '#advisory' },
  ]
  const onHero = !scrolled && !mobileNavOpen

  return (
    <div className="min-h-screen bg-[#F7F3EC] text-[#15213A] selection:bg-[#E6C9A0] selection:text-[#15213A]">
      <SmoothScroll />

      {/* ── NAVIGATION ─────────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,border-color,padding] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          onHero
            ? 'bg-transparent border-b border-transparent py-4'
            : 'bg-[#F7F3EC]/95 border-b border-[#B0834A]/25 py-2 shadow-[0_10px_30px_-25px_rgba(21,33,58,0.5)]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-10 grid grid-cols-[1fr_auto_1fr] items-center">
          <div className="hidden lg:flex items-center gap-8">
            {NAV.map(link => (
              <a
                key={link.label}
                href={link.href}
                className={`group/nav relative font-sans text-[10px] uppercase tracking-[0.3em] transition-colors duration-500 ${
                  onHero ? 'text-[#F7F3EC]/80 hover:text-[#F7F3EC]' : 'text-[#4A5163] hover:text-[#15213A]'
                }`}
              >
                {link.label}
                <span className="absolute left-0 -bottom-1.5 h-px w-full origin-left scale-x-0 bg-[#B0834A] transition-transform duration-500 group-hover/nav:scale-x-100" />
              </a>
            ))}
          </div>
          <button
            onClick={() => setMobileNavOpen(o => !o)}
            aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
            className="lg:hidden justify-self-start flex flex-col gap-[5px] p-2 -ml-2"
          >
            {[0, 1].map(i => (
              <span
                key={i}
                className={`block h-px w-6 transition-all duration-500 ${onHero ? 'bg-[#F7F3EC]' : 'bg-[#15213A]'} ${
                  mobileNavOpen ? (i === 0 ? 'translate-y-[3px] rotate-45' : '-translate-y-[3px] -rotate-45') : ''
                }`}
              />
            ))}
          </button>

          <Link href="/" aria-label="Tharaga Estates — home" className="justify-self-center">
            <TharagaWordmark tone={onHero ? 'ivory' : 'navy'} height={scrolled ? 56 : 80} priority />
          </Link>

          <div className="justify-self-end flex items-center gap-6">
            {user ? (
              <div className="relative" onMouseEnter={() => setUserMenuOpen(true)} onMouseLeave={() => setUserMenuOpen(false)}>
                <button
                  className={`flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.26em] ${
                    onHero ? 'text-[#F7F3EC]' : 'text-[#15213A]'
                  }`}
                >
                  <span className="flex h-7 w-7 items-center justify-center border border-[#B0834A] font-display text-[11px]">{initials}</span>
                  <ChevronDown className="h-3 w-3 text-[#B0834A]" />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="absolute right-0 top-full mt-3 w-60 bg-[#F7F3EC] border border-[#B0834A]/30 shadow-xl p-2 z-50 text-left"
                    >
                      <div className="px-3 py-2 border-b border-[#E4DACA]">
                        <p className="font-display text-xs text-[#15213A] truncate">{displayName}</p>
                        <p className="text-[10px] text-[#7D8292] truncate">{userEmail}</p>
                      </div>
                      <a
                        href="#status"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-[#4A5163] hover:text-[#15213A] hover:bg-[#EFE8DC] transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5 text-[#94643A]" /> My Property Status
                      </a>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-700 hover:bg-rose-50 transition-colors text-left"
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
                className={`hidden sm:block font-sans text-[10px] uppercase tracking-[0.3em] transition-colors duration-500 ${
                  onHero ? 'text-[#F7F3EC]/80 hover:text-[#F7F3EC]' : 'text-[#4A5163] hover:text-[#15213A]'
                }`}
              >
                Sign in
              </button>
            )}
            <button
              onClick={() => setIsIntakeModalOpen(true)}
              className={`group/list relative overflow-hidden border px-5 py-2.5 font-sans text-[10px] uppercase tracking-[0.28em] transition-colors duration-500 ${
                onHero ? 'border-[#E6C9A0]/70 text-[#F7F3EC]' : 'border-[#15213A] text-[#15213A]'
              }`}
            >
              <span className={`absolute inset-0 origin-bottom scale-y-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/list:scale-y-100 ${onHero ? 'bg-[#F7F3EC]' : 'bg-[#15213A]'}`} />
              <span className={`relative transition-colors duration-500 ${onHero ? 'group-hover/list:text-[#15213A]' : 'group-hover/list:text-[#F7F3EC]'}`}>
                <span className="hidden sm:inline">List a Property</span>
                <span className="sm:hidden">List</span>
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu: full-screen navy curtain */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 bg-[#15213A] text-[#F7F3EC] flex flex-col justify-center px-8 lg:hidden"
          >
            <Grain opacity={0.1} />
            <ul className="relative space-y-6">
              {NAV.map((link, i) => (
                <motion.li
                  key={link.label}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.07, duration: 0.6 }}
                >
                  <a
                    href={link.href}
                    onClick={() => setMobileNavOpen(false)}
                    className="flex items-baseline gap-5 text-[#F7F3EC]"
                  >
                    <span className="font-display text-sm text-[#D9AE78]">{['I', 'II', 'III', 'IV'][i]}</span>
                    <span className="font-display text-3xl tracking-[0.06em]">{link.label}</span>
                  </a>
                </motion.li>
              ))}
            </ul>
            <div className="relative mt-14 border-t border-[#E6C9A0]/20 pt-8 space-y-4 font-sans text-[10.5px] uppercase tracking-[0.3em]">
              <a href={telLink} className="block text-[#E6C9A0] hover:text-[#F7F3EC]">{DESK_PHONE_DISPLAY}</a>
              {!user && (
                <button
                  onClick={() => {
                    setMobileNavOpen(false)
                    openAuthModal()
                  }}
                  className="block text-white/70"
                >
                  Sign in with Google
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <CinematicHero onEnquire={() => window.open(whatsappLink('a private discussion'), '_blank', 'noopener')} />

      {/* ── I. PORTFOLIO  ·  II. ACQUIRING ─────────────────────────── */}
      <PortfolioShowcase />

      {/* ── III. FEASIBILITY ───────────────────────────────────────── */}
      <section id="feasibility" className="py-24 sm:py-32 bg-[#EFE8DC] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="mb-14 max-w-3xl">
            <Eyebrow numeral="III">Feasibility Study</Eyebrow>
            <h2 className="mt-7 text-[#15213A]">
              <span className="block font-display text-4xl sm:text-5xl tracking-[0.03em] leading-[1.1]">Before you buy land,</span>{' '}
              <span className="block font-serif italic font-light text-5xl sm:text-6xl text-[#94643A]">know what it can carry.</span>
            </h2>
          </div>
          <InstitutionalScreener />
        </div>
      </section>

      {/* ── SELLER STATUS ──────────────────────────────────────────── */}
      <section id="status" className="py-24 sm:py-28 bg-[#F7F3EC] border-t border-[#B0834A]/20 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <MandateTracker user={user} onOpenIntake={() => setIsIntakeModalOpen(true)} />
        </div>
      </section>

      {/* ── IV. THE STANDARD ───────────────────────────────────────── */}
      <section id="advisory" className="relative overflow-hidden py-24 sm:py-32 bg-[#F7F3EC] border-t border-[#B0834A]/20 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 grid gap-16 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 lg:sticky lg:top-32 self-start"
          >
            <Eyebrow numeral="IV">The Tharaga Standard</Eyebrow>
            <h2 className="mt-7 text-[#15213A]">
              <span className="block font-display text-4xl sm:text-5xl tracking-[0.03em] leading-[1.1]">Bespoke placement.</span>{' '}
              <span className="block font-serif italic font-light text-5xl sm:text-6xl text-[#94643A]">Zero public noise.</span>
            </h2>
            <p className="mt-8 font-serif text-[1.3rem] leading-[1.6] text-[#2E3648] max-w-md">
              We are not a classifieds portal. Tharaga Estates represents owners privately and places their assets directly
              with corporate buyers and serious investors.
            </p>
          </motion.div>

          <ol className="lg:col-span-7 border-t border-[#B0834A]/30">
            {[
              {
                title: 'Direct corporate access',
                desc: 'Quarries, solar land and large extents are placed directly with the decision desks of cement, energy and infrastructure companies — not broadcast to the market.',
              },
              {
                title: 'Technical underwriting',
                desc: 'Every asset is assessed before it is shown: access and haulage, statutory zoning, title, and — where relevant — grid proximity or mineral data.',
              },
              {
                title: 'Total discretion',
                desc: 'Owners decide what is disclosed and to whom. Locations, documents and pricing reach a buyer only after we have verified them.',
              },
            ].map((col, i) => (
              <motion.li
                key={col.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }}
                className="group grid grid-cols-[4rem_1fr] gap-6 border-b border-[#B0834A]/30 py-10"
              >
                <span className="font-display text-4xl text-[#B0834A]/40 transition-colors duration-700 group-hover:text-[#B0834A]">
                  {['I', 'II', 'III'][i]}
                </span>
                <div>
                  <h3 className="font-display text-xl sm:text-2xl tracking-[0.04em] text-[#15213A]">{col.title}</h3>
                  <p className="mt-4 font-serif text-[1.18rem] leading-[1.6] text-[#4A5163]">{col.desc}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── V. THE DESK ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#15213A] text-[#F7F3EC] py-28 sm:py-36">
        <Grain opacity={0.12} />
        <div aria-hidden className="pointer-events-none absolute inset-6 border border-[#E6C9A0]/15" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="flex justify-center">
            <Eyebrow numeral="V" light>The Managing Desk</Eyebrow>
          </div>
          <h2 className="mt-9 text-[#F7F3EC]">
            <span className="block font-display text-4xl sm:text-6xl tracking-[0.04em] leading-[1.1]">A private conversation</span>{' '}
            <span className="block font-serif italic font-light text-5xl sm:text-7xl text-[#E6C9A0]">begins here.</span>
          </h2>
          <p className="mt-8 font-serif text-[1.3rem] leading-[1.6] text-white/70 max-w-xl mx-auto">
            For land acquisitions, asset sales and quarry concessions across Tamil Nadu — directly with the desk, in confidence.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-5">
            <a
              href={telLink}
              className="group/d relative overflow-hidden border border-[#E6C9A0]/70 px-9 py-4 font-sans text-[10.5px] uppercase tracking-[0.3em] text-[#F7F3EC] hover:text-[#F7F3EC]"
            >
              <span className="absolute inset-0 origin-bottom scale-y-0 bg-[#F7F3EC] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/d:scale-y-100" />
              <span className="relative transition-colors duration-500 group-hover/d:text-[#15213A]">Call {DESK_PHONE_DISPLAY}</span>
            </a>
            <a
              href={whatsappLink('a commercial mandate or land parcel')}
              target="_blank"
              rel="noreferrer"
              className="group/w relative py-2 font-sans text-[10.5px] uppercase tracking-[0.3em] text-[#E6C9A0]"
            >
              WhatsApp the desk →
              <span className="absolute left-0 -bottom-px h-px w-full origin-left scale-x-0 bg-[#D9AE78] transition-transform duration-500 group-hover/w:scale-x-100" />
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="bg-[#0E1729] text-white/60 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="flex flex-col items-center text-center">
            <TharagaWordmark tone="ivory" variant="full" height={210} />
            <p className="mt-8 font-serif italic text-xl text-white/60">Land, energy and commercial assets · Tamil Nadu</p>
          </div>
          <div className="mt-14 flex flex-wrap items-center justify-center gap-x-9 gap-y-4 border-y border-[#E6C9A0]/15 py-6 font-sans text-[10px] uppercase tracking-[0.3em]">
            {[...NAV, { label: 'Property Status', href: '#status' }].map(l => (
              <a key={l.label} href={l.href} className="text-white/60 hover:text-[#E6C9A0] transition-colors">{l.label}</a>
            ))}
            <Link href="/about" className="text-white/60 hover:text-[#E6C9A0] transition-colors">About</Link>
            <Link href="/privacy" className="text-white/60 hover:text-[#E6C9A0] transition-colors">Privacy</Link>
            <Link href="/terms" className="text-white/60 hover:text-[#E6C9A0] transition-colors">Terms</Link>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-[10px] tracking-[0.18em] uppercase text-white/40">
            <span>© {new Date().getFullYear()} Tharaga Estates · Chennai, Tamil Nadu</span>
            <a href={telLink} className="text-white/40 hover:text-[#E6C9A0] transition-colors">{DESK_PHONE_DISPLAY} · tharaga.in</a>
          </div>
        </div>
      </footer>

      <CommercialIntakeModal isOpen={isIntakeModalOpen} onClose={() => setIsIntakeModalOpen(false)} user={user} />
    </div>
  )
}
