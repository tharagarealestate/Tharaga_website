'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import Script from 'next/script'

export function Header() {
  useEffect(() => {
    // Mobile menu toggle functionality
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle')
    const mobileMenuPanel = document.getElementById('mobile-menu-panel')
    const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay')
    const mobileMenuClose = document.querySelector('.mobile-menu-close')

    if (mobileMenuToggle && mobileMenuPanel) {
      const openMenu = () => {
        mobileMenuPanel.setAttribute('aria-hidden', 'false')
        mobileMenuToggle.setAttribute('aria-expanded', 'true')
        document.body.style.overflow = 'hidden'
      }

      const closeMenu = () => {
        mobileMenuPanel.setAttribute('aria-hidden', 'true')
        mobileMenuToggle.setAttribute('aria-expanded', 'false')
        document.body.style.overflow = ''
      }

      mobileMenuToggle.addEventListener('click', openMenu)
      mobileMenuClose?.addEventListener('click', closeMenu)
      mobileMenuOverlay?.addEventListener('click', closeMenu)

      // Close on escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && mobileMenuPanel.getAttribute('aria-hidden') === 'false') {
          closeMenu()
        }
      }
      document.addEventListener('keydown', handleEscape)

      // Populate mobile menu items
      const populateMobileMenu = () => {
        const navItems = document.querySelectorAll('nav.row a, nav.row details')
        const mobileMenu = mobileMenuPanel.querySelector('.mobile-menu-items')
        if (mobileMenu) {
          mobileMenu.innerHTML = ''
          navItems.forEach((item) => {
            if (item.tagName === 'A') {
              const link = item.cloneNode(true) as HTMLElement
              link.classList.add('mobile-menu-item')
              mobileMenu.appendChild(link)
            } else if (item.tagName === 'DETAILS') {
              const details = item.cloneNode(true) as HTMLElement
              details.removeAttribute('open')
              details.classList.add('mobile-menu-item')
              mobileMenu.appendChild(details)
            }
          })
        }
      }

      // Show/hide mobile menu toggle based on viewport
      const handleResize = () => {
        if (window.innerWidth < 768) {
          mobileMenuToggle?.setAttribute('style', 'display: block;')
        } else {
          mobileMenuToggle?.setAttribute('style', 'display: none;')
          closeMenu()
        }
      }

      handleResize()
      window.addEventListener('resize', handleResize)
      populateMobileMenu()

      return () => {
        mobileMenuToggle.removeEventListener('click', openMenu)
        mobileMenuClose?.removeEventListener('click', closeMenu)
        mobileMenuOverlay?.removeEventListener('click', closeMenu)
        document.removeEventListener('keydown', handleEscape)
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [])

  // Scroll effect for header
  useEffect(() => {
    const header = document.querySelector('header.nav')
    if (!header) return

    const handleScroll = () => {
      if (window.scrollY > 50) {
        header.classList.add('is-scrolled')
      } else {
        header.classList.remove('is-scrolled')
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <header className="nav" role="banner">
        <div className="inner">
          {/* Brand row: Logo + Trust pill */}
          <div className="row">
            <Link href="/" className="brand" style={{ fontSize: '26px' }}>
              THARAGA
            </Link>
            <span className="pill" id="home_pill_trust">
              Verified • Broker‑free
            </span>
          </div>

          {/* Navigation menu */}
          <nav className="row" aria-label="Primary">
            <span className="menu-group">
              {/* Features dropdown */}
              <details className="dropdown">
                <summary>Features</summary>
                <div className="menu" role="menu">
                  <Link href="/tools/vastu/">Vastu</Link>
                  <Link href="/tools/environment/">Climate & environment</Link>
                  <Link href="/tools/voice-tamil/">Voice (Tamil)</Link>
                  <Link href="/tools/verification/">Verification</Link>
                  <Link href="/tools/roi/">ROI</Link>
                  <Link href="/tools/currency-risk/">Currency risk</Link>
                  {/* Mobile-only injected: Pricing + About (hidden on desktop) */}
                  <span className="divider show-mobile-only" aria-hidden="true"></span>
                  <Link className="show-mobile-only" href="/pricing/">
                    Pricing
                  </Link>
                  <Link className="show-mobile-only" href="/about/">
                    About
                  </Link>
                </div>
              </details>
              <span className="divider" aria-hidden="true"></span>

              {/* Portal dropdown (dynamic based on user role) */}
              <details className="dropdown" id="portal-menu">
                <summary>Portal</summary>
                <div className="menu" role="menu" aria-label="Portal menu" id="portal-menu-items">
                  {/* Dynamically populated by role manager */}
                  <Link href="/builder">Builder Dashboard</Link>
                  <Link href="/my-dashboard">Buyer Dashboard</Link>
                </div>
              </details>
              <span className="divider" aria-hidden="true"></span>

              <Link href="/pricing/">Pricing</Link>
            </span>
            <span className="divider" aria-hidden="true"></span>
            <Link href="/about/">About</Link>
          </nav>

          {/* Mobile-only About link */}
          <Link className="about-mobile-link" href="/about/">
            About
          </Link>

          {/* Auth container - auth system will inject login/signup buttons here */}
          <div id="site-header-auth-container" className="tharaga-header__actions">
            {/* Auth system will inject .thg-auth-wrap here */}
          </div>

          {/* Mobile menu toggle button (hidden on desktop) */}
          <button
            className="mobile-menu-toggle"
            aria-label="Toggle menu"
            aria-expanded="false"
            aria-controls="mobile-menu-panel"
            style={{ display: 'none' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Mobile menu overlay */}
          <div className="mobile-menu-overlay" aria-hidden="true"></div>

          {/* Mobile menu panel */}
          <nav className="mobile-menu-panel" id="mobile-menu-panel" aria-label="Mobile navigation">
            <button className="mobile-menu-close" aria-label="Close menu">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            {/* Mobile menu items will be populated by JavaScript */}
            <div className="mobile-menu-items"></div>
          </nav>
        </div>
      </header>
    </>
  )
}

