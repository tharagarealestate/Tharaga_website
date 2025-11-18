import React from 'react'
import { Brain, FileCheck, TrendingUp, Users, Globe, Zap } from 'lucide-react'
import { GlassContainer } from '@/components/ui/GlassContainer'
import { ShimmerCard } from '@/components/ui/ShimmerCard'

interface Feature {
  icon: React.ElementType
  title: string
  description: string
  badge: string
  gradient: string
}

const features: Feature[] = [
  {
    icon: Brain,
    title: 'AI-Powered Intelligence',
    description: 'Multi-dimensional property insights—price trends, flood & safety indicators, infrastructure context and rental yield estimates. See property insights for data sources and limitations.',
    badge: 'Explainable ML-based appreciation bands (Low / Medium / High)',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: FileCheck,
    title: 'Document Snapshot Immutability',
    description: 'Fraud-risk reduction toolkit. Each listing includes public registry snapshots, uploaded document hashes, and an independent audit report. This is not a substitute for a legal title search.',
    badge: 'Cryptographic verification for auditability',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: TrendingUp,
    title: 'Zero Broker Commission',
    description: 'Connect directly with verified builders. Save ₹3-5 lakhs on brokerage. That\'s a vacation in Europe, on us.',
    badge: '₹1,200/sqft avg. savings',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: Users,
    title: 'ROI Prediction Engine',
    description: 'Know your property\'s future value before you buy. Our ML models forecast appreciation with 85% accuracy.',
    badge: '+24% avg. 3-year ROI',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    icon: Globe,
    title: 'Family Decision Tools',
    description: 'Compare properties, calculate EMIs, assess risks—all in one dashboard. Make decisions together, confidently.',
    badge: '28 hours saved per buyer',
    gradient: 'from-indigo-500 to-purple-500',
  },
  {
    icon: Zap,
    title: 'Tamil Voice Search',
    description: 'Search properties in your language, your way. Our voice AI understands context, not just keywords.',
    badge: '5+ regional languages',
    gradient: 'from-yellow-500 to-orange-500',
  },
]

export function FeaturesSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Dark Background with Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-section-dark-from via-blue-950 to-section-dark-to -z-10" />
      
      {/* Animated Orbs */}
      <div className="absolute top-40 left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-40 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            India's First AI-Powered Wealth Intelligence Platform
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            We're building India's first AI-powered wealth intelligence platform for real estate. Every feature is designed to make you richer, smarter, faster.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <ShimmerCard key={index}>
              <GlassContainer 
                intensity="medium"
                className="p-8 h-full hover:scale-[1.02] transition-transform duration-300"
              >
                {/* Icon with Gradient Background */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-white mb-4">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-white/70 mb-6 leading-relaxed">
                  {feature.description}
                </p>

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20">
                  <Zap className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-semibold text-green-400">
                    {feature.badge}
                  </span>
                </div>
              </GlassContainer>
            </ShimmerCard>
          ))}
        </div>
      </div>
    </section>
  )
}

