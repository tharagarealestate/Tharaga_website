"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import BuilderAvatar, { BuilderExpression } from './BuilderAvatar'
import { Crane } from './ContextIcons/Crane'
import { UploadFolder } from './ContextIcons/UploadFolder'
import { AIBrain } from './ContextIcons/AIBrain'
import { BuyersGroup } from './ContextIcons/Buyers'
import { HandshakeAndDashboard } from './ContextIcons/HandshakeAndDashboard'
import ProgressBar from './ProgressBar'

export type Scene = 1 | 2 | 3

const bgColor = '#F9FAFB'

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

export const HowItWorksAnimatedSection: React.FC = () => {
  const [scene, setScene] = useState<Scene>(1)
  const [paused, setPaused] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const inView = useIntersectionStep(rootRef as any, true)
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Auto‑advance when section scrolled into view
  useEffect(() => {
    if (!inView || paused || reduceMotion) return
    let isCancelled = false
    const next = () => {
      if (isCancelled) return
      setScene((prev) => ((prev % 3) + 1) as Scene)
    }
    const id = setInterval(next, 3500)
    return () => {
      isCancelled = true
      clearInterval(id)
    }
  }, [inView, paused, reduceMotion])

  // Optional auditory tick for step transitions (accessibility-friendly, short tone)
  const playTick = React.useCallback(() => {
    if (!soundEnabled || typeof window === 'undefined') return
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = 660
      gain.gain.value = 0.04
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      setTimeout(() => { osc.stop(); ctx.close().catch(() => {}) }, 120)
    } catch {}
  }, [soundEnabled])

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

  // Simple swipe gesture support
  const startXRef = useRef<number | null>(null)
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    startXRef.current = e.clientX
  }
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (startXRef.current == null) return
    const dx = e.clientX - startXRef.current
    if (Math.abs(dx) > 40) {
      setScene((s) => (dx > 0 ? (s > 1 ? ((s - 1) as Scene) : 3) : ((s % 3) + 1) as Scene))
    }
    startXRef.current = null
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') setScene((s) => ((s % 3) + 1) as Scene)
    if (e.key === 'ArrowLeft') setScene((s) => (s > 1 ? ((s - 1) as Scene) : 3))
    if (e.key === ' ') setPaused((p) => !p)
  }

  return (
    <section
      ref={rootRef}
      aria-label="How it works process: steps 1 to 3"
      id="how-it-works-animated"
      className="w-full"
      style={{ background: bgColor }}
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex flex-col items-center gap-6">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900">How it works</h2>

          {/* Scene Canvas */}
          <div
            className="relative w-full overflow-hidden rounded-2xl border border-gray-200 bg-white"
            style={{ minHeight: 360 }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
          >
            {/* Large background grid */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background:radial-gradient(circle_at_1px_1px,#111_1px,transparent_1px)] [background-size:20px_20px]" />

            {/* Builder Avatar – anchored centerish */}
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              initial="initial"
              animate={{ ...containerVariants.animate, ...avatarPosition }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              <BuilderAvatar expression={expression} className="h-[180px] w-[180px] sm:h-[220px] sm:w-[220px]" />
            </motion.div>

            {/* Scenes */}
            <AnimatePresence mode="wait">
              {scene === 1 && (
                <motion.div
                  key="scene-1"
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <motion.div className="absolute left-[12%] top-[18%] w-32 sm:w-36" initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 120, damping: 12 }}>
                    <Crane />
                  </motion.div>
                  <motion.div className="absolute right-[12%] top-[26%] w-40 sm:w-48" initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}>
                    <UploadFolder />
                  </motion.div>
                  {/* Clipboard ticks */}
                  <motion.div className="absolute left-1/2 top-[70%] -translate-x-1/2" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="h-2 w-2 rounded-full" style={{ background: stepMeta[1].accent }} />
                      <span className="text-gray-700">Checklist prepared</span>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {scene === 2 && (
                <motion.div key="scene-2" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                  <motion.div className="absolute left-1/2 top-[24%] -translate-x-1/2 w-40 sm:w-48" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                    <AIBrain />
                  </motion.div>
                  <motion.div className="absolute left-1/2 top-[62%] -translate-x-1/2 w-[260px] sm:w-[300px]" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                    <BuyersGroup />
                  </motion.div>
                </motion.div>
              )}

              {scene === 3 && (
                <motion.div key="scene-3" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                  <motion.div className="absolute left-1/2 top-[28%] -translate-x-1/2 w-64 sm:w-72" initial={{ y: 12 }} animate={{ y: 0 }}>
                    <HandshakeAndDashboard />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Labels and bullets */}
          <motion.div key={scene} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="w-full text-center" aria-live="polite">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{meta.label}</h3>
            <ul className="mt-2 flex flex-col items-center gap-1 text-sm sm:text-base text-gray-600">
              {meta.bullets.map((b, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: meta.accent }} />
                  {b}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Controls */}
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
                onClick={() => setScene((s) => (s > 1 ? ((s - 1) as Scene) : 3))}
                aria-label="Previous step"
              >
                Prev
              </button>
              <button
                type="button"
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
                onClick={() => setScene((s) => ((s % 3) + 1) as Scene)}
                aria-label="Next step"
              >
                Next
              </button>
              <button
                type="button"
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
                onClick={() => setScene(1)}
                aria-label="Replay animation"
              >
                Replay
              </button>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600" htmlFor="pause-toggle">Pause</label>
              <input id="pause-toggle" type="checkbox" checked={paused} onChange={(e) => setPaused(e.target.checked)} className="h-4 w-4" />
              <label className="text-sm text-gray-600" htmlFor="sound-toggle">Sound</label>
              <input id="sound-toggle" type="checkbox" checked={soundEnabled} onChange={(e) => setSoundEnabled(e.target.checked)} className="h-4 w-4" />
            </div>
          </div>

          <ProgressBar step={scene} total={3} onStepChange={(s) => setScene(s as Scene)} />
        </div>
      </div>
    </section>
  )
}

export default HowItWorksAnimatedSection
