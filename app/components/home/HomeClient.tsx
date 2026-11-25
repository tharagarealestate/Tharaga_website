'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { openAuthModal } from '@/components/auth/AuthModal'
import { CinematicHero } from '@/components/portfolio/CinematicHero'
import { PortfolioShowcase } from '@/components/portfolio/PortfolioShowcase'
import { EASE, Eyebrow, Grain } from '@/components/portfolio/primitives'
import { Button } from '@/components/brand/Button'
import { SmoothScroll } from '@/components/brand/SmoothScroll'
import { SiteFooter, SiteHeader } from '@/components/brand/SiteHeader'
import { DESK_PHONE_DISPLAY, telLink, whatsappLink } from '@/lib/mandates'
import { useAuthUser } from '@/lib/useAuthUser'
import { CommercialIntakeModal } from '@/components/commercial/CommercialIntakeModal'
import { MandateTracker } from '@/components/commercial/MandateTracker'

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.8, ease: EASE },
}

const BUYER_STEPS = [
  ['Browse the pipeline', 'Filter by type and region. Every page has site footage, plans and the key facts.'],
  ['Shortlist and enquire', 'Save what fits, then send it to the desk in one WhatsApp message or a call.'],
  ['Private briefing and visit', 'Price, documents and a guided site visit once you are verified as a buyer.'],
]
const OWNER_STEPS = [
  ['List in a few minutes', 'Describe the property, add photos or videos. No fee to list.'],
  ['We verify and present it', 'Title, access and zoning are checked before any buyer sees it.'],
  ['Follow every step', 'Sign in to track review, buyer interest and visits from your account.'],
]

export function HomeClient() {
  const { user } = useAuthUser()
  const [intake, setIntake] = useState(false)
  const [authError, setAuthError] = useState(false)

  // Deep links: /?signin=1 opens sign-in, /?list=1 opens the listing form
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const t = setTimeout(() => {
      if (q.get('signin') === '1') openAuthModal()
      if (q.get('list') === '1') setIntake(true)
      if (q.get('error') === 'auth_callback_failed') setAuthError(true)
    }, 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen bg-[#F7F3EC] text-[#15213A] selection:bg-[#E6C9A0] selection:text-[#15213A]">
      <SmoothScroll />
      <SiteHeader onListProperty={() => setIntake(true)} />

      <main>
        <CinematicHero onListProperty={() => setIntake(true)} />

        <PortfolioShowcase />

        {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
        <section id="how-it-works" className="scroll-mt-20 border-t border-[#B0834A]/20 bg-[#EFE8DC] py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <motion.div {...reveal} className="max-w-2xl">
              <Eyebrow>How it works</Eyebrow>
              <h2 className="mt-5 font-display text-[2.1rem] leading-[1.1] tracking-[0.02em] text-[#15213A] sm:text-[2.8rem]">
                One desk for buyers and owners
              </h2>
            </motion.div>

            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              {[
                { who: 'For buyers', steps: BUYER_STEPS, cta: <Button arrow href="/properties">Browse properties</Button> },
                {
                  who: 'For owners',
                  steps: OWNER_STEPS,
                  cta: (
                    <Button variant="secondary" arrow onClick={() => setIntake(true)}>
                      List your property
                    </Button>
                  ),
                },
              ].map((col, ci) => (
                <motion.div
                  key={col.who}
                  {...reveal}
                  transition={{ ...reveal.transition, delay: ci * 0.1 }}
                  className="flex flex-col border border-[#D6CAB5] bg-[#FBF8F2] p-6 sm:p-9"
                >
                  <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.18em] text-[#94643A]">{col.who}</p>
                  <ol className="mt-6 flex-1 space-y-6">
                    {col.steps.map(([t, d], i) => (
                      <li key={t} className="grid grid-cols-[2.5rem_1fr] gap-3">
                        <span className="flex h-9 w-9 items-center justify-center border border-[#B0834A]/50 font-display text-[1rem] text-[#94643A]">{i + 1}</span>
                        <div>
                          <h3 className="font-sans text-[16px] font-semibold text-[#15213A]">{t}</h3>
                          <p className="mt-1 font-sans text-[14.5px] leading-[1.6] text-[#4A5163]">{d}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-8">{col.cta}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SIGNED-IN OWNERS: live status ───────────────────────── */}
        <section id="status" className="scroll-mt-24 bg-[#F7F3EC]">
          {user ? (
            <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
              <MandateTracker user={user.raw} onOpenIntake={() => setIntake(true)} />
            </div>
          ) : (
            <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
              <div className="flex flex-col gap-5 border border-[#D6CAB5] bg-[#FBF8F2] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                <div>
                  <p className="font-sans text-[16px] font-semibold text-[#15213A]">Already listed with us?</p>
                  <p className="mt-1 font-sans text-[14.5px] text-[#4A5163]">Sign in to follow review, buyer interest and visits — and keep your shortlist on every device.</p>
                </div>
                <Button variant="secondary" onClick={() => openAuthModal()}>
                  Sign in
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* ── LAND CHECK ───────────────────────────────────────────── */}
        <section id="feasibility" className="scroll-mt-20 border-y border-[#B0834A]/20 bg-[#F7F3EC] py-20 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-12 lg:items-center">
            <motion.div {...reveal} className="lg:col-span-6">
              <Eyebrow>Free land check</Eyebrow>
              <h2 className="mt-5 font-display text-[2.1rem] leading-[1.1] tracking-[0.02em] text-[#15213A] sm:text-[2.8rem]">
                Find out what your land is right for
              </h2>
              <p className="mt-5 max-w-lg font-sans text-[16px] leading-[1.7] text-[#4A5163]">
                Answer four questions. You get the checks to make, the Tamil Nadu approvals that apply, and the properties in
                our pipeline that fit — in under a minute.
              </p>
              <div className="mt-8">
                <Button arrow href="/feasibility">
                  Start the land check
                </Button>
              </div>
            </motion.div>
            <ol className="grid grid-cols-2 gap-px bg-[#D6CAB5] lg:col-span-6">
              {[
                ['Use', 'Solar, quarry, factory, homes…'],
                ['Location', 'Anywhere in Tamil Nadu'],
                ['Extent', 'From a plot to 100+ acres'],
                ['Stage', 'Exploring, buying or owning'],
              ].map(([t, d], i) => (
                <li key={t} className="bg-[#FBF8F2] p-5 sm:p-7">
                  <span className="font-display text-[1rem] text-[#B0834A]">0{i + 1}</span>
                  <p className="mt-3 font-sans text-[13px] font-semibold uppercase tracking-[0.14em] text-[#15213A]">{t}</p>
                  <p className="mt-1.5 font-sans text-[14px] text-[#4A5163]">{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── CONTACT ──────────────────────────────────────────────── */}
        <section id="contact" className="relative overflow-hidden bg-[#15213A] py-20 text-[#F7F3EC] sm:py-24">
          <Grain opacity={0.1} />
          <div className="relative mx-auto flex max-w-7xl flex-col gap-10 px-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <Eyebrow light>Speak to the desk</Eyebrow>
              <h2 className="mt-5 font-display text-[2.1rem] leading-[1.1] tracking-[0.02em] text-[#F7F3EC] sm:text-[2.8rem]">
                One message. A real person replies.
              </h2>
              <p className="mt-5 font-sans text-[16px] leading-[1.7] text-white/75">
                Buying, selling or leasing land, energy or commercial property in Tamil Nadu — talk to us in confidence.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <Button variant="light" size="lg" arrow href={whatsappLink('buying, selling or leasing a property')}>
                WhatsApp the desk
              </Button>
              <Button variant="outline-light" size="lg" href={telLink}>
                Call {DESK_PHONE_DISPLAY}
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      {authError && (
        <div role="alert" className="fixed inset-x-4 bottom-4 z-[60] mx-auto flex max-w-md items-center justify-between gap-4 border border-[#B0834A]/40 bg-[#FBF8F2] p-4 shadow-[0_20px_50px_-20px_rgba(14,23,41,0.5)]">
          <p className="font-sans text-[14px] text-[#15213A]">Sign-in didn&apos;t complete. Please try again.</p>
          <div className="flex shrink-0 gap-3">
            <button onClick={() => { setAuthError(false); openAuthModal() }} className="font-sans text-[13px] font-semibold text-[#94643A]">Try again</button>
            <button onClick={() => setAuthError(false)} aria-label="Dismiss" className="font-sans text-[16px] text-[#5F6575]">×</button>
          </div>
        </div>
      )}
      <CommercialIntakeModal isOpen={intake} onClose={() => setIntake(false)} user={user?.raw ?? null} />
    </div>
  )
}
