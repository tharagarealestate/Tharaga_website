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
import { Button } from '@/components/brand/Button'
import { SmoothScroll } from '@/components/brand/SmoothScroll'
import { DESK_PHONE_DISPLAY, telLink, whatsappLink } from '@/lib/mandates'
import { CommercialIntakeModal } from '@/components/commercial/CommercialIntakeModal'
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

  // Deep links from other pages: /?signin=1 opens sign-in, /?list=1 opens the listing form
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const t = setTimeout(() => {
      if (q.get('signin') === '1') openAuthModal()
      if (q.get('list') === '1') setIsIntakeModalOpen(true)
    }, 300)
    return () => clearTimeout(t)
  }, [])

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
    { label: 'Properties', href: '/properties' },
    { label: 'Land Check', href: '/feasibility' },
    { label: 'We Are Buying', href: '#acquiring' },
    { label: 'About', href: '/about' },
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
            : 'bg-[#F7F3EC] border-b border-[#B0834A]/25 py-2 shadow-[0_10px_30px_-25px_rgba(21,33,58,0.5)]'
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
              className={`group/list relative inline-flex h-10 items-center overflow-hidden border-[1.5px] px-5 font-sans text-[10px] font-semibold uppercase tracking-[0.24em] transition-colors duration-200 ${
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

      {/* ── III. LAND CHECK (teaser) ───────────────────────────────── */}
      <section id="feasibility" className="scroll-mt-20 border-b border-[#B0834A]/20 bg-[#EFE8DC] py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6"
          >
            <Eyebrow numeral="III">Free land check</Eyebrow>
            <h2 className="mt-6 text-[#15213A]">
              <span className="block font-display text-[2rem] leading-[1.1] tracking-[0.03em] sm:text-[2.8rem]">Find out what your land</span>{' '}
              <span className="block font-serif text-[2.5rem] font-light italic leading-[1.05] text-[#94643A] sm:text-[3.4rem]">is right for.</span>
            </h2>
            <p className="mt-6 max-w-lg font-serif text-[1.2rem] leading-[1.6] text-[#2E3648]">
              Four questions. You get the checks to make, the Tamil Nadu approvals that apply, and the properties in our
              portfolio that fit.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button arrow href="/feasibility">
                Start the land check
              </Button>
            </div>
          </motion.div>

          <ol className="grid grid-cols-2 gap-px bg-[#D6CAB5] lg:col-span-6">
            {[
              ['I', 'Use', 'Solar, quarry, factory, homes…'],
              ['II', 'Location', 'Anywhere in Tamil Nadu'],
              ['III', 'Extent', 'From a plot to 100+ acres'],
              ['IV', 'Stage', 'Exploring, buying or owning'],
            ].map(([n, t, d]) => (
              <li key={n} className="bg-[#F7F3EC] p-5 sm:p-7">
                <span className="font-display text-sm text-[#B0834A]">{n}</span>
                <p className="mt-3 font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#15213A]">{t}</p>
                <p className="mt-1.5 font-serif text-[1.02rem] text-[#7D8292]">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── IV. WHY THARAGA ────────────────────────────────────────── */}
      <section id="advisory" className="scroll-mt-20 bg-[#F7F3EC] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <Eyebrow numeral="IV">Why Tharaga</Eyebrow>
              <h2 className="mt-6 text-[#15213A]">
                <span className="block font-display text-[2rem] leading-[1.1] tracking-[0.03em] sm:text-[2.8rem]">Private placement,</span>{' '}
                <span className="block font-serif text-[2.5rem] font-light italic leading-[1.05] text-[#94643A] sm:text-[3.4rem]">not public listing.</span>
              </h2>
            </div>
            <p className="font-serif text-[1.2rem] leading-[1.6] text-[#2E3648] lg:col-span-5">
              We are not a classifieds portal. We represent owners privately and introduce each property to the buyers best
              placed to act.
            </p>
          </div>
          <ol className="mt-12 grid gap-px bg-[#B0834A]/30 md:grid-cols-3">
            {[
              {
                title: 'We go straight to buyers',
                desc: 'Land, quarries and energy assets go directly to the people who decide — not broadcast to the market.',
              },
              {
                title: 'We check before we show',
                desc: 'Access, zoning, title and, where relevant, grid or mineral data are reviewed before a buyer sees a property.',
              },
              {
                title: 'You control what is shared',
                desc: 'Locations, documents and prices reach a buyer only after we have verified them.',
              },
            ].map((c, i) => (
              <motion.li
                key={c.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
                className="group bg-[#F7F3EC] p-7 sm:p-9"
              >
                <span className="font-display text-3xl text-[#B0834A]/40 transition-colors duration-500 group-hover:text-[#B0834A]">
                  {['I', 'II', 'III'][i]}
                </span>
                <h3 className="mt-5 font-display text-[1.2rem] tracking-[0.04em] text-[#15213A]">{c.title}</h3>
                <p className="mt-3 font-serif text-[1.1rem] leading-[1.6] text-[#4A5163]">{c.desc}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── FOR OWNERS ─────────────────────────────────────────────── */}
      <section id="status" className="scroll-mt-20 border-t border-[#B0834A]/20 bg-[#F7F3EC] pb-20 sm:pb-24">
        <div className="mx-auto max-w-7xl px-5 pt-20 sm:px-8 sm:pt-24">
          {user ? (
            <MandateTracker user={user} onOpenIntake={() => setIsIntakeModalOpen(true)} />
          ) : (
            <div className="grid gap-10 border border-[#D6CAB5] bg-[#FBF8F2] p-7 sm:p-10 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-7">
                <Eyebrow>For property owners</Eyebrow>
                <h2 className="mt-5 text-[#15213A]">
                  <span className="block font-display text-[1.8rem] leading-[1.15] tracking-[0.03em] sm:text-[2.4rem]">Sell or lease your property</span>{' '}
                  <span className="block font-serif text-[2.2rem] font-light italic text-[#94643A] sm:text-[2.8rem]">— privately.</span>
                </h2>
                <p className="mt-5 max-w-lg font-serif text-[1.15rem] leading-[1.6] text-[#4A5163]">
                  List it with us in a few minutes, then follow every step — review, verification and buyer interest — from
                  your own account.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:col-span-5 lg:flex-col xl:flex-row lg:justify-end">
                <Button arrow onClick={() => setIsIntakeModalOpen(true)}>
                  List your property
                </Button>
                <Button variant="secondary" onClick={() => openAuthModal()}>
                  Track my property
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── V. CONTACT ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#15213A] py-24 text-[#F7F3EC] sm:py-28">
        <Grain opacity={0.12} />
        <div aria-hidden className="pointer-events-none absolute inset-4 border border-[#E6C9A0]/15 sm:inset-6" />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="flex justify-center">
            <Eyebrow numeral="V" light>
              Contact
            </Eyebrow>
          </div>
          <h2 className="mt-8 text-[#F7F3EC]">
            <span className="block font-display text-[2.2rem] leading-[1.1] tracking-[0.04em] sm:text-6xl">Speak to us</span>{' '}
            <span className="block font-serif text-[2.6rem] font-light italic text-[#E6C9A0] sm:text-7xl">directly.</span>
          </h2>
          <p className="mx-auto mt-7 max-w-xl font-serif text-[1.25rem] leading-[1.6] text-white/70">
            Buying, selling or leasing land, energy or commercial property in Tamil Nadu — one call, in confidence.
          </p>
          <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Button variant="light" size="lg" arrow href={whatsappLink('buying, selling or leasing a property')}>
              WhatsApp us
            </Button>
            <Button variant="outline-light" size="lg" href={telLink}>
              Call {DESK_PHONE_DISPLAY}
            </Button>
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
