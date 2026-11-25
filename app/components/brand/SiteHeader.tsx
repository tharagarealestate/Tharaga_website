'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { Bookmark, ClipboardList, LogOut, Phone, Plus, User } from 'lucide-react'
import { TharagaWordmark } from './TharagaWordmark'
import { Grain } from '@/components/portfolio/primitives'
import { DESK_PHONE_DISPLAY, telLink, whatsappLink } from '@/lib/mandates'
import { useAuthUser, type AuthUser } from '@/lib/useAuthUser'
import { useShortlist } from '@/lib/useShortlist'
import { openAuthModal } from '@/components/auth/AuthModal'

const NAV = [
  { label: 'Properties', href: '/properties' },
  { label: 'Land Check', href: '/feasibility' },
  { label: 'About', href: '/about' },
]

const EASE = [0.22, 1, 0.36, 1] as const

function Avatar({ user, size = 34 }: { user: AuthUser; size?: number }) {
  if (user.avatarUrl) {
    return (
      <Image
        src={user.avatarUrl}
        alt=""
        width={size}
        height={size}
        unoptimized
        referrerPolicy="no-referrer"
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <span
      className="flex items-center justify-center rounded-full bg-[#B0834A] font-sans font-semibold text-[#FBF8F2]"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {user.initials}
    </span>
  )
}

/**
 * One header for every page. Transparent over a dark masthead, then a solid ivory bar once
 * the visitor scrolls. A single row: navigation · logo · account and the one primary action.
 */
export function SiteHeader({ onListProperty }: { onListProperty?: () => void }) {
  const pathname = usePathname()
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { user, signOut } = useAuthUser()
  const shortlist = useShortlist()
  useMotionValueEvent(scrollY, 'change', v => setScrolled(v > 40))
  const dark = open || !scrolled

  // Close the account menu on outside click / Escape; lock the page under the mobile menu.
  useEffect(() => {
    if (!menu) return
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menu])
  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : ''
    return () => {
      document.documentElement.style.overflow = ''
    }
  }, [open])

  const list = () => {
    setOpen(false)
    setMenu(false)
    if (onListProperty) onListProperty()
    else window.location.href = '/?list=1'
  }
  const statusHref = pathname === '/' ? '#status' : '/#status'
  const textTone = dark ? 'text-[#F7F3EC]/85 hover:text-[#F7F3EC]' : 'text-[#2E3648] hover:text-[#15213A]'

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,border-color] duration-500 ${
          dark
            ? 'border-b border-white/0 bg-gradient-to-b from-[#0B1220]/60 to-transparent'
            : 'border-b border-[#B0834A]/20 bg-[#F7F3EC]/95 shadow-[0_8px_30px_-22px_rgba(21,33,58,0.45)] backdrop-blur-md'
        }`}
      >
        <div className={`mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-4 transition-[height] duration-500 sm:px-8 ${scrolled ? 'h-16' : 'h-[84px]'}`}>
          {/* Left: navigation (desktop) / menu (mobile) */}
          <nav aria-label="Main" className="hidden items-center gap-9 lg:flex">
            {NAV.map(l => {
              const active = pathname?.startsWith(l.href)
              return (
                <Link
                  key={l.label}
                  href={l.href}
                  className={`group/nav relative py-2 font-sans text-[11.5px] font-medium uppercase tracking-[0.2em] transition-colors duration-300 ${textTone}`}
                >
                  {l.label}
                  <span
                    className={`absolute inset-x-0 bottom-0 h-px origin-left bg-[#B0834A] transition-transform duration-500 ${
                      active ? 'scale-x-100' : 'scale-x-0 group-hover/nav:scale-x-100'
                    }`}
                  />
                </Link>
              )
            })}
          </nav>
          <button
            onClick={() => setOpen(o => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="-ml-2 flex h-11 w-11 flex-col items-center justify-center gap-[6px] justify-self-start lg:hidden"
          >
            {[0, 1].map(i => (
              <span
                key={i}
                className={`block h-[1.5px] w-6 transition-all duration-500 ${dark ? 'bg-[#F7F3EC]' : 'bg-[#15213A]'} ${
                  open ? (i === 0 ? 'translate-y-[3.75px] rotate-45' : '-translate-y-[3.75px] -rotate-45') : ''
                }`}
              />
            ))}
          </button>

          {/* Centre: logo */}
          <Link href="/" aria-label="Tharaga Estates — home" className="justify-self-center">
            <TharagaWordmark tone={dark ? 'ivory' : 'navy'} height={scrolled ? 46 : 60} priority />
          </Link>

          {/* Right: account + primary action */}
          <div className="flex items-center justify-self-end gap-3 sm:gap-5">
            {user ? (
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => setMenu(m => !m)}
                  aria-haspopup="menu"
                  aria-expanded={menu}
                  aria-label="Your account"
                  className={`relative flex items-center rounded-full p-[3px] ring-1 transition ${
                    dark ? 'ring-white/40 hover:ring-white/80' : 'ring-[#B0834A]/50 hover:ring-[#B0834A]'
                  }`}
                >
                  <Avatar user={user} size={32} />
                  {shortlist.items.length > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#15213A] px-1 font-sans text-[10px] font-semibold text-[#F7F3EC] ring-2 ring-[#F7F3EC]">
                      {shortlist.items.length}
                    </span>
                  )}
                </button>
                <AnimatePresence>
                  {menu && (
                    <motion.div
                      role="menu"
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.22, ease: EASE }}
                      className="absolute right-0 top-[calc(100%+12px)] w-[280px] origin-top-right border border-[#B0834A]/25 bg-[#FBF8F2] text-left shadow-[0_30px_60px_-25px_rgba(14,23,41,0.45)]"
                    >
                      <div className="flex items-center gap-3 border-b border-[#E4DACA] p-4">
                        <Avatar user={user} size={40} />
                        <div className="min-w-0">
                          <p className="truncate font-sans text-[14px] font-semibold text-[#15213A]">{user.name}</p>
                          <p className="truncate font-sans text-[12px] text-[#5F6575]">{user.email}</p>
                        </div>
                      </div>
                      <div className="p-1.5">
                        {[
                          { href: '/properties?shortlist=1', icon: Bookmark, label: 'My shortlist', meta: shortlist.items.length || '' },
                          { href: statusHref, icon: ClipboardList, label: 'My listings & status', meta: '' },
                        ].map(it => (
                          <Link
                            key={it.label}
                            role="menuitem"
                            href={it.href}
                            onClick={() => setMenu(false)}
                            className="flex items-center gap-3 px-3 py-2.5 font-sans text-[13.5px] text-[#2E3648] transition-colors hover:bg-[#EFE8DC] hover:text-[#15213A]"
                          >
                            <it.icon className="h-4 w-4 text-[#94643A]" />
                            <span className="flex-1">{it.label}</span>
                            {it.meta !== '' && <span className="font-sans text-[12px] text-[#5F6575]">{it.meta}</span>}
                          </Link>
                        ))}
                        <button
                          role="menuitem"
                          onClick={list}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-left font-sans text-[13.5px] text-[#2E3648] transition-colors hover:bg-[#EFE8DC] hover:text-[#15213A]"
                        >
                          <Plus className="h-4 w-4 text-[#94643A]" /> List a property
                        </button>
                      </div>
                      <div className="border-t border-[#E4DACA] p-1.5">
                        <button
                          role="menuitem"
                          onClick={async () => {
                            setMenu(false)
                            await signOut()
                          }}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-left font-sans text-[13.5px] text-[#5F6575] transition-colors hover:bg-[#EFE8DC] hover:text-[#15213A]"
                        >
                          <LogOut className="h-4 w-4" /> Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => openAuthModal()}
                aria-label="Sign in"
                className={`flex h-11 items-center gap-2 font-sans text-[11.5px] font-medium uppercase tracking-[0.2em] transition-colors ${textTone}`}
              >
                <User className="h-[18px] w-[18px]" strokeWidth={1.6} />
                <span className="hidden sm:inline">Sign in</span>
              </button>
            )}
            <button
              onClick={list}
              className={`hidden h-10 items-center gap-2 px-5 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors duration-300 md:inline-flex ${
                dark ? 'bg-[#F7F3EC] text-[#15213A] hover:bg-white' : 'bg-[#15213A] text-[#F7F3EC] hover:bg-[#0E1729]'
              }`}
            >
              List property
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            data-lenis-prevent
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.6, ease: EASE }}
            className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-[#15213A] px-6 pb-10 pt-28 text-[#F7F3EC] lg:hidden"
          >
            <Grain opacity={0.08} />
            <ul className="relative space-y-1">
              {[{ label: 'Home', href: '/' }, ...NAV].map((l, i) => (
                <motion.li key={l.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.06, duration: 0.5 }}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between border-b border-white/10 py-4 font-display text-[1.7rem] tracking-[0.04em] text-[#F7F3EC] hover:text-[#E6C9A0]"
                  >
                    {l.label}
                    <span aria-hidden className="text-base text-[#D9AE78]">→</span>
                  </Link>
                </motion.li>
              ))}
            </ul>

            <div className="relative mt-8 space-y-3">
              <button onClick={list} className="flex h-12 w-full items-center justify-center bg-[#F7F3EC] font-sans text-[12px] font-semibold uppercase tracking-[0.18em] text-[#15213A]">
                List your property
              </button>
              <a
                href={whatsappLink('the Tharaga portfolio')}
                target="_blank"
                rel="noreferrer"
                className="flex h-12 w-full items-center justify-center border border-[#E6C9A0]/50 font-sans text-[12px] font-semibold uppercase tracking-[0.18em] text-[#F7F3EC] hover:text-[#F7F3EC]"
              >
                WhatsApp the desk
              </a>
            </div>

            <div className="relative mt-8 border-t border-white/10 pt-6">
              {user ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar user={user} size={40} />
                    <div className="min-w-0">
                      <p className="truncate font-sans text-[15px] font-semibold text-[#F7F3EC]">{user.name}</p>
                      <p className="truncate font-sans text-[12.5px] text-white/60">{user.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/properties?shortlist=1" onClick={() => setOpen(false)} className="border border-white/15 px-3 py-3 font-sans text-[13px] text-[#F7F3EC] hover:text-[#F7F3EC]">
                      My shortlist {shortlist.items.length ? `· ${shortlist.items.length}` : ''}
                    </Link>
                    <Link href={statusHref} onClick={() => setOpen(false)} className="border border-white/15 px-3 py-3 font-sans text-[13px] text-[#F7F3EC] hover:text-[#F7F3EC]">
                      My listings
                    </Link>
                  </div>
                  <button onClick={() => { setOpen(false); signOut() }} className="font-sans text-[13px] text-white/60">
                    Sign out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setOpen(false)
                    openAuthModal()
                  }}
                  className="flex items-center gap-3 font-sans text-[14px] text-[#F7F3EC]"
                >
                  <User className="h-5 w-5 text-[#D9AE78]" strokeWidth={1.6} /> Sign in to save properties and track listings
                </button>
              )}
              <a href={telLink} className="mt-6 flex items-center gap-3 font-sans text-[14px] text-[#E6C9A0] hover:text-[#F7F3EC]">
                <Phone className="h-4 w-4" /> {DESK_PHONE_DISPLAY}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

const FOOTER_LINKS = [
  { label: 'All properties', href: '/properties' },
  { label: 'Land Check', href: '/feasibility' },
  { label: 'List a property', href: '/?list=1' },
  { label: 'About', href: '/about' },
]
const LEGAL = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Refunds', href: '/refund' },
]

export function SiteFooter() {
  const linkCls = 'font-sans text-[14px] text-white/70 transition-colors hover:text-[#F7F3EC]'
  return (
    <footer className="relative isolate overflow-hidden bg-[#0E1729] pb-10 pt-16 text-white/70 sm:pt-20">
      {/* Warm horizon glow, echoing the hero */}
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[28rem] w-[min(68rem,140vw)] -translate-x-1/2 -translate-y-[38%] rounded-full bg-[radial-gradient(closest-side,rgba(255,196,128,0.26),rgba(176,131,74,0.12)_55%,transparent)] blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 right-[-10%] -z-10 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(closest-side,rgba(176,131,74,0.18),transparent)] blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#E6C9A0]/45 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <div className="grid gap-12 text-center md:grid-cols-12 md:items-start md:gap-10 md:text-left">
          <div className="flex flex-col items-center md:col-span-5 md:items-start">
            <span className="md:hidden"><TharagaWordmark tone="ivory" variant="full" height={112} /></span>
            <span className="hidden md:block"><TharagaWordmark tone="ivory" variant="full" height={136} /></span>
            <p className="mt-5 max-w-sm font-serif text-[1.15rem] leading-relaxed text-white/70">
              Land, energy, quarries and city property across Tamil Nadu — represented directly by the Tharaga desk.
            </p>
          </div>

          <nav aria-label="Footer" className="mx-auto grid w-full max-w-sm grid-cols-2 gap-8 border-y border-white/10 py-8 md:col-span-4 md:mx-0 md:max-w-none md:border-0 md:py-0 md:pt-3">
            <div>
              <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D9AE78]">Explore</p>
              <ul className="mt-4 space-y-3">
                {FOOTER_LINKS.map(l => (
                  <li key={l.label}><Link href={l.href} className={linkCls}>{l.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D9AE78]">Legal</p>
              <ul className="mt-4 space-y-3">
                {LEGAL.map(l => (
                  <li key={l.label}><Link href={l.href} className={linkCls}>{l.label}</Link></li>
                ))}
              </ul>
            </div>
          </nav>

          <div className="flex flex-col items-center md:col-span-3 md:items-start md:pt-3">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D9AE78]">The desk</p>
            <a href={telLink} className="mt-4 block font-display text-[1.4rem] tracking-[0.04em] text-[#F7F3EC] hover:text-[#E6C9A0]">
              {DESK_PHONE_DISPLAY}
            </a>
            <a
              href={whatsappLink('the Tharaga portfolio')}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex h-11 items-center border border-[#E6C9A0]/40 px-5 font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-[#F0DDBF] transition-colors hover:border-[#E6C9A0] hover:bg-[#E6C9A0] hover:text-[#15213A]"
            >
              Message on WhatsApp
            </a>
            <p className="mt-4 font-sans text-[13px] text-white/55">Chennai, Tamil Nadu</p>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-6 text-center font-sans text-[12px] text-white/50 sm:flex-row sm:text-left">
          <span>© {new Date().getFullYear()} Tharaga Estates. All rights reserved.</span>
          <span className="tracking-[0.18em] uppercase">tharaga.in</span>
        </div>
      </div>
    </footer>
  )
}
