'use client';

import { Footer } from '@/components/sections/Footer'
import { Metadata } from 'next'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  Building2,
  Shield,
  Zap,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Users,
  Award,
  MapPin,
  DollarSign
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-96 h-96 bg-amber-500 rounded-full blur-3xl animate-pulse-slow" />
        <div
          className="absolute bottom-20 right-10 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDelay: '1s' }}
        />
      </div>

      <div className="relative z-10">
        <main className="max-w-7xl mx-auto px-6 sm:px-8 pt-32 pb-16">
          <div className="space-y-6">
            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              {/* Eyebrow Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-100 mb-6"
              >
                <Shield className="h-4 w-4" />
                <span className="text-sm font-semibold">Tamil Nadu • Broker-Free • AI-Powered</span>
              </motion.div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                The Operating System for
                <span className="block mt-2 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 bg-clip-text text-transparent">
                  Tamil Nadu Real Estate
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto mb-8">
                India's first AI-powered zero-commission real estate platform.
                <strong className="text-white"> Connect directly with verified builders</strong> and save ₹3-5 lakhs on brokerage.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                <Link
                  href="/property-listing"
                  className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 glow-border text-slate-900 font-bold text-lg rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-1 w-full sm:w-auto"
                >
                  Explore Properties
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-slate-800/95 hover:bg-slate-700/95 border border-slate-700/50 hover:border-slate-600/50 text-white font-bold text-lg rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 w-full sm:w-auto"
                >
                  For Builders
                  <Building2 className="h-5 w-5" />
                </Link>
              </div>
            </motion.div>

            {/* Statistics Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8"
            >
              {[
                { icon: Home, value: '12k+', label: 'Verified Properties', delay: 0.1 },
                { icon: Users, value: '₹3-5L', label: 'Avg. Savings', delay: 0.15 },
                { icon: Award, value: '100%', label: 'Zero Brokerage', delay: 0.2 },
                { icon: MapPin, value: 'Tamil Nadu', label: 'Coverage', delay: 0.25 }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: stat.delay }}
                  className="p-6 bg-slate-800/95 glow-border rounded-lg border border-slate-700/50"
                >
                  <div className="flex items-center justify-between mb-4">
                    <stat.icon className="h-8 w-8 text-amber-300" />
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                  </div>
                  <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Features Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl p-6 sm:p-8 shadow-2xl"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                  Why Choose Tharaga?
                </h2>
                <p className="text-lg text-slate-300">
                  Experience the future of real estate with our cutting-edge platform
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    icon: Shield,
                    title: 'RERA Verified',
                    description: 'All properties and builders are RERA-certified and verified',
                    gradient: 'from-emerald-500/20 to-emerald-600/20'
                  },
                  {
                    icon: Zap,
                    title: 'Zero Commission',
                    description: 'Save ₹3-5 lakhs by connecting directly with builders',
                    gradient: 'from-amber-500/20 to-amber-600/20'
                  },
                  {
                    icon: Building2,
                    title: 'Direct Connect',
                    description: 'Talk directly to verified builders, no middlemen',
                    gradient: 'from-blue-500/20 to-blue-600/20'
                  },
                  {
                    icon: TrendingUp,
                    title: 'AI-Powered Search',
                    description: 'Find your perfect property with intelligent recommendations',
                    gradient: 'from-purple-500/20 to-purple-600/20'
                  },
                  {
                    icon: CheckCircle2,
                    title: 'Transparent Pricing',
                    description: 'No hidden costs, clear pricing from verified sources',
                    gradient: 'from-rose-500/20 to-rose-600/20'
                  },
                  {
                    icon: Award,
                    title: 'Premium Support',
                    description: '24/7 dedicated support throughout your journey',
                    gradient: 'from-cyan-500/20 to-cyan-600/20'
                  }
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className="p-6 bg-slate-800/50 rounded-lg border border-slate-700/30 hover:border-amber-300/30 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className={`p-3 bg-gradient-to-r ${feature.gradient} rounded-lg w-fit mb-4`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Smart Calculators Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl p-6 sm:p-8 shadow-2xl"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                  Smart Calculators & Tools
                </h2>
                <p className="text-lg text-slate-300">
                  Make informed decisions with our AI-powered calculators
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    icon: TrendingUp,
                    title: 'ROI Calculator',
                    description: 'Calculate rental yield, appreciation, and total returns',
                    href: '/tools/roi',
                    gradient: 'from-amber-500/20 to-amber-600/20'
                  },
                  {
                    icon: DollarSign,
                    title: 'EMI Calculator',
                    description: 'Calculate home loan EMI, interest, and amortization',
                    href: '/tools/emi',
                    gradient: 'from-emerald-500/20 to-emerald-600/20'
                  },
                  {
                    icon: Building2,
                    title: 'Budget Planner',
                    description: 'Plan your budget and find affordable properties',
                    href: '/tools/budget-planner',
                    gradient: 'from-blue-500/20 to-blue-600/20'
                  },
                  {
                    icon: Shield,
                    title: 'Loan Eligibility',
                    description: 'Check your home loan eligibility with TN banks',
                    href: '/tools/loan-eligibility',
                    gradient: 'from-purple-500/20 to-purple-600/20'
                  },
                  {
                    icon: MapPin,
                    title: 'Neighborhood Finder',
                    description: 'Find the perfect neighborhood for your needs',
                    href: '/tools/neighborhood-finder',
                    gradient: 'from-rose-500/20 to-rose-600/20'
                  },
                  {
                    icon: Award,
                    title: 'Property Valuation',
                    description: 'Get accurate property valuation with RERA data',
                    href: '/tools/property-valuation',
                    gradient: 'from-cyan-500/20 to-cyan-600/20'
                  }
                ].map((tool, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                  >
                    <Link
                      href={tool.href}
                      className="block p-6 bg-slate-800/50 rounded-lg border border-slate-700/30 hover:border-amber-300/30 transition-all duration-300 hover:-translate-y-1 group"
                    >
                      <div className={`p-3 bg-gradient-to-r ${tool.gradient} rounded-lg w-fit mb-4`}>
                        <tool.icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                        {tool.title}
                      </h3>
                      <p className="text-sm text-slate-400 mb-4">
                        {tool.description}
                      </p>
                      <div className="flex items-center text-amber-300 text-sm font-medium">
                        Calculate Now
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Call to Action Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-r from-amber-500/20 via-amber-600/20 to-amber-500/20 glow-border rounded-xl p-8 sm:p-12 text-center shadow-2xl"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Ready to Find Your Dream Home?
                </h2>
                <p className="text-lg sm:text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                  Join thousands of smart investors who saved lakhs on brokerage with Tharaga
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/property-listing"
                    className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 glow-border text-slate-900 font-bold text-lg rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-1 w-full sm:w-auto"
                  >
                    Start Exploring Now
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/about"
                    className="px-8 py-4 text-white font-semibold hover:text-amber-300 transition-colors"
                  >
                    Learn More About Us
                  </Link>
                </div>
              </motion.div>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="grid gap-4 sm:grid-cols-3 text-center"
            >
              {[
                { value: '100% Free', label: 'No Hidden Charges' },
                { value: 'RERA Certified', label: 'Government Verified' },
                { value: '24/7 Support', label: 'Always Here to Help' }
              ].map((item, index) => (
                <div
                  key={index}
                  className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/30"
                >
                  <p className="text-lg font-bold text-amber-300 mb-1">{item.value}</p>
                  <p className="text-sm text-slate-400">{item.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}
