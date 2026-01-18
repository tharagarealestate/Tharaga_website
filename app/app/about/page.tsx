'use client'

import Breadcrumb from '@/components/Breadcrumb'
import { Check, Building2, Users, Shield, FileText, MessageSquare, BarChart3, Zap } from 'lucide-react'
import { PageWrapper } from '@/components/ui/PageWrapper'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { PremiumButton } from '@/components/ui/premium-button'
import { DESIGN_TOKENS } from '@/lib/design-system'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <PageWrapper>
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'About' }
      ]} />

      {/* Hero Section */}
      <PageHeader
        title={
          <>
            The Operating System for
            <span className="block mt-2 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 bg-clip-text text-transparent">
              Tamil Nadu Real Estate
            </span>
          </>
        }
        description="Tharaga is a broker-free real estate platform that behaves like an operations layer for builders and an assurance layer for buyers—not just a CRM or listing site."
        className="text-center mb-12"
      >
        <div className={`inline-flex items-center gap-2 px-4 py-2 ${DESIGN_TOKENS.colors.background.card} backdrop-blur-sm border ${DESIGN_TOKENS.effects.border.amberClass} rounded-full mb-6`}>
          <span className={`w-2 h-2 ${DESIGN_TOKENS.colors.text.accent} rounded-full animate-pulse`} />
          <span className={`${DESIGN_TOKENS.colors.text.accent} text-sm font-medium`}>
            Tamil Nadu • Broker-Free • AI-Powered
          </span>
        </div>
      </PageHeader>

      {/* For Builders Section */}
      <SectionWrapper
        title="For Builders: From Leads to Closings"
        description="Tharaga plugs directly into a builder's day-to-day work"
        className="mb-12"
      >
        <div className='grid lg:grid-cols-3 gap-8'>
          {/* Card 1: Serious Buyers */}
          <GlassCard variant="dark" glow border className="p-8 group hover:scale-105 transition-transform">
            <div className={`w-14 h-14 rounded-2xl ${DESIGN_TOKENS.colors.background.card} border ${DESIGN_TOKENS.effects.border.amberClass} flex items-center justify-center mb-6`}>
              <Shield className={`w-7 h-7 ${DESIGN_TOKENS.colors.text.accent}`} />
            </div>
            <h3 className={`${DESIGN_TOKENS.typography.h3} mb-4`}>Serious buyers only</h3>
            <p className={`${DESIGN_TOKENS.colors.text.secondary} leading-relaxed mb-6`}>
              Every inquiry is OTP-verified and filtered by budget, location, and intent before it reaches the builder. No raw lead dumps.
            </p>
            <div className={`flex items-center gap-2 ${DESIGN_TOKENS.colors.semantic.success}`}>
              <Check className='w-5 h-5' />
              <span className='text-sm font-semibold'>Verified & Filtered</span>
            </div>
          </GlassCard>

          {/* Card 2: Operational Workflows */}
          <GlassCard variant="gold" glow border className="p-8 group hover:scale-105 transition-transform">
            <div className={`w-14 h-14 rounded-2xl ${DESIGN_TOKENS.colors.background.card} border-2 ${DESIGN_TOKENS.effects.border.amberClass} flex items-center justify-center mb-6`}>
              <BarChart3 className={`w-7 h-7 ${DESIGN_TOKENS.colors.text.accent}`} />
            </div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-amber-600 to-amber-500 text-slate-900 text-xs font-bold rounded-full mb-4`}>
              <Zap className='w-3 h-3' />
              OPERATIONAL EXCELLENCE
            </div>
            <h3 className={`${DESIGN_TOKENS.typography.h3} mb-4`}>Operational workflows, not spreadsheets</h3>
            <p className={`${DESIGN_TOKENS.colors.text.secondary} leading-relaxed mb-6`}>
              Site visits, follow-ups, WhatsApp conversations, and document sharing all run through Tharaga so teams execute the same way, every time.
            </p>
            <div className={`flex items-center gap-2 ${DESIGN_TOKENS.colors.semantic.success}`}>
              <Check className='w-5 h-5' />
              <span className='text-sm font-semibold'>Standardized Processes</span>
            </div>
          </GlassCard>

          {/* Card 3: Legal & Trust */}
          <GlassCard variant="dark" glow border className="p-8 group hover:scale-105 transition-transform">
            <div className={`w-14 h-14 rounded-2xl ${DESIGN_TOKENS.colors.background.card} border-2 ${DESIGN_TOKENS.effects.border.amberClass} flex items-center justify-center mb-6`}>
              <FileText className={`w-7 h-7 ${DESIGN_TOKENS.colors.semantic.success}`} />
            </div>
            <h3 className={`${DESIGN_TOKENS.typography.h3} mb-4`}>Legal and trust built-in</h3>
            <p className={`${DESIGN_TOKENS.colors.text.secondary} leading-relaxed mb-6`}>
              Properties can be paired with lawyer-verified document sets and clear checklists, turning a chaotic handover into a repeatable process.
            </p>
            <div className={`flex items-center gap-2 ${DESIGN_TOKENS.colors.semantic.success}`}>
              <Check className='w-5 h-5' />
              <span className='text-sm font-semibold'>Lawyer-Verified</span>
            </div>
          </GlassCard>
        </div>

        <div className='mt-12 max-w-4xl mx-auto'>
          <GlassCard variant="dark" glow border className="p-8">
            <p className={`${DESIGN_TOKENS.typography.bodyLarge} leading-relaxed text-center`}>
              Instead of running 10 disconnected tools, a builder runs Tharaga as the single system that standardizes how projects are launched, marketed, and closed.
            </p>
          </GlassCard>
        </div>
      </SectionWrapper>

      {/* For Buyers Section */}
      <SectionWrapper
        title="For Buyers: Confidence Instead of Confusion"
        className="mb-12"
      >
        <div className='grid lg:grid-cols-3 gap-8'>
          {/* Card 1: Verified Projects */}
          <GlassCard variant="dark" glow border className="p-8 group hover:scale-105 transition-transform">
            <div className={`w-14 h-14 rounded-2xl ${DESIGN_TOKENS.colors.background.card} border ${DESIGN_TOKENS.effects.border.amberClass} flex items-center justify-center mb-6`}>
              <Shield className={`w-7 h-7 ${DESIGN_TOKENS.colors.text.accent}`} />
            </div>
            <h3 className={`${DESIGN_TOKENS.typography.h3} mb-4`}>Verified projects and builders</h3>
            <p className={`${DESIGN_TOKENS.colors.text.secondary} leading-relaxed mb-6`}>
              Profiles, documents, and project data are structured and surfaced so families can quickly understand where they&apos;re putting their life savings.
            </p>
            <div className={`flex items-center gap-2 ${DESIGN_TOKENS.colors.semantic.success}`}>
              <Check className='w-5 h-5' />
              <span className='text-sm font-semibold'>Transparent Data</span>
            </div>
          </GlassCard>

          {/* Card 2: Context Not Pressure */}
          <GlassCard variant="gold" glow border className="p-8 group hover:scale-105 transition-transform">
            <div className={`w-14 h-14 rounded-2xl ${DESIGN_TOKENS.colors.background.card} border-2 ${DESIGN_TOKENS.effects.border.amberClass} flex items-center justify-center mb-6`}>
              <Users className={`w-7 h-7 ${DESIGN_TOKENS.colors.text.accent}`} />
            </div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-amber-600 to-amber-500 text-slate-900 text-xs font-bold rounded-full mb-4`}>
              <Zap className='w-3 h-3' />
              BUYER FOCUSED
            </div>
            <h3 className={`${DESIGN_TOKENS.typography.h3} mb-4`}>Context, not pressure</h3>
            <p className={`${DESIGN_TOKENS.colors.text.secondary} leading-relaxed mb-6`}>
              Cinematic walkthroughs, locality insights, and finance helpers give buyers clarity before they ever speak to a sales person.
            </p>
            <div className={`flex items-center gap-2 ${DESIGN_TOKENS.colors.semantic.success}`}>
              <Check className='w-5 h-5' />
              <span className='text-sm font-semibold'>Informed Decisions</span>
            </div>
          </GlassCard>

          {/* Card 3: Direct Conversations */}
          <GlassCard variant="dark" glow border className="p-8 group hover:scale-105 transition-transform">
            <div className={`w-14 h-14 rounded-2xl ${DESIGN_TOKENS.colors.background.card} border-2 ${DESIGN_TOKENS.effects.border.amberClass} flex items-center justify-center mb-6`}>
              <MessageSquare className={`w-7 h-7 ${DESIGN_TOKENS.colors.semantic.success}`} />
            </div>
            <h3 className={`${DESIGN_TOKENS.typography.h3} mb-4`}>Direct, traceable conversations</h3>
            <p className={`${DESIGN_TOKENS.colors.text.secondary} leading-relaxed mb-6`}>
              Buyers talk to builders over secure, logged channels so promises and pricing don&apos;t &quot;get lost&quot; in the broker chain.
            </p>
            <div className={`flex items-center gap-2 ${DESIGN_TOKENS.colors.semantic.success}`}>
              <Check className='w-5 h-5' />
              <span className='text-sm font-semibold'>Secure & Logged</span>
            </div>
          </GlassCard>
        </div>

        <div className='mt-12 max-w-4xl mx-auto'>
          <GlassCard variant="dark" glow border className="p-8">
            <p className={`${DESIGN_TOKENS.typography.bodyLarge} leading-relaxed text-center`}>
              The result: fewer wasted visits, fewer surprises, and a home-buying journey that feels professional instead of chaotic.
            </p>
          </GlassCard>
        </div>
      </SectionWrapper>

      {/* Why Tharaga Exists Section */}
      <SectionWrapper noPadding className="mb-12">
        <div className='max-w-4xl mx-auto'>
          <GlassCard variant="gold" glow border className="p-12 text-center">
            <h2 className={`${DESIGN_TOKENS.typography.h1} mb-6`}>
              Why Tharaga Exists
            </h2>
            <p className={`${DESIGN_TOKENS.typography.bodyLarge} leading-relaxed mb-8`}>
              Tharaga was started in Tamil Nadu after watching families and builders lose time, money, and trust in long broker chains and unstructured sales processes. The belief is simple:
            </p>
            <div className='max-w-2xl mx-auto'>
              <GlassCard variant="dark" glow border className="p-8 mb-8">
                <p className={`text-2xl font-bold ${DESIGN_TOKENS.colors.text.primary} leading-relaxed`}>
                  If the operations of real estate become transparent, standardized, and data-driven, trust will follow.
                </p>
              </GlassCard>
              <p className={`${DESIGN_TOKENS.typography.body} leading-relaxed`}>
                By <strong className={DESIGN_TOKENS.colors.text.accent}>2035</strong>, Tharaga aims to be the default operational layer for new-home sales in Tamil Nadu—where every serious project and every serious buyer eventually passes through the same reliable rails.
              </p>
            </div>
          </GlassCard>
        </div>
      </SectionWrapper>

      {/* Final CTA */}
      <SectionWrapper noPadding className="mb-12">
        <div className='max-w-4xl mx-auto'>
          <GlassCard variant="dark" glow border className="p-12 text-center">
            <h2 className={`${DESIGN_TOKENS.typography.h1} mb-4`}>
              Ready to Transform Real Estate?
            </h2>
            <p className={`${DESIGN_TOKENS.typography.bodyLarge} mb-8`}>
              Join builders and buyers who trust Tharaga for transparent, broker-free real estate operations.
            </p>
            <div className='flex flex-wrap gap-4 justify-center'>
              <PremiumButton variant="gold" size="lg" asChild>
                <a href='https://docs.google.com/forms/d/e/1FAIpQLScVrrMf7voKVXGz9d2giOje_p-nyt9yEdxJgWkVc0Mc1-PN1Q/viewform?usp=sharing'>
                  List My Project
                  <Building2 className='w-5 h-5 ml-2' />
                </a>
              </PremiumButton>
              <PremiumButton variant="secondary" size="lg" asChild>
                <a href='https://tharaga.co.in/verified-property-listings'>
                  Explore Verified Homes
                  <Users className='w-5 h-5 ml-2' />
                </a>
              </PremiumButton>
            </div>
          </GlassCard>
        </div>
      </SectionWrapper>
    </PageWrapper>
  )
}
