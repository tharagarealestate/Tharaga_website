'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  label: string
  href: string
  subItems?: { label: string; href: string }[]
}

interface ResponsiveHeaderProps {
  logoSrc?: string
  logoText?: string
  logoHref?: string
  navItems?: NavItem[]
  onUserIconClick?: () => void
  showUserIcon?: boolean
  className?: string
}

export default function ResponsiveHeader({
  logoSrc,
  logoText = 'Tharaga',
  logoHref = '/',
  navItems = [],
  onUserIconClick,
  showUserIcon = true,
  className = ''
}: ResponsiveHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())
  const pathname = usePathname()

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  // Close menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const toggleSubmenu = (index: number) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedItems(newExpanded)
  }

  const handleUserIconClick = () => {
    if (onUserIconClick) {
      onUserIconClick()
    }
  }

  return (
    <>
      {/* Header */}
      <header
        className={`sticky top-0 z-50 w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 ${className}`}
        role="banner"
      >
        <div className="flex items-center justify-between h-16 px-4 md:px-6">
          {/* Left Section: Logo & Branding (20% width on desktop) */}
          <div className="flex items-center w-auto md:w-1/5">
            <Link
              href={logoHref}
              className="flex items-center transition-opacity duration-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-lg"
              aria-label="Go to homepage"
            >
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt={`${logoText} logo`}
                  className="h-8 w-auto md:h-10"
                  style={{ maxWidth: '140px' }}
                />
              ) : (
                <span className="text-2xl md:text-[28px] font-bold text-white whitespace-nowrap">
                  {logoText}
                </span>
              )}
            </Link>
          </div>

          {/* Center Section: Desktop Navigation (Hidden on Mobile) */}
          <nav
            className="hidden md:flex items-center justify-center flex-1"
            aria-label="Primary navigation"
          >
            <ul className="flex items-center gap-8">
              {navItems.map((item, index) => (
                <li key={index}>
                  <Link
                    href={item.href}
                    className="text-[14px] md:text-[16px] font-normal text-slate-200 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 rounded px-2 py-1"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Right Section: User Utilities & Hamburger Menu (40% width on desktop) */}
          <div className="flex items-center justify-end gap-4 w-auto md:w-2/5">
            {/* User Account Icon - Show only on mobile if showUserIcon is true */}
            {showUserIcon && (
              <button
                onClick={handleUserIconClick}
                className="md:hidden flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full transition-all duration-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                aria-label="User account"
              >
                <User
                  className="w-5 h-5 md:w-6 md:h-6 text-white"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </button>
            )}

            {/* Hamburger Menu Button - Mobile Only */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg transition-all duration-200 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
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
                    <Menu className="w-6 h-6 md:w-7 md:h-7 text-amber-500" aria-hidden="true" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            {/* Desktop User Icon */}
            {showUserIcon && (
              <button
                onClick={handleUserIconClick}
                className="hidden md:flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full transition-all duration-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                aria-label="User account"
              >
                <User
                  className="w-5 h-5 md:w-6 md:h-6 text-white"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay & Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black z-40 md:hidden"
              onClick={toggleMobileMenu}
              aria-hidden="true"
            />

            {/* Mobile Menu Sidebar */}
            <motion.div
              id="mobile-menu"
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
              <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700/50">
                <span className="text-xl font-bold text-white">Menu</span>
                <button
                  onClick={toggleMobileMenu}
                  className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full transition-all duration-200 hover:bg-white/5"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6 text-white" aria-hidden="true" />
                </button>
              </div>

              {/* Menu Items */}
              <nav className="py-6 px-4" aria-label="Mobile navigation">
                <ul className="space-y-2">
                  {navItems.map((item, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: index * 0.05,
                        duration: 0.3
                      }}
                    >
                      {item.subItems ? (
                        <>
                          <button
                            onClick={() => toggleSubmenu(index)}
                            className="w-full flex items-center justify-between px-4 py-3 text-base font-medium text-white rounded-lg hover:bg-white/5 transition-all duration-200 active:scale-[0.98]"
                          >
                            <span>{item.label}</span>
                            <motion.svg
                              animate={{ rotate: expandedItems.has(index) ? 90 : 0 }}
                              transition={{ duration: 0.3 }}
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </motion.svg>
                          </button>

                          <AnimatePresence>
                            {expandedItems.has(index) && (
                              <motion.ul
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="ml-4 mt-2 space-y-1 overflow-hidden"
                              >
                                {item.subItems.map((subItem, subIndex) => (
                                  <motion.li
                                    key={subIndex}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: subIndex * 0.05 }}
                                  >
                                    <Link
                                      href={subItem.href}
                                      className="block px-4 py-2 text-sm text-slate-300 rounded-lg hover:bg-white/5 hover:text-white transition-all duration-200 active:scale-[0.98]"
                                      onClick={toggleMobileMenu}
                                    >
                                      {subItem.label}
                                    </Link>
                                  </motion.li>
                                ))}
                              </motion.ul>
                            )}
                          </AnimatePresence>
                        </>
                      ) : (
                        <Link
                          href={item.href}
                          className="block px-4 py-3 text-base font-medium text-white rounded-lg hover:bg-white/5 transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onClick={toggleMobileMenu}
                        >
                          {item.label}
                        </Link>
                      )}
                    </motion.li>
                  ))}
                </ul>
              </nav>

              {/* Menu Footer (Optional) */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: navItems.length * 0.05 + 0.1 }}
                  className="text-center text-sm text-slate-400"
                >
                  &copy; {new Date().getFullYear()} {logoText}
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
