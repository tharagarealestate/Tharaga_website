'use client'

import { useState, useEffect } from 'react'
import { Heart, Calendar, Bell, TrendingUp, MapPin, Sparkles, Home, Shield, Award, Search, Filter, ArrowRight, Zap, Bookmark } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { getSupabase } from '@/lib/supabase'
import { listSaved } from '@/lib/saved'
import type { RecommendationItem } from '@/types/recommendations'
import { LeadModal } from '@/components/lead/LeadModal'

const RecommendationsCarousel = dynamic(() => import('@/features/recommendations/RecommendationsCarousel').then(m => m.RecommendationsCarousel), { ssr: false })

export default function Page() {
  const [greeting, setGreeting] = useState('')
  const [userName, setUserName] = useState('')
  const [recs, setRecs] = useState<RecommendationItem[]>([])
  const [recError, setRecError] = useState<string | null>(null)
  const [leadFor, setLeadFor] = useState<string | null>(null)
  const [savedCount, setSavedCount] = useState(0)

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good Morning')
    else if (hour < 18) setGreeting('Good Afternoon')
    else setGreeting('Good Evening')

    // Get user name
    const supabase = getSupabase()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name.split(' ')[0])
      } else if (user?.email) {
        setUserName(user.email.split('@')[0])
      }
    })

    // Load recommendations
    const loadRecs = async () => {
      try {
        const sid = typeof document !== 'undefined' ? document.cookie.match(/(?:^|; )thg_sid=([^;]+)/)?.[1] : null
        const res = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sid, num_results: 6 })
        })
        if (res.ok) {
          const data = await res.json()
          setRecs(Array.isArray(data.items) ? data.items : [])
        } else {
          setRecError('Failed to load')
        }
      } catch {
        setRecError('Failed to load')
      }
    }
    loadRecs()

    // Update saved count
    setSavedCount(listSaved().length)
  }, [])

  return (
    <div className='-mx-4 sm:-mx-6 lg:-mx-8'>
      {/* Premium Hero Section with Gradient */}
      <div className='relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 pb-16 pt-8 -mt-4'>
        {/* Animated Background Elements */}
        <div className='absolute inset-0 overflow-hidden'>
          <motion.div
            className='absolute top-20 right-20 w-96 h-96 bg-gold-500/20 rounded-full blur-3xl'
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className='absolute bottom-20 left-20 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-3xl'
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
        </div>

        <div className='relative z-10 px-4 sm:px-6 lg:px-8'>
          {/* Hero Content */}
          <div className='grid lg:grid-cols-2 gap-8 items-center'>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 backdrop-blur-xl border border-emerald-400/30 mb-6'>
                <Sparkles className='w-4 h-4 text-emerald-300' />
                <span className='text-emerald-200 text-sm font-medium'>AI-Powered Recommendations</span>
              </div>
              <h1 className='text-4xl lg:text-5xl font-display font-bold text-white mb-4 leading-tight'>
                {greeting}{userName ? `, ${userName}` : ''}
                <span className='block text-gradient-gold mt-2'>Find Your Dream Home</span>
              </h1>
              <p className='text-primary-200 text-lg mb-8 leading-relaxed'>
                Zero brokers. Zero commissions. Just pure property discovery powered by intelligent matching.
              </p>
              <div className='flex flex-wrap gap-4'>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.href = '/property-listing'}
                  className='btn-gold px-8 py-4 text-base font-semibold flex items-center gap-2'
                >
                  <Search className='w-5 h-5' />
                  Explore Properties
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.href = '/property-listing'}
                  className='px-8 py-4 rounded-lg bg-white/10 backdrop-blur-xl border border-white/20 text-white font-semibold hover:bg-white/20 transition-all flex items-center gap-2'
                >
                  <Filter className='w-5 h-5' />
                  Advanced Filters
                </motion.button>
              </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className='grid grid-cols-2 gap-4'
            >
              <StatCard
                icon={<TrendingUp className='w-6 h-6' />}
                value="12k+"
                label="Properties"
                gradient="from-gold-500 to-gold-400"
              />
              <StatCard
                icon={<Shield className='w-6 h-6' />}
                value="100%"
                label="Zero Fees"
                gradient="from-emerald-500 to-emerald-400"
              />
              <StatCard
                icon={<Award className='w-6 h-6' />}
                value="4.9★"
                label="Satisfaction"
                gradient="from-primary-500 to-primary-400"
              />
              <StatCard
                icon={<Zap className='w-6 h-6' />}
                value="AI"
                label="Powered"
                gradient="from-gold-500 via-emerald-500 to-primary-500"
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='px-4 sm:px-6 lg:px-8 -mt-12 relative z-20'>
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-12'
        >
          <QuickActionCard
            icon={<Heart className='w-6 h-6' />}
            title="Saved Properties"
            count={savedCount}
            description="Your favorite listings"
            href="/saved"
            gradient="from-pink-500 to-rose-500"
          />
          <QuickActionCard
            icon={<Calendar className='w-6 h-6' />}
            title="Site Visits"
            count={0}
            description="Upcoming appointments"
            href="#"
            gradient="from-blue-500 to-cyan-500"
          />
          <QuickActionCard
            icon={<MapPin className='w-6 h-6' />}
            title="Recent Searches"
            count={0}
            description="Continue exploring"
            href="/property-listing"
            gradient="from-emerald-500 to-teal-500"
          />
        </motion.div>

        {/* AI Recommendations Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className='mb-12'
        >
          <div className='flex items-center justify-between mb-6'>
            <div>
              <div className='flex items-center gap-3 mb-2'>
                <div className='p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600'>
                  <Sparkles className='w-5 h-5 text-white' />
                </div>
                <h2 className='text-3xl font-display font-bold text-gray-900'>AI Recommendations</h2>
              </div>
              <p className='text-gray-600 ml-12'>Curated just for you based on your preferences</p>
            </div>
            <Link
              href="/property-listing"
              className='flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors'
            >
              View All <ArrowRight className='w-4 h-4' />
            </Link>
          </div>
          <div className='bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-xl p-6'>
            <Suspense fallback={<div className='p-8 text-center text-gray-600'>Loading recommendations...</div>}>
              <RecommendationsCarousel items={recs} isLoading={!recs.length && !recError} error={recError} />
            </Suspense>
          </div>
        </motion.section>

        {/* Saved Properties Showcase */}
        <SavedPropertiesShowcase />

        {/* Upcoming Visits */}
        <UpcomingVisitsSection />

        {/* Trust Indicators */}
        <TrustIndicators />
      </div>

      <LeadModal propertyId={leadFor ?? ''} open={!!leadFor} onClose={() => setLeadFor(null)} />
    </div>
  )
}

function StatCard({ icon, value, label, gradient }: { icon: React.ReactNode; value: string; label: string; gradient: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 shadow-xl`}
    >
      <div className='absolute inset-0 bg-white/10 backdrop-blur-sm' />
      <div className='relative z-10'>
        <div className='text-white/90 mb-3'>{icon}</div>
        <div className='text-3xl font-display font-bold text-white mb-1'>{value}</div>
        <div className='text-white/80 text-sm font-medium'>{label}</div>
      </div>
      <div className='absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16' />
    </motion.div>
  )
}

function QuickActionCard({ icon, title, count, description, href, gradient }: {
  icon: React.ReactNode
  title: string
  count: number
  description: string
  href: string
  gradient: string
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 shadow-lg hover:shadow-xl transition-all`}
      >
        <div className='absolute inset-0 bg-white/10 backdrop-blur-sm' />
        <div className='relative z-10 flex items-start justify-between'>
          <div>
            <div className='text-white/90 mb-3'>{icon}</div>
            <h3 className='text-xl font-display font-bold text-white mb-1'>{title}</h3>
            <p className='text-white/80 text-sm mb-2'>{description}</p>
            <div className='text-2xl font-bold text-white'>{count}</div>
          </div>
          <ArrowRight className='w-5 h-5 text-white/60' />
        </div>
      </motion.div>
    </Link>
  )
}

function SavedPropertiesShowcase() {
  const saved = listSaved().slice(0, 4)

  if (saved.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className='mb-12'
      >
        <div className='flex items-center justify-between mb-6'>
          <div>
            <div className='flex items-center gap-3 mb-2'>
              <div className='p-2 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500'>
                <Bookmark className='w-5 h-5 text-white' />
              </div>
              <h2 className='text-3xl font-display font-bold text-gray-900'>Saved Properties</h2>
            </div>
            <p className='text-gray-600 ml-12'>Your favorite listings for easy access</p>
          </div>
          <Link
            href="/saved"
            className='flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors'
          >
            View All <ArrowRight className='w-4 h-4' />
          </Link>
        </div>
        <div className='bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-xl p-12 text-center'>
          <Bookmark className='w-16 h-16 text-gray-300 mx-auto mb-4' />
          <p className='text-gray-600 text-lg mb-2'>No saved properties yet</p>
          <p className='text-gray-500 mb-6'>Start exploring and save properties you love</p>
          <Link
            href="/property-listing"
            className='inline-flex items-center gap-2 btn-primary'
          >
            <Search className='w-4 h-4' />
            Explore Properties
          </Link>
        </div>
      </motion.section>
    )
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className='mb-12'
    >
      <div className='flex items-center justify-between mb-6'>
        <div>
          <div className='flex items-center gap-3 mb-2'>
            <div className='p-2 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500'>
              <Bookmark className='w-5 h-5 text-white' />
            </div>
            <h2 className='text-3xl font-display font-bold text-gray-900'>Saved Properties</h2>
          </div>
          <p className='text-gray-600 ml-12'>Your favorite listings for easy access</p>
        </div>
        <Link
          href="/saved"
          className='flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors'
        >
          View All <ArrowRight className='w-4 h-4' />
        </Link>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {saved.map((item, idx) => (
          <motion.div
            key={item.property_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            whileHover={{ scale: 1.02, y: -4 }}
            className='group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all'
          >
            <Link href={`/properties/${item.property_id}`}>
              <div className='relative h-48 w-full bg-gray-100 overflow-hidden'>
                <Image
                  src={item.image_url}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className='object-cover group-hover:scale-110 transition-transform duration-500'
                />
                <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent' />
                <div className='absolute top-3 right-3'>
                  <div className='p-2 rounded-full bg-white/90 backdrop-blur-sm'>
                    <Heart className='w-4 h-4 text-pink-500 fill-pink-500' />
                  </div>
                </div>
              </div>
              <div className='p-4'>
                <h3 className='font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors'>
                  {item.title}
                </h3>
                {item.specs && (
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    {item.specs.bedrooms && <span>{item.specs.bedrooms} BHK</span>}
                    {item.specs.area_sqft && <span>• {Math.round(item.specs.area_sqft)} sqft</span>}
                  </div>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}

function UpcomingVisitsSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className='mb-12'
    >
      <div className='flex items-center justify-between mb-6'>
        <div>
          <div className='flex items-center gap-3 mb-2'>
            <div className='p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500'>
              <Calendar className='w-5 h-5 text-white' />
            </div>
            <h2 className='text-3xl font-display font-bold text-gray-900'>Upcoming Site Visits</h2>
          </div>
          <p className='text-gray-600 ml-12'>Your scheduled property visits</p>
        </div>
      </div>
      <div className='bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-xl p-8 text-center'>
        <Calendar className='w-16 h-16 text-gray-300 mx-auto mb-4' />
        <p className='text-gray-600 text-lg mb-2'>No upcoming visits scheduled</p>
        <p className='text-gray-500 mb-6'>Schedule a site visit to see properties in person</p>
        <button className='inline-flex items-center gap-2 btn-primary'>
          <Calendar className='w-4 h-4' />
          Schedule Visit
        </button>
      </div>
    </motion.section>
  )
}

function TrustIndicators() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className='mb-12'
    >
      <div className='bg-gradient-to-br from-primary-900 to-primary-800 rounded-2xl p-8 md:p-12 shadow-2xl'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8 text-center'>
          <div>
            <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold-500/20 mb-4'>
              <Shield className='w-8 h-8 text-gold-400' />
            </div>
            <h3 className='text-xl font-display font-bold text-white mb-2'>Zero Commissions</h3>
            <p className='text-primary-200'>Save money with our broker-free platform</p>
          </div>
          <div>
            <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-4'>
              <Award className='w-8 h-8 text-emerald-400' />
            </div>
            <h3 className='text-xl font-display font-bold text-white mb-2'>Verified Properties</h3>
            <p className='text-primary-200'>All listings are verified and authentic</p>
          </div>
          <div>
            <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-500/20 mb-4'>
              <Zap className='w-8 h-8 text-primary-300' />
            </div>
            <h3 className='text-xl font-display font-bold text-white mb-2'>AI-Powered</h3>
            <p className='text-primary-200'>Smart recommendations based on your preferences</p>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
