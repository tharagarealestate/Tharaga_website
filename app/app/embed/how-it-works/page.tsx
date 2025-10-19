"use client"

import dynamic from 'next/dynamic'
import { useEffect, useRef } from 'react'

// Client animated section for embeddable usage
const HowItWorksAnimatedSection = dynamic(
  () => import('../../../components/AnimatedHowItWorks/HowItWorksAnimatedSection'),
  { ssr: false }
)

export default function HowItWorksEmbed(){
  const rootRef = useRef<HTMLDivElement>(null)

  // Auto-report height to parent so host page can size iframe dynamically
  useEffect(() => {
    function postHeight(){
      try {
        const el = rootRef.current || document.documentElement
        const h = Math.max(
          document.documentElement.scrollHeight,
          document.body?.scrollHeight || 0,
          el?.scrollHeight || 0
        )
        window.parent?.postMessage({ type: 'HOW_IT_WORKS_RESIZE', height: h }, '*')
      } catch(_) { /* no-op */ }
    }
    postHeight()
    const ro = new ResizeObserver(() => postHeight())
    try { ro.observe(document.documentElement) } catch(_) {}
    window.addEventListener('resize', postHeight)
    const id = setInterval(postHeight, 900)
    return () => { window.removeEventListener('resize', postHeight); try { ro.disconnect() } catch(_) {}; clearInterval(id) }
  }, [])

  return (
    <main ref={rootRef} className="mx-auto max-w-5xl px-3 py-3 overflow-visible">
      <HowItWorksAnimatedSection compact />
    </main>
  )
}
