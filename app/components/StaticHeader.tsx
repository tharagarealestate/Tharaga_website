"use client"

import Link from 'next/link'
import { memo, useEffect } from 'react'
import { usePathname } from 'next/navigation'

// TypeScript declarations for window.thgRoleManager
declare global {
  interface Window {
    thgRoleManager?: {
      getState: () => {
        initialized: boolean
        user: { email: string } | null
        roles: string[]
        primaryRole?: string
        builderVerified?: boolean
      }
    }
    __updatePortalMenu?: () => void
  }
}

/**
 * Static Header Component
 * 
 * This component matches the homepage header style exactly and is designed
 * to persist across page navigation without re-rendering. It uses React.memo
 * to prevent unnecessary re-renders and maintains consistent styling.
 */
const StaticHeader = memo(function StaticHeader() {
  const pathname = usePathname()

  // Hide header on dashboard routes (they have their own navigation)
  const isDashboard =
    pathname?.startsWith('/builder') ||
    pathname?.startsWith('/my-dashboard') ||
    pathname?.startsWith('/admin')

  if (isDashboard) {
    return null
  }
  // Update portal menu when roles change (runs once on mount and on role changes)
  useEffect(() => {
    function updatePortalMenu() {
      const portalMenuItems = document.getElementById('portal-menu-items')
      if (!portalMenuItems || !window.thgRoleManager) return

      const state = window.thgRoleManager.getState()

      // Wait for both initialization AND user data to be ready
      if (!state.initialized || !state.user) {
        const portalMenu = document.getElementById('portal-menu')
        if (portalMenu) portalMenu.style.display = 'none'
        return
      }

      // Special handling: Show ALL dashboards for admin owner email
      const isAdminOwner = state.user.email === 'tharagarealestate@gmail.com'

      // Hide portal menu if no roles AND not admin owner
      if (state.roles.length === 0 && !isAdminOwner) {
        const portalMenu = document.getElementById('portal-menu')
        if (portalMenu) portalMenu.style.display = 'none'
        return
      }

      const portalMenu = document.getElementById('portal-menu')
      if (portalMenu) portalMenu.style.display = ''

      let menuHTML = ''

      console.log('[Portal Menu] Updating for user:', state.user.email, 'isAdminOwner:', isAdminOwner, 'roles:', state.roles)

      // For admin owner, always show buyer dashboard
      if (state.roles.includes('buyer') || isAdminOwner) {
        const active = state.primaryRole === 'buyer' ? ' <span style="color:#10b981">✓</span>' : ''
        menuHTML += '<a href="/my-dashboard">🏠 Buyer Dashboard' + active + '</a>'
      }

      // For admin owner, always show builder dashboard
      if (state.roles.includes('builder') || isAdminOwner) {
        const active = state.primaryRole === 'builder' ? ' <span style="color:#10b981">✓</span>' : ''
        const verified = state.builderVerified ? ' <span style="color:#10b981;font-size:11px">✓ Verified</span>' : ''
        menuHTML += '<a href="/builder">🏗️ Builder Dashboard' + active + verified + '</a>'
      }

      // Show Admin Panel link if user has admin role OR is admin owner
      if (state.roles.includes('admin') || isAdminOwner) {
        menuHTML += '<a href="/admin" style="border-top:1px solid #e5e7eb;margin-top:8px;padding-top:8px;">🛡️ Admin Panel</a>'
      }

      portalMenuItems.innerHTML = menuHTML || '<a href="/my-dashboard">Buyer Dashboard</a><a href="/builder">Builder Dashboard</a>'
    }

    // Update portal menu when roles change
    if (window.thgRoleManager) {
      const checkRoles = setInterval(() => {
        const state = window.thgRoleManager.getState()
        // Wait for BOTH initialized AND user to be ready
        if (state.initialized && state.user) {
          clearInterval(checkRoles)
          updatePortalMenu()
        }
      }, 500)

      // Listen for role changes
      window.addEventListener('thg-role-changed', updatePortalMenu)

      // Update on role switch (storage event for cross-tab communication)
      window.addEventListener('storage', (e) => {
        if (e.key === 'tharaga_active_role') {
          updatePortalMenu()
        }
      })

      // Make function globally available
      window.__updatePortalMenu = updatePortalMenu

      return () => {
        clearInterval(checkRoles)
        window.removeEventListener('thg-role-changed', updatePortalMenu)
        window.removeEventListener('storage', updatePortalMenu)
      }
    } else {
      // If role manager not loaded yet, retry
      const timeout = setTimeout(() => {
        if (window.thgRoleManager) {
          const checkRoles = setInterval(() => {
            const state = window.thgRoleManager.getState()
            if (state.initialized && state.user) {
              clearInterval(checkRoles)
              updatePortalMenu()
            }
          }, 500)
          window.addEventListener('thg-role-changed', updatePortalMenu)
          window.addEventListener('storage', (e) => {
            if (e.key === 'tharaga_active_role') {
              updatePortalMenu()
            }
          })
          window.__updatePortalMenu = updatePortalMenu
        }
      }, 1000)

      return () => clearTimeout(timeout)
    }
  }, [])

  return (
    <header className="nav">
      <div className="inner">
        {/* Brand and pill in same row - exact match to homepage */}
        <div className="row">
          <Link className="brand" href="/" style={{ fontSize: '26px' }}>
            THARAGA
          </Link>
          <span className="pill" id="home_pill_trust">
            Verified • Broker‑free
          </span>
        </div>
        {/* Navigation with exact spacing - margin-left:auto pushes it right */}
        <nav className="row" aria-label="Primary">
          <span className="menu-group">
            <details className="dropdown">
              <summary>Features</summary>
              <div className="menu" role="menu">
                <Link href="/tools/vastu/">Vastu</Link>
                <Link href="/tools/environment/">Climate &amp; environment</Link>
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
              <div
                className="menu"
                role="menu"
                aria-label="Portal menu"
                id="portal-menu-items"
              >
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
        <Link className="about-mobile-link" href="/about/">
          About
        </Link>
        {/* Right-side auth group is injected by auth script; ensure Features sits near it by letting nav push left via margin-left:auto */}
        <div id="site-header-auth-container"></div>
      </div>
    </header>
  )
})

StaticHeader.displayName = 'StaticHeader'

export default StaticHeader

