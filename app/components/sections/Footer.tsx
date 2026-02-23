'use client'

import React, { useState, FormEvent } from 'react'
import Link from 'next/link'
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Shield,
  Globe,
  MessageCircle,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import { CONTACT_INFO } from '@/lib/contact-info'

export function Footer() {
  const currentYear = new Date().getFullYear()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [subscribeMessage, setSubscribeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleNewsletterSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setSubscribeMessage({ type: 'error', text: 'Please enter a valid email address' })
      return
    }

    setIsSubmitting(true)
    setSubscribeMessage(null)

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'footer' }),
      })

      const data = await response.json()

      if (data.ok) {
        setSubscribeMessage({
          type: 'success',
          text: data.already_subscribed ? 'You are already subscribed!' : 'Successfully subscribed! Check your inbox soon.',
        })
        setEmail('')
      } else {
        setSubscribeMessage({ type: 'error', text: data.error || 'Failed to subscribe. Please try again.' })
      }
    } catch (error) {
      setSubscribeMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const socialLinks = [
    { href: 'https://www.instagram.com/tharaga.co.in?igsh=amY2M3BwNHVoNGV5&utm_source=qr', icon: Instagram, label: 'Instagram' },
    { href: 'https://wa.me/message/YFS5HON7VE4KC1', icon: MessageCircle, label: 'WhatsApp' },
    { href: 'https://facebook.com/tharaga', icon: Facebook, label: 'Facebook' },
    { href: 'https://twitter.com/tharaga', icon: Twitter, label: 'Twitter' },
    { href: 'https://linkedin.com/company/tharaga', icon: Linkedin, label: 'LinkedIn' },
  ]

  const footerSections = [
    {
      title: 'Platform',
      links: [
        { label: 'Builder Dashboard', href: '/builder' },
        { label: 'Property Search', href: '/property-listing' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'Smart Tools', href: '/tools/roi' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'Contact', href: '/contact' },
        { label: 'Help Center', href: '/help' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Refund Policy', href: '/refund' },
        { label: 'Sitemap', href: '/sitemap' },
      ],
    },
  ]

  return (
    <footer className="relative bg-zinc-950 border-t border-zinc-800/50 text-white">
      {/* Newsletter Section */}
      <div className="container-page py-16">
        <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border border-zinc-800 rounded-3xl p-8 md:p-12 overflow-hidden">
          {/* Glow */}
          <div className="absolute top-0 right-0 w-[300px] h-[200px] bg-amber-500/8 rounded-full blur-[80px]" />

          <div className="relative flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full">
                <Mail className="w-3.5 h-3.5" />
                Newsletter
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-2">
                Stay ahead of the market
              </h3>
              <p className="text-zinc-400 text-sm max-w-lg">
                Weekly property insights, market trends, and exclusive deals delivered to your inbox.
              </p>
            </div>

            <div className="w-full lg:w-auto lg:min-w-[380px]">
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 rounded-xl bg-zinc-800/80 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 disabled:opacity-50 text-sm transition-all"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-amber-500 text-zinc-950 rounded-xl font-bold text-sm hover:bg-amber-400 transition-all active:scale-[0.98] shadow-md shadow-amber-500/20 disabled:opacity-50 shrink-0 flex items-center gap-2"
                >
                  {isSubmitting ? 'Sending...' : 'Subscribe'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
              {subscribeMessage && (
                <p className={`mt-3 text-sm ${subscribeMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {subscribeMessage.text}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Grid */}
      <div className="container-page pb-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-8">
          {/* Brand Column */}
          <div className="col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-6 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20">
                <Sparkles className="w-4 h-4 text-zinc-950" />
              </div>
              <span className="text-xl font-extrabold font-display tracking-tight">Tharaga</span>
            </Link>

            <p className="text-zinc-400 text-sm leading-relaxed mb-6 max-w-sm">
              India&apos;s first AI-powered zero-commission real estate platform. Connect directly with verified builders and build real wealth.
            </p>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-2 mb-6">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">RERA Verified</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-semibold text-blue-400">5+ Languages</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center transition-all hover:scale-105 text-zinc-500 hover:text-zinc-300"
                  aria-label={`Follow us on ${social.label}`}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors inline-flex items-center gap-1 group/link"
                    >
                      {link.label}
                      <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Bar */}
      <div className="container-page pb-8">
        <div className="grid sm:grid-cols-3 gap-4 py-6 border-t border-zinc-800/60">
          <a href={`mailto:${CONTACT_INFO.email}`} className="flex items-center gap-3 group/contact">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover/contact:border-amber-500/30 transition-colors">
              <Mail className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium">Email</p>
              <p className="text-sm text-zinc-300 group-hover/contact:text-zinc-100 transition-colors">{CONTACT_INFO.email}</p>
            </div>
          </a>

          <a href={`tel:${CONTACT_INFO.phoneTel}`} className="flex items-center gap-3 group/contact">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover/contact:border-amber-500/30 transition-colors">
              <Phone className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium">Phone</p>
              <p className="text-sm text-zinc-300 group-hover/contact:text-zinc-100 transition-colors">{CONTACT_INFO.phone}</p>
            </div>
          </a>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium">Address</p>
              <p className="text-sm text-zinc-400">{CONTACT_INFO.address}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-zinc-800/40">
        <div className="container-page py-5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-zinc-600">
            &copy; {currentYear} Tharaga. All rights reserved. Built with love in India.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Privacy</Link>
            <Link href="/terms" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Terms</Link>
            <Link href="/cookies" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
