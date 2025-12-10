'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  label: string
  href: string
}

export default function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const pathname = usePathname()

  // Check auth status
  useEffect(() => {
    const checkAuth = () => {
      try {
        // Check if user is authenticated via the auth system
        const authBtn = document.querySelector('.thg-auth-btn')
        const isAuth = authBtn?.classList.contains('is-auth')
        setIsAuthenticated(!!isAuth)
      } catch (error) {
        setIsAuthenticated(false)
      }
    }

    checkAuth()
    // Recheck every second
    const interval = setInterval(checkAuth, 1000)
    return () => clearInterval(interval)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const navItems: NavItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Properties', href: '/property-listing' },
    { label: 'For Builders', href: '/pricing' },
    { label: 'About', href: '/about' },
    { label: 'Help', href: '/help' },
  ]

  const handleUserIconClick = () => {
    try {
      if (isAuthenticated) {
        // If authenticated, go to dashboard
        window.location.href = '/my-dashboard'
      } else {
        // If not authenticated, open login modal
        const next = location.pathname + location.search
        const authGate = (window as any).authGate
        if (authGate && typeof authGate.openLoginModal === 'function') {
          authGate.openLoginModal({ next })
        } else if (typeof (window as any).__thgOpenAuthModal === 'function') {
          ;(window as any).__thgOpenAuthModal({ next })
        } else {
          location.href = `/login?next=${encodeURIComponent(next)}`
        }
      }
    } catch (error) {
      location.href = '/login'
    }
  }

  return (
    <>
      {/* Desktop & Mobile Header */}
      <header className="site-header-present fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-white/[0.06] backdrop-blur-[24px]">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 h-[60px] md:h-[72px] flex items-center justify-between">
          {/* Left: Logo (20% width) */}
          <Link
            href="/"
            className="flex items-center gap-2 group transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-lg"
          >
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] flex items-center justify-center shadow-md">
              <span className="text-base md:text-xl font-bold text-[#0a1628]">T</span>
            </div>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="font-bold text-white text-xs md:text-sm">THARAGA</span>
              <span className="text-[#D4AF37] text-[10px] font-medium">Real Estate</span>
            </div>
          </Link>

          {/* Center: Desktop Navigation (Hidden on mobile) */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            {navItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="text-sm font-medium text-slate-200 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 rounded px-2 py-1"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right: User Icon & Hamburger Menu (40% width) */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* User Account Icon */}
            <button
              onClick={handleUserIconClick}
              className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full border-2 border-white/90 bg-transparent transition-all duration-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              aria-label={isAuthenticated ? 'Go to dashboard' : 'Sign in'}
            >
              <User className="w-5 h-5 md:w-6 md:h-6 text-white" strokeWidth={2} />
            </button>

            {/* Hamburger Menu Button - Mobile Only */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg transition-all duration-200 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600"
                  >
                    <X className="w-6 h-6 text-white" aria-hidden="true" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-6 h-6 text-[#D4AF37]" aria-hidden="true" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay & Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop - 70% opacity */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Menu Panel - Slides from RIGHT */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{
                type: 'tween',
                duration: 0.35,
                ease: 'easeOut'
              }}
              className="fixed top-0 right-0 bottom-0 w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 z-50 overflow-y-auto md:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation menu"
            >
              {/* Menu Header */}
              <div className="flex items-center justify-between h-16 px-4 border-b border-white/[0.06]">
                <span className="text-xl font-bold text-white">Menu</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full transition-all duration-200 hover:bg-white/5"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6 text-white" aria-hidden="true" />
                </button>
              </div>

              <nav className="px-4 py-6 space-y-2">
                {/* Navigation Items - Staggered with 50ms delay */}
                {navItems.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-4 rounded-xl text-base font-medium text-slate-200 hover:text-white hover:bg-white/5 transition-all duration-200 active:scale-[0.98] group hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}

                {/* Login/Dashboard Button */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navItems.length * 0.05 + 0.1, duration: 0.3 }}
                  className="pt-4 border-t border-white/[0.06]"
                >
                  <button
                    onClick={() => {
                      handleUserIconClick()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full px-4 py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0a1628] text-base font-bold hover:shadow-lg transition-all active:scale-[0.98]"
                  >
                    {isAuthenticated ? 'Go to Dashboard' : 'Sign In / Sign Up'}
                  </button>
                </motion.div>
              </nav>

              {/* Menu Footer */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/[0.06] bg-slate-900/50 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: navItems.length * 0.05 + 0.15, duration: 0.3 }}
                  className="text-center text-xs text-slate-400"
                >
                  &copy; {new Date().getFullYear()} THARAGA Real Estate
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
