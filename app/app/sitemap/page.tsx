'use client'

import React from 'react'
import Link from 'next/link'
import { Map, Home, Building2, Users, DollarSign, FileText, HelpCircle, Settings } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import { PageWrapper } from '@/components/ui/PageWrapper'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { DESIGN_TOKENS } from '@/lib/design-system'

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
        { href: '/builder', label: 'Builder Dashboard' },
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
        { href: '/tools/emi', label: 'EMI Calculator' },
        { href: '/tools/budget-planner', label: 'Budget Planner' },
        { href: '/tools/loan-eligibility', label: 'Loan Eligibility Calculator' },
        { href: '/tools/neighborhood-finder', label: 'Neighborhood Finder' },
        { href: '/tools/property-valuation', label: 'Property Valuation' },
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
    <PageWrapper>
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Sitemap' }
      ]} />

      <PageHeader
        title="Sitemap"
        description="Find all pages and sections of Tharaga platform"
        className="text-center mb-8"
      >
        <div className={`inline-flex items-center gap-2 px-4 py-2 ${DESIGN_TOKENS.colors.background.card} backdrop-blur-sm border ${DESIGN_TOKENS.effects.border.amberClass} rounded-full mb-6`}>
          <Map className={`w-4 h-4 ${DESIGN_TOKENS.colors.text.accent}`} />
          <span className={`${DESIGN_TOKENS.colors.text.accent} text-sm font-medium`}>Site Navigation</span>
        </div>
      </PageHeader>

      <div className="max-w-6xl mx-auto">

        {/* Sitemap Grid */}
        <SectionWrapper noPadding>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section) => (
              <GlassCard
                key={section.title}
                variant="dark"
                glow
                border
                className="p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-lg ${DESIGN_TOKENS.colors.background.card} flex items-center justify-center ${DESIGN_TOKENS.colors.text.accent}`}>
                    {section.icon}
                  </div>
                  <h2 className={`text-xl font-bold ${DESIGN_TOKENS.colors.text.primary}`}>{section.title}</h2>
                </div>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={`${DESIGN_TOKENS.colors.text.secondary} hover:${DESIGN_TOKENS.colors.text.accent} transition-colors flex items-center gap-2 group`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${DESIGN_TOKENS.colors.text.muted} group-hover:${DESIGN_TOKENS.colors.text.accent} transition-colors`} />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            ))}
          </div>
        </SectionWrapper>

        {/* Additional Information */}
        <SectionWrapper noPadding className="mt-12">
          <GlassCard variant="dark" glow border className="p-8">
            <h2 className={`${DESIGN_TOKENS.typography.h2} mb-4`}>About This Sitemap</h2>
            <p className={`${DESIGN_TOKENS.colors.text.secondary} leading-relaxed mb-4`}>
              This sitemap provides an overview of all major pages and sections available on Tharaga. 
              Use it to navigate through our platform and discover features for builders, buyers, and tools.
            </p>
            <p className={`${DESIGN_TOKENS.colors.text.secondary} leading-relaxed`}>
              If you can't find what you're looking for, visit our <Link href="/help" className={`${DESIGN_TOKENS.colors.text.accent} hover:text-amber-200 underline`}>Help Center</Link> or 
              {' '}<Link href="/contact" className={`${DESIGN_TOKENS.colors.text.accent} hover:text-amber-200 underline`}>contact our support team</Link>.
            </p>
          </GlassCard>
        </SectionWrapper>

        {/* XML Sitemap Link */}
        <SectionWrapper noPadding className="mt-8 text-center">
          <p className={`${DESIGN_TOKENS.colors.text.secondary} mb-4`}>For search engines:</p>
          <Link
            href="/sitemap.xml"
            className={`inline-flex items-center gap-2 px-6 py-3 ${DESIGN_TOKENS.colors.background.card} hover:bg-slate-700/50 border ${DESIGN_TOKENS.colors.border.default} rounded-xl font-semibold transition-colors`}
          >
            <FileText className="w-5 h-5" />
            View XML Sitemap
          </Link>
        </SectionWrapper>
      </div>
    </PageWrapper>
  )
}

