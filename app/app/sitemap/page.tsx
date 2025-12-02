'use client'

import React from 'react'
import Link from 'next/link'
import { Map, Home, Building2, Users, DollarSign, FileText, HelpCircle, Settings } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'

export default function SitemapPage() {
  const sections = [
    {
      title: 'Main Pages',
      icon: <Home className="w-5 h-5" />,
      links: [
        { href: '/', label: 'Home' },
        { href: '/about', label: 'About Us' },
        { href: '/pricing', label: 'Pricing' },
        { href: '/contact', label: 'Contact' }
      ]
    },
    {
      title: 'For Builders',
      icon: <Building2 className="w-5 h-5" />,
      links: [
        { href: '/builder', label: 'Builder Dashboard' },
        { href: '/builder/properties', label: 'My Properties' },
        { href: '/builder/leads', label: 'Leads Management' },
        { href: '/builder/analytics', label: 'Analytics' },
        { href: '/builder/settings', label: 'Builder Settings' },
        { href: '/builders/add-property', label: 'Add Property' }
      ]
    },
    {
      title: 'For Buyers',
      icon: <Users className="w-5 h-5" />,
      links: [
        { href: '/my-dashboard', label: 'Buyer Dashboard' },
        { href: '/property-listing', label: 'Property Search' },
        { href: '/saved', label: 'Saved Properties' },
        { href: '/buyer-form', label: 'Buyer Registration' }
      ]
    },
    {
      title: 'Tools & Features',
      icon: <Settings className="w-5 h-5" />,
      links: [
        { href: '/tools/vastu', label: 'Vastu Analysis' },
        { href: '/tools/environment', label: 'Climate & Environment' },
        { href: '/tools/voice-tamil', label: 'Voice Search (Tamil)' },
        { href: '/tools/verification', label: 'Property Verification' },
        { href: '/tools/roi', label: 'ROI Calculator' },
        { href: '/tools/currency-risk', label: 'Currency Risk Analysis' },
        { href: '/tools/cost-calculator', label: 'Cost Calculator' }
      ]
    },
    {
      title: 'Legal & Support',
      icon: <FileText className="w-5 h-5" />,
      links: [
        { href: '/privacy', label: 'Privacy Policy' },
        { href: '/terms', label: 'Terms of Service' },
        { href: '/refund', label: 'Refund Policy' },
        { href: '/help', label: 'Help Center' },
        { href: '/sitemap', label: 'Sitemap' }
      ]
    },
    {
      title: 'Property Listings',
      icon: <Home className="w-5 h-5" />,
      links: [
        { href: '/property-listing', label: 'Browse Properties' },
        { href: '/properties', label: 'All Properties' },
        { href: '/verified-property-listings', label: 'Verified Listings' }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gold-500 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Sitemap' }
        ]} />

        <div className="max-w-6xl mx-auto mt-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500/20 backdrop-blur-sm border border-gold-500/30 rounded-full mb-6">
              <Map className="w-4 h-4 text-gold-300" />
              <span className="text-gold-300 text-sm font-medium">Site Navigation</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              Sitemap
            </h1>
            <p className="text-xl text-gray-300">
              Find all pages and sections of Tharaga platform
            </p>
          </div>

          {/* Sitemap Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section) => (
              <div
                key={section.title}
                className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gold-500/20 flex items-center justify-center text-gold-300">
                    {section.icon}
                  </div>
                  <h2 className="text-xl font-bold text-white">{section.title}</h2>
                </div>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-white/70 hover:text-gold-400 transition-colors flex items-center gap-2 group"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white/30 group-hover:bg-gold-400 transition-colors" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Additional Information */}
          <div className="mt-12 backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">About This Sitemap</h2>
            <p className="text-white/80 leading-relaxed mb-4">
              This sitemap provides an overview of all major pages and sections available on Tharaga. 
              Use it to navigate through our platform and discover features for builders, buyers, and tools.
            </p>
            <p className="text-white/80 leading-relaxed">
              If you can't find what you're looking for, visit our <Link href="/help" className="text-gold-400 hover:text-gold-300 underline">Help Center</Link> or 
              {' '}<Link href="/contact" className="text-gold-400 hover:text-gold-300 underline">contact our support team</Link>.
            </p>
          </div>

          {/* XML Sitemap Link */}
          <div className="mt-8 text-center">
            <p className="text-white/70 mb-4">For search engines:</p>
            <Link
              href="/sitemap.xml"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-semibold transition-colors"
            >
              <FileText className="w-5 h-5" />
              View XML Sitemap
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

