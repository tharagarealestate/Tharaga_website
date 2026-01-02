'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { User, Building2, Bell, CreditCard, Shield, Users, Palette, Zap, CheckCircle2, AlertCircle, X } from 'lucide-react'
import { FloatingLabelInput, FloatingLabelTextarea } from '@/components/ui/FloatingLabelInput'
import { BuilderPageWrapper } from '../_components/BuilderPageWrapper'

export default function BuilderSettingsPage() {
  return (
    <Suspense fallback={<div className='min-h-screen flex items-center justify-center'><div className='text-white'>Loading...</div></div>}>
      <BuilderSettingsContent />
    </Suspense>
  )
}

function BuilderSettingsContent() {
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
    <BuilderPageWrapper 
      title="Settings" 
      description="Manage your account and preferences"
      noContainer
    >
      <div className="space-y-6">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar - Design System */}
          <div className="lg:col-span-1">
            <nav className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl p-2 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-amber-500/20 text-amber-300 border-l-2 border-amber-300'
                        : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content Area - Design System Container */}
          <div className="lg:col-span-3 space-y-6">
            {/* Status Message - Design System Alert */}
            {calendarMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 rounded-lg border flex items-center justify-between ${
                  calendarMessage.type === 'success'
                    ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-100'
                    : 'bg-rose-500/20 border-rose-400/50 text-rose-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  {calendarMessage.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-300" />
                  )}
                  <p className="font-medium">{calendarMessage.message}</p>
                </div>
                <button
                  onClick={() => setCalendarMessage(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            <div className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl p-6 sm:p-8">
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
    </BuilderPageWrapper>
  )
}

function ProfileSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Profile Information</h2>
        <p className="text-slate-300">Update your personal details and how others see you</p>
      </div>

      {/* Profile Photo - Design System */}
      <div className="flex items-center gap-6 pb-6 border-b border-slate-700/50">
        <div className='relative group'>
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-600 to-amber-500 flex items-center justify-center text-white text-3xl font-bold">
            RK
          </div>
          <button className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-medium">
            Change
          </button>
        </div>

        <div>
          <h3 className="font-semibold text-white mb-1">Profile Photo</h3>
          <p className="text-sm text-slate-300 mb-3">This will be displayed on your profile</p>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 glow-border text-slate-900 font-semibold rounded-lg text-sm transition-all duration-300">
              Upload New
            </button>
            <button className="px-4 py-2 bg-slate-700/50 glow-border text-slate-200 hover:bg-slate-700 rounded-lg text-sm transition-all">
              Remove
            </button>
          </div>
        </div>
      </div>

      {/* Form Fields with Floating Labels */}
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
        <FloatingLabelInput
          type='text'
          label='First Name'
          defaultValue='Rajesh'
        />
        <FloatingLabelInput
          type='text'
          label='Last Name'
          defaultValue='Kumar'
        />
        <div className='col-span-2'>
          <FloatingLabelInput
            type='email'
            label='Email Address'
            defaultValue='rajesh@skylinebuilders.com'
          />
        </div>
        <div className='col-span-2'>
          <FloatingLabelInput
            type='tel'
            label='Phone Number'
            defaultValue='+91 98765 43210'
          />
        </div>
        <div className='col-span-2'>
          <FloatingLabelTextarea
            rows={4}
            label='Bio'
            defaultValue='Founder & CEO of Skyline Builders. 15+ years in real estate development.'
          />
        </div>
      </div>

      {/* Save Button - Design System */}
      <div className="flex justify-end pt-6 border-t border-slate-700/50">
        <button className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 glow-border text-slate-900 font-semibold rounded-lg transition-all duration-300">
          Save Changes
        </button>
      </div>
    </div>
  )
}

function CompanySettings() {
  const [companyName, setCompanyName] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  // Fetch company data
  useEffect(() => {
    async function fetchCompanyData() {
      try {
        const res = await fetch('/api/builder/company', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          if (data.company) {
            setCompanyName(data.company.name || '')
            setLogoUrl(data.company.logo_url || null)
          }
        }
      } catch (error) {
        console.error('Error fetching company data:', error)
      }
    }
    fetchCompanyData()
  }, [])

  const handleSave = async () => {
    try {
      const res = await fetch('/api/builder/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: companyName }),
      })
      if (res.ok) {
        // Show success message
        alert('Company information saved successfully')
      }
    } catch (error) {
      console.error('Error saving company data:', error)
      alert('Failed to save company information')
    }
  }

  return (
    <div className='space-y-8'>
      {/* Company Logo Section */}
      <div className='flex items-start gap-6'>
        <div className='relative group'>
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt="Company Logo" 
              className='w-24 h-24 rounded-xl object-cover border-2 border-white/20'
            />
          ) : (
            <div className='w-24 h-24 rounded-xl bg-gradient-to-br from-primary-700 to-primary-600 flex items-center justify-center text-white text-2xl font-bold border-2 border-white/20'>
              {companyName ? companyName.substring(0, 2).toUpperCase() : 'SB'}
            </div>
          )}
          <button 
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = 'image/*'
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) {
                  // Handle file upload
                  const formData = new FormData()
                  formData.append('logo', file)
                  try {
                    const res = await fetch('/api/builder/company/logo', {
                      method: 'POST',
                      credentials: 'include',
                      body: formData,
                    })
                    if (res.ok) {
                      const data = await res.json()
                      setLogoUrl(data.logo_url)
                    }
                  } catch (error) {
                    console.error('Error uploading logo:', error)
                  }
                }
              }
              input.click()
            }}
            className='absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-medium cursor-pointer'
          >
            Change
          </button>
        </div>

        <div className='flex-1'>
          <h3 className='font-semibold text-white mb-1 text-lg'>Company Logo</h3>
          <p className='text-sm text-gray-400 mb-4'>Upload your company logo</p>
          <div className='flex gap-3'>
            <button 
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'image/*'
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (file) {
                    const formData = new FormData()
                    formData.append('logo', file)
                    try {
                      const res = await fetch('/api/builder/company/logo', {
                        method: 'POST',
                        credentials: 'include',
                        body: formData,
                      })
                      if (res.ok) {
                        const data = await res.json()
                        setLogoUrl(data.logo_url)
                      }
                    } catch (error) {
                      console.error('Error uploading logo:', error)
                    }
                  }
                }
                input.click()
              }}
              className='px-4 py-2 bg-gradient-to-r from-gold-600 to-gold-500 text-white font-medium rounded-lg text-sm hover:shadow-lg hover:-translate-y-1 transition-all'
            >
              Upload Logo
            </button>
            {logoUrl && (
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/builder/company/logo', {
                      method: 'DELETE',
                      credentials: 'include',
                    })
                    if (res.ok) {
                      setLogoUrl(null)
                    }
                  } catch (error) {
                    console.error('Error removing logo:', error)
                  }
                }}
                className='px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium rounded-lg text-sm hover:bg-white/20 transition-all'
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Company Name Field Only */}
      <div>
        <label className='block text-sm font-medium text-gray-300 mb-2'>
          Company Name
        </label>
        <input
          type='text'
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder='Enter your company name'
          className="w-full px-4 py-2.5 bg-slate-700/50 glow-border rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:glow-border transition-all"
        />
      </div>

      {/* Save Button - Design System */}
      <div className="flex justify-end pt-6 border-t border-slate-700/50">
        <button 
          onClick={handleSave}
          className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 glow-border text-slate-900 font-semibold rounded-lg transition-all duration-300"
        >
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Notification Preferences</h2>
        <p className="text-slate-300">Choose how you want to be notified about important events</p>
      </div>

      {/* Email Notifications - Design System Container */}
      <div className="bg-slate-800/95 glow-border rounded-lg border border-slate-700/50 p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-300"></div>
          Email Notifications
        </h3>
        <div className="space-y-4">
          {Object.entries(notifications.email).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <div className="font-medium text-white capitalize">{key.replace('_', ' ')}</div>
                <div className="text-sm text-slate-400">Receive email notifications for {key}</div>
              </div>
              <button
                onClick={() => toggleNotification('email', key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  value ? 'bg-gradient-to-r from-amber-600 to-amber-500' : 'bg-slate-600'
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

      {/* SMS Notifications - Design System Container */}
      <div className="bg-slate-800/95 glow-border rounded-lg border border-slate-700/50 p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-300"></div>
          SMS Notifications
        </h3>
        <div className="space-y-4">
          {Object.entries(notifications.sms).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <div className="font-medium text-white capitalize">{key.replace('_', ' ')}</div>
                <div className="text-sm text-slate-400">Receive SMS notifications for {key}</div>
              </div>
              <button
                onClick={() => toggleNotification('sms', key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  value ? 'bg-gradient-to-r from-amber-600 to-amber-500' : 'bg-slate-600'
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

      {/* Push Notifications - Design System Container */}
      <div className="bg-slate-800/95 glow-border rounded-lg border border-slate-700/50 p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-300"></div>
          Push Notifications
        </h3>
        <div className="space-y-4">
          {Object.entries(notifications.push).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <div className="font-medium text-white capitalize">{key.replace('_', ' ')}</div>
                <div className="text-sm text-slate-400">Receive push notifications for {key}</div>
              </div>
              <button
                onClick={() => toggleNotification('push', key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  value ? 'bg-gradient-to-r from-amber-600 to-amber-500' : 'bg-slate-600'
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

      {/* Save Button - Design System */}
      <div className="flex justify-end pt-6 border-t border-slate-700/50">
        <button className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 glow-border text-slate-900 font-semibold rounded-lg transition-all duration-300">
          Save Preferences
        </button>
      </div>
    </div>
  )
}

function BillingSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Billing & Subscription</h2>
        <p className="text-slate-300">Manage your subscription and payment methods</p>
      </div>
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-600 to-amber-500 rounded-xl p-8 text-white">
        <div className='absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl' />
        <div className='relative'>
          <div className='flex items-start justify-between mb-6'>
            <div>
              <div className='text-sm font-medium opacity-90 mb-2'>Current Plan</div>
              <h3 className='text-3xl font-bold'>Builder Pro</h3>
              <p className='text-sm opacity-90 mt-1'>Subscription Model • Monthly</p>
            </div>
            <button className="px-6 py-2 bg-white text-amber-600 font-semibold rounded-lg hover:shadow-lg transition-all">
              Upgrade
            </button>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border-white/20'>
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
        <h3 className="text-lg font-bold text-white mb-4">Payment Methods</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-slate-800/95 glow-border rounded-lg border border-slate-700/50">
            <div className='flex items-center gap-4'>
              <div className='w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-500 rounded flex items-center justify-center text-white text-xs font-bold'>
                VISA
              </div>
              <div>
                <div className="font-medium text-white">•••• 4242</div>
                <div className="text-sm text-slate-300">Expires 12/25</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 text-sm font-medium bg-slate-700/50 glow-border text-slate-200 hover:bg-slate-700 rounded-lg transition-all">
                Edit
              </button>
              <button className="px-4 py-2 text-sm font-medium bg-rose-500/20 border border-rose-400/30 text-rose-300 hover:bg-rose-500/30 rounded-lg transition-all">
                Remove
              </button>
            </div>
          </div>
        </div>
        <button className="mt-4 px-6 py-3 border-2 border-dashed border-slate-600/50 text-slate-300 font-medium rounded-lg hover:border-amber-300 hover:text-amber-300 transition-all w-full">
          + Add Payment Method
        </button>
      </div>
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Billing History</h3>
        <div className="bg-slate-800/95 glow-border rounded-lg border border-slate-700/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Invoice</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((i) => (
                <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="px-6 py-4 text-sm font-medium text-white">#INV-00{i}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">Oct {i}, 2025</td>
                  <td className="px-6 py-4 text-sm font-semibold text-white">₹5,899</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-medium rounded-full border border-emerald-400/30">
                      Paid
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-sm font-medium text-amber-300 hover:text-amber-200">
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Security Settings</h2>
        <p className="text-slate-300">Manage your account security and privacy</p>
      </div>
      <div className="bg-slate-800/95 glow-border rounded-lg border border-slate-700/50 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Change Password</h3>
        <div className='space-y-4'>
          <FloatingLabelInput
            type='password'
            label='Current Password'
            helperText='Enter your current password to verify your identity'
          />
          <FloatingLabelInput
            type='password'
            label='New Password'
            helperText='Must be at least 8 characters with letters and numbers'
          />
          <FloatingLabelInput
            type='password'
            label='Confirm New Password'
            helperText='Re-enter your new password to confirm'
          />
          <button className="px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 glow-border text-slate-900 font-semibold rounded-lg transition-all duration-300">
            Update Password
          </button>
        </div>
      </div>
      <div className="bg-slate-800/95 glow-border rounded-lg border border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Two-Factor Authentication</h3>
            <p className="text-sm text-slate-400 mt-1">Add an extra layer of security to your account</p>
          </div>
          <button className="px-6 py-2 bg-slate-700/50 glow-border text-slate-200 hover:bg-slate-700 rounded-lg transition-all">
            Enable 2FA
          </button>
        </div>
      </div>
      <div className="bg-slate-800/95 glow-border rounded-lg border border-slate-700/50 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Active Sessions</h3>
        <div className="space-y-3">
          {[
            { device: 'Chrome on Windows', location: 'Chennai, India', current: true },
            { device: 'Safari on iPhone', location: 'Chennai, India', current: false },
            { device: 'Firefox on Mac', location: 'Chennai, India', current: false }
          ].map((session, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 border border-slate-700/50 rounded-lg">
              <div>
                <div className="font-medium text-white flex items-center gap-2">
                  {session.device}
                  {session.current && (
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-medium rounded-full border border-emerald-400/30">
                      Current
                    </span>
                  )}
                </div>
                <div className="text-sm text-slate-400 mt-1">{session.location} • Last active 2 hours ago</div>
              </div>
              {!session.current && (
                <button className="px-4 py-2 text-sm font-medium bg-rose-500/20 border border-rose-400/30 text-rose-300 hover:bg-rose-500/30 rounded-lg transition-all">
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="bg-slate-800/95 glow-border rounded-lg border border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">API Keys</h3>
            <p className="text-sm text-slate-400 mt-1">Manage your API access keys</p>
          </div>
          <button className="px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 glow-border text-slate-900 font-semibold rounded-lg transition-all duration-300">
            Generate Key
          </button>
        </div>
        <div className="text-sm text-slate-400">No API keys found. Generate one to get started.</div>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Team Management</h2>
          <p className="text-slate-300">Invite and manage your team members</p>
        </div>
        <button className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 glow-border text-slate-900 font-semibold rounded-lg transition-all duration-300">
          + Invite Member
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-6 bg-slate-800/95 glow-border rounded-lg border border-slate-700/50">
          <div className="text-2xl font-bold text-white">4</div>
          <div className="text-sm text-slate-400">Total Members</div>
        </div>
        <div className="p-6 bg-slate-800/95 glow-border rounded-lg border border-slate-700/50">
          <div className="text-2xl font-bold text-white">3</div>
          <div className="text-sm text-slate-400">Active</div>
        </div>
        <div className="p-6 bg-slate-800/95 glow-border rounded-lg border border-slate-700/50">
          <div className="text-2xl font-bold text-white">1</div>
          <div className="text-sm text-slate-400">Pending</div>
        </div>
      </div>
      <div className="bg-slate-800/95 glow-border rounded-lg border border-slate-700/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Member</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Role</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member, idx) => (
              <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-white">{member.name}</div>
                    <div className="text-sm text-slate-400">{member.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-medium rounded-full border border-blue-400/30">
                    {member.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full border ${
                    member.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                  }`}>
                    {member.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex gap-2 justify-end">
                    <button className="px-4 py-2 text-sm font-medium bg-slate-700/50 glow-border text-slate-200 hover:bg-slate-700 rounded-lg transition-all">
                      Edit
                    </button>
                    <button className="px-4 py-2 text-sm font-medium bg-rose-500/20 border border-rose-400/30 text-rose-300 hover:bg-rose-500/30 rounded-lg transition-all">
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-slate-800/95 glow-border rounded-lg border border-slate-700/50 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Roles & Permissions</h3>
        <div className="space-y-4">
          {[
            { role: 'Owner', desc: 'Full access to all features and settings' },
            { role: 'Manager', desc: 'Can manage leads, properties, and team members' },
            { role: 'Agent', desc: 'Can view and manage assigned leads and properties' }
          ].map((item, idx) => (
            <div key={idx} className="flex items-start justify-between p-4 border border-slate-700/50 rounded-lg">
              <div>
                <div className="font-medium text-white">{item.role}</div>
                <div className="text-sm text-slate-400 mt-1">{item.desc}</div>
              </div>
              <button className="px-4 py-2 text-sm font-medium bg-slate-700/50 glow-border text-slate-200 hover:bg-slate-700 rounded-lg transition-all">
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Preferences</h2>
        <p className="text-slate-300">Customize your dashboard experience</p>
      </div>
      <div className="bg-slate-800/95 glow-border rounded-lg border border-slate-700/50 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Appearance</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Theme</label>
            <div className="flex gap-3">
              {['light', 'dark', 'auto'].map((theme) => (
                <button
                  key={theme}
                  onClick={() => setPreferences({ ...preferences, theme })}
                  className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
                    preferences.theme === theme
                      ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-slate-800/95 glow-border rounded-lg border border-slate-700/50 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Language & Region</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Language</label>
            <select
              value={preferences.language}
              onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-700/50 glow-border rounded-lg text-white focus:outline-none focus:glow-border transition-all"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="mr">Marathi</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Timezone</label>
            <select
              value={preferences.timezone}
              onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-700/50 glow-border rounded-lg text-white focus:outline-none focus:glow-border transition-all"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="Asia/Dubai">Asia/Dubai (GST)</option>
              <option value="America/New_York">America/New_York (EST)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Date Format</label>
            <select
              value={preferences.dateFormat}
              onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-700/50 glow-border rounded-lg text-white focus:outline-none focus:glow-border transition-all"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Currency</label>
            <select
              value={preferences.currency}
              onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-700/50 glow-border rounded-lg text-white focus:outline-none focus:glow-border transition-all"
            >
              <option value="INR">INR (₹)</option>
            </select>
          </div>
        </div>
      </div>
      <div className="bg-slate-800/95 glow-border rounded-lg border border-slate-700/50 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Email Digest</h3>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Frequency</label>
          <select
            value={preferences.emailDigest}
            onChange={(e) => setPreferences({ ...preferences, emailDigest: e.target.value })}
            className="w-full px-4 py-2.5 bg-slate-700/50 glow-border rounded-lg text-white focus:outline-none focus:glow-border transition-all"
          >
            <option value="never">Never</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end pt-6 border-t border-slate-700/50">
        <button className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 glow-border text-slate-900 font-semibold rounded-lg transition-all duration-300">
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
        
        // Check if response is ok
        if (!response.ok) {
          // If 401, it might be auth error or just not connected
          if (response.status === 401) {
            const errorData = await response.json().catch(() => ({ error: 'Unauthorized' }))
            // Only set error if it's a real auth error (not just not connected)
            if (errorData.error && errorData.error === 'Unauthorized' && errorData.success === false) {
              // Real auth error - but don't show error in settings page, just set not connected
              console.warn('Authentication error when fetching Zoho status')
            }
          }
          setZohoStatus({ connected: false })
          return
        }

        const data = await response.json()
        
        // Check if request was successful (even if not connected)
        if (data.success !== false) {
          setZohoStatus({
            connected: data.connected || false,
            account_name: data.account?.name || data.account_name || null,
            last_sync_at: data.sync?.last_sync || data.last_sync_at || null,
            total_synced: data.statistics?.total_syncs || data.total_synced || 0,
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Integrations</h2>
        <p className="text-slate-300">Connect your favorite tools and services</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {integrations.map((integration, idx) => (
          <div
            key={idx}
            className="bg-slate-800/95 glow-border rounded-lg border border-slate-700/50 p-6 hover:border-amber-300/50 transition-all"
          >
            <div className='flex items-start justify-between mb-4'>
              <div className='flex items-center gap-3'>
                <div className='text-3xl'>{integration.icon}</div>
                <div>
                  <h3 className="font-bold text-white">{integration.name}</h3>
                  <p className="text-sm text-slate-400 mt-1">{integration.desc}</p>
                  {/* Calendar Status Info */}
                  {integration.name === 'Google Calendar' && integration.calendarStatus?.connected && (
                    <div className="mt-2 text-xs text-slate-500">
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
                    <div className="mt-2 text-xs text-slate-500">
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
            <div className="flex items-center justify-between">
              <span
                className={`px-3 py-1 text-xs font-medium rounded-full border ${
                  integration.status === 'connected'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                    : 'bg-slate-700/50 text-slate-300 border-slate-600/50'
                }`}
              >
                {integration.status === 'connected' ? 'Connected' : 'Available'}
              </span>
              {integration.name === 'Google Calendar' ? (
                <div className="flex items-center gap-2">
                  {integration.status === 'connected' ? (
                    <>
                      <button
                        onClick={handleCalendarSync}
                        disabled={syncing}
                        className="px-3 py-2 text-xs font-medium bg-slate-700/50 glow-border text-slate-200 hover:bg-slate-700 rounded-lg transition-all disabled:opacity-50"
                      >
                        {syncing ? 'Syncing...' : 'Sync'}
                      </button>
                      <Link
                        href={integration.href as '/' | '/builder/settings' | '/builder/settings/calendar' | '/builder/messaging' | '/builder/settings/zoho'}
                        className="px-4 py-2 text-sm font-medium bg-slate-700/50 glow-border text-slate-200 hover:bg-slate-700 rounded-lg transition-all"
                      >
                        Manage
                      </Link>
                    </>
                  ) : (
                    <button
                      onClick={handleCalendarConnect}
                      disabled={connecting}
                      className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 glow-border text-slate-900 font-semibold rounded-lg transition-all duration-300 disabled:opacity-50"
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
                      ? 'bg-slate-700/50 glow-border text-slate-200 hover:bg-slate-700'
                      : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 glow-border text-slate-900 font-semibold'
                  }`}
                >
                  {integration.status === 'connected' ? 'Manage' : 'Connect'}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
