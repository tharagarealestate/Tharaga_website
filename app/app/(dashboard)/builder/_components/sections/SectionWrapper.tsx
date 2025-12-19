"use client"

import { useEffect } from 'react'
import { builderPageBackground, builderContentContainer } from '../builderCommonStyles'

/**
 * Wrapper component that ensures consistent dark background
 * across all builder dashboard sections (no white backgrounds)
 */
export function SectionWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Remove any page-level backgrounds from child components
    const removeBackgrounds = () => {
      // Find and remove full-screen backgrounds from child elements
      const fullScreenElements = document.querySelectorAll('[class*="min-h-screen"][class*="bg-gradient"]')
      fullScreenElements.forEach((el) => {
        const htmlEl = el as HTMLElement
        htmlEl.classList.remove('min-h-screen')
        htmlEl.style.background = 'transparent'
      })
      
      // Remove white backgrounds (but keep glassmorphic white/opacity backgrounds)
      const whiteBackgrounds = document.querySelectorAll('[class*="bg-white"]')
      whiteBackgrounds.forEach((el) => {
        const htmlEl = el as HTMLElement
        const classes = htmlEl.className || ''
        // Only remove solid white backgrounds, not glassmorphic ones
        if (classes.includes('bg-white') && 
            !classes.includes('bg-white/') && 
            !classes.includes('bg-white-') &&
            !classes.includes('text-white')) {
          htmlEl.style.background = 'transparent'
        }
      })
    }

    // Run after a short delay to allow child components to render
    const timer = setTimeout(removeBackgrounds, 100)
    
    // Also run on any mutations
    const observer = new MutationObserver(removeBackgrounds)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [])

  return (
    <div className={builderPageBackground}>
      <div className={builderContentContainer}>
        {children}
      </div>
    </div>
  )
}



