'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { User, Building2, Bell, CreditCard, Shield, Users, Palette, Zap, CheckCircle2, AlertCircle, X } from 'lucide-react'

export default function BuilderSettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('profile')
  const [calendarStatus, setCalendarStatus] = useState<{
    connected: boolean
    calendar_name?: string
    last_sync_at?: string
    total_events_synced?: number
  } | null>(null)
  const [calendarMessage, setCalendarMessage] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Check for calendar and Zoho callback messages
  useEffect(() => {
    const calendarError = searchParams.get('calendar_error')
    const calendarConnected = searchParams.get('calendar_connected')
    const zohoError = searchParams.get('zoho_error')
    const zohoConnected = searchParams.get('zoho_connected')
    const zohoDescription = searchParams.get('description')
    const zohoMessage = searchParams.get('message')

    if (calendarError) {
      setCalendarMessage({
        type: 'error',
        message: decodeURIComponent(calendarError),
      })
      setActiveTab('integrations')
      // Clear error from URL
      router.replace('/builder/settings', { scroll: false })
      // Clear message after 5 seconds
      setTimeout(() => setCalendarMessage(null), 5000)
    }

    if (calendarConnected) {
      setCalendarMessage({
        type: 'success',
        message: 'Calendar connected successfully!',
      })
      setActiveTab('integrations')
      // Refresh calendar status
      fetchCalendarStatus()
      // Clear success from URL
      router.replace('/builder/settings', { scroll: false })
      // Clear message after 5 seconds
      setTimeout(() => setCalendarMessage(null), 5000)
    }

    // Handle Zoho callback messages
    if (zohoError) {
      const errorMsg = zohoDescription || zohoMessage || zohoError;
      setCalendarMessage({
        type: 'error',
        message: `Zoho CRM: ${decodeURIComponent(errorMsg)}`,
      });
      setActiveTab('integrations');
      router.replace('/builder/settings', { scroll: false });
      setTimeout(() => setCalendarMessage(null), 8000);
    }

    if (zohoConnected === 'true') {
      setCalendarMessage({
        type: 'success',
        message: 'Zoho CRM connected successfully!',
      });
      setActiveTab('integrations');
      router.replace('/builder/settings', { scroll: false });
      setTimeout(() => setCalendarMessage(null), 5000);
    }

    // Check for tab parameter
    const tabParam = searchParams.get('tab')
    if (tabParam) {
      const validTabs = ['profile', 'company', 'notifications', 'billing', 'security', 'team', 'preferences', 'integrations']
      if (validTabs.includes(tabParam)) {
        setActiveTab(tabParam)
      }
    }
  }, [searchParams, router])

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'company', label: 'Company', icon: Building2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'integrations', label: 'Integrations', icon: Zap }
  ]

  // Fetch calendar status
  const fetchCalendarStatus = async () => {
    try {
      const response = await fetch('/api/calendar/status', {
        credentials: 'include',
      })
      const data = await response.json()
      if (data.success) {
        setCalendarStatus(data)
      }
    } catch (error) {
      console.error('Error fetching calendar status:', error)
    }
  }

  // Fetch calendar status on mount and when integrations tab is active
  useEffect(() => {
    if (activeTab === 'integrations') {
      fetchCalendarStatus()
    }
  }, [activeTab])

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
      {/* Glass Header - positioned below static header */}
      <div className='bg-white/70 backdrop-blur-xl border-b border-gray-200/50 sticky top-[60px] z-30'>
        <div className='max-w-7xl mx-auto px-6 py-6'>
          <h1 className='text-3xl font-bold bg-gradient-to-r from-primary-900 to-primary-700 bg-clip-text text-transparent'>
            Settings
          </h1>
          <p className='text-gray-600 mt-1'>Manage your account and preferences</p>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-6 py-8'>
        <div className='grid lg:grid-cols-4 gap-8'>
          {/* Sidebar */}
          <div className='lg:col-span-1'>
            <nav className='bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-2 space-y-1'>
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className='w-5 h-5' />
                    <span className='font-medium'>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div className='lg:col-span-3'>
            {/* Calendar Status Message */}
            {calendarMessage && (
              <div
                className={`mb-6 p-4 rounded-xl border flex items-center justify-between ${
                  calendarMessage.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <div className='flex items-center gap-3'>
                  {calendarMessage.type === 'success' ? (
                    <CheckCircle2 className='w-5 h-5 text-emerald-600' />
                  ) : (
                    <AlertCircle className='w-5 h-5 text-rose-600' />
                  )}
                  <p className='font-medium'>{calendarMessage.message}</p>
                </div>
                <button
                  onClick={() => setCalendarMessage(null)}
                  className='text-gray-400 hover:text-gray-600 transition-colors'
                >
                  <X className='w-5 h-5' />
                </button>
              </div>
            )}

            <div className='bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-8'>
              {activeTab === 'profile' && <ProfileSettings />}
              {activeTab === 'company' && <CompanySettings />}
              {activeTab === 'notifications' && <NotificationSettings />}
              {activeTab === 'billing' && <BillingSettings />}
              {activeTab === 'security' && <SecuritySettings />}
              {activeTab === 'team' && <TeamSettings />}
              {activeTab === 'preferences' && <PreferenceSettings />}
              {activeTab === 'integrations' && (
                <IntegrationSettings calendarStatus={calendarStatus} onStatusChange={fetchCalendarStatus} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfileSettings() {
  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-bold text-gray-900 mb-2'>Profile Information</h2>
        <p className='text-gray-600'>Update your personal details and how others see you</p>
      </div>

      {/* Profile Photo */}
      <div className='flex items-center gap-6 pb-6 border-b border-gray-200'>
        <div className='relative group'>
          <div className='w-24 h-24 rounded-full bg-gradient-to-br from-gold-600 to-gold-500 flex items-center justify-center text-white text-3xl font-bold'>
            RK
          </div>
          <button className='absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-medium'>
            Change
          </button>
        </div>

        <div>
          <h3 className='font-semibold text-gray-900 mb-1'>Profile Photo</h3>
          <p className='text-sm text-gray-600 mb-3'>This will be displayed on your profile</p>
          <div className='flex gap-2'>
            <button className='px-4 py-2 bg-gradient-to-r from-gold-600 to-gold-500 text-white font-medium rounded-lg text-sm hover:shadow-lg hover:-translate-y-1 transition-all'>
              Upload New
            </button>
            <button className='px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg text-sm hover:bg-gray-200 transition-all'>
              Remove
            </button>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className='grid grid-cols-2 gap-6'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>First Name</label>
          <input
            type='text'
            defaultValue='Rajesh'
            className='w-full px-4 py-3 bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Last Name</label>
          <input
            type='text'
            defaultValue='Kumar'
            className='w-full px-4 py-3 bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500'
          />
        </div>

        <div className='col-span-2'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Email Address</label>
          <input
            type='email'
            defaultValue='rajesh@skylinebuilders.com'
            className='w-full px-4 py-3 bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500'
          />
        </div>

        <div className='col-span-2'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Phone Number</label>
          <input
            type='tel'
            defaultValue='+91 98765 43210'
            className='w-full px-4 py-3 bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500'
          />
        </div>

        <div className='col-span-2'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Bio</label>
          <textarea
            rows={4}
            defaultValue='Founder & CEO of Skyline Builders. 15+ years in real estate development.'
            className='w-full px-4 py-3 bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500'
          />
        </div>
      </div>

      {/* Save Button */}
      <div className='flex justify-end pt-6 border-t border-gray-200'>
        <button className='px-8 py-3 bg-gradient-to-r from-gold-600 to-gold-500 text-white font-semibold rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all'>
          Save Changes
        </button>
      </div>
    </div>
  )
}

function CompanySettings() {
  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-bold text-gray-900 mb-2'>Company Information</h2>
        <p className='text-gray-600'>Manage your company profile and business details</p>
      </div>

      {/* Company Logo */}
      <div className='flex items-center gap-6 pb-6 border-b border-gray-200'>
        <div className='relative group'>
          <div className='w-24 h-24 rounded-xl bg-gradient-to-br from-primary-700 to-primary-600 flex items-center justify-center text-white text-2xl font-bold'>
            SB
          </div>
          <button className='absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-medium'>
            Change
          </button>
        </div>

        <div>
          <h3 className='font-semibold text-gray-900 mb-1'>Company Logo</h3>
          <p className='text-sm text-gray-600 mb-3'>Upload your company logo</p>
          <div className='flex gap-2'>
            <button className='px-4 py-2 bg-gradient-to-r from-gold-600 to-gold-500 text-white font-medium rounded-lg text-sm hover:shadow-lg hover:-translate-y-1 transition-all'>
              Upload Logo
            </button>
            <button className='px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg text-sm hover:bg-gray-200 transition-all'>
              Remove
            </button>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className='grid grid-cols-2 gap-6'>
        <div className='col-span-2'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Company Name</label>
          <input
            type='text'
            defaultValue='Skyline Builders'
            className='w-full px-4 py-3 bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Registration Number</label>
          <input
            type='text'
            defaultValue='U45200MH2010PTC123456'
            className='w-full px-4 py-3 bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>RERA Number</label>
          <input
            type='text'
            defaultValue='MHMRE-123456'
            className='w-full px-4 py-3 bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500'
          />
        </div>

        <div className='col-span-2'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Company Address</label>
          <textarea
            rows={3}
            defaultValue='123 Business Park, Anna Nagar, Chennai - 600040'
            className='w-full px-4 py-3 bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Website</label>
          <input
            type='url'
            defaultValue='https://skylinebuilders.com'
            className='w-full px-4 py-3 bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Phone Number</label>
          <input
            type='tel'
            defaultValue='+91 22 1234 5678'
            className='w-full px-4 py-3 bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500'
          />
        </div>

        <div className='col-span-2'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>About Company</label>
          <textarea
            rows={4}
            defaultValue='Skyline Builders is a leading real estate development company with over 15 years of experience in creating premium residential and commercial spaces in Chennai.'
            className='w-full px-4 py-3 bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500'
          />
        </div>
      </div>

      {/* Save Button */}
      <div className='flex justify-end pt-6 border-t border-gray-200'>
        <button className='px-8 py-3 bg-gradient-to-r from-gold-600 to-gold-500 text-white font-semibold rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all'>
          Save Changes
        </button>
      </div>
    </div>
  )
}

function NotificationSettings() {
  const [notifications, setNotifications] = useState({
    email: {
      leads: true,
      payments: true,
      updates: false,
      marketing: false
    },
    sms: {
      leads: true,
      payments: false,
      reminders: true
    },
    push: {
      leads: true,
      payments: true,
      updates: true
    }
  })

  const toggleNotification = (category: 'email' | 'sms' | 'push', key: string) => {
    setNotifications((prev) => {
      const categoryData = prev[category] as Record<string, boolean>
      return {
        ...prev,
        [category]: {
          ...categoryData,
          [key]: !categoryData[key],
        },
      }
    })
  }

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-bold text-gray-900 mb-2'>Notification Preferences</h2>
        <p className='text-gray-600'>Choose how you want to be notified about important events</p>
      </div>

      {/* Email Notifications */}
      <div className='bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl p-6'>
        <h3 className='text-lg font-bold text-gray-900 mb-4 flex items-center gap-2'>
          <div className='w-2 h-2 rounded-full bg-gradient-to-r from-gold-600 to-gold-500'></div>
          Email Notifications
        </h3>
        <div className='space-y-4'>
          {Object.entries(notifications.email).map(([key, value]) => (
            <div key={key} className='flex items-center justify-between'>
              <div>
                <div className='font-medium text-gray-900 capitalize'>{key.replace('_', ' ')}</div>
                <div className='text-sm text-gray-600'>Receive email notifications for {key}</div>
              </div>
                            <button
                onClick={() => toggleNotification('email', key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  value ? 'bg-gradient-to-r from-gold-600 to-gold-500' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  value ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SMS Notifications */}
      <div className='bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl p-6'>
        <h3 className='text-lg font-bold text-gray-900 mb-4 flex items-center gap-2'>
          <div className='w-2 h-2 rounded-full bg-gradient-to-r from-primary-600 to-primary-500'></div>
          SMS Notifications
        </h3>
        <div className='space-y-4'>
          {Object.entries(notifications.sms).map(([key, value]) => (
            <div key={key} className='flex items-center justify-between'>
              <div>
                <div className='font-medium text-gray-900 capitalize'>{key.replace('_', ' ')}</div>
                <div className='text-sm text-gray-600'>Receive SMS notifications for {key}</div>
              </div>
                            <button
                onClick={() => toggleNotification('sms', key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  value ? 'bg-gradient-to-r from-gold-600 to-gold-500' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  value ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Push Notifications */}
      <div className='bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl p-6'>
        <h3 className='text-lg font-bold text-gray-900 mb-4 flex items-center gap-2'>
          <div className='w-2 h-2 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500'></div>
          Push Notifications
        </h3>
        <div className='space-y-4'>
          {Object.entries(notifications.push).map(([key, value]) => (
            <div key={key} className='flex items-center justify-between'>
              <div>
                <div className='font-medium text-gray-900 capitalize'>{key.replace('_', ' ')}</div>
                <div className='text-sm text-gray-600'>Receive push notifications for {key}</div>
              </div>
                            <button
                onClick={() => toggleNotification('push', key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  value ? 'bg-gradient-to-r from-gold-600 to-gold-500' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  value ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className='flex justify-end pt-6 border-t border-gray-200'>
        <button className='px-8 py-3 bg-gradient-to-r from-gold-600 to-gold-500 text-white font-semibold rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all'>
          Save Preferences
        </button>
      </div>
    </div>
  )
}

function BillingSettings() {
  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-bold text-gray-900 mb-2'>Billing & Subscription</h2>
        <p className='text-gray-600'>Manage your subscription and payment methods</p>
      </div>
      <div className='relative overflow-hidden bg-gradient-to-br from-gold-600 to-gold-500 rounded-2xl p-8 text-white'>
        <div className='absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl' />
        <div className='relative'>
          <div className='flex items-start justify-between mb-6'>
            <div>
              <div className='text-sm font-medium opacity-90 mb-2'>Current Plan</div>
              <h3 className='text-3xl font-bold'>Builder Pro</h3>
              <p className='text-sm opacity-90 mt-1'>Subscription Model • Monthly</p>
            </div>
            <button className='px-6 py-2 bg-white text-gold-600 font-semibold rounded-lg hover:shadow-lg transition-all'>
              Upgrade
            </button>
          </div>
          <div className='grid grid-cols-3 gap-6 pt-6 border-t border-white/20'>
            <div>
              <div className='text-2xl font-bold'>₹4,999</div>
              <div className='text-sm opacity-75'>per month</div>
            </div>
            <div>
              <div className='text-2xl font-bold'>∞</div>
              <div className='text-sm opacity-75'>Leads</div>
            </div>
            <div>
              <div className='text-2xl font-bold'>50</div>
              <div className='text-sm opacity-75'>Properties</div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <h3 className='text-lg font-bold text-gray-900 mb-4'>Payment Methods</h3>
        <div className='space-y-3'>
          <div className='flex items-center justify-between p-4 bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl'>
            <div className='flex items-center gap-4'>
              <div className='w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-500 rounded flex items-center justify-center text-white text-xs font-bold'>
                VISA
              </div>
              <div>
                <div className='font-medium text-gray-900'>•••• 4242</div>
                <div className='text-sm text-gray-600'>Expires 12/25</div>
              </div>
            </div>
            <div className='flex gap-2'>
              <button className='px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-all'>
                Edit
              </button>
              <button className='px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all'>
                Remove
              </button>
            </div>
          </div>
        </div>
        <button className='mt-4 px-6 py-3 border-2 border-dashed border-gray-300 text-gray-700 font-medium rounded-xl hover:border-gold-500 hover:text-gold-600 transition-all w-full'>
          + Add Payment Method
        </button>
      </div>
      <div>
        <h3 className='text-lg font-bold text-gray-900 mb-4'>Billing History</h3>
        <div className='bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl overflow-hidden'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-gray-200'>
                <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>Invoice</th>
                <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>Date</th>
                <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>Amount</th>
                <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>Status</th>
                <th className='px-6 py-4'></th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((i) => (
                <tr key={i} className='border-b border-gray-100 hover:bg-gray-50/50'>
                  <td className='px-6 py-4 text-sm font-medium text-gray-900'>#INV-00{i}</td>
                  <td className='px-6 py-4 text-sm text-gray-600'>Oct {i}, 2025</td>
                  <td className='px-6 py-4 text-sm font-semibold text-gray-900'>₹5,899</td>
                  <td className='px-6 py-4'>
                    <span className='px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full'>
                      Paid
                    </span>
                  </td>
                  <td className='px-6 py-4 text-right'>
                    <button className='text-sm font-medium text-gold-600 hover:text-gold-700'>
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function SecuritySettings() {
  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-bold text-gray-900 mb-2'>Security Settings</h2>
        <p className='text-gray-600'>Manage your account security and privacy</p>
      </div>
      <div className='bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl p-6'>
        <h3 className='text-lg font-bold text-gray-900 mb-4'>Change Password</h3>
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Current Password</label>
            <input type='password' className='w-full px-4 py-3 bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500' />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>New Password</label>
            <input type='password' className='w-full px-4 py-3 bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500' />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Confirm New Password</label>
            <input type='password' className='w-full px-4 py-3 bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500' />
          </div>
          <button className='px-6 py-2 bg-gradient-to-r from-gold-600 to-gold-500 text-white font-medium rounded-lg hover:shadow-lg hover:-translate-y-1 transition-all'>
            Update Password
          </button>
        </div>
      </div>
      <div className='bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl p-6'>
        <div className='flex items-center justify-between mb-4'>
          <div>
            <h3 className='text-lg font-bold text-gray-900'>Two-Factor Authentication</h3>
            <p className='text-sm text-gray-600 mt-1'>Add an extra layer of security to your account</p>
          </div>
          <button className='px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all'>
            Enable 2FA
          </button>
        </div>
      </div>
      <div className='bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl p-6'>
        <h3 className='text-lg font-bold text-gray-900 mb-4'>Active Sessions</h3>
        <div className='space-y-3'>
          {[
            { device: 'Chrome on Windows', location: 'Chennai, India', current: true },
            { device: 'Safari on iPhone', location: 'Chennai, India', current: false },
            { device: 'Firefox on Mac', location: 'Chennai, India', current: false }
          ].map((session, idx) => (
            <div key={idx} className='flex items-center justify-between p-4 border border-gray-200/50 rounded-xl'>
              <div>
                <div className='font-medium text-gray-900 flex items-center gap-2'>
                  {session.device}
                  {session.current && (
                    <span className='px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full'>
                      Current
                    </span>
                  )}
                </div>
                <div className='text-sm text-gray-600 mt-1'>{session.location} • Last active 2 hours ago</div>
              </div>
              {!session.current && (
                <button className='px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all'>
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className='bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl p-6'>
        <div className='flex items-center justify-between mb-4'>
          <div>
            <h3 className='text-lg font-bold text-gray-900'>API Keys</h3>
            <p className='text-sm text-gray-600 mt-1'>Manage your API access keys</p>
          </div>
          <button className='px-6 py-2 bg-gradient-to-r from-gold-600 to-gold-500 text-white font-medium rounded-lg hover:shadow-lg hover:-translate-y-1 transition-all'>
            Generate Key
          </button>
        </div>
        <div className='text-sm text-gray-600'>No API keys found. Generate one to get started.</div>
      </div>
    </div>
  )
}

function TeamSettings() {
  const members = [
    { name: 'Rajesh Kumar', email: 'rajesh@skylinebuilders.com', role: 'Owner', status: 'active' },
    { name: 'Priya Sharma', email: 'priya@skylinebuilders.com', role: 'Manager', status: 'active' },
    { name: 'Amit Patel', email: 'amit@skylinebuilders.com', role: 'Agent', status: 'active' },
    { name: 'Sneha Desai', email: 'sneha@skylinebuilders.com', role: 'Agent', status: 'pending' }
  ]

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>Team Management</h2>
          <p className='text-gray-600'>Invite and manage your team members</p>
        </div>
        <button className='px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 text-white font-semibold rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all'>
          + Invite Member
        </button>
      </div>
      <div className='grid grid-cols-3 gap-4'>
        <div className='bg-gradient-to-br from-gold-600/10 to-gold-500/5 backdrop-blur-md border border-gold-500/20 rounded-xl p-4'>
          <div className='text-2xl font-bold text-gray-900'>4</div>
          <div className='text-sm text-gray-600'>Total Members</div>
        </div>
        <div className='bg-gradient-to-br from-emerald-600/10 to-emerald-500/5 backdrop-blur-md border border-emerald-500/20 rounded-xl p-4'>
          <div className='text-2xl font-bold text-gray-900'>3</div>
          <div className='text-sm text-gray-600'>Active</div>
        </div>
        <div className='bg-gradient-to-br from-amber-600/10 to-amber-500/5 backdrop-blur-md border border-amber-500/20 rounded-xl p-4'>
          <div className='text-2xl font-bold text-gray-900'>1</div>
          <div className='text-sm text-gray-600'>Pending</div>
        </div>
      </div>
      <div className='bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl overflow-hidden'>
        <table className='w-full'>
          <thead>
            <tr className='border-b border-gray-200'>
              <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>Member</th>
              <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>Role</th>
              <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>Status</th>
              <th className='px-6 py-4 text-right text-sm font-semibold text-gray-700'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member, idx) => (
              <tr key={idx} className='border-b border-gray-100 hover:bg-gray-50/50'>
                <td className='px-6 py-4'>
                  <div>
                    <div className='font-medium text-gray-900'>{member.name}</div>
                    <div className='text-sm text-gray-600'>{member.email}</div>
                  </div>
                </td>
                <td className='px-6 py-4'>
                  <span className='px-3 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full'>
                    {member.role}
                  </span>
                </td>
                <td className='px-6 py-4'>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    member.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {member.status}
                  </span>
                </td>
                <td className='px-6 py-4 text-right'>
                  <div className='flex gap-2 justify-end'>
                    <button className='px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-all'>
                      Edit
                    </button>
                    <button className='px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all'>
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className='bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl p-6'>
        <h3 className='text-lg font-bold text-gray-900 mb-4'>Roles & Permissions</h3>
        <div className='space-y-4'>
          {[
            { role: 'Owner', desc: 'Full access to all features and settings' },
            { role: 'Manager', desc: 'Can manage leads, properties, and team members' },
            { role: 'Agent', desc: 'Can view and manage assigned leads and properties' }
          ].map((item, idx) => (
            <div key={idx} className='flex items-start justify-between p-4 border border-gray-200/50 rounded-xl'>
              <div>
                <div className='font-medium text-gray-900'>{item.role}</div>
                <div className='text-sm text-gray-600 mt-1'>{item.desc}</div>
              </div>
              <button className='px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-all'>
                Edit
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PreferenceSettings() {
  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'en',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    currency: 'INR',
    emailDigest: 'daily'
  })

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-bold text-gray-900 mb-2'>Preferences</h2>
        <p className='text-gray-600'>Customize your dashboard experience</p>
      </div>
      <div className='bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl p-6'>
        <h3 className='text-lg font-bold text-gray-900 mb-4'>Appearance</h3>
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Theme</label>
            <div className='flex gap-3'>
              {['light', 'dark', 'auto'].map((theme) => (
                <button
                  key={theme}
                  onClick={() => setPreferences({ ...preferences, theme })}
                  className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
                    preferences.theme === theme
                      ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className='bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl p-6'>
        <h3 className='text-lg font-bold text-gray-900 mb-4'>Language & Region</h3>
        <div className='grid grid-cols-2 gap-6'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Language</label>
            <select
              value={preferences.language}
              onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
              className='w-full px-4 py-3 bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500'
            >
              <option value='en'>English</option>
              <option value='hi'>Hindi</option>
              <option value='mr'>Marathi</option>
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Timezone</label>
            <select
              value={preferences.timezone}
              onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
              className='w-full px-4 py-3 bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500'
            >
              <option value='Asia/Kolkata'>Asia/Kolkata (IST)</option>
              <option value='Asia/Dubai'>Asia/Dubai (GST)</option>
              <option value='America/New_York'>America/New_York (EST)</option>
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Date Format</label>
            <select
              value={preferences.dateFormat}
              onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
              className='w-full px-4 py-3 bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500'
            >
              <option value='DD/MM/YYYY'>DD/MM/YYYY</option>
              <option value='MM/DD/YYYY'>MM/DD/YYYY</option>
              <option value='YYYY-MM-DD'>YYYY-MM-DD</option>
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Currency</label>
            <select
              value={preferences.currency}
              onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
              className='w-full px-4 py-3 bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500'
            >
              <option value='INR'>INR (₹)</option>
            </select>
          </div>
        </div>
      </div>
      <div className='bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl p-6'>
        <h3 className='text-lg font-bold text-gray-900 mb-4'>Email Digest</h3>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Frequency</label>
          <select
            value={preferences.emailDigest}
            onChange={(e) => setPreferences({ ...preferences, emailDigest: e.target.value })}
            className='w-full px-4 py-3 bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500'
          >
            <option value='never'>Never</option>
            <option value='daily'>Daily</option>
            <option value='weekly'>Weekly</option>
            <option value='monthly'>Monthly</option>
          </select>
        </div>
      </div>
      <div className='flex justify-end pt-6 border-t border-gray-200'>
        <button className='px-8 py-3 bg-gradient-to-r from-gold-600 to-gold-500 text-white font-semibold rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all'>
          Save Preferences
        </button>
      </div>
    </div>
  )
}

function IntegrationSettings({
  calendarStatus,
  onStatusChange,
}: {
  calendarStatus: {
    connected: boolean
    calendar_name?: string
    last_sync_at?: string
    total_events_synced?: number
  } | null
  onStatusChange: () => void
}) {
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [zohoStatus, setZohoStatus] = useState<{
    connected: boolean
    account_name?: string
    last_sync_at?: string
    total_synced?: number
  } | null>(null)
  const [loadingZoho, setLoadingZoho] = useState(true)

  // Determine calendar connection status
  const isCalendarConnected = calendarStatus?.connected || false

  // Fetch Zoho status
  useEffect(() => {
    const fetchZohoStatus = async () => {
      try {
        setLoadingZoho(true)
        const response = await fetch('/api/crm/zoho/status', {
          credentials: 'include',
        })
        const data = await response.json()
        if (data.success) {
          setZohoStatus({
            connected: data.connected,
            account_name: data.account_name,
            last_sync_at: data.last_sync_at,
            total_synced: data.total_synced,
          })
        } else {
          setZohoStatus({ connected: false })
        }
      } catch (error) {
        console.error('Error fetching Zoho status:', error)
        setZohoStatus({ connected: false })
      } finally {
        setLoadingZoho(false)
      }
    }
    fetchZohoStatus()
  }, [])

  const integrations = [
    {
      name: 'Google Calendar',
      desc: 'Sync your calendar events and schedule site visits',
      status: isCalendarConnected ? 'connected' : 'available',
      icon: '📅',
      href: '/builder/settings/calendar',
      calendarStatus,
    },
    {
      name: 'Zoho CRM',
      desc: 'Sync leads and deals with Zoho CRM for seamless management',
      status: zohoStatus?.connected ? 'connected' : 'available',
      icon: '🔗',
      href: '/builder/settings/zoho',
      zohoStatus,
    },
    {
      name: 'WhatsApp Business',
      desc: 'Send automated messages and notifications via WhatsApp',
      status: 'connected',
      icon: '💬',
      href: '/builder/messaging',
    },
    {
      name: 'Zapier',
      desc: 'Connect with 5000+ apps and automate workflows',
      status: 'available',
      icon: '⚡',
      href: '/builder/settings',
    },
    {
      name: 'Slack',
      desc: 'Get real-time notifications in your Slack workspace',
      status: 'available',
      icon: '💼',
      href: '/builder/settings',
    },
    {
      name: 'Email Marketing',
      desc: 'Integrate with Mailchimp, SendGrid, and more',
      status: 'available',
      icon: '📧',
      href: '/builder/settings',
    },
  ]

  // Handle calendar connect
  const handleCalendarConnect = async () => {
    try {
      setConnecting(true)
      const response = await fetch('/api/calendar/connect', {
        credentials: 'include',
      })
      const data = await response.json()

      if (response.ok && data.auth_url) {
        // Redirect to Google OAuth
        window.location.href = data.auth_url
      } else {
        alert(data.error || data.message || 'Failed to connect calendar')
        setConnecting(false)
      }
    } catch (error: any) {
      alert(error.message || 'Failed to connect calendar')
      setConnecting(false)
    }
  }

  // Handle calendar sync
  const handleCalendarSync = async () => {
    try {
      setSyncing(true)
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        credentials: 'include',
      })
      const data = await response.json()

      if (data.success) {
        alert(`Synced ${data.synced} events successfully!`)
        onStatusChange()
      } else {
        alert(data.error || 'Failed to sync calendar')
      }
    } catch (error: any) {
      alert(error.message || 'Failed to sync calendar')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-bold text-gray-900 mb-2'>Integrations</h2>
        <p className='text-gray-600'>Connect your favorite tools and services</p>
      </div>
      <div className='grid md:grid-cols-2 gap-4'>
        {integrations.map((integration, idx) => (
          <div
            key={idx}
            className='bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl p-6 hover:shadow-lg transition-all'
          >
            <div className='flex items-start justify-between mb-4'>
              <div className='flex items-center gap-3'>
                <div className='text-3xl'>{integration.icon}</div>
                <div>
                  <h3 className='font-bold text-gray-900'>{integration.name}</h3>
                  <p className='text-sm text-gray-600 mt-1'>{integration.desc}</p>
                  {/* Calendar Status Info */}
                  {integration.name === 'Google Calendar' && integration.calendarStatus?.connected && (
                    <div className='mt-2 text-xs text-gray-500'>
                      {integration.calendarStatus.calendar_name && (
                        <div>Calendar: {integration.calendarStatus.calendar_name}</div>
                      )}
                      {integration.calendarStatus.total_events_synced !== undefined && (
                        <div>Events synced: {integration.calendarStatus.total_events_synced}</div>
                      )}
                    </div>
                  )}
                  {/* Zoho Status Info */}
                  {integration.name === 'Zoho CRM' && integration.zohoStatus?.connected && (
                    <div className='mt-2 text-xs text-gray-500'>
                      {integration.zohoStatus.account_name && (
                        <div>Account: {integration.zohoStatus.account_name}</div>
                      )}
                      {integration.zohoStatus.total_synced !== undefined && (
                        <div>Records synced: {integration.zohoStatus.total_synced}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className='flex items-center justify-between'>
              <span
                className={`px-3 py-1 text-xs font-medium rounded-full ${
                  integration.status === 'connected'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {integration.status === 'connected' ? 'Connected' : 'Available'}
              </span>
              {integration.name === 'Google Calendar' ? (
                <div className='flex items-center gap-2'>
                  {integration.status === 'connected' ? (
                    <>
                      <button
                        onClick={handleCalendarSync}
                        disabled={syncing}
                        className='px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50'
                      >
                        {syncing ? 'Syncing...' : 'Sync'}
                      </button>
                      <Link
                        href={integration.href as '/' | '/builder/settings' | '/builder/settings/calendar' | '/builder/messaging' | '/builder/settings/zoho'}
                        className='px-4 py-2 text-sm font-medium rounded-lg transition-all bg-gray-100 text-gray-700 hover:bg-gray-200'
                      >
                        Manage
                      </Link>
                    </>
                  ) : (
                    <button
                      onClick={handleCalendarConnect}
                      disabled={connecting}
                      className='px-4 py-2 text-sm font-medium rounded-lg transition-all bg-gradient-to-r from-gold-600 to-gold-500 text-white hover:shadow-lg hover:-translate-y-1 disabled:opacity-50'
                    >
                      {connecting ? 'Connecting...' : 'Connect'}
                    </button>
                  )}
                </div>
              ) : (
                <Link
                  href={integration.href as '/' | '/builder/settings' | '/builder/settings/calendar' | '/builder/messaging' | '/builder/settings/zoho'}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    integration.status === 'connected'
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-gradient-to-r from-gold-600 to-gold-500 text-white hover:shadow-lg hover:-translate-y-1'
                  }`}
                >
                  {integration.status === 'connected' ? 'Manage' : 'Connect'}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className='bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl p-6'>
        <h3 className='text-lg font-bold text-gray-900 mb-4'>API Access</h3>
        <p className='text-sm text-gray-600 mb-4'>
          Use our REST API to integrate Tharaga with your custom applications
        </p>
        <div className='flex gap-3'>
          <button className='px-6 py-2 bg-gradient-to-r from-gold-600 to-gold-500 text-white font-medium rounded-lg hover:shadow-lg hover:-translate-y-1 transition-all'>
            View API Docs
          </button>
          <button className='px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all'>
            Generate API Key
          </button>
        </div>
      </div>
    </div>
  )
}
