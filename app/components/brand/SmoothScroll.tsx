'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'

/**
 * Inertial smooth scrolling for the marketing pages. Anchor links glide to their
 * section; elements marked `data-lenis-prevent` (modals, sheets) keep native scroll.
 * Disabled for users who prefer reduced motion and on touch devices (native is better there).
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({
      duration: 1.15,
      easing: t => 1 - Math.pow(1 - t, 4),
      smoothWheel: true,
      anchors: { offset: -72 },
    })
    let raf = 0
    const loop = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
    }
  }, [])
  return null
}
