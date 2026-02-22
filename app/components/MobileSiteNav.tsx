"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, User } from 'lucide-react'
import Link from 'next/link'
import { openAuthModal } from '@/components/auth/AuthModal'

export function MobileSiteNav() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check auth state
  useEffect(() => {
    const checkAuth = () => {
      try {
        const authState = (window as any).__thgAuthState
        setIsAuthenticated(!!(authState && authState.user && authState.user.email))
      } catch {
        setIsAuthenticated(false)
      }
    }

    // Check initially
    checkAuth()

    // Re-check periodically
    const interval = setInterval(checkAuth, 1000)

    return () => clearInterval(interval)
  }, [])

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  const handleUserIconClick = () => {
    try {
      if (isAuthenticated) {
        // Navigate to dashboard if authenticated
        window.location.href = '/my-dashboard'
      } else {
        // Open login modal if not authenticated
        openAuthModal()
      }
    } catch {
      location.href = '/login'
    }
  }

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Properties', href: '/property-listing' },
    { label: 'For Builders', href: '/pricing' },
    { label: 'About', href: '/about' },
    { label: 'Help', href: '/help' },
  ]

  return (
    <>
      {/* Mobile Navigation Controls - Only visible on mobile */}
      <div className="fixed top-4 right-4 z-[2147483000] flex items-center gap-2 md:hidden">
        {/* User Icon Button */}
        <button
          onClick={handleUserIconClick}
          className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full border-2 border-white/90 bg-transparent hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label={isAuthenticated ? "Go to dashboard" : "Sign in"}
        >
          <User className="w-6 h-6 text-white" />
        </button>

        {/* Hamburger Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileMenuOpen}
        >
          <AnimatePresence mode="wait">
            {isMobileMenuOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600"
              >
                <X className="w-6 h-6 text-white" />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Menu className="w-6 h-6 text-amber-500" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Backdrop Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black z-[2147482999] md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Mobile Menu Panel - Slides from RIGHT */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.35, ease: 'easeOut' }}
            className="fixed top-0 right-0 bottom-0 w-[85%] max-w-[320px] bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 shadow-2xl z-[2147483000] overflow-y-auto md:hidden"
          >
            <nav className="flex flex-col p-6 pt-20" role="navigation" aria-label="Mobile navigation">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: index * 0.05,
                    duration: 0.3,
                    ease: 'easeOut'
                  }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-3 px-4 text-white text-lg font-semibold rounded-lg hover:bg-white/10 active:scale-98 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hide default auth button on mobile */}
      <style jsx global>{`
        @media (max-width: 767px) {
          header .thg-auth-wrap,
          .thg-auth-wrap {
            display: none !important;
          }
        }
      `}</style>
    </>
  )
}
