'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Script from 'next/script'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    // Wait for auth system to be ready, then open modal
    const openAuthModal = () => {
      const redirect = searchParams.get('redirect') || searchParams.get('next') || '/'
      
      // Try to open the auth modal
      if (typeof window !== 'undefined') {
        if (window.authGate && typeof window.authGate.openLoginModal === 'function') {
          window.authGate.openLoginModal({ next: redirect })
          return
        }
        if (typeof (window as any).__thgOpenAuthModal === 'function') {
          ;(window as any).__thgOpenAuthModal({ next: redirect })
          return
        }
        
        // If auth system not ready, wait a bit and try again
        setTimeout(() => {
          if (window.authGate && typeof window.authGate.openLoginModal === 'function') {
            window.authGate.openLoginModal({ next: redirect })
          } else if (typeof (window as any).__thgOpenAuthModal === 'function') {
            ;(window as any).__thgOpenAuthModal({ next: redirect })
          } else {
            // Fallback: redirect to home with login intent
            router.push(`/?login=true&redirect=${encodeURIComponent(redirect)}`)
          }
        }, 500)
      }
    }

    // Wait for DOM and scripts to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', openAuthModal, { once: true })
    } else {
      openAuthModal()
    }
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
      <div className="text-center">
        <div className="mb-4">
          <div className="inline-block w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
        <p className="text-white/80 text-lg">Opening login...</p>
        <p className="text-white/60 text-sm mt-2">
          If the login form doesn't appear, <a href="/" className="text-white underline">click here</a>
        </p>
      </div>
    </div>
  )
}

