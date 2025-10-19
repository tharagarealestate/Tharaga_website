"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import BuilderAvatar, { BuilderExpression } from './BuilderAvatar'
import { Crane } from './ContextIcons/Crane'
import { UploadFolder } from './ContextIcons/UploadFolder'
import { AIBrain } from './ContextIcons/AIBrain'
import { BuyersGroup } from './ContextIcons/Buyers'
import { HandshakeAndDashboard } from './ContextIcons/HandshakeAndDashboard'

export type Scene = 1 | 2 | 3

const bgColor = '#F9FAFB'
const SCENE_MS = 1800
const SCENE_S = SCENE_MS / 1000

const stepMeta = {
  1: {
    label: 'List Projects Effortlessly',
    bullets: [
      'Drag‑drop media and floor plans',
      'Our AI prepares your story',
    ],
    accent: '#1A73E8',
  },
  2: {
    label: 'AI Matches Qualified Buyers',
    bullets: [
      'Neural matching routes best‑fit intent',
      'Auto‑qualification with badges',
    ],
    accent: '#FF6B35',
  },
  3: {
    label: 'Close Deals and Track Success',
    bullets: [
      'Handshake and real‑time updates',
      'Dashboard growth with notifications',
    ],
    accent: '#10B981',
  },
} as const

const containerVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
}

function useIntersectionStep(ref: React.RefObject<HTMLElement>, enabled: boolean) {
  const inView = useInView(ref, { amount: 0.4, once: false })
  return enabled ? inView : true
}

export interface HowItWorksAnimatedSectionProps {
  /**
   * Compact layout trims paddings and hides the text column on mobile
   * to avoid vertical scrolling in tight embeds.
   */
  compact?: boolean
}

export const HowItWorksAnimatedSection: React.FC<HowItWorksAnimatedSectionProps> = ({ compact = false }) => {
  const [scene, setScene] = useState<Scene>(1)
  const rootRef = useRef<HTMLDivElement>(null)
  const inView = useIntersectionStep(rootRef as any, true)
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Track page/tab visibility so we can pause auto-advance + audio when hidden
  const [isPageVisible, setIsPageVisible] = useState<boolean>(true)
  useEffect(() => {
    if (typeof document === 'undefined') return
    const update = () => setIsPageVisible(!document.hidden)
    update()
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  // Auto‑advance when section scrolled into view
  useEffect(() => {
    if (!inView || reduceMotion || !isPageVisible) return
    let isCancelled = false
    const next = () => {
      if (isCancelled) return
      setScene((prev) => ((prev % 3) + 1) as Scene)
    }
    const id = setInterval(next, SCENE_MS)
    return () => {
      isCancelled = true
      clearInterval(id)
    }
  }, [inView, reduceMotion, isPageVisible])

  // Subtle auditory tick for step transitions (default on; no visible controls)
  const playTick = React.useCallback(() => {
    if (typeof window === 'undefined') return
    try { if (typeof document !== 'undefined' && document.hidden) return } catch(_) {}
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = 660
      gain.gain.value = 0.04
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      setTimeout(() => { try { osc.stop() } catch(_){} try { ctx.close() } catch(_){} }, 120)
    } catch {}
  }, [])

  // Fire tick when scene changes
  useEffect(() => {
    playTick()
  }, [scene, playTick])

  const expression: BuilderExpression = useMemo(() => {
    if (scene === 1) return 'neutral'
    if (scene === 2) return 'smile'
    return 'confident'
  }, [scene])

  const meta = stepMeta[scene]

  // Builder avatar positioning per scene for a more narrative flow
  const avatarPosition = useMemo(() => {
    if (scene === 1) return { x: -120, scale: 0.95 }
    if (scene === 2) return { x: 0, scale: 1 }
    return { x: 90, scale: 1 }
  }, [scene])

  // Attempt to unlock audio on any user gesture without exposing controls
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = () => { try { playTick() } catch(_){} }
    window.addEventListener('pointerdown', handler, { once: true })
    window.addEventListener('keydown', handler, { once: true })
    return () => {
      window.removeEventListener('pointerdown', handler as any)
      window.removeEventListener('keydown', handler as any)
    }
  }, [playTick])

  // Post our content height to any embedding parent window so iframes
  // can shrink‑wrap to the exact section height (removes unwanted
  // whitespace below the transitioning text on mobile).
  useEffect(() => {
    if (typeof window === 'undefined') return
    const isEmbedded = window.parent && window.parent !== window
    if (!isEmbedded) return

    let raf: number | null = null

    const measure = () => {
      try {
        // Measure ONLY the section root height so the iframe
        // matches visible content and never grows with viewport
        // changes (iOS URL bar collapse, etc.).
        const root = rootRef.current
        let h = 0
        if (root) {
          const rect = root.getBoundingClientRect()
          // Include vertical margins to be precise
          const cs = window.getComputedStyle(root)
          const mt = parseFloat(cs.marginTop || '0') || 0
          const mb = parseFloat(cs.marginBottom || '0') || 0
          h = Math.ceil(rect.height + mt + mb)
        } else {
          // Fallback to document scrollHeight (no clientHeight!)
          const doc = document
          h = Math.max(
            doc.documentElement.scrollHeight || 0,
            doc.body.scrollHeight || 0,
            doc.documentElement.offsetHeight || 0,
            doc.body.offsetHeight || 0
          )
        }
        window.parent.postMessage({ type: 'thg-how-height', height: h }, '*')
      } catch {}
    }

    const schedule = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(measure)
    }

    // Observe DOM/layout changes
    try {
      const ro = new (window as any).ResizeObserver(() => schedule())
      ro.observe(document.documentElement)
      if (document.body) ro.observe(document.body)
      // Also observe the section specifically
      if (rootRef.current) ro.observe(rootRef.current)
      ;(rootRef as any).__ro = ro
    } catch {}

    try {
      const mo = new MutationObserver(() => schedule())
      mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true, characterData: true })
      ;(rootRef as any).__mo = mo
    } catch {}

    const onResize = () => schedule()
    const onOrientation = () => {
      schedule()
      setTimeout(schedule, 250)
      setTimeout(schedule, 800)
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onOrientation)

    // Initial + a few delayed measurements to capture async paints
    schedule()
    setTimeout(schedule, 0)
    setTimeout(schedule, 200)
    setTimeout(schedule, 800)

    return () => {
      try { (rootRef as any).__ro && (rootRef as any).__ro.disconnect() } catch {}
      try { (rootRef as any).__mo && (rootRef as any).__mo.disconnect() } catch {}
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onOrientation)
    }
  }, [])

  // Also nudge parent to resize when scene changes (text copy changes)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'thg-how-height:soft' }, '*')
      }
    } catch {}
  }, [scene])

  return (
    <section
      ref={rootRef}
      aria-label="How it works process: steps 1 to 3"
      id="how-it-works-animated"
      className="w-full overflow-x-hidden"
      style={{ background: bgColor }}
    >
      <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${compact ? 'py-2 sm:py-5' : 'pt-6 pb-4 sm:py-8'} overflow-x-hidden`}
      >
        <div
          className="grid grid-cols-1 items-center gap-4 lg:gap-8 lg:[grid-template-columns:minmax(0,0.9fr)_minmax(0,1.1fr)] xl:[grid-template-columns:minmax(0,0.85fr)_minmax(0,1.15fr)]"
        >
          {/* Text column */}
          <motion.div
            key={`text-${scene}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`order-2 lg:order-1 ${compact ? 'hidden sm:block' : ''} text-center sm:text-left max-w-md mx-auto sm:mx-0`}
            aria-live="polite"
          >
            {/* Heading moved into the canvas (top centered) for all sizes */}
            <h2 className="hidden">How it works</h2>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{meta.label}</h3>
            <ul className="mt-2 space-y-1 text-sm sm:text-base text-gray-600">
              {meta.bullets.map((b, i) => (
                <li key={i} className="flex items-center gap-2 justify-center sm:justify-start">
                  <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: meta.accent }} />
                  {b}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Futuristic scene canvas */}
          <div
            className={`order-1 lg:order-2 relative w-full overflow-hidden rounded-2xl bg-white lg:[width:calc(100%+2rem)] xl:[width:calc(100%+3rem)] 2xl:[width:calc(100%+4rem)] lg:ml-[-2rem] xl:ml-[-3rem] 2xl:ml-[-4rem]`}
          >
            {/* Mobile-only section title pinned to top center */}
            <h2 className="absolute top-2 left-1/2 -translate-x-1/2 text-base sm:text-2xl lg:text-3xl font-extrabold text-gray-900 z-20 text-center">How it works</h2>
            {/* Reserve space for animation canvas – mobile height slightly reduced to avoid leftover whitespace */}
            <div className="min-h-[clamp(220px,54vw,300px)] sm:min-h-[440px]" />
            {/* Gradient + grid background */}
            <div className="pointer-events-none absolute inset-0" style={{
              background: `radial-gradient(800px 320px at 85% -10%, rgba(16,185,129,.12), rgba(16,185,129,0) 70%),
                          radial-gradient(600px 300px at 10% 110%, rgba(59,130,246,.12), rgba(59,130,246,0) 70%),
                          linear-gradient(180deg, #ffffff, #fafafa)`
            }} />
            {/* Parallax drift layers */}
            <motion.div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(420px 220px at 22% 32%, rgba(59,130,246,.06), transparent 70%),
                            radial-gradient(520px 240px at 78% 68%, rgba(16,185,129,.06), transparent 70%)`,
                willChange: 'transform'
              }}
              animate={{ x: [ -24, 24 ] }}
              transition={{ duration: 14, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' }}
            />
            <motion.div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(380px 200px at 70% 26%, rgba(99,102,241,.05), transparent 72%),
                            radial-gradient(460px 220px at 30% 80%, rgba(20,184,166,.05), transparent 72%)`,
                willChange: 'transform'
              }}
              animate={{ x: [ 18, -18 ] }}
              transition={{ duration: 18, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' }}
            />
            <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background:radial-gradient(circle_at_1px_1px,#111_1px,transparent_1px)] [background-size:18px_18px]" />
            {/* Scanning sweep */}
            <motion.div
              className="pointer-events-none absolute inset-x-0 top-0 h-16"
              style={{ background: 'linear-gradient(180deg, rgba(16,185,129,0.0), rgba(16,185,129,0.14), rgba(16,185,129,0.0))' }}
              animate={{ y: [ -64, 320 ] }}
              transition={{ duration: SCENE_S, ease: 'easeInOut', repeat: Infinity }}
            />

            {/* Builder Avatar – center anchor with gentle drift */}
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              initial="initial"
              animate={{ ...containerVariants.animate, ...avatarPosition }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            >
              <BuilderAvatar expression={expression} className="h-[160px] w-[160px] sm:h-[220px] sm:w-[220px]" />
            </motion.div>

            {/* Floating cursor indicator */}
            <motion.div
              className="absolute h-4 w-4 rounded-full"
              style={{ background: '#fff', boxShadow: '0 0 18px rgba(59,130,246,.55)', border: '2px solid rgba(59,130,246,.85)' }}
              animate={{
                left: scene === 1 ? '22%': scene === 2 ? '52%' : '68%',
                top: scene === 1 ? '28%' : scene === 2 ? '62%' : '36%'
              }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            />

            {/* Scenes with richer overlays */}
            <AnimatePresence>
              {scene === 1 && (
                <motion.div
                  key="scene-1"
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.28 }}
                >
                  <motion.div className="absolute left-[10%] top-[16%] w-32 sm:w-36" initial={{ x: -24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 140, damping: 12 }}>
                    <Crane />
                  </motion.div>
                  <motion.div className="absolute right-[10%] top-[22%] w-40 sm:w-48" initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.32 }}>
                    <UploadFolder />
                  </motion.div>
                  <motion.div className="absolute left-1/2 top-[74%] -translate-x-1/2" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.18, duration: 0.22 }}>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="h-2 w-2 rounded-full" style={{ background: stepMeta[1].accent }} />
                      <span className="text-gray-700">Assets uploaded • Story ready</span>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {scene === 2 && (
                <motion.div key="scene-2" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.28 }}>
                  <motion.div className="absolute left-1/2 top-[24%] -translate-x-1/2 w-40 sm:w-48" initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.32 }}>
                    <AIBrain />
                  </motion.div>
                  <motion.div className="absolute left-1/2 top-[62%] -translate-x-1/2 w-[260px] sm:w-[300px]" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.32 }}>
                    <BuyersGroup />
                  </motion.div>
                  <motion.div className="absolute left-[14%] bottom-[14%]" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.2 }}>
                    <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-3 py-1 text-xs font-semibold text-gray-800 shadow-sm">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: stepMeta[2].accent }} />
                      Qualified badges
                    </span>
                  </motion.div>
                </motion.div>
              )}

              {scene === 3 && (
                <motion.div key="scene-3" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.28 }}>
                  <motion.div className="absolute left-1/2 top-[28%] -translate-x-1/2 w-64 sm:w-72" initial={{ y: 10 }} animate={{ y: 0 }} transition={{ duration: 0.32 }}>
                    <HandshakeAndDashboard />
                  </motion.div>
                  <motion.div className="absolute right-[12%] bottom-[14%]" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.2 }}>
                    <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-3 py-1 text-xs font-semibold text-gray-800 shadow-sm">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: stepMeta[3].accent }} />
                      Live dashboard
                    </span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Global dissolve/blur wipe across scene boundaries */}
            <AnimatePresence>
              <motion.div
                key={`wipe-${scene}`}
                className="pointer-events-none absolute inset-y-0 -left-1/5 w-2/5"
                style={{
                  background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(148,163,184,0.22) 40%, rgba(255,255,255,0) 100%)',
                  filter: 'blur(10px)',
                  opacity: 0.0,
                  willChange: 'transform, filter, opacity',
                  mixBlendMode: 'soft-light'
                }}
                initial={{ x: '-20%', opacity: 0.0, filter: 'blur(14px)' }}
                animate={{ x: '120%', opacity: 0.65, filter: 'blur(6px)' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.36, ease: 'easeInOut' }}
              />
            </AnimatePresence>

          </div>
          </div>

          {/* Mobile-only transitioning text as a separate block BELOW the animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`mobile-copy-${scene}`}
              className="sm:hidden order-2 relative z-10 mx-3 mt-3 mb-2"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              aria-live="polite"
            >
              <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white/95 backdrop-blur-[2px] shadow-sm px-3 py-2">
                <h3 className="text-[15px] font-bold text-gray-900">{meta.label}</h3>
                <ul className="mt-1 space-y-1 text-[13px] leading-5 text-gray-600">
                  {meta.bullets.map((b, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: meta.accent }} />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
    </section>
  )
}

export default HowItWorksAnimatedSection
