"use client"
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Star, Shield, Sparkles, ChevronDown, CheckCircle, Lock, Users, TrendingUp } from 'lucide-react'

const HowItWorksAnimatedSection = dynamic(
  () => import('../components/AnimatedHowItWorks/HowItWorksAnimatedSection'),
  { ssr: false },
)

export default function Home() {
  return (
    <main className="relative">
      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800" />

        {/* Animated Floating Shapes (Framer Motion) */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl"
            style={{ backgroundColor: 'rgb(var(--gold-500))' }}
            initial={{ y: -10, opacity: 0.7 }}
            animate={{ y: 10, opacity: 1 }}
            transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl"
            style={{ backgroundColor: 'rgb(var(--primary-600))' }}
            initial={{ y: 12, opacity: 0.7 }}
            animate={{ y: -12, opacity: 1 }}
            transition={{ duration: 7, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror', delay: 0.6 }}
          />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* LEFT: Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="text-white"
            >
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500/20 backdrop-blur-sm border border-gold-500/30 rounded-full mb-6">
                <span className="w-2 h-2 bg-gold-500 rounded-full animate-pulse" />
                <span className="text-gold-300 text-sm font-medium tracking-wide">
                  Tamil Nadu's Most Intelligent Real Estate Platform
                </span>
              </div>

              {/* Headline */}
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6">
                Build Wealth,
                <br />
                <span className="text-gradient-gold">Not Just Homes</span>
              </h1>

              {/* Subheadline */}
              <p className="text-xl sm:text-2xl text-gray-300 leading-relaxed mb-8 max-w-xl">
                AI-verified properties. Zero broker fees.
                <span className="text-gold-400 font-semibold"> ₹1,200/sqft saved</span> on average.
                Make the smartest investment of your life.
              </p>

              {/* Trust Metrics */}
              <div className="grid grid-cols-3 gap-4 mb-10">
                <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-gold-500 mb-1">28h</div>
                  <div className="text-sm text-gray-300">Time Saved</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-emerald-400 mb-1">100%</div>
                  <div className="text-sm text-gray-300">RERA Verified</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-gold-500 mb-1">₹120Cr+</div>
                  <div className="text-sm text-gray-300">Deals Closed</div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/properties" className="btn-gold group inline-flex items-center justify-center">
                  Explore Properties
                  <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/how-it-works"
                  className="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-200 inline-flex items-center justify-center"
                >
                  See How It Works
                </Link>
              </div>

              {/* Social Proof */}
              <div className="mt-10 flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[35, 36, 37, 38].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-primary-950 bg-gray-300 overflow-hidden">
                      <img
                        src={`https://i.pravatar.cc/80?img=${i}`}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-gold-500 text-gold-500" />
                    ))}
                  </div>
                  <p className="text-gray-300">
                    <span className="text-white font-semibold">500+ builders</span> trust Tharaga
                  </p>
                </div>
              </div>
            </motion.div>

            {/* RIGHT: Hero Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
              className="relative hidden lg:block"
            >
              {/* 3D Property Card Mockup */}
              <div className="relative">
                {/* Main Card */}
                <div className="glass-card p-6 rounded-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                  <img
                    src="/images/hero-bg.jpg"
                    alt="Luxury Property"
                    className="w-full h-64 object-cover rounded-lg mb-4"
                    loading="lazy"
                  />
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Prestige Lakeside</h3>
                      <p className="text-sm text-gray-600">Whitefield, Bangalore</p>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-emerald-100 rounded-full">
                      <Shield className="w-4 h-4 text-emerald-700" />
                      <span className="text-xs font-medium text-emerald-700">Verified</span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gold-700 mb-4">₹2.4 Cr</div>
                  <div className="flex gap-3 text-sm text-gray-700">
                    <span>3 BHK</span>
                    <span>•</span>
                    <span>1,850 sqft</span>
                    <span>•</span>
                    <span>Ready to Move</span>
                  </div>
                </div>

                {/* Floating AI Badge */}
                <div className="absolute -top-4 -right-4 glass-card p-4 rounded-xl shadow-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-gold-600" />
                    <span className="text-sm font-semibold text-gray-900">AI Match</span>
                  </div>
                  <div className="text-3xl font-bold text-gold-600">92%</div>
                </div>

                {/* Floating Stats */}
                <div className="absolute -bottom-4 -left-4 glass-card p-4 rounded-xl shadow-xl">
                  <div className="text-xs text-gray-600 mb-1">ROI Potential</div>
                  <div className="text-2xl font-bold text-emerald-600">+24%</div>
                  <div className="text-xs text-gray-500">in 3 years</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-white/70" />
        </div>
      </section>

      {/* TRIAL CTA SECTION */}
      <section className="py-24 relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800" />

        {/* Decorative Shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 rounded-full mb-6"
            >
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-300 text-sm font-medium">
                No Credit Card Required • 14-Day Free Trial
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6"
            >
              Ready to Build
              <span className="text-gradient-gold"> Real Wealth</span>?
            </motion.h2>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto"
            >
              Join 500+ builders who've closed ₹120Cr+ in deals. Get your first 10 qualified leads absolutely free.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <Link href="/trial-signup" className="btn-gold text-lg px-8 py-4 group">
                Start Free Trial
                <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/demo"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-200 text-lg"
              >
                Watch Demo
              </Link>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap justify-center items-center gap-8 text-gray-400"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span>RERA Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-gold-400" />
                <span>Bank-Grade Security</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-400" />
                <span>500+ Active Builders</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span>₹120Cr+ Deals Closed</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Subsequent sections */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <HowItWorksAnimatedSection compact />
      </section>
    </main>
  )
}

