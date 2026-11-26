'use client'

import Image from 'next/image'
import { openProperty } from '@/lib/propertyAccess'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import {
  CATEGORY_LABELS,
  DESK_PHONE_DISPLAY,
  relatedMandates,
  telLink,
  whatsappLink,
  type Mandate,
  type MediaItem,
} from '@/lib/mandates'
import { useShortlist } from '@/lib/useShortlist'
import { useAuthUser } from '@/lib/useAuthUser'
import { openAuthModal } from '@/components/auth/AuthModal'
import { Check, FileText, Home, Image as ImageIcon, Lock, MapPin, Ruler } from 'lucide-react'
import { Button } from '@/components/brand/Button'
import { SiteFooter, SiteHeader } from '@/components/brand/SiteHeader'
import { SmoothScroll } from '@/components/brand/SmoothScroll'
import { MandateCard, SaveToggle } from '@/components/portfolio/MandateCard'
import { SurveyPlate } from '@/components/portfolio/SurveyPlate'
import { BadgeTag, EASE, Eyebrow, Grain, StatPills } from '@/components/portfolio/primitives'

const reveal = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.9, ease: EASE },
}

const DEFAULT_DOSSIER = ['Price and terms, shared privately', 'Ownership documents on verification', 'A guided site visit']

/* ───────────────────────────── Hero visual ───────────────────────────── */

function HeroVisual({ mandate, onOpenGallery }: { mandate: Mandate; onOpenGallery: (i: number) => void }) {
  const reduce = useReducedMotion()
  const media = mandate.media ?? []
  const lead = media.find(m => m.kind === 'video') ?? media.find(m => m.kind === 'photo')
  const leadIndex = lead ? media.indexOf(lead) : -1

  let body: React.ReactNode
  let tag: string
  if (lead?.kind === 'video') {
    body = (
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={lead.src}
        poster={lead.poster}
        autoPlay={!reduce}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={lead.alt}
      />
    )
    tag = 'Filmed on site'
  } else if (lead?.kind === 'photo') {
    body = <Image src={lead.src} alt={lead.alt} fill priority sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" />
    tag = 'Photographed on site'
  } else if (mandate.image && !mandate.plate) {
    body = (
      <Image
        src={mandate.image}
        alt={mandate.imageAlt || mandate.name}
        fill
        priority
        sizes="(min-width:1024px) 40vw, 100vw"
        className="object-cover tharaga-grade"
      />
    )
    tag = 'Representative image'
  } else {
    body = (
      <SurveyPlate seed={mandate.slug} label={mandate.region} caption={mandate.plate?.caption} tone={mandate.plate?.tone ?? 'navy'} />
    )
    tag = 'Location withheld'
  }

  const clickable = leadIndex >= 0
  return (
    <motion.div
      initial={{ clipPath: 'inset(10% 10% 10% 10%)', opacity: 0 }}
      animate={{ clipPath: 'inset(0% 0% 0% 0%)', opacity: 1 }}
      transition={{ duration: 1.4, ease: EASE, delay: 0.15 }}
      className="relative mx-auto aspect-[4/5] w-full max-w-[460px] overflow-hidden bg-[#0E1729] shadow-[0_60px_120px_-50px_rgba(0,0,0,0.8)] lg:max-w-none"
    >
      {body}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0E1729]/70 via-transparent to-[#0E1729]/20" />
      <div aria-hidden className="pointer-events-none absolute inset-3 border border-[#E6C9A0]/35" />
      <span className="absolute left-6 top-6 inline-flex items-center gap-2 bg-[#0E1729]/60 px-3 py-[6px] font-sans text-[10.5px] uppercase tracking-[0.2em] text-[#F0E2CC] backdrop-blur-sm">
        {(lead?.kind === 'video' || lead?.kind === 'photo') && (
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E6C9A0] opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#E6C9A0]" />
          </span>
        )}
        {tag}
      </span>
      {clickable && (
        <button
          type="button"
          onClick={() => onOpenGallery(leadIndex)}
          className="absolute inset-x-6 bottom-6 flex items-center justify-between border-t border-[#E6C9A0]/40 pt-4 text-left font-sans text-[11px] uppercase tracking-[0.2em] text-[#F7F3EC]"
        >
          <span>Open the gallery · {media.length}</span>
          <span aria-hidden>↗</span>
        </button>
      )}
    </motion.div>
  )
}

/* ───────────────────────────── Section nav ───────────────────────────── */

function SectionNav({ sections }: { sections: { id: string; label: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id)
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => {
        const vis = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (vis[0]) setActive(vis[0].target.id)
      },
      { rootMargin: '-35% 0px -55% 0px' },
    )
    sections.forEach(s => {
      const el = document.getElementById(s.id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [sections])

  return (
    <nav aria-label="On this page" className="sticky top-[72px] z-30 border-b border-[#B0834A]/20 bg-[#F7F3EC]/90 backdrop-blur-md">
      <ul className="mx-auto flex max-w-7xl gap-7 overflow-x-auto px-5 [scrollbar-width:none] sm:px-8 [&::-webkit-scrollbar]:hidden">
        {sections.map(s => (
          <li key={s.id} className="shrink-0">
            <a
              href={`#${s.id}`}
              className={`relative block py-4 font-sans text-[11px] uppercase tracking-[0.2em] transition-colors ${
                active === s.id ? 'text-[#15213A]' : 'text-[#5F6575] hover:text-[#15213A]'
              }`}
            >
              {s.label}
              {active === s.id && (
                <motion.span layoutId="secnav" className="absolute inset-x-0 -bottom-px h-[2px] bg-[#B0834A]" transition={{ duration: 0.45, ease: EASE }} />
              )}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/* ───────────────────────────── Gallery + lightbox ───────────────────────────── */

function MediaThumb({ item, index, onOpen, className = '' }: { item: MediaItem; index: number; onOpen: (i: number) => void; className?: string }) {
  const src = item.kind === 'video' ? item.poster || '' : item.src
  return (
    <motion.button
      type="button"
      {...reveal}
      transition={{ ...reveal.transition, delay: (index % 3) * 0.08 }}
      onClick={() => onOpen(index)}
      className={`group relative block w-full overflow-hidden bg-[#E4DACA] text-left outline-none focus-visible:ring-2 focus-visible:ring-[#B0834A] ${className}`}
      aria-label={`Open ${item.caption}`}
    >
      {src && (
        <Image
          src={src}
          alt={item.alt}
          fill
          sizes="(min-width:1024px) 30vw, 50vw"
          className={`transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05] ${
            item.kind === 'plan' ? 'object-contain p-3' : 'object-cover'
          }`}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0E1729]/75 via-transparent to-transparent opacity-90" />
      {item.kind === 'video' && (
        <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#E6C9A0]/70 bg-[#0E1729]/40 backdrop-blur-sm transition-transform duration-500 group-hover:scale-110">
          <span aria-hidden className="ml-1 h-0 w-0 border-y-[8px] border-l-[13px] border-y-transparent border-l-[#F7F3EC]" />
        </span>
      )}
      <span className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
        <span className="font-serif text-[0.92rem] leading-snug text-[#F7F3EC] sm:text-[1.02rem]">{item.caption}</span>
        <span className="hidden shrink-0 font-sans text-[10.5px] uppercase tracking-[0.24em] text-[#E6C9A0] sm:inline">
          {item.kind === 'video' ? 'Video' : item.kind === 'plan' ? 'Plan' : 'Photo'}
        </span>
      </span>
    </motion.button>
  )
}

function Lightbox({ items, index, onClose, onIndex }: { items: MediaItem[]; index: number | null; onClose: () => void; onIndex: (i: number) => void }) {
  const open = index !== null
  const item = open ? items[index] : null
  const go = useCallback(
    (d: number) => {
      if (index === null) return
      onIndex((index + d + items.length) % items.length)
    },
    [index, items.length, onIndex],
  )
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, go, onClose])

  return (
    <AnimatePresence>
      {item && index !== null && (
        <motion.div
          data-lenis-prevent
          role="dialog"
          aria-modal="true"
          aria-label="Property gallery"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[70] flex flex-col bg-[#0B1220] text-[#F7F3EC]"
        >
          <div className="flex items-center justify-between px-5 py-4 sm:px-8">
            <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-[#E6C9A0]">
              {String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center gap-3 font-sans text-[11px] uppercase tracking-[0.22em] text-[#F7F3EC] hover:text-[#E6C9A0]"
            >
              Close <span aria-hidden className="text-lg leading-none">×</span>
            </button>
          </div>
          <div className="relative flex-1 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: EASE }}
                drag={item.kind === 'plan' ? false : 'x'}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.25}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -70) go(1)
                  if (info.offset.x > 70) go(-1)
                }}
                className="absolute inset-0 flex items-center justify-center px-4 pb-4 sm:px-20"
              >
                {item.kind === 'video' ? (
                  <video
                    key={item.src}
                    src={item.src}
                    poster={item.poster}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-full max-w-full bg-black"
                  />
                ) : item.kind === 'plan' ? (
                  <PlanViewer item={item} dark />
                ) : (
                  <div className="relative h-full w-full">
                    <Image src={item.src} alt={item.alt} fill sizes="100vw" className="object-contain" />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            {items.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous"
                  className="absolute left-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center border border-[#E6C9A0]/40 text-[#F7F3EC] hover:bg-[#F7F3EC] hover:text-[#15213A] sm:flex"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next"
                  className="absolute right-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center border border-[#E6C9A0]/40 text-[#F7F3EC] hover:bg-[#F7F3EC] hover:text-[#15213A] sm:flex"
                >
                  →
                </button>
              </>
            )}
          </div>
          <div className="border-t border-white/10 px-5 py-4 sm:px-8">
            <p className="font-serif text-lg text-[#F7F3EC]">{item.caption}</p>
            <div className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none]">
              {items.map((m, i) => (
                <button
                  key={m.src}
                  type="button"
                  onClick={() => onIndex(i)}
                  aria-label={`Show ${m.caption}`}
                  className={`relative h-12 w-12 shrink-0 overflow-hidden border transition-colors ${i === index ? 'border-[#E6C9A0]' : 'border-transparent opacity-50 hover:opacity-90'}`}
                >
                  <Image src={m.kind === 'video' ? m.poster || m.src : m.src} alt="" fill sizes="48px" className="object-cover" />
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Zoomable plan: buttons and wheel to zoom, drag to pan. */
function PlanViewer({ item, dark = false }: { item: MediaItem; dark?: boolean }) {
  const [zoom, setZoom] = useState(1)
  const frame = useRef<HTMLDivElement>(null)
  const clamp = (z: number) => Math.min(3, Math.max(1, Math.round(z * 10) / 10))
  return (
    <div className={`relative h-full w-full ${dark ? '' : 'bg-[#F7F3EC]'}`}>
      <div
        ref={frame}
        className="relative h-full w-full overflow-hidden"
        onWheel={e => {
          if (!e.ctrlKey && !e.metaKey) return
          e.preventDefault()
          setZoom(z => clamp(z - e.deltaY * 0.002))
        }}
      >
        <motion.div
          drag={zoom > 1}
          dragConstraints={frame}
          dragElastic={0.05}
          animate={{ scale: zoom }}
          transition={{ duration: 0.35, ease: EASE }}
          className={`relative h-full w-full ${zoom > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
          style={{ x: zoom === 1 ? 0 : undefined, y: zoom === 1 ? 0 : undefined }}
        >
          <Image src={item.src} alt={item.alt} fill loading="eager" sizes="(min-width:1024px) 60vw, 100vw" className="pointer-events-none select-none object-contain" />
        </motion.div>
      </div>
      <div className="absolute bottom-3 right-3 flex border border-[#B0834A]/50 bg-[#F7F3EC] text-[#15213A]">
        <button type="button" onClick={() => setZoom(z => clamp(z - 0.5))} aria-label="Zoom out" className="h-10 w-10 text-lg hover:bg-[#15213A] hover:text-[#F7F3EC]">
          −
        </button>
        <span className="flex h-10 w-14 items-center justify-center border-x border-[#B0834A]/40 font-sans text-[11px] tracking-[0.15em]">{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => setZoom(z => clamp(z + 0.5))} aria-label="Zoom in" className="h-10 w-10 text-lg hover:bg-[#15213A] hover:text-[#F7F3EC]">
          +
        </button>
      </div>
    </div>
  )
}

/* ───────────────────────────── Small pieces ───────────────────────────── */

function SectionTitle({ numeral, eyebrow, title, intro }: { numeral: string; eyebrow: string; title: string; intro?: string }) {
  return (
    <motion.div {...reveal} className="mb-10">
      <Eyebrow numeral={numeral}>{eyebrow}</Eyebrow>
      <h2 className="mt-5 font-display text-[1.75rem] leading-[1.15] tracking-[0.02em] text-[#15213A] sm:text-[2.2rem]">{title}</h2>
      {intro && <p className="mt-4 max-w-2xl font-serif text-[1.2rem] leading-relaxed text-[#4A5163]">{intro}</p>}
    </motion.div>
  )
}

function ShareButton({ name, tone = 'light' }: { name: string; tone?: 'light' | 'dark' }) {
  const [done, setDone] = useState(false)
  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: `${name} · Tharaga Estates`, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setDone(true)
      setTimeout(() => setDone(false), 2200)
    } catch {}
  }
  return (
    <button
      type="button"
      onClick={share}
      className={`inline-flex items-center gap-2 font-sans text-[11px] uppercase tracking-[0.2em] ${
        tone === 'light' ? 'text-white/75 hover:text-white' : 'text-[#4A5163] hover:text-[#15213A]'
      }`}
    >
      <span aria-hidden>↗</span>
      {done ? 'Link copied' : 'Share'}
    </button>
  )
}

function DistanceBars({ items }: { items: NonNullable<Mandate['nearby']> }) {
  const max = Math.max(...items.map(i => parseFloat(i.distance) || 0))
  return (
    <ul className="divide-y divide-[#B0834A]/20 border-y border-[#B0834A]/20">
      {items.map((n, i) => {
        const v = parseFloat(n.distance) || 0
        return (
          <li key={n.place} className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2 py-4 sm:grid-cols-[14rem_1fr_6rem]">
            <span className="font-serif text-[1.15rem] text-[#15213A]">{n.place}</span>
            <span className="order-3 col-span-2 h-[3px] bg-[#E4DACA] sm:order-none sm:col-span-1">
              <motion.span
                className="block h-full origin-left bg-[#B0834A]"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: Math.max(0.04, v / max) }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: EASE, delay: i * 0.08 }}
              />
            </span>
            <span className="text-right font-sans text-[12px] tracking-[0.08em] text-[#15213A]">
              {n.distance}
              {n.note && <span className="block text-[10.5px] uppercase tracking-[0.2em] text-[#5F6575]">{n.note}</span>}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

/* ───────────────────────────── Page ───────────────────────────── */


/* ───────────────────────────── Members gate ───────────────────────────── */
function MembersGate({ mandate, counts, onSignIn }: { mandate: Mandate; counts: { media: number; plans: number; facts: number; nearby: number }; onSignIn: () => void }) {
  const items = [
    counts.media > 0 && { icon: ImageIcon, text: `${counts.media} photo${counts.media > 1 ? 's' : ''} & video${counts.media > 1 ? 's' : ''} from the site` },
    counts.plans > 0 && { icon: Ruler, text: 'The site plan, zoomable' },
    { icon: FileText, text: `${counts.facts} key facts and specifications` },
    counts.nearby > 0 && { icon: MapPin, text: 'Distances to highways, rail and towns' },
  ].filter(Boolean) as { icon: any; text: string }[]
  return (
    <section id="members" aria-labelledby="members-title" className="tharaga-members-only scroll-mt-36">
      <div className="relative overflow-hidden border border-[#B0834A]/35 bg-[#FBF8F2]">
        {/* A quiet, blurred hint of what is inside */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 grid grid-cols-3 gap-2 p-2 opacity-50 blur-[10px]">
          {[0, 1, 2].map(i => <div key={i} className="aspect-[4/3] bg-gradient-to-br from-[#D6CAB5] to-[#EFE8DC]" />)}
        </div>
        <div className="relative bg-gradient-to-b from-[#FBF8F2]/60 via-[#FBF8F2]/95 to-[#FBF8F2] px-6 pb-9 pt-24 sm:px-10 sm:pt-28">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#15213A] text-[#E6C9A0]">
            <Lock className="h-5 w-5" strokeWidth={1.7} />
          </span>
          <p className="mt-5 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#94643A]">For signed-in buyers</p>
          <h2 id="members-title" className="mt-2 font-display text-[1.6rem] leading-tight tracking-[0.02em] text-[#15213A] sm:text-[1.9rem]">
            See the full details of {mandate.name}
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {items.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 font-sans text-[14.5px] text-[#2E3648]">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#94643A]" strokeWidth={1.7} /> {text}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button onClick={onSignIn} className="inline-flex h-12 items-center justify-center gap-3 bg-[#15213A] px-7 font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-[#F7F3EC] transition-colors hover:bg-[#0E1729]">
              Sign in to view — it&apos;s free
            </button>
            <p className="font-sans text-[13px] text-[#5F6575]">One tap with Google. Your details stay private.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function GateSkeleton() {
  return (
    <div aria-hidden className="space-y-4">
      <div className="h-6 w-48 animate-pulse bg-[#EFE8DC]" />
      <div className="grid grid-cols-3 gap-3">{[0, 1, 2].map(i => <div key={i} className="aspect-[4/3] animate-pulse bg-[#EFE8DC]" />)}</div>
      <div className="h-40 animate-pulse bg-[#EFE8DC]" />
    </div>
  )
}

function SignedOutDialog({ onSignIn, onHome, onDismiss }: { onSignIn: () => void; onHome: () => void; onDismiss: () => void }) {
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    ref.current?.focus()
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onDismiss()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onDismiss])
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] flex items-end justify-center bg-[#0B1220]/70 p-0 backdrop-blur-[4px] sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="signedout-title">
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ duration: 0.45, ease: EASE }} className="w-full max-w-md bg-[#FBF8F2] p-7 pb-[max(28px,env(safe-area-inset-bottom))] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.6)] sm:p-9">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#15213A] text-[#E6C9A0]"><Lock className="h-5 w-5" strokeWidth={1.7} /></span>
        <h2 id="signedout-title" className="mt-5 font-display text-[1.5rem] leading-tight tracking-[0.02em] text-[#15213A]">You&apos;ve signed out</h2>
        <p className="mt-2 font-sans text-[14.5px] leading-relaxed text-[#4A5163]">Property details are for signed-in buyers. Sign in again to keep viewing, or head back to the home page.</p>
        <div className="mt-7 flex flex-col gap-3">
          <button ref={ref} onClick={onSignIn} className="inline-flex h-12 items-center justify-center bg-[#15213A] font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-[#F7F3EC] hover:bg-[#0E1729]">Sign in again</button>
          <button onClick={onHome} className="inline-flex h-12 items-center justify-center gap-2 border border-[#15213A] font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-[#15213A]"><Home className="h-4 w-4" /> Return to home</button>
          <button onClick={onDismiss} className="h-10 font-sans text-[13px] text-[#5F6575] underline underline-offset-4 hover:text-[#15213A]">Stay on the summary</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function PropertyDossier({ mandate }: { mandate: Mandate }) {
  const router = useRouter()
  const shortlist = useShortlist()
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [showBar, setShowBar] = useState(false)
  const heroRef = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const textY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 90])
  const textO = useTransform(scrollYProgress, [0, 0.8], [1, 0.2])

  const media = useMemo(() => mandate.media ?? [], [mandate.media])
  const plans = media.filter(m => m.kind === 'plan')
  const shots = media.filter(m => m.kind !== 'plan')
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'video' | 'photo'>('all')
  const visibleShots = galleryFilter === 'all' ? shots : shots.filter(m => m.kind === galleryFilter)
  const facts = mandate.facts ?? mandate.stats.map((s, i) => ({ label: ['Extent', 'Type', 'Location'][i] ?? 'Detail', value: s }))
  const related = relatedMandates(mandate)
  const wa = whatsappLink(mandate.name)
  const saved = shortlist.has(mandate.slug)
  const dossier = mandate.dossier ?? DEFAULT_DOSSIER

  // ── Access: the summary is public; the details are for signed-in buyers ──
  const { user, ready } = useAuthUser()
  const unlocked = !!user
  const checking = !user && !ready
  const signIn = useCallback(
    () =>
      openAuthModal(`/properties/${mandate.slug}`, {
        title: `Sign in to view ${mandate.name}`,
        body: 'Photos, videos, the site plan and key facts are shared with signed-in buyers. One tap with Google — no forms.',
      }),
    [mandate.slug, mandate.name],
  )
  const wasSignedIn = useRef(false)
  const [signedOut, setSignedOut] = useState(false)
  useEffect(() => {
    if (user) {
      wasSignedIn.current = true
      setSignedOut(false)
    } else if (ready && wasSignedIn.current) {
      wasSignedIn.current = false
      setLightbox(null)
      setSignedOut(true)
    }
  }, [user, ready])

  useEffect(() => {
    const onScroll = () => setShowBar(window.scrollY > window.innerHeight * 0.7)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const sections = useMemo(() => {
    const s = [{ id: 'overview', label: 'Overview' }]
    if (!unlocked) {
      s.push({ id: 'members', label: 'Full details' }, { id: 'next-steps', label: 'How to buy' })
      return s
    }
    if (shots.length) s.push({ id: 'gallery', label: 'Photos & video' })
    if (plans.length) s.push({ id: 'layout', label: 'Layout' })
    s.push({ id: 'details', label: 'Key facts' })
    if (mandate.nearby?.length) s.push({ id: 'location', label: 'Nearby' })
    s.push({ id: 'next-steps', label: 'How to buy' })
    return s
  }, [shots.length, plans.length, mandate.nearby, unlocked])

  let n = 0
  const roman = () => ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][n++]

  return (
    <div className="min-h-screen bg-[#F7F3EC] pb-24 text-[#15213A] lg:pb-0 [&_p]:text-inherit">
      <SmoothScroll />
      <SiteHeader />

      {/* ── HERO ─────────────────────────────────────────── */}
      <header ref={heroRef} className="relative overflow-hidden bg-[#15213A] pb-16 pt-32 text-[#F7F3EC] sm:pt-36 lg:pb-24 lg:pt-40">
        {mandate.media?.[0]?.poster || mandate.media?.find(m => m.kind === 'photo') || (mandate.image && !mandate.plate) ? (
          <div aria-hidden className="absolute inset-0 opacity-[0.18]">
            <Image
              src={mandate.media?.[0]?.poster || mandate.media?.find(m => m.kind === 'photo')?.src || mandate.image || ''}
              alt=""
              fill
              sizes="100vw"
              className="scale-110 object-cover blur-2xl"
            />
          </div>
        ) : null}
        <div aria-hidden className="pointer-events-none absolute inset-4 border border-[#E6C9A0]/15 sm:inset-6" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-16">
          <motion.div style={{ y: textY, opacity: textO }} className="lg:col-span-7">
            <nav aria-label="Breadcrumb" className="font-sans text-[11px] uppercase tracking-[0.2em] text-white/60">
              <Link href="/properties" className="text-white/60 hover:text-[#E6C9A0]">
                Properties
              </Link>
              <span className="mx-3 text-[#E6C9A0]/60">/</span>
              <span className="text-[#E6C9A0]">{CATEGORY_LABELS[mandate.category]}</span>
            </nav>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.1 }} className="mt-8">
              {mandate.badge && <BadgeTag badge={mandate.badge} onDark />}
            </motion.div>

            <h1 className="mt-6 text-[#F7F3EC]">
              {mandate.name.split(' ').map((w, i) => (
                <span key={i} className="inline-block overflow-hidden pb-1 align-bottom">
                  <motion.span
                    className="inline-block font-display text-[2.3rem] leading-[1.08] tracking-[0.02em] sm:text-[3.2rem] lg:text-[3.6rem]"
                    initial={{ y: '110%' }}
                    animate={{ y: '0%' }}
                    transition={{ duration: 1, ease: EASE, delay: 0.2 + i * 0.05 }}
                  >
                    {w}&nbsp;
                  </motion.span>
                </span>
              ))}
            </h1>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.6 }} className="mt-5 font-sans text-[11px] uppercase tracking-[0.2em] text-white/70">
              {mandate.location} · {mandate.region}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: EASE, delay: 0.7 }}
              className="mt-7 max-w-xl font-serif text-[1.45rem] font-light italic leading-snug text-[#E6C9A0] sm:text-[1.7rem]"
            >
              “{mandate.tagline}”
            </motion.p>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.85 }} className="mt-8">
              <StatPills stats={mandate.stats} onDark />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.95 }}
              className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <Button href={wa} variant="copper" size="lg" arrow>
                Request a private briefing
              </Button>
              <Button href={telLink} variant="outline-light" size="lg">
                Call {DESK_PHONE_DISPLAY}
              </Button>
            </motion.div>
            <div className="mt-6 flex items-center gap-8">
              <SaveToggle saved={saved} onToggle={() => shortlist.toggle(mandate.slug)} tone="light" />
              <ShareButton name={mandate.name} />
            </div>
          </motion.div>

          <div className="lg:col-span-5">
            <HeroVisual mandate={mandate} onOpenGallery={i => (unlocked ? setLightbox(i) : signIn())} />
          </div>
        </div>
      </header>

      <SectionNav sections={sections} />

      {/* ── BODY ─────────────────────────────────────────── */}
      <div className="mx-auto grid max-w-7xl gap-14 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-12 lg:gap-16">
        <main className="min-w-0 space-y-24 lg:col-span-8 sm:space-y-28">
          {/* Overview */}
          <section id="overview" className="scroll-mt-36">
            <SectionTitle numeral={roman()} eyebrow="Overview" title="The property in brief" />
            <motion.p {...reveal} className="font-serif text-[1.35rem] leading-[1.65] text-[#2E3648] first-letter:float-left first-letter:mr-3 first-letter:font-display first-letter:text-[3.6rem] first-letter:leading-[0.9] first-letter:text-[#B0834A]">
              {mandate.story}
            </motion.p>

            <motion.div {...reveal} className="mt-12 grid gap-px border border-[#B0834A]/25 bg-[#B0834A]/25 sm:grid-cols-2">
              {mandate.highlights.map((h, i) => (
                <div key={h} className={`flex gap-5 bg-[#FBF8F2] p-6 ${i === mandate.highlights.length - 1 && i % 2 === 0 ? 'sm:col-span-2' : ''}`}>
                  <span className="font-display text-[1.4rem] leading-none text-[#B0834A]">{String(i + 1).padStart(2, '0')}</span>
                  <span className="font-sans text-[14.5px] leading-relaxed text-[#2E3648]">{h}</span>
                </div>
              ))}
            </motion.div>

            <motion.div {...reveal} className="mt-10 border-l-2 border-[#B0834A] pl-6">
              <p className="font-sans text-[11px] uppercase tracking-[0.22em] text-[#94643A]">Best suited to</p>
              <p className="mt-2 font-serif text-[1.25rem] leading-relaxed text-[#15213A]">{mandate.idealFor.split(' · ').join('  ·  ')}</p>
            </motion.div>
          </section>

          {unlocked ? (
            <>
          {/* Gallery */}
          {shots.length > 0 && (
            <section id="gallery" className="scroll-mt-36">
              <SectionTitle
                numeral={roman()}
                eyebrow="Photos & video"
                title="See it for yourself"
                intro="Footage and photographs from the property, as shared by the owner. Tap any frame to view it full screen."
              />
              {shots.some(m => m.kind === 'video') && shots.some(m => m.kind === 'photo') && shots.length > 4 && (
                <div role="tablist" aria-label="Filter gallery" className="mb-6 flex flex-wrap gap-2">
                  {([
                    ['all', `All · ${shots.length}`],
                    ['video', `Videos · ${shots.filter(m => m.kind === 'video').length}`],
                    ['photo', `Photos · ${shots.filter(m => m.kind === 'photo').length}`],
                  ] as const).map(([k, label]) => (
                    <button
                      key={k}
                      type="button"
                      role="tab"
                      aria-selected={galleryFilter === k}
                      onClick={() => setGalleryFilter(k)}
                      className={`h-9 border px-4 font-sans text-[11px] uppercase tracking-[0.22em] transition-colors ${
                        galleryFilter === k ? 'border-[#15213A] bg-[#15213A] text-[#F7F3EC]' : 'border-[#B0834A]/40 text-[#4A5163] hover:border-[#15213A] hover:text-[#15213A]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              <motion.div layout className={`grid grid-cols-2 gap-3 sm:gap-4 ${visibleShots.length === 4 ? 'sm:grid-cols-4' : visibleShots.length === 2 ? 'sm:grid-cols-2' : visibleShots.length === 1 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
                {visibleShots.map((m, vi) => {
                  const i = media.indexOf(m)
                  return (
                    <MediaThumb
                      key={m.src}
                      item={m}
                      index={vi}
                      onOpen={() => setLightbox(i)}
                      className={`${m.portrait ? 'aspect-[3/4]' : 'aspect-[4/3]'} ${vi === 0 && visibleShots.length % 2 === 1 ? 'col-span-2 !aspect-[4/5] sm:col-span-1 sm:!aspect-[3/4]' : ''}`}
                    />
                  )
                })}
              </motion.div>
            </section>
          )}

          {/* Layout */}
          {plans.length > 0 && (
            <section id="layout" className="scroll-mt-36">
              <SectionTitle
                numeral={roman()}
                eyebrow="Layout"
                title={mandate.category === 'land' && mandate.acres && mandate.acres > 100 ? 'How the land is laid out' : 'The site plan'}
                intro="Zoom in to study the shape of the land. Survey numbers are kept private and shared once a buyer is verified."
              />
              {plans.map(p => (
                <motion.figure key={p.src} {...reveal}>
                  <div className="relative aspect-[4/3] w-full overflow-hidden border border-[#B0834A]/30 bg-[#F7F3EC] sm:aspect-[16/11]">
                    <PlanViewer item={p} />
                    <span className="pointer-events-none absolute left-4 top-4 font-sans text-[10.5px] uppercase tracking-[0.2em] text-[#94643A]">Not to scale</span>
                  </div>
                  <figcaption className="mt-3 font-sans text-[12px] tracking-[0.04em] text-[#4A5163]">{p.caption}</figcaption>
                </motion.figure>
              ))}
            </section>
          )}

          {/* Key facts */}
          <section id="details" className="scroll-mt-36">
            <SectionTitle numeral={roman()} eyebrow="Key facts" title="The details that matter" />
            <motion.dl {...reveal} className="grid grid-cols-1 border-t border-[#B0834A]/25 sm:grid-cols-2">
              {facts.map(f => (
                <div key={f.label} className="flex items-baseline justify-between gap-6 border-b border-[#B0834A]/25 py-5 sm:pr-8 sm:even:pl-8 sm:even:pr-0">
                  <dt className="shrink-0 font-sans text-[11px] uppercase tracking-[0.24em] text-[#5F6575]">{f.label}</dt>
                  <dd className="text-right font-serif text-[1.15rem] leading-snug text-[#15213A]">{f.value}</dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-6 border-b border-[#B0834A]/25 py-5 sm:pr-8 sm:even:pl-8 sm:even:pr-0">
                <dt className="shrink-0 font-sans text-[11px] uppercase tracking-[0.24em] text-[#5F6575]">Price</dt>
                <dd className="text-right font-serif text-[1.15rem] italic leading-snug text-[#94643A]">Shared privately on enquiry</dd>
              </div>
            </motion.dl>

            {mandate.specs?.map(g => (
              <motion.div key={g.title} {...reveal} className="mt-12">
                <h3 className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#15213A]">{g.title}</h3>
                <table className="mt-4 w-full border-collapse text-left">
                  <tbody>
                    {g.rows.map(r => (
                      <tr key={r.label} className="border-b border-[#B0834A]/20">
                        <th scope="row" className="py-4 pr-4 font-serif text-[1.1rem] font-normal text-[#2E3648]">
                          {r.label}
                        </th>
                        <td className="py-4 pr-4 text-right font-sans text-[13.5px] font-medium text-[#15213A]">{r.value}</td>
                        <td className="hidden w-40 py-4 text-right font-sans text-[11px] uppercase tracking-[0.2em] text-[#5F6575] sm:table-cell">{r.note ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            ))}
          </section>

          {/* Nearby */}
          {mandate.nearby?.length ? (
            <section id="location" className="scroll-mt-36">
              <SectionTitle
                numeral={roman()}
                eyebrow="Nearby"
                title="Distances that shape the deal"
                intro="Approximate distances from the village. The exact boundary is walked with you on the site visit."
              />
              <motion.div {...reveal}>
                <DistanceBars items={mandate.nearby} />
              </motion.div>
            </section>
          ) : null}

            </>
          ) : checking ? (
            <GateSkeleton />
          ) : (
            <MembersGate
              mandate={mandate}
              counts={{ media: shots.length, plans: plans.length, facts: facts.length + (mandate.specs?.reduce((a, g) => a + g.rows.length, 0) ?? 0), nearby: mandate.nearby?.length ?? 0 }}
              onSignIn={signIn}
            />
          )}

          {/* How to buy */}
          <section id="next-steps" className="scroll-mt-36">
            <SectionTitle numeral={roman()} eyebrow="How to buy" title="Three steps, one point of contact" />
            <ol className="grid gap-px bg-[#B0834A]/25 sm:grid-cols-3">
              {[
                ['Tell us what you need', 'Message or call the desk. One conversation is enough to know if this property fits.'],
                ['Get the private briefing', 'Price, terms, plans and ownership papers — shared once you are verified as a genuine buyer.'],
                ['Visit and decide', 'We walk the property with you and stay with the deal through to registration.'],
              ].map(([t, d], i) => (
                <motion.li key={t} {...reveal} transition={{ ...reveal.transition, delay: i * 0.1 }} className="bg-[#F7F3EC] p-7">
                  <span className="font-display text-[2.6rem] leading-none text-[#B0834A]/40">{i + 1}</span>
                  <h3 className="mt-5 font-display text-[1.15rem] tracking-[0.03em] text-[#15213A]">{t}</h3>
                  <p className="mt-3 font-sans text-[14px] leading-relaxed text-[#4A5163]">{d}</p>
                </motion.li>
              ))}
            </ol>
          </section>
        </main>

        {/* Enquiry rail */}
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-36">
            <motion.div {...reveal} className="relative overflow-hidden bg-[#15213A] p-8 text-[#F7F3EC]">
              <Grain opacity={0.08} />
              <div aria-hidden className="pointer-events-none absolute inset-2 border border-[#E6C9A0]/20" />
              <p className="relative font-sans text-[11px] uppercase tracking-[0.22em] text-[#E6C9A0]">Interested?</p>
              <h2 className="relative mt-4 font-display text-[1.5rem] leading-tight tracking-[0.02em] text-[#F7F3EC]">Speak to the desk that holds this mandate.</h2>
              <p className="relative mt-4 font-sans text-[13.5px] leading-relaxed text-white/70">
                No forms. Message or call — you reach the person managing this property directly.
              </p>
              <div className="relative mt-7 space-y-3">
                <Button href={wa} variant="copper" full arrow>
                  WhatsApp the desk
                </Button>
                <Button href={telLink} variant="outline-light" full>
                  Call {DESK_PHONE_DISPLAY}
                </Button>
              </div>
              <div className="relative mt-8 border-t border-white/15 pt-6">
                <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-white/55">After your first call</p>
                <ul className="mt-4 space-y-3">
                  {dossier.map(d => (
                    <li key={d} className="flex gap-3 font-sans text-[13.5px] leading-snug text-[#F7F3EC]/90">
                      <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rotate-45 bg-[#B0834A]" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
            <div className="mt-5 flex items-center justify-between border border-[#B0834A]/25 px-5 py-4">
              <SaveToggle saved={saved} onToggle={() => shortlist.toggle(mandate.slug)} />
              <ShareButton name={mandate.name} tone="dark" />
            </div>
          </div>
        </aside>
      </div>

      {/* ── RELATED ─────────────────────────────────────── */}
      {related.length > 0 && (
        <section className="border-t border-[#B0834A]/25 bg-[#EFE8DC] py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
              <div>
                <Eyebrow>Keep exploring</Eyebrow>
                <h2 className="mt-5 font-display text-[1.75rem] tracking-[0.02em] text-[#15213A] sm:text-[2.2rem]">More from the portfolio</h2>
              </div>
              <Button href="/properties" variant="secondary" arrow>
                All properties
              </Button>
            </div>
            <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((m, i) => (
                <MandateCard
                  key={m.slug}
                  mandate={m}
                  index={i}
                  onOpen={() => openProperty(router, m)}
                  saved={shortlist.has(m.slug)}
                  onToggleSave={() => shortlist.toggle(m.slug)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── OWNER CTA ───────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#15213A] py-20 text-[#F7F3EC]">
        <Grain opacity={0.08} />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Eyebrow light>For owners</Eyebrow>
            <h2 className="mt-5 max-w-2xl font-display text-[1.7rem] leading-tight tracking-[0.02em] text-[#F7F3EC] sm:text-[2.2rem]">
              Own land or a property like this? <span className="font-serif font-light italic text-[#E6C9A0]">We will find the buyer.</span>
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button href="/?list=1" variant="light" size="lg" arrow>
              List your property
            </Button>
            <Button href="/feasibility" variant="outline-light" size="lg">
              Free land check
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />

      {/* ── MOBILE ACTION BAR ───────────────────────────── */}
      <AnimatePresence>
        {showBar && lightbox === null && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.45, ease: EASE }}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-[#B0834A]/30 bg-[#F7F3EC]/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:hidden"
          >
            <p className="mb-2 truncate font-sans text-[10.5px] uppercase tracking-[0.24em] text-[#5F6575]">{mandate.name}</p>
            <div className="flex gap-2">
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                className="flex h-12 flex-1 items-center justify-center gap-2 bg-[#B0834A] font-sans text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#FBF7F0] hover:text-[#FBF7F0]"
              >
                WhatsApp the desk <span aria-hidden>→</span>
              </a>
              <a
                href={telLink}
                aria-label={`Call ${DESK_PHONE_DISPLAY}`}
                className="flex h-12 w-14 items-center justify-center border-[1.5px] border-[#15213A] font-sans text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#15213A] hover:text-[#15213A]"
              >
                Call
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Lightbox items={media} index={unlocked ? lightbox : null} onClose={() => setLightbox(null)} onIndex={setLightbox} />
      <AnimatePresence>
        {signedOut && (
          <SignedOutDialog
            onSignIn={() => {
              setSignedOut(false)
              signIn()
            }}
            onHome={() => router.push('/')}
            onDismiss={() => setSignedOut(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
