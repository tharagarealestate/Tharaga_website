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
  MessageCircle
} from 'lucide-react'
import { GlassContainer } from '@/components/ui/GlassContainer'

export function Footer() {
  const currentYear = new Date().getFullYear()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [subscribeMessage, setSubscribeMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

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
        body: JSON.stringify({ email, source: 'footer' })
      })

      const data = await response.json()

      if (data.ok) {
        setSubscribeMessage({ 
          type: 'success', 
          text: data.already_subscribed 
            ? 'You are already subscribed!'
            : 'Successfully subscribed! Check your inbox soon.' 
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

  return (
    <footer className="relative bg-gradient-to-b from-section-dark-from to-black text-white pt-20 pb-8">
      {/* Top Section - Newsletter */}
      <div className="container mx-auto px-4 mb-16">
        <GlassContainer intensity="light" className="p-8 md:p-12 max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-4">
            Stay Ahead of the Market
          </h3>
          <p className="text-white/70 mb-8 max-w-2xl mx-auto">
            Get weekly property insights, market trends, and exclusive deals delivered to your inbox
          </p>
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={isSubmitting}
              className="flex-1 px-6 py-4 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              required
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Subscribing...' : 'Subscribe'}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
          {subscribeMessage && (
            <p className={`mt-4 text-sm ${subscribeMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {subscribeMessage.text}
            </p>
          )}
        </GlassContainer>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-6">
              <span className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                Tharaga
              </span>
            </Link>
            <p className="text-white/70 mb-6 leading-relaxed">
              India's first AI-powered zero-commission real estate platform. Connect directly with verified builders and build real wealth.
            </p>
            
            {/* Trust Badges */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg border border-white/20">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-sm font-semibold text-white">RERA Verified</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg border border-white/20">
                <Globe className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-white">5+ Languages</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/tharaga.co.in?igsh=amY2M3BwNHVoNGV5&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors border border-white/20"
                aria-label="Follow us on Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://wa.me/message/YFS5HON7VE4KC1"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors border border-white/20"
                aria-label="Chat with us on WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href="https://facebook.com/tharaga"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors border border-white/20"
                aria-label="Follow us on Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com/tharaga"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors border border-white/20"
                aria-label="Follow us on Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com/company/tharaga"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors border border-white/20"
                aria-label="Follow us on LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-bold text-lg mb-6">Products</h4>
            <ul className="space-y-4">
              <li>
                <Link href="/my-dashboard" className="text-white/70 hover:text-white transition-colors">
                  Buyer Dashboard
                </Link>
              </li>
              <li>
                <Link href="/builder" className="text-white/70 hover:text-white transition-colors">
                  Builder Dashboard
                </Link>
              </li>
              <li>
                <Link href="/property-listing" className="text-white/70 hover:text-white transition-colors">
                  Property Search
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-white/70 hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/tools" className="text-white/70 hover:text-white transition-colors">
                  Features
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-lg mb-6">Company</h4>
            <ul className="space-y-4">
              <li>
                <Link href="/about" className="text-white/70 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-white/70 hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-white/70 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h4 className="font-bold text-lg mb-6">Legal & Support</h4>
            <ul className="space-y-4">
              <li>
                <Link href="/privacy" className="text-white/70 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-white/70 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/refund" className="text-white/70 hover:text-white transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-white/70 hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/sitemap" className="text-white/70 hover:text-white transition-colors">
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 pb-12 border-b border-white/10">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="font-semibold mb-1">Email</p>
              <a href="mailto:hello@tharaga.co.in" className="text-white/70 hover:text-white transition-colors">
                hello@tharaga.co.in
              </a>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="font-semibold mb-1">Phone</p>
              <a href="tel:+919876543210" className="text-white/70 hover:text-white transition-colors">
                +91 98765 43210
              </a>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="font-semibold mb-1">Address</p>
              <p className="text-white/70">
                Chennai, Tamil Nadu, India
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-white/50 text-sm">
          <p>
            © {currentYear} Tharaga. All rights reserved. Built with ❤️ in India.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/cookies" className="hover:text-white transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

