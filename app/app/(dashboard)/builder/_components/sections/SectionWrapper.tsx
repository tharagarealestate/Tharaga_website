"use client"

import { useEffect } from 'react'

/**
 * Wrapper component that removes background from child pages
 * when used within the unified dashboard
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

  return <div className="w-full">{children}</div>
}



