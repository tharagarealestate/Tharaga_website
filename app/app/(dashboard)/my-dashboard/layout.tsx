'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'
import * as React from 'react'
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider'
import { SupabaseProvider } from '@/contexts/SupabaseContext'

export default function MyDashboardLayout({ children }: { children: ReactNode }) {
  // Hide auth dropdown and signin footer completely
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Hide auth dropdown button
    window.AUTH_HIDE_HEADER = true
    window.AUTH_NO_HEADER = true
    
    // Hide auth dropdown container
    const hideAuthDropdown = () => {
      const authWrap = document.querySelector('.thg-auth-wrap')
      if (authWrap) {
        (authWrap as HTMLElement).style.display = 'none'
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
    
    hideAuthDropdown()
    hideSigninOverlay()
    
    // Continuously check and hide (in case auth system tries to show them)
    const interval = setInterval(() => {
      hideAuthDropdown()
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
