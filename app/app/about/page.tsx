'use client'

import Breadcrumb from '@/components/Breadcrumb'
import { Check, Building2, Users, Shield, FileText, MessageSquare, BarChart3, Zap } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden'>
      {/* Animated Background Elements */}
      <div className='absolute inset-0 opacity-30'>
        <div className='absolute top-20 left-10 w-96 h-96 bg-gold-500 rounded-full blur-3xl animate-pulse-slow' />
        <div
          className='absolute bottom-20 right-10 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl animate-pulse-slow'
          style={{ animationDelay: '1s' }}
        />
      </div>

      <div className='relative z-10'>
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'About' }
        ]} />

        {/* Hero Section */}
        <section className='container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16'>
          <div className='text-center max-w-4xl mx-auto'>
            {/* Badge */}
            <div className='inline-flex items-center gap-2 px-4 py-2 bg-gold-500/20 backdrop-blur-sm border border-gold-500/30 rounded-full mb-6'>
              <span className='w-2 h-2 bg-gold-500 rounded-full animate-pulse' />
              <span className='text-gold-300 text-sm font-medium'>
                Tamil Nadu • Broker-Free • AI-Powered
              </span>
            </div>

            {/* Headline */}
            <h1 className='font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6'>
              The Operating System for
              <span className='text-gradient-gold block mt-2'>Tamil Nadu Real Estate</span>
            </h1>

            {/* Subheadline */}
            <p className='text-xl sm:text-2xl text-gray-300 leading-relaxed mb-8'>
              Tharaga is a broker-free real estate platform that behaves like an operations layer for builders
              <br className='hidden sm:block' />
              and an assurance layer for buyers—not just a CRM or listing site.
            </p>
          </div>
        </section>

        {/* For Builders Section */}
        <section className='container mx-auto px-4 sm:px-6 lg:px-8 pb-24'>
          <div className='max-w-7xl mx-auto'>
            <div className='text-center mb-12'>
              <h2 className='font-display text-4xl sm:text-5xl font-bold text-white mb-4'>
                For Builders: From Leads to Closings
              </h2>
              <p className='text-xl text-gray-300 max-w-3xl mx-auto'>
                Tharaga plugs directly into a builder&apos;s day-to-day work
              </p>
            </div>

            <div className='grid lg:grid-cols-3 gap-8'>
              {/* Card 1: Serious Buyers */}
              <div className='relative group backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2'>
                <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none' />
                <div className='relative p-8'>
                  <div className='w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-500/20 to-emerald-500/20 border border-gold-500/30 flex items-center justify-center mb-6'>
                    <Shield className='w-7 h-7 text-gold-400' />
                  </div>
                  <h3 className='text-2xl font-bold text-white mb-4'>Serious buyers only</h3>
                  <p className='text-gray-300 leading-relaxed mb-6'>
                    Every inquiry is OTP-verified and filtered by budget, location, and intent before it reaches the builder. No raw lead dumps.
                  </p>
                  <div className='flex items-center gap-2 text-emerald-400'>
                    <Check className='w-5 h-5' />
                    <span className='text-sm font-semibold'>Verified & Filtered</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Operational Workflows */}
              <div className='relative group backdrop-blur-xl bg-white/10 border-2 border-gold-500/50 rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 bg-gradient-to-br from-gold-500/20 to-emerald-500/20 shadow-2xl shadow-gold-500/30'>
                <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none' />
                <div className='relative p-8'>
                  <div className='w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-500/30 to-emerald-500/30 border-2 border-gold-500/50 flex items-center justify-center mb-6'>
                    <BarChart3 className='w-7 h-7 text-gold-300' />
                  </div>
                  <div className='inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-gold-600 to-gold-500 text-primary-950 text-xs font-bold rounded-full shadow-gold mb-4'>
                    <Zap className='w-3 h-3' />
                    OPERATIONAL EXCELLENCE
                  </div>
                  <h3 className='text-2xl font-bold text-white mb-4'>Operational workflows, not spreadsheets</h3>
                  <p className='text-gray-300 leading-relaxed mb-6'>
                    Site visits, follow-ups, WhatsApp conversations, and document sharing all run through Tharaga so teams execute the same way, every time.
                  </p>
                  <div className='flex items-center gap-2 text-emerald-400'>
                    <Check className='w-5 h-5' />
                    <span className='text-sm font-semibold'>Standardized Processes</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Legal & Trust */}
              <div className='relative group backdrop-blur-xl bg-white/10 border-2 border-emerald-500/30 rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2'>
                <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none' />
                <div className='relative p-8'>
                  <div className='w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/30 border-2 border-emerald-500/30 flex items-center justify-center mb-6'>
                    <FileText className='w-7 h-7 text-emerald-400' />
                  </div>
                  <h3 className='text-2xl font-bold text-white mb-4'>Legal and trust built-in</h3>
                  <p className='text-gray-300 leading-relaxed mb-6'>
                    Properties can be paired with lawyer-verified document sets and clear checklists, turning a chaotic handover into a repeatable process.
                  </p>
                  <div className='flex items-center gap-2 text-emerald-400'>
                    <Check className='w-5 h-5' />
                    <span className='text-sm font-semibold'>Lawyer-Verified</span>
                  </div>
                </div>
              </div>
            </div>

            <div className='mt-12 max-w-4xl mx-auto'>
              <div className='backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8'>
                <p className='text-lg text-gray-300 leading-relaxed text-center'>
                  Instead of running 10 disconnected tools, a builder runs Tharaga as the single system that standardizes how projects are launched, marketed, and closed.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* For Buyers Section */}
        <section className='container mx-auto px-4 sm:px-6 lg:px-8 pb-24'>
          <div className='max-w-7xl mx-auto'>
            <div className='text-center mb-12'>
              <h2 className='font-display text-4xl sm:text-5xl font-bold text-white mb-4'>
                For Buyers: Confidence Instead of Confusion
              </h2>
            </div>

            <div className='grid lg:grid-cols-3 gap-8'>
              {/* Card 1: Verified Projects */}
              <div className='relative group backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2'>
                <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none' />
                <div className='relative p-8'>
                  <div className='w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-500/20 to-emerald-500/20 border border-gold-500/30 flex items-center justify-center mb-6'>
                    <Shield className='w-7 h-7 text-gold-400' />
                  </div>
                  <h3 className='text-2xl font-bold text-white mb-4'>Verified projects and builders</h3>
                  <p className='text-gray-300 leading-relaxed mb-6'>
                    Profiles, documents, and project data are structured and surfaced so families can quickly understand where they&apos;re putting their life savings.
                  </p>
                  <div className='flex items-center gap-2 text-emerald-400'>
                    <Check className='w-5 h-5' />
                    <span className='text-sm font-semibold'>Transparent Data</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Context Not Pressure */}
              <div className='relative group backdrop-blur-xl bg-white/10 border-2 border-gold-500/50 rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 bg-gradient-to-br from-gold-500/20 to-emerald-500/20 shadow-2xl shadow-gold-500/30'>
                <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none' />
                <div className='relative p-8'>
                  <div className='w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-500/30 to-emerald-500/30 border-2 border-gold-500/50 flex items-center justify-center mb-6'>
                    <Users className='w-7 h-7 text-gold-300' />
                  </div>
                  <div className='inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-gold-600 to-gold-500 text-primary-950 text-xs font-bold rounded-full shadow-gold mb-4'>
                    <Zap className='w-3 h-3' />
                    BUYER FOCUSED
                  </div>
                  <h3 className='text-2xl font-bold text-white mb-4'>Context, not pressure</h3>
                  <p className='text-gray-300 leading-relaxed mb-6'>
                    Cinematic walkthroughs, locality insights, and finance helpers give buyers clarity before they ever speak to a sales person.
                  </p>
                  <div className='flex items-center gap-2 text-emerald-400'>
                    <Check className='w-5 h-5' />
                    <span className='text-sm font-semibold'>Informed Decisions</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Direct Conversations */}
              <div className='relative group backdrop-blur-xl bg-white/10 border-2 border-emerald-500/30 rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2'>
                <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none' />
                <div className='relative p-8'>
                  <div className='w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/30 border-2 border-emerald-500/30 flex items-center justify-center mb-6'>
                    <MessageSquare className='w-7 h-7 text-emerald-400' />
                  </div>
                  <h3 className='text-2xl font-bold text-white mb-4'>Direct, traceable conversations</h3>
                  <p className='text-gray-300 leading-relaxed mb-6'>
                    Buyers talk to builders over secure, logged channels so promises and pricing don&apos;t &quot;get lost&quot; in the broker chain.
                  </p>
                  <div className='flex items-center gap-2 text-emerald-400'>
                    <Check className='w-5 h-5' />
                    <span className='text-sm font-semibold'>Secure & Logged</span>
                  </div>
                </div>
              </div>
            </div>

            <div className='mt-12 max-w-4xl mx-auto'>
              <div className='backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8'>
                <p className='text-lg text-gray-300 leading-relaxed text-center'>
                  The result: fewer wasted visits, fewer surprises, and a home-buying journey that feels professional instead of chaotic.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Tharaga Exists Section */}
        <section className='container mx-auto px-4 sm:px-6 lg:px-8 pb-24'>
          <div className='max-w-4xl mx-auto'>
            <div className='backdrop-blur-xl bg-white/10 border-2 border-gold-500/30 rounded-3xl p-12 text-center'>
              <h2 className='font-display text-4xl sm:text-5xl font-bold text-white mb-6'>
                Why Tharaga Exists
              </h2>
              <p className='text-xl text-gray-300 leading-relaxed mb-8'>
                Tharaga was started in Tamil Nadu after watching families and builders lose time, money, and trust in long broker chains and unstructured sales processes. The belief is simple:
              </p>
              <div className='max-w-2xl mx-auto'>
                <div className='backdrop-blur-xl bg-gradient-to-br from-gold-500/20 to-emerald-500/20 border-2 border-gold-500/50 rounded-2xl p-8 mb-8'>
                  <p className='text-2xl font-bold text-white leading-relaxed'>
                    If the operations of real estate become transparent, standardized, and data-driven, trust will follow.
                  </p>
                </div>
                <p className='text-lg text-gray-300 leading-relaxed'>
                  By <strong className='text-gold-400'>2035</strong>, Tharaga aims to be the default operational layer for new-home sales in Tamil Nadu—where every serious project and every serious buyer eventually passes through the same reliable rails.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className='container mx-auto px-4 sm:px-6 lg:px-8 pb-24'>
          <div className='max-w-4xl mx-auto glass-card-dark p-12 rounded-3xl text-center border-2 border-gold-500/30'>
            <h2 className='font-display text-4xl font-bold text-white mb-4'>
              Ready to Transform Real Estate?
            </h2>
            <p className='text-xl text-gray-300 mb-8'>
              Join builders and buyers who trust Tharaga for transparent, broker-free real estate operations.
            </p>
            <div className='flex flex-wrap gap-4 justify-center'>
              <a
                href='https://docs.google.com/forms/d/e/1FAIpQLScVrrMf7voKVXGz9d2giOje_p-nyt9yEdxJgWkVc0Mc1-PN1Q/viewform?usp=sharing'
                className='btn-gold text-lg px-10 py-4 inline-flex items-center gap-2'
              >
                List My Project
                <Building2 className='w-5 h-5' />
              </a>
              <a
                href='https://tharaga.co.in/verified-property-listings'
                className='px-10 py-4 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-xl font-bold text-lg hover:bg-white/20 transition-all'
              >
                Explore Verified Homes
                <Users className='w-5 h-5' />
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
