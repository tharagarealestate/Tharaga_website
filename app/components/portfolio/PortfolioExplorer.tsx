'use client'

import { useRouter } from 'next/navigation'
import { openProperty } from '@/lib/propertyAccess'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion, useMotionValue, useSpring } from 'framer-motion'
import {
  CATEGORY_LABELS,
  MANDATES,
  PORTFOLIO_ACRES,
  shortlistWhatsappLink,
  whatsappLink,
  zoneOf,
  type Mandate,
  type MandateCategory,
  type Zone,
} from '@/lib/mandates'
import { useShortlist } from '@/lib/useShortlist'
import { MandateCard, SaveToggle } from './MandateCard'
import { MandateVisual } from './MandateVisual'
import { BadgeTag, EASE, EnquireLink, Eyebrow, Grain } from './primitives'
import { Button } from '@/components/brand/Button'

type View = 'gallery' | 'index'
type Sort = 'curated' | 'extent' | 'az'
const ZONES: ('all' | Zone)[] = ['all', 'Chennai', 'Across Tamil Nadu', 'Location withheld']

export function PortfolioExplorer() {
  const [category, setCategory] = useState<'all' | MandateCategory>('all')
  const [zone, setZone] = useState<'all' | Zone>('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('curated')
  const [view, setView] = useState<View>('gallery')
  const router = useRouter()
  const [drawer, setDrawer] = useState(false)
  const shortlist = useShortlist()

  // Legacy deep links (/properties?m=<slug>) now go to the property's own page
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const slug = q.get('m')
    if (slug && MANDATES.some(x => x.slug === slug)) router.replace(`/properties/${slug}`)
    const cat = q.get('cat') as MandateCategory | null
    if (cat && MANDATES.some(x => x.category === cat)) setCategory(cat)
    if (q.get('shortlist') === '1') setDrawer(true)
  }, [router])
  const openMandate = useCallback((m: Mandate | null) => {
    if (m) openProperty(router, m)
  }, [router])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    let r = MANDATES.filter(
      m =>
        (category === 'all' || m.category === category) &&
        (zone === 'all' || zoneOf(m) === zone) &&
        (!q || [m.name, m.location, m.region, m.tagline, ...m.stats].join(' ').toLowerCase().includes(q)),
    )
    if (sort === 'extent') r = [...r].sort((a, b) => (b.acres ?? -1) - (a.acres ?? -1))
    if (sort === 'az') r = [...r].sort((a, b) => a.name.localeCompare(b.name))
    return r
  }, [category, zone, query, sort])

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(MANDATES.map(m => m.category)))] as ('all' | MandateCategory)[],
    [],
  )
  const savedMandates = MANDATES.filter(m => shortlist.has(m.slug))

  return (
    <>
      {/* ── Masthead ─────────────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-[#15213A] text-[#F7F3EC] pt-40 pb-20 sm:pt-48 sm:pb-24">
        <div aria-hidden className="pointer-events-none absolute inset-4 sm:inset-6 border border-[#E6C9A0]/15" />
        <div className="relative max-w-7xl mx-auto px-6 sm:px-10 grid gap-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE }}>
              <Eyebrow light>All properties · {MANDATES.length} available</Eyebrow>
            </motion.div>
            <h1 className="mt-8">
              {['Every property', 'we represent,'].map((line, i) => (
                <span key={line} className="block overflow-hidden">
                  <motion.span
                    initial={{ y: '110%' }}
                    animate={{ y: 0 }}
                    transition={{ duration: 1.2, ease: EASE, delay: 0.15 + i * 0.12 }}
                    className={
                      i === 0
                        ? 'block font-display text-[11vw] sm:text-6xl lg:text-[5.4rem] tracking-[0.03em] leading-[1.05]'
                        : 'block font-serif italic font-light text-[12vw] sm:text-7xl lg:text-[6.4rem] leading-[1.02] text-[#E6C9A0]'
                    }
                  >
                    {line}
                  </motion.span>{' '}
                </span>
              ))}
              <span className="block overflow-hidden">
                <motion.span
                  initial={{ y: '110%' }}
                  animate={{ y: 0 }}
                  transition={{ duration: 1.2, ease: EASE, delay: 0.39 }}
                  className="block font-serif italic font-light text-[12vw] sm:text-7xl lg:text-[6.4rem] leading-[1.02] text-[#E6C9A0]"
                >
                  in one place.
                </motion.span>
              </span>
            </h1>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: EASE, delay: 0.6 }}
            className="lg:col-span-4 space-y-8"
          >
            <p className="font-serif text-[1.3rem] leading-[1.6] text-white/75">
              Land banks, energy, quarries, commercial and residential addresses across Tamil Nadu. Locations, documents
              and pricing are released only to buyers we have verified.
            </p>
            <dl className="flex divide-x divide-[#E6C9A0]/25">
              {[
                { k: 'Properties', v: MANDATES.length },
                { k: 'Acres', v: `${PORTFOLIO_ACRES.toLocaleString('en-IN')}+` },
                { k: 'Property types', v: categories.length - 1 },
              ].map((s, i) => (
                <div key={s.k} className={`flex flex-col-reverse ${i === 0 ? 'pr-6' : 'px-6'}`}>
                  <dt className="mt-2 font-sans text-[10.5px] uppercase tracking-[0.22em] text-white/50">{s.k}</dt>
                  <dd className="font-display text-3xl">{s.v}</dd>
                </div>
              ))}
            </dl>
          </motion.div>
        </div>
      </header>

      {/* ── Control bar (sticky) ─────────────────────────────────── */}
      <div className="md:sticky md:top-[72px] z-30 bg-[#F7F3EC] border-b border-[#B0834A]/25 shadow-[0_12px_30px_-28px_rgba(21,33,58,0.6)]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="flex items-center gap-6 py-3 overflow-x-auto no-scrollbar">
            <LayoutGroup id="cat">
              {categories.map(c => {
                const active = category === c
                const count = c === 'all' ? MANDATES.length : MANDATES.filter(m => m.category === c).length
                return (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`relative shrink-0 py-2 font-sans text-[11px] uppercase tracking-[0.2em] transition-colors ${
                      active ? 'text-[#15213A]' : 'text-[#5F6575] hover:text-[#15213A]'
                    }`}
                  >
                    {c === 'all' ? 'All' : CATEGORY_LABELS[c]}
                    <sup className={`ml-1 ${active ? 'text-[#B0834A]' : 'text-[#A9A190]'}`}>{count}</sup>
                    {active && (
                      <motion.span layoutId="cat-rule" className="absolute left-0 right-0 -bottom-[13px] h-[2px] bg-[#B0834A]" />
                    )}
                  </button>
                )
              })}
            </LayoutGroup>
          </div>
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-x-6 gap-y-3 border-t border-[#B0834A]/15 py-3">
            <label className="flex basis-full lg:basis-auto flex-1 min-w-[180px] items-center gap-3 border-b border-[#D6CAB5] focus-within:border-[#B0834A] transition-colors">
              <span className="h-2 w-2 rotate-45 border border-[#B0834A]" aria-hidden />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by place, extent or type"
                className="w-full bg-transparent py-2 font-serif text-[1.1rem] text-[#15213A] placeholder:text-[#A9A190] outline-none"
              />
            </label>
            <Select
              label="Zone"
              value={zone}
              onChange={v => setZone(v as 'all' | Zone)}
              options={ZONES.map(z => ({ v: z, l: z === 'all' ? 'All zones' : z }))}
            />
            <Select
              label="Order"
              value={sort}
              onChange={v => setSort(v as Sort)}
              options={[
                { v: 'curated', l: 'Curated' },
                { v: 'extent', l: 'Largest extent' },
                { v: 'az', l: 'A – Z' },
              ]}
            />
            <div className="hidden md:flex border border-[#D6CAB5]" role="group" aria-label="View">
              {(['gallery', 'index'] as View[]).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  aria-pressed={view === v}
                  className={`px-3.5 py-2 font-sans text-[10.5px] uppercase tracking-[0.24em] transition-colors ${
                    view === v ? 'bg-[#15213A] text-[#F7F3EC]' : 'text-[#4A5163] hover:text-[#15213A]'
                  }`}
                >
                  {v === 'gallery' ? 'Gallery' : 'Index'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Results ──────────────────────────────────────────────── */}
      <section className="bg-[#F7F3EC] pt-14 pb-32 min-h-[60vh]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <p className="mb-10 font-sans text-[11px] uppercase tracking-[0.22em] text-[#5F6575]">
            Showing <span className="text-[#15213A]">{list.length}</span> of {MANDATES.length} properties
          </p>

          {list.length === 0 ? (
            <div className="py-24 text-center">
              <p className="font-serif italic text-3xl text-[#4A5163]">Nothing matches — yet.</p>
              <p className="mt-4 font-serif text-lg text-[#5F6575]">
                Many of our properties are never listed publicly. Tell us what you are looking for.
              </p>
              <div className="mt-8 flex justify-center">
                <EnquireLink href={whatsappLink(`a requirement: ${query || 'unlisted assets'}`)}>Tell us what you need</EnquireLink>
              </div>
            </div>
          ) : view === 'gallery' ? (
            <AnimatePresence mode="popLayout">
              <motion.div
                key={`${category}-${zone}-${sort}-${query}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16"
              >
                {list.map((m, i) => (
                  <div key={m.slug} className={i % 3 === 1 ? 'lg:mt-20' : ''}>
                    <MandateCard
                      mandate={m}
                      index={i}
                      tall={i % 3 === 1}
                      onOpen={() => openMandate(m)}
                      saved={shortlist.has(m.slug)}
                      onToggleSave={() => shortlist.toggle(m.slug)}
                    />
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          ) : (
            <IndexView list={list} onOpen={openMandate} has={shortlist.has} toggle={shortlist.toggle} />
          )}
        </div>
      </section>

      {/* ── Unlisted invitation ──────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#15213A] text-[#F7F3EC] py-24">
        <Grain opacity={0.1} />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <Eyebrow light>Not listed publicly</Eyebrow>
          <h2 className="mt-8 text-[#F7F3EC]">
            <span className="block font-display text-3xl sm:text-5xl tracking-[0.04em]">Some of our finest properties</span>{' '}
            <span className="block font-serif italic font-light text-4xl sm:text-6xl text-[#E6C9A0]">are never published.</span>
          </h2>
          <p className="mt-7 font-serif text-xl text-white/70 max-w-2xl mx-auto">
            Tell us what you are looking for — size, district, use — and we will tell you what is available before it reaches
            any market.
          </p>
          <div className="mt-10 flex justify-center">
            <Button variant="light" arrow href={whatsappLink('a property that is not listed publicly')}>
              Ask about unlisted properties
            </Button>
          </div>
        </div>
      </section>

      {/* ── Shortlist dock ───────────────────────────────────────── */}
      <AnimatePresence>
        {shortlist.items.length > 0 && !drawer && (
          <motion.div
            key="dock"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center"
          >
          <button
            onClick={() => setDrawer(true)}
            className="pointer-events-auto flex items-center gap-4 whitespace-nowrap bg-[#15213A] px-6 py-3.5 text-[#F7F3EC] shadow-[0_20px_50px_-15px_rgba(14,23,41,0.7)]"
          >
            <span className="h-2.5 w-2.5 rotate-45 bg-[#B0834A]" />
            <span className="font-sans text-[11px] uppercase tracking-[0.2em]">
              <span className="hidden sm:inline">Your </span>shortlist · {shortlist.items.length}
            </span>
            <span className="font-serif italic text-[#E6C9A0]">Review →</span>
          </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {drawer && (
          <motion.div
            className="fixed inset-0 z-[70] bg-[#0E1729]/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDrawer(false)}
            data-lenis-prevent
          >
            <motion.aside
              onClick={e => e.stopPropagation()}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.6, ease: EASE }}
              className="absolute right-0 top-0 h-full w-full max-w-md bg-[#F7F3EC] flex flex-col"
              aria-label="Your shortlist"
            >
              <div className="flex items-center justify-between border-b border-[#B0834A]/25 px-7 py-6">
                <div>
                  <p className="font-sans text-[11px] uppercase tracking-[0.22em] text-[#94643A]">Private</p>
                  <h2 className="mt-1 font-display text-2xl tracking-[0.04em] text-[#15213A]">Your shortlist</h2>
                </div>
                <button onClick={() => setDrawer(false)} className="font-sans text-[11px] uppercase tracking-[0.2em] text-[#4A5163]">
                  Close
                </button>
              </div>
              <ul className="flex-1 overflow-y-auto divide-y divide-[#B0834A]/15 px-7" data-lenis-prevent>
                {savedMandates.map(m => (
                  <li key={m.slug} className="flex items-center gap-4 py-5">
                    <button
                      onClick={() => {
                        setDrawer(false)
                        openMandate(m)
                      }}
                      className="relative h-16 w-20 shrink-0 overflow-hidden bg-[#E4DACA]"
                      aria-label={`Open ${m.name}`}
                    >
                      <MandateVisual mandate={m} sizes="80px" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-[0.95rem] leading-snug text-[#15213A]">{m.name}</p>
                      <p className="mt-1 font-sans text-[10.5px] uppercase tracking-[0.22em] text-[#5F6575]">{m.location}</p>
                    </div>
                    <button
                      onClick={() => shortlist.toggle(m.slug)}
                      className="font-sans text-[10.5px] uppercase tracking-[0.22em] text-[#94643A]"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <div className="border-t border-[#B0834A]/25 px-7 py-6 space-y-4">
                <p className="font-serif text-[1.05rem] text-[#4A5163]">
                  Send your shortlist to the desk in one message. An advisor will brief you on each one — privately.
                </p>
                <Button full arrow href={shortlistWhatsappLink(savedMandates.map(m => m.name))}>
                  Request a private briefing
                </Button>
                <button onClick={shortlist.clear} className="w-full font-sans text-[10.5px] uppercase tracking-[0.24em] text-[#5F6575]">
                  Clear shortlist
                </button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { v: string; l: string }[]
}) {
  return (
    <label className="flex items-center gap-2 whitespace-nowrap font-sans text-[10.5px] uppercase tracking-[0.24em] text-[#5F6575]">
      {label}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="cursor-pointer bg-transparent border-b border-[#D6CAB5] py-1.5 pr-1 font-serif text-[1.02rem] normal-case tracking-normal text-[#15213A] outline-none focus:border-[#B0834A]"
      >
        {options.map(o => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </select>
    </label>
  )
}

/**
 * Index view: an editorial ledger. On desktop, hovering a row reveals the mandate's
 * visual in a frame that follows the cursor.
 */
function IndexView({
  list,
  onOpen,
  has,
  toggle,
}: {
  list: Mandate[]
  onOpen: (m: Mandate) => void
  has: (s: string) => boolean
  toggle: (s: string) => void
}) {
  const [hover, setHover] = useState<Mandate | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const x = useSpring(mx, { stiffness: 220, damping: 28 })
  const y = useSpring(my, { stiffness: 220, damping: 28 })

  return (
    <div
      ref={ref}
      className="relative"
      onMouseMove={e => {
        const r = ref.current?.getBoundingClientRect()
        if (!r) return
        mx.set(e.clientX - r.left + 28)
        my.set(e.clientY - r.top - 120)
      }}
      onMouseLeave={() => setHover(null)}
    >
      <div className="hidden md:grid grid-cols-[3.5rem_1.6fr_1fr_1fr_auto] gap-6 border-b border-[#15213A] pb-3 font-sans text-[10.5px] uppercase tracking-[0.2em] text-[#5F6575]">
        <span>No.</span>
        <span>Mandate</span>
        <span>Location</span>
        <span>Extent</span>
        <span className="text-right">Shortlist</span>
      </div>
      <ol>
        {list.map((m, i) => (
          <motion.li
            key={m.slug}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: i * 0.03 }}
            onMouseEnter={() => setHover(m)}
            onClick={() => onOpen(m)}
            className="group grid cursor-pointer grid-cols-[2.5rem_1fr] md:grid-cols-[3.5rem_1.6fr_1fr_1fr_auto] items-center gap-x-6 gap-y-2 border-b border-[#B0834A]/25 py-6 transition-colors hover:bg-[#EFE8DC]/70"
          >
            <span className="font-display text-sm text-[#B0834A]">{String(i + 1).padStart(2, '0')}</span>
            <div className="min-w-0">
              <p className="font-display text-[1.15rem] sm:text-[1.3rem] leading-snug tracking-[0.02em] text-[#15213A] transition-transform duration-500 group-hover:translate-x-2">
                {m.name}
              </p>
              <p className="mt-1 font-serif italic text-[1.02rem] text-[#5F6575]">{m.tagline}</p>
              {m.badge && (
                <div className="mt-2 md:hidden">
                  <BadgeTag badge={m.badge} />
                </div>
              )}
            </div>
            <p className="col-start-2 md:col-start-auto font-sans text-[11px] uppercase tracking-[0.22em] text-[#4A5163]">
              {m.location}
              <span className="block text-[#A9A190]">{m.region}</span>
            </p>
            <p className="col-start-2 md:col-start-auto font-serif text-[1.1rem] text-[#15213A]">{m.stats[0]}</p>
            <div className="col-start-2 md:col-start-auto md:justify-self-end">
              <SaveToggle saved={has(m.slug)} onToggle={() => toggle(m.slug)} />
            </div>
          </motion.li>
        ))}
      </ol>

      {/* Cursor-following preview (desktop) */}
      <motion.div
        style={{ x, y }}
        className="pointer-events-none absolute left-0 top-0 z-20 hidden lg:block"
        aria-hidden
      >
        <AnimatePresence>
          {hover && (
            <motion.div
              key={hover.slug}
              initial={{ opacity: 0, scale: 0.9, clipPath: 'inset(10% 10% 10% 10%)' }}
              animate={{ opacity: 1, scale: 1, clipPath: 'inset(0% 0% 0% 0%)' }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="relative h-[220px] w-[300px] overflow-hidden bg-[#E4DACA] shadow-[0_30px_60px_-25px_rgba(14,23,41,0.6)]"
            >
              <MandateVisual mandate={hover} sizes="300px" />
              {hover.badge && (
                <div className="absolute left-3 top-3">
                  <BadgeTag badge={hover.badge} onDark />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
