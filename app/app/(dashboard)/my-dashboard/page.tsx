'use client'

import { useState, useEffect } from 'react'
import { Heart, Calendar, Bell, TrendingUp, MapPin, Sparkles, Home, Shield, Award, Search, Filter, ArrowRight, Zap, Bookmark } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { listSaved } from '@/lib/saved'
import type { RecommendationItem } from '@/types/recommendations'
import { LeadModal } from '@/components/lead/LeadModal'
import { LuxuryPropertyCard } from './_components/LuxuryPropertyCard'
import { CompactPropertyCard } from './_components/CompactPropertyCard'
import { SiteVisitCard } from './_components/SiteVisitCard'

const RecommendationsCarousel = dynamic(() => import('@/features/recommendations/RecommendationsCarousel').then(m => m.RecommendationsCarousel), { ssr: false })

export default function Page() {
  const router = useRouter()
  const [greeting, setGreeting] = useState('')
  const [userName, setUserName] = useState('')
  const [recs, setRecs] = useState<RecommendationItem[]>([])
  const [recError, setRecError] = useState<string | null>(null)
  const [leadFor, setLeadFor] = useState<string | null>(null)
  const [savedCount, setSavedCount] = useState(0)
  const [visitsCount, setVisitsCount] = useState(0)
  const [siteVisits, setSiteVisits] = useState<any[]>([])
  const [profileCompletion, setProfileCompletion] = useState(60)

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

    // Load site visits
    const loadSiteVisits = async () => {
      try {
        const supabase = getSupabase()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const nowISO = new Date().toISOString()
        let visits: any[] = []

        // Try primary table name
        try {
          const { data, error } = await supabase
            .from('visits')
            .select('*, properties(title, locality, city)')
            .eq('user_id', user.id)
            .gt('start_time', nowISO)
            .order('start_time', { ascending: true })
            .limit(5)
          
          if (!error && data) {
            visits = data.map(v => ({
              property: v.properties?.title || 'Property',
              date: new Date(v.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
              time: new Date(v.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
              status: v.status || 'pending',
              propertyId: v.property_id
            }))
          }
        } catch {}

        // Fallback to site_visits table
        if (visits.length === 0) {
          try {
            const { data, error } = await supabase
              .from('site_visits')
              .select('*, properties(title, locality, city)')
              .eq('user_id', user.id)
              .gt('visit_date', nowISO)
              .order('visit_date', { ascending: true })
              .limit(5)
            
            if (!error && data) {
              visits = data.map(v => ({
                property: v.properties?.title || 'Property',
                date: new Date(v.visit_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                time: new Date(v.visit_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
                status: v.status || 'pending',
                propertyId: v.property_id
              }))
            }
          } catch {}
        }

        setSiteVisits(visits)
        setVisitsCount(visits.length)
      } catch {
        // Mock data for development
        setSiteVisits([
          {
            property: 'Prestige Lakeside Habitat',
            date: 'Tomorrow, Nov 5',
            time: '10:30 AM',
            status: 'confirmed'
          },
          {
            property: 'Sobha Dream Acres',
            date: 'Saturday, Nov 7',
            time: '2:00 PM',
            status: 'pending'
          }
        ])
        setVisitsCount(2)
      }
    }
    loadSiteVisits()
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

        <div className='relative z-10 max-w-7xl mx-auto px-6 pt-12'>
          {/* Welcome Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className='mb-12'
          >
            <div className='flex items-center justify-between mb-8'>
              <div>
                <h1 className='text-4xl sm:text-5xl font-display font-bold text-white mb-2'>
                  {greeting}, {userName || 'User'}! 👋
                </h1>
                <p className='text-xl text-gray-300'>
                  Your dream home is closer than you think
                </p>
              </div>

              {/* Quick Stats */}
              <div className='hidden lg:flex items-center gap-6'>
                <div className='text-center px-6 py-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20'>
                  <div className='text-3xl font-bold text-gold-400'>{savedCount}</div>
                  <div className='text-sm text-gray-300'>Saved</div>
                </div>
                <div className='text-center px-6 py-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20'>
                  <div className='text-3xl font-bold text-emerald-400'>{visitsCount}</div>
                  <div className='text-sm text-gray-300'>Visits</div>
                </div>
              </div>
            </div>

            {/* Search Bar - Premium Glass */}
            <div className='relative group max-w-4xl'>
              <div className='absolute inset-0 bg-gradient-to-r from-gold-500 to-emerald-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity' />
              <div className='relative bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl p-2 shadow-2xl'>
                <form onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  const query = formData.get('search') as string
                  if (query?.trim()) {
                    router.push(`/property-listing/?q=${encodeURIComponent(query.trim())}`)
                  }
                }}>
                  <div className='flex items-center gap-4'>
                    <div className='flex-1 flex items-center gap-3 px-6 py-4'>
                      <MapPin className='w-6 h-6 text-gold-400' />
                      <input
                        type='text'
                        name='search'
                        placeholder='Search by location, builder, or project name...'
                        className='flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-lg'
                      />
                    </div>

                    <button type='submit' className='px-8 py-4 bg-gradient-to-r from-gold-600 to-gold-500 text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-gold-500/50 transition-all hover:-translate-y-0.5'>
                      <div className='flex items-center gap-2'>
                        <Sparkles className='w-5 h-5' />
                        AI Search
                      </div>
                    </button>
                  </div>
                </form>

                {/* Quick Filters */}
                <div className='flex items-center gap-3 px-6 pb-4'>
                  <button
                    type='button'
                    onClick={() => router.push('/property-listing/?bhk=2-3')}
                    className='px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-all'
                  >
                    2-3 BHK
                  </button>
                  <button
                    type='button'
                    onClick={() => router.push('/property-listing/?minPrice=5000000&maxPrice=10000000')}
                    className='px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-all'
                  >
                    ₹50L - 1Cr
                  </button>
                  <button
                    type='button'
                    onClick={() => router.push('/property-listing/?status=ready')}
                    className='px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-all'
                  >
                    Ready to Move
                  </button>
                  <button
                    type='button'
                    onClick={() => router.push('/property-listing')}
                    className='px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-all'
                  >
                    + More Filters
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

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
      <div className='max-w-7xl mx-auto px-6 -mt-24 pb-12 relative z-20'>
        <div className='grid lg:grid-cols-3 gap-8'>
          {/* Left Column - Main Feed */}
          <div className='lg:col-span-2 space-y-8'>

            {/* AI Recommendations Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className='bg-white/70 backdrop-blur-xl rounded-3xl border border-gray-200/50 p-8 shadow-2xl'
            >
              <div className='flex items-center justify-between mb-6'>
                <div>
                  <div className='flex items-center gap-3 mb-2'>
                    <div className='w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center'>
                      <Sparkles className='w-5 h-5 text-white' />
                    </div>
                    <h2 className='text-2xl font-bold text-gray-900'>
                      Perfect Matches For You
                    </h2>
                  </div>
                  <p className='text-gray-600'>Based on your preferences and search history</p>
                </div>

                <Link href='/property-listing' className='text-gold-600 hover:text-gold-700 font-semibold flex items-center gap-2'>
                  View All
                  <TrendingUp className='w-4 h-4' />
                </Link>
              </div>

              {/* Property Cards - Pinterest Style */}
              <div className='grid sm:grid-cols-2 gap-6'>
                {recs.length > 0 ? (
                  recs.slice(0, 2).map((item) => (
                    <LuxuryPropertyCard
                      key={item.property_id}
                      image={item.image_url || '/property1.jpg'}
                      title={item.title}
                      location={`${item.specs?.locality || ''}, ${item.specs?.city || 'Bangalore'}`}
                      price={item.specs?.price_display || 'Price on Request'}
                      pricePerSqft={item.specs?.price_per_sqft ? `₹${item.specs.price_per_sqft.toLocaleString('en-IN')}` : 'N/A'}
                      bhk={item.specs?.bedrooms ? `${item.specs.bedrooms} BHK` : 'N/A'}
                      sqft={item.specs?.area_sqft ? Math.round(item.specs.area_sqft).toLocaleString() : 'N/A'}
                      matchScore={Math.round((item.score || 85) / 30 * 100)}
                      tags={['AI Verified', 'RERA Approved']}
                      propertyId={item.property_id}
                    />
                  ))
                ) : (
                  <>
                    <LuxuryPropertyCard
                      image='/property1.jpg'
                      title='Sobha Dream Acres'
                      location='Whitefield, Bangalore'
                      price='₹85 Lakhs'
                      pricePerSqft='₹5,200'
                      bhk='2 BHK'
                      sqft='1,635'
                      matchScore={94}
                      tags={['AI Verified', 'RERA Approved', 'Price Alert']}
                    />
                    <LuxuryPropertyCard
                      image='/property2.jpg'
                      title='Prestige Lakeside'
                      location='Sarjapur Road, Bangalore'
                      price='₹1.2 Cr'
                      pricePerSqft='₹6,800'
                      bhk='3 BHK'
                      sqft='1,765'
                      matchScore={91}
                      tags={['Recently Reduced', 'Premium']}
                    />
                  </>
                )}
              </div>
            </motion.div>

            {/* Recent Searches / Saved Properties */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className='bg-white/70 backdrop-blur-xl rounded-3xl border border-gray-200/50 p-8 shadow-2xl'
            >
              <div className='flex items-center justify-between mb-6'>
                <h2 className='text-2xl font-bold text-gray-900 flex items-center gap-3'>
                  <Heart className='w-6 h-6 text-red-500 fill-red-500' />
                  Your Favorites
                </h2>

                {savedCount > 0 && (
                  <Link href='/saved' className='px-6 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all'>
                    Compare ({savedCount})
                  </Link>
                )}
              </div>

              {/* Horizontal Scroll Cards */}
              <div className='flex gap-4 overflow-x-auto pb-4 -mx-8 px-8 scrollbar-hide'>
                {savedCount > 0 ? (
                  listSaved().slice(0, 4).map((item) => (
                    <CompactPropertyCard
                      key={item.property_id}
                      propertyId={item.property_id}
                      image={item.image_url}
                      title={item.title}
                      location={item.specs?.locality || 'Location'}
                      price={item.specs?.price_display || 'Price on Request'}
                    />
                  ))
                ) : (
                  [1, 2, 3, 4].map((i) => (
                    <CompactPropertyCard key={i} />
                  ))
                )}
              </div>
            </motion.div>

            {/* Upcoming Site Visits */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className='bg-white/70 backdrop-blur-xl rounded-3xl border border-gray-200/50 p-8 shadow-2xl'
            >
              <h2 className='text-2xl font-bold text-gray-900 flex items-center gap-3 mb-6'>
                <Calendar className='w-6 h-6 text-blue-500' />
                Upcoming Site Visits
              </h2>

              {siteVisits.length > 0 ? (
                <div className='space-y-4'>
                  {siteVisits.map((visit, i) => (
                    <SiteVisitCard
                      key={i}
                      property={visit.property}
                      date={visit.date}
                      time={visit.time}
                      status={visit.status}
                      propertyId={visit.propertyId}
                    />
                  ))}
                </div>
              ) : (
                <div className='text-center py-8'>
                  <Calendar className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                  <p className='text-gray-600 text-lg mb-2'>No upcoming visits scheduled</p>
                  <p className='text-gray-500 mb-6'>Schedule a site visit to see properties in person</p>
                  <Link href='/property-listing' className='inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all'>
                    <Calendar className='w-4 h-4' />
                    Schedule Visit
                  </Link>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column - Sidebar */}
          <div className='space-y-6'>
            {/* Profile Completion Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className='bg-gradient-to-br from-gold-500 to-gold-600 rounded-3xl p-6 text-white shadow-2xl'
            >
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-bold'>Complete Your Profile</h3>
                <div className='text-3xl font-bold'>{profileCompletion}%</div>
              </div>

              <div className='w-full bg-white/20 rounded-full h-3 mb-6'>
                <div className='bg-white rounded-full h-3 transition-all duration-500' style={{ width: `${profileCompletion}%` }} />
              </div>

              <p className='text-sm opacity-90 mb-4'>
                Complete your profile to get better property recommendations
              </p>

              <Link href='/login' className='w-full py-3 bg-white text-gold-600 font-semibold rounded-xl hover:shadow-lg transition-all block text-center'>
                Complete Now
              </Link>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className='bg-white/70 backdrop-blur-xl rounded-3xl border border-gray-200/50 p-6 shadow-2xl'
            >
              <h3 className='text-lg font-bold text-gray-900 mb-4'>Quick Actions</h3>

              <div className='space-y-3'>
                <Link href='/property-listing' className='w-full flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:shadow-md transition-all group'>
                  <div className='w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform'>
                    <Home className='w-6 h-6 text-white' />
                  </div>
                  <div className='flex-1 text-left'>
                    <div className='font-semibold text-gray-900'>Virtual Tours</div>
                    <div className='text-sm text-gray-600'>360° property views</div>
                  </div>
                </Link>

                <Link href='/saved' className='w-full flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl hover:shadow-md transition-all group'>
                  <div className='w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform'>
                    <Shield className='w-6 h-6 text-white' />
                  </div>
                  <div className='flex-1 text-left'>
                    <div className='font-semibold text-gray-900'>Document Vault</div>
                    <div className='text-sm text-gray-600'>Secure storage</div>
                  </div>
                </Link>

                <Link href='#' className='w-full flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl hover:shadow-md transition-all group'>
                  <div className='w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform'>
                    <Award className='w-6 h-6 text-white' />
                  </div>
                  <div className='flex-1 text-left'>
                    <div className='font-semibold text-gray-900'>Lawyer Consult</div>
                    <div className='text-sm text-gray-600'>3 free questions</div>
                  </div>
                </Link>
              </div>
            </motion.div>

            {/* Market Insights */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className='bg-white/70 backdrop-blur-xl rounded-3xl border border-gray-200/50 p-6 shadow-2xl'
            >
              <h3 className='text-lg font-bold text-gray-900 mb-4'>Market Insights</h3>

              <div className='space-y-4'>
                <div className='flex items-start gap-3'>
                  <div className='w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                    <TrendingUp className='w-4 h-4 text-emerald-600' />
                  </div>
                  <div>
                    <div className='font-semibold text-gray-900 text-sm'>Whitefield Up 8%</div>
                    <div className='text-xs text-gray-600'>Prices increased this quarter</div>
                  </div>
                </div>

                <div className='flex items-start gap-3'>
                  <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                    <Bell className='w-4 h-4 text-blue-600' />
                  </div>
                  <div>
                    <div className='font-semibold text-gray-900 text-sm'>New Metro Line</div>
                    <div className='text-xs text-gray-600'>Sarjapur connectivity boost</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
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


