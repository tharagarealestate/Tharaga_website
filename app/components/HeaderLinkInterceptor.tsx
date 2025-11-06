// Extend Window interface
declare global {
  interface Window {
    __nextRouter?: {
      push: (href: string) => void
    }
  }
}

/**
 * Next.js Link Interceptor for Static Header
 * 
 * This client component intercepts clicks on header links and uses Next.js router
 * for client-side navigation, ensuring the header stays fixed while content loads.
 */
"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function HeaderLinkInterceptor() {
  const router = useRouter()

  useEffect(() => {
    // Make router available globally for header script
    if (typeof window !== 'undefined') {
      window.__nextRouter = {
        push: (href: string) => router.push(href)
      }
    }

    // Intercept link clicks in static header
    function interceptLinks() {
      const links = document.querySelectorAll('#tharaga-static-header a[data-next-link], #tharaga-static-header a[href^="/"]')
      links.forEach(function(link: HTMLAnchorElement) {
        if (link.hasAttribute('data-next-link-processed')) return
        link.setAttribute('data-next-link-processed', 'true')

        link.addEventListener('click', function(e: MouseEvent) {
          const href = link.getAttribute('href')
          if (!href || href.startsWith('#') || href.startsWith('http')) return

          e.preventDefault()
          
          // Use Next.js router for client-side navigation
          if (window.__nextRouter) {
            window.__nextRouter.push(href)
          } else {
            router.push(href)
          }
        })
      })
    }

    // Run immediately and on DOM updates
    interceptLinks()

    // Re-intercept after dynamic updates (portal menu changes)
    const observer = new MutationObserver(function() {
      setTimeout(interceptLinks, 50)
    })

    const headerEl = document.getElementById('tharaga-static-header')
    if (headerEl) {
      observer.observe(headerEl, {
        childList: true,
        subtree: true
      })
    }

    return () => {
      observer.disconnect()
    }
  }, [router])

  return null
}

