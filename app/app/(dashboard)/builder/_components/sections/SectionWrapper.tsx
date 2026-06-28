"use client"

import { useEffect } from 'react'
import type { ReactNode } from 'react'

/**
 * Wrapper component that ensures consistent dark background
 * across all builder dashboard sections (no white backgrounds)
 * Background is handled by layout.tsx, this just ensures no white backgrounds leak through
 */
export function SectionWrapper({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Remove any white backgrounds from child components
    const removeWhiteBackgrounds = () => {
      // Remove solid white backgrounds (but keep glassmorphic white/opacity backgrounds)
      const whiteBackgrounds = document.querySelectorAll('[class*="bg-white"]')
      whiteBackgrounds.forEach((el) => {
        const htmlEl = el as HTMLElement
        const classes = htmlEl.className || ''
        // Only remove solid white backgrounds, not glassmorphic ones
        if (classes.includes('bg-white') && 
            !classes.includes('bg-white/') && 
            !classes.includes('bg-white-') &&
            !classes.includes('text-white') &&
            !classes.includes('border-white')) {
          htmlEl.style.background = 'transparent'
        }
      })
    }

    // Run after a short delay to allow child components to render
    const timer = setTimeout(removeWhiteBackgrounds, 100)
    
    // Also run on any mutations
    const observer = new MutationObserver(removeWhiteBackgrounds)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [])

  // Don't add background here - layout.tsx handles it
  // Just wrap children to ensure consistent styling
  return <div className="w-full">{children}</div>
}



