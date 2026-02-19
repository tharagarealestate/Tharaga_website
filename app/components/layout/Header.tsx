'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Menu, X, ChevronDown, Sparkles, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const navLinks = [
  { label: 'Properties', href: '/property-listing' },
  {
    label: 'Tools',
    href: '/tools/roi',
    children: [
      { label: 'ROI Calculator', href: '/tools/roi' },
      { label: 'EMI Calculator', href: '/tools/emi' },
      { label: 'Budget Planner', href: '/tools/budget-planner' },
      { label: 'Loan Eligibility', href: '/tools/loan-eligibility' },
      { label: 'Neighborhood Finder', href: '/tools/neighborhood-finder' },
      { label: 'Property Valuation', href: '/tools/property-valuation' },
    ],
  },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
]

export function Header() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setDropdownOpen(null)
  }, [pathname])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-[100] transition-all duration-200',
        scrolled
          ? 'bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50'
          : 'bg-transparent'
      )}
    >
      <div className="container-page">
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-zinc-950" />
            </div>
            <span className="text-lg font-bold font-display text-zinc-100">
              Tharaga
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <div key={link.label} className="relative">
                {link.children ? (
                  <div
                    className="relative"
                    onMouseEnter={() => setDropdownOpen(link.label)}
                    onMouseLeave={() => setDropdownOpen(null)}
                  >
                    <button
                      className={cn(
                        'flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                        'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                      )}
                    >
                      {link.label}
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    {dropdownOpen === link.label && (
                      <div className="absolute top-full left-0 mt-1 w-56 bg-zinc-900 border border-zinc-800 rounded-xl p-2 shadow-xl animate-scale-in">
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="block px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={link.href}
                    className={cn(
                      'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                      pathname === link.href
                        ? 'text-zinc-100 bg-zinc-800/50'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                    )}
                  >
                    {link.label}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Right side — single Sign In button */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login_signup_glassdrop/">
              <Button variant="primary" size="sm">
                <LogIn className="w-3.5 h-3.5 mr-1.5" />
                Sign In
              </Button>
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-zinc-100"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-zinc-950 border-t border-zinc-800 animate-slide-up">
          <div className="container-page py-4 space-y-1">
            {navLinks.map((link) => (
              <div key={link.label}>
                <Link
                  href={link.href}
                  className="block px-3 py-3 text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-lg"
                >
                  {link.label}
                </Link>
                {link.children && (
                  <div className="pl-4 space-y-1">
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-3 py-2 text-sm text-zinc-500 hover:text-zinc-300 rounded-lg"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-4 border-t border-zinc-800">
              <Link href="/login_signup_glassdrop/">
                <Button variant="primary" size="md" className="w-full">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
