'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'
import * as React from 'react'
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider'
import { SupabaseProvider } from '@/contexts/SupabaseContext'

export default function MyDashboardLayout({ children }: { children: ReactNode }) {
  // Hide auth dropdown and signin footer completely on mobile and desktop
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Hide auth dropdown button
    window.AUTH_HIDE_HEADER = true
    window.AUTH_NO_HEADER = true
    
    // Hide auth dropdown container and all auth-related elements
    const hideAuthElements = () => {
      // Hide main auth wrap
      const authWrap = document.querySelector('.thg-auth-wrap')
      if (authWrap) {
        (authWrap as HTMLElement).style.display = 'none'
        ;(authWrap as HTMLElement).style.visibility = 'hidden'
      }
      
      // Hide site header auth container
      const siteHeaderAuth = document.querySelector('#site-header-auth-container')
      if (siteHeaderAuth) {
        (siteHeaderAuth as HTMLElement).style.display = 'none'
        ;(siteHeaderAuth as HTMLElement).style.visibility = 'hidden'
      }
      
      // Hide auth button
      const authBtn = document.querySelector('.thg-auth-btn')
      if (authBtn) {
        (authBtn as HTMLElement).style.display = 'none'
        ;(authBtn as HTMLElement).style.visibility = 'hidden'
      }
      
      // Hide user menu button in header
      const userMenuBtn = document.querySelector('button[aria-label*="account"], button[aria-label*="Account"], button[aria-label*="menu"], button[aria-label*="Menu"]')
      if (userMenuBtn && (userMenuBtn as HTMLElement).closest('header')) {
        (userMenuBtn as HTMLElement).style.display = 'none'
        ;(userMenuBtn as HTMLElement).style.visibility = 'hidden'
      }
      
      // Hide hamburger menu in header
      const hamburgerMenu = document.querySelector('button[aria-label*="Open menu"], button[aria-label*="Close menu"]')
      if (hamburgerMenu && (hamburgerMenu as HTMLElement).closest('header')) {
        (hamburgerMenu as HTMLElement).style.display = 'none'
        ;(hamburgerMenu as HTMLElement).style.visibility = 'hidden'
      }
    }
    
    // Hide signin overlay/footer
    const hideSigninOverlay = () => {
      const overlay = document.querySelector('.thg-auth-overlay')
      if (overlay) {
        (overlay as HTMLElement).style.display = 'none'
      }
      // Also hide any logout confirmation dialogs
      const confirm = document.querySelector('.thg-confirm')
      if (confirm) {
        (confirm as HTMLElement).style.display = 'none'
      }
    }
    
    // Inject CSS to hide auth elements on mobile
    const injectHideStyles = () => {
      const styleId = 'my-dashboard-hide-auth'
      if (document.getElementById(styleId)) return
      
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        /* Hide all auth elements on my-dashboard */
        .thg-auth-wrap,
        #site-header-auth-container,
        .thg-auth-btn,
        header button[aria-label*="account" i],
        header button[aria-label*="Account" i],
        header button[aria-label*="Open menu" i],
        header button[aria-label*="Close menu" i],
        header button[aria-label*="Open account menu" i] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
        
        /* Hide mobile navigation icons in TopNav - specifically for my-dashboard */
        @media (max-width: 767px) {
          /* Hide user icon and hamburger menu buttons in mobile nav */
          .sticky.top-\\[60px\\] button[aria-label*="User account" i],
          .sticky.top-\\[60px\\] button[aria-label*="Open menu" i],
          .sticky.top-\\[60px\\] button[aria-label*="Close menu" i],
          .sticky.top-\\[60px\\] .flex.items-center.gap-2 {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
        }
      `
      document.head.appendChild(style)
    }
    
    hideAuthElements()
    hideSigninOverlay()
    injectHideStyles()
    
    // Continuously check and hide (in case auth system tries to show them)
    const interval = setInterval(() => {
      hideAuthElements()
      hideSigninOverlay()
    }, 100)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <ReactQueryProvider>
      <SupabaseProvider>
        {children}
      </SupabaseProvider>
    </ReactQueryProvider>
  )
}
