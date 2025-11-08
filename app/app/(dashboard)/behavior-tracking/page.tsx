'use client'

import { useState, useEffect } from 'react'
import { useBehaviorTracking } from '@/hooks/useBehaviorTracking'
import { getSupabase } from '@/lib/supabase'
import { 
  Activity, 
  Eye, 
  Search, 
  Phone, 
  Mail, 
  MessageSquare, 
  Heart, 
  Filter,
  TrendingUp,
  Clock,
  Users,
  BarChart3
} from 'lucide-react'
import { format } from 'date-fns'

// =============================================
// BEHAVIOR TRACKING DASHBOARD PAGE
// Matches pricing page design exactly
// =============================================

export default function BehaviorTrackingPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'test'>('overview')
  const [stats, setStats] = useState({
    totalEvents: 0,
    todayEvents: 0,
    uniqueUsers: 0,
    avgSessionDuration: 0,
  })
  const [recentBehaviors, setRecentBehaviors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBehaviorData()
  }, [])

  async function loadBehaviorData() {
    try {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's behaviors
      const { data, error } = await supabase
        .from('user_behavior')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const todayEvents = (data || []).filter(
        (b) => new Date(b.created_at) >= today
      ).length

      const uniqueSessions = new Set((data || []).map((b) => b.session_id)).size

      const durations = (data || [])
        .map((b) => b.duration)
        .filter((d) => d > 0)
      const avgDuration =
        durations.length > 0
          ? durations.reduce((a, b) => a + b, 0) / durations.length
          : 0

      setStats({
        totalEvents: data?.length || 0,
        todayEvents,
        uniqueUsers: uniqueSessions,
        avgSessionDuration: Math.round(avgDuration),
      })

      setRecentBehaviors(data || [])
    } catch (error) {
      console.error('Failed to load behavior data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden'>
      {/* Animated Background Elements - Same as pricing */}
      <div className='absolute inset-0 opacity-30'>
        <div className='absolute top-20 left-10 w-96 h-96 bg-gold-500 rounded-full blur-3xl animate-pulse-slow' />
        <div
          className='absolute bottom-20 right-10 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl animate-pulse-slow'
          style={{ animationDelay: '1s' }}
        />
      </div>

      <div className='relative z-10'>
        {/* Hero Section */}
        <section className='container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16'>
          <div className='text-center max-w-4xl mx-auto'>
            {/* Badge */}
            <div className='inline-flex items-center gap-2 px-4 py-2 bg-gold-500/20 backdrop-blur-sm border border-gold-500/30 rounded-full mb-6'>
              <span className='w-2 h-2 bg-gold-500 rounded-full animate-pulse' />
              <span className='text-gold-300 text-sm font-medium'>
                Real-Time Behavior Tracking
              </span>
            </div>

            {/* Headline */}
            <h1 className='font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6'>
              User Behavior
              <span className='text-gradient-gold block mt-2'>Analytics</span>
            </h1>

            {/* Subheadline */}
            <p className='text-xl sm:text-2xl text-gray-300 leading-relaxed mb-8'>
              Track every user action in real-time, analyze engagement patterns,
              <br className='hidden sm:block' />
              and optimize your lead generation strategy.
            </p>

            {/* Toggle: Overview vs Test */}
            <div className='inline-flex items-center gap-2 p-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20'>
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-8 py-3 font-semibold rounded-full transition-all duration-300 ${
                  activeTab === 'overview'
                    ? 'bg-gold-500 text-primary-950'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('test')}
                className={`px-8 py-3 font-semibold rounded-full transition-all duration-300 ${
                  activeTab === 'test'
                    ? 'bg-gold-500 text-primary-950'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Test Functions
              </button>
            </div>
          </div>
        </section>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <section className='container mx-auto px-4 sm:px-6 lg:px-8 pb-24'>
            {/* Stats Cards */}
            <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 max-w-7xl mx-auto'>
              <StatCard
                icon={<Activity className='w-6 h-6' />}
                label='Total Events'
                value={stats.totalEvents.toLocaleString()}
                trend='+12%'
                variant='glass'
              />
              <StatCard
                icon={<TrendingUp className='w-6 h-6' />}
                label='Today'
                value={stats.todayEvents.toLocaleString()}
                trend='+5%'
                variant='highlighted'
              />
              <StatCard
                icon={<Users className='w-6 h-6' />}
                label='Unique Sessions'
                value={stats.uniqueUsers.toLocaleString()}
                trend='+8%'
                variant='glass'
              />
              <StatCard
                icon={<Clock className='w-6 h-6' />}
                label='Avg Duration'
                value={`${stats.avgSessionDuration}s`}
                trend='+3%'
                variant='glass'
              />
            </div>

            {/* Recent Behaviors Table */}
            <div className='max-w-7xl mx-auto'>
              <div className='backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl overflow-hidden'>
                <div className='p-6 border-b border-white/10'>
                  <h2 className='text-2xl font-bold text-white flex items-center gap-3'>
                    <BarChart3 className='w-6 h-6 text-gold-500' />
                    Recent Behaviors
                  </h2>
                </div>
                {loading ? (
                  <div className='p-12 text-center text-gray-400'>
                    Loading behavior data...
                  </div>
                ) : recentBehaviors.length === 0 ? (
                  <div className='p-12 text-center text-gray-400'>
                    No behavior data yet. Use the Test Functions tab to generate
                    some events.
                  </div>
                ) : (
                  <div className='overflow-x-auto'>
                    <table className='w-full'>
                      <thead>
                        <tr className='border-b border-white/10'>
                          <th className='text-left p-4 text-white font-semibold'>
                            Type
                          </th>
                          <th className='text-left p-4 text-white font-semibold'>
                            Property ID
                          </th>
                          <th className='text-left p-4 text-white font-semibold'>
                            Duration
                          </th>
                          <th className='text-left p-4 text-white font-semibold'>
                            Device
                          </th>
                          <th className='text-left p-4 text-white font-semibold'>
                            Timestamp
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentBehaviors.slice(0, 20).map((behavior) => (
                          <tr
                            key={behavior.id}
                            className='border-b border-white/5 hover:bg-white/5 transition-colors'
                          >
                            <td className='p-4'>
                              <BehaviorTypeBadge
                                type={behavior.behavior_type}
                              />
                            </td>
                            <td className='p-4 text-gray-300'>
                              {behavior.property_id
                                ? behavior.property_id.slice(0, 8) + '...'
                                : '—'}
                            </td>
                            <td className='p-4 text-gray-300'>
                              {behavior.duration}s
                            </td>
                            <td className='p-4 text-gray-300 capitalize'>
                              {behavior.device_type || '—'}
                            </td>
                            <td className='p-4 text-gray-300'>
                              {format(
                                new Date(behavior.created_at),
                                'MMM d, HH:mm'
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Test Functions Tab */}
        {activeTab === 'test' && (
          <section className='container mx-auto px-4 sm:px-6 lg:px-8 pb-24'>
            <BehaviorTrackingTester />
          </section>
        )}
      </div>
    </div>
  )
}

// =============================================
// STAT CARD COMPONENT
// =============================================

function StatCard({
  icon,
  label,
  value,
  trend,
  variant = 'glass',
}: {
  icon: React.ReactNode
  label: string
  value: string
  trend: string
  variant?: 'glass' | 'highlighted'
}) {
  const isHighlighted = variant === 'highlighted'

  return (
    <div
      className={`
        relative group
        backdrop-blur-xl rounded-3xl overflow-hidden
        transition-all duration-500
        ${
          isHighlighted
            ? 'bg-gradient-to-br from-gold-500/20 to-emerald-500/20 border-2 border-gold-500/50 shadow-2xl shadow-gold-500/30'
            : 'bg-white/10 border border-white/20'
        }
        hover:shadow-2xl hover:-translate-y-2
      `}
    >
      <div className='p-6'>
        <div className='flex items-center justify-between mb-4'>
          <div className='text-gold-400'>{icon}</div>
          <span
            className={`text-sm font-semibold ${
              trend.startsWith('+') ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {trend}
          </span>
        </div>
        <div className='text-3xl font-bold text-white mb-1'>{value}</div>
        <div className='text-gray-400 text-sm'>{label}</div>
      </div>
    </div>
  )
}

// =============================================
// BEHAVIOR TYPE BADGE
// =============================================

function BehaviorTypeBadge({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    property_view: <Eye className='w-4 h-4' />,
    search: <Search className='w-4 h-4' />,
    form_interaction: <Activity className='w-4 h-4' />,
    phone_clicked: <Phone className='w-4 h-4' />,
    email_clicked: <Mail className='w-4 h-4' />,
    whatsapp_clicked: <MessageSquare className='w-4 h-4' />,
    saved_property: <Heart className='w-4 h-4' />,
    compared_properties: <BarChart3 className='w-4 h-4' />,
    filter_applied: <Filter className='w-4 h-4' />,
  }

  const colors: Record<string, string> = {
    property_view: 'bg-blue-500/20 text-blue-300',
    search: 'bg-purple-500/20 text-purple-300',
    form_interaction: 'bg-yellow-500/20 text-yellow-300',
    phone_clicked: 'bg-green-500/20 text-green-300',
    email_clicked: 'bg-red-500/20 text-red-300',
    whatsapp_clicked: 'bg-emerald-500/20 text-emerald-300',
    saved_property: 'bg-pink-500/20 text-pink-300',
    compared_properties: 'bg-indigo-500/20 text-indigo-300',
    filter_applied: 'bg-orange-500/20 text-orange-300',
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
        colors[type] || 'bg-gray-500/20 text-gray-300'
      }`}
    >
      {icons[type] || <Activity className='w-4 h-4' />}
      {type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
    </div>
  )
}

// =============================================
// BEHAVIOR TRACKING TESTER COMPONENT
// =============================================

function BehaviorTrackingTester() {
  const tracking = useBehaviorTracking({
    enableDebug: true,
    autoCalculateScore: true,
  })
  const [testResults, setTestResults] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addResult = (message: string) => {
    setTestResults((prev) => [
      `[${new Date().toLocaleTimeString()}] ${message}`,
      ...prev.slice(0, 19),
    ])
  }

  const testFunctions = {
    async trackPropertyView() {
      await tracking.trackPropertyView('test-property-123', {
        test: true,
        source: 'test_page',
      })
      addResult('✅ trackPropertyView() - Property view tracked')
    },

    async trackSearch() {
      await tracking.trackSearch('2BHK in Bangalore', {
        city: 'Bangalore',
        bhk: '2',
        priceRange: '50L-1Cr',
        resultsCount: 25,
      })
      addResult('✅ trackSearch() - Search tracked')
    },

    async trackFormInteraction() {
      await tracking.trackFormInteraction('contact_form', 'email_field')
      addResult('✅ trackFormInteraction() - Form interaction tracked')
    },

    async trackContactClick() {
      await tracking.trackContactClick('phone', 'test-property-123')
      addResult('✅ trackContactClick(phone) - Phone click tracked')
      await new Promise((resolve) => setTimeout(resolve, 100))
      await tracking.trackContactClick('email', 'test-property-123')
      addResult('✅ trackContactClick(email) - Email click tracked')
      await new Promise((resolve) => setTimeout(resolve, 100))
      await tracking.trackContactClick('whatsapp', 'test-property-123')
      addResult('✅ trackContactClick(whatsapp) - WhatsApp click tracked')
    },

    async trackPropertySave() {
      await tracking.trackPropertySave('test-property-123')
      addResult('✅ trackPropertySave() - Property save tracked')
    },

    async trackPropertyCompare() {
      await tracking.trackPropertyCompare([
        'test-property-123',
        'test-property-456',
        'test-property-789',
      ])
      addResult('✅ trackPropertyCompare() - Property comparison tracked')
    },

    async trackFilterApplied() {
      await tracking.trackFilterApplied('price_range', {
        min: 5000000,
        max: 10000000,
      })
      addResult('✅ trackFilterApplied() - Filter application tracked')
    },

    async flush() {
      await tracking.flush()
      addResult('✅ flush() - Events flushed to database')
    },
  }

  async function runAllTests() {
    setIsRunning(true)
    setTestResults([])
    addResult('🚀 Starting comprehensive behavior tracking tests...')

    try {
      // Test all functions sequentially
      for (const [name, fn] of Object.entries(testFunctions)) {
        try {
          await fn()
          await new Promise((resolve) => setTimeout(resolve, 200)) // Small delay between tests
        } catch (error: any) {
          addResult(`❌ ${name}() - Error: ${error.message}`)
        }
      }

      addResult('✅ All tests completed!')
      addResult(
        `📊 Pending events in queue: ${tracking.pendingCount}`,
      )
    } catch (error: any) {
      addResult(`❌ Test suite error: ${error.message}`)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className='max-w-7xl mx-auto'>
      {/* Test Controls */}
      <div className='backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 mb-8'>
        <h2 className='text-2xl font-bold text-white mb-6 flex items-center gap-3'>
          <Activity className='w-6 h-6 text-gold-500' />
          Test Behavior Tracking Functions
        </h2>

        <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
          <TestButton
            onClick={testFunctions.trackPropertyView}
            disabled={isRunning}
            label='Property View'
          />
          <TestButton
            onClick={testFunctions.trackSearch}
            disabled={isRunning}
            label='Search'
          />
          <TestButton
            onClick={testFunctions.trackFormInteraction}
            disabled={isRunning}
            label='Form Interaction'
          />
          <TestButton
            onClick={testFunctions.trackContactClick}
            disabled={isRunning}
            label='Contact Clicks'
          />
          <TestButton
            onClick={testFunctions.trackPropertySave}
            disabled={isRunning}
            label='Property Save'
          />
          <TestButton
            onClick={testFunctions.trackPropertyCompare}
            disabled={isRunning}
            label='Property Compare'
          />
          <TestButton
            onClick={testFunctions.trackFilterApplied}
            disabled={isRunning}
            label='Filter Applied'
          />
          <TestButton
            onClick={testFunctions.flush}
            disabled={isRunning}
            label='Flush Queue'
          />
        </div>

        <button
          onClick={runAllTests}
          disabled={isRunning}
          className={`
            w-full py-4 rounded-xl font-bold text-lg
            transition-all duration-300
            ${
              isRunning
                ? 'bg-gray-500/50 cursor-not-allowed'
                : 'bg-gradient-to-r from-gold-600 to-gold-500 text-primary-950 hover:shadow-2xl hover:shadow-gold-500/50 hover:-translate-y-1'
            }
          `}
        >
          {isRunning ? 'Running Tests...' : '🚀 Run All Tests'}
        </button>

        {/* Status */}
        <div className='mt-6 p-4 bg-white/5 rounded-xl border border-white/10'>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-gray-400'>Tracking Status:</span>
            <span
              className={`font-semibold ${
                tracking.isTracking ? 'text-emerald-400' : 'text-gray-400'
              }`}
            >
              {tracking.isTracking ? '🟢 Active' : '⚪ Idle'}
            </span>
          </div>
          <div className='flex items-center justify-between text-sm mt-2'>
            <span className='text-gray-400'>Pending Events:</span>
            <span className='font-semibold text-white'>
              {tracking.pendingCount}
            </span>
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className='backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl overflow-hidden'>
        <div className='p-6 border-b border-white/10'>
          <h2 className='text-2xl font-bold text-white flex items-center gap-3'>
            <BarChart3 className='w-6 h-6 text-gold-500' />
            Test Results
          </h2>
        </div>
        <div className='p-6'>
          {testResults.length === 0 ? (
            <div className='text-center text-gray-400 py-12'>
              No tests run yet. Click a test button above to start.
            </div>
          ) : (
            <div className='space-y-2 max-h-96 overflow-y-auto'>
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className='p-3 bg-white/5 rounded-lg text-sm font-mono text-gray-300'
                >
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================
// TEST BUTTON COMPONENT
// =============================================

function TestButton({
  onClick,
  disabled,
  label,
}: {
  onClick: () => void | Promise<void>
  disabled: boolean
  label: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4 py-3 rounded-xl font-semibold text-sm
        transition-all duration-300
        ${
          disabled
            ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
            : 'bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 hover:-translate-y-1'
        }
      `}
    >
      {label}
    </button>
  )
}




