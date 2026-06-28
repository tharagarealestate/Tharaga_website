"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  User, Bell, Plug, Globe,
  Save, MessageSquare, BarChart3,
  Database, CheckCircle2, AlertTriangle, Loader2, Copy, Check, ShieldAlert,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBuilderDataContext } from '../hooks/useBuilderData'
import { getSupabase } from '@/lib/supabase'

interface SettingsSectionProps {
  onNavigate?: (section: string) => void
}

type SettingsTab = 'profile' | 'notifications' | 'integrations' | 'database'

export function SettingsSection({ onNavigate }: SettingsSectionProps) {
  const { builderId, userId, companyName, email, isAdmin } = useBuilderDataContext()
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [profileData, setProfileData] = useState({
    company_name: '',
    contact_email: '',
    phone: '',
    city: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  // Load real profile data from Supabase
  useEffect(() => {
    async function loadProfile() {
      if (!userId) return
      try {
        const supabase = getSupabase()
        const { data: profile } = await supabase
          .from('builder_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()

        if (profile) {
          setProfileData({
            company_name: profile.company_name || '',
            contact_email: profile.contact_email || profile.email || email || '',
            phone: profile.phone || profile.contact_phone || '',
            city: profile.city || profile.location || '',
          })
        } else {
          setProfileData(prev => ({
            ...prev,
            company_name: companyName || '',
            contact_email: email || '',
          }))
        }
      } catch (err) {
        console.error('[Settings] Failed to load profile:', err)
      }
    }
    loadProfile()
  }, [userId, email, companyName])

  // Save profile to Supabase
  const handleSaveProfile = async () => {
    if (!userId) return
    setIsSaving(true)
    setSaveMessage('')
    try {
      const supabase = getSupabase()
      const { error } = await supabase
        .from('builder_profiles')
        .update({
          company_name: profileData.company_name,
          contact_email: profileData.contact_email,
          phone: profileData.phone,
          city: profileData.city,
        })
        .eq('user_id', userId)

      if (error) throw error
      setSaveMessage('Profile saved successfully')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err) {
      console.error('[Settings] Save failed:', err)
      setSaveMessage('Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const tabs: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'profile',       label: 'Profile',       icon: User     },
    { id: 'notifications', label: 'Notifications', icon: Bell     },
    { id: 'integrations',  label: 'Integrations',  icon: Plug     },
    ...(isAdmin ? [{ id: 'database' as SettingsTab, label: 'DB Status', icon: Database }] : []),
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {isAdmin ? 'Admin settings — Manage platform preferences' : 'Manage your account and preferences'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tabs */}
        <div className="space-y-1">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
                  activeTab === tab.id ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50')}>
                <Icon className={cn('w-4 h-4', activeTab === tab.id ? 'text-amber-400' : 'text-zinc-500')} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-6 space-y-5">
              <h2 className="text-base font-semibold text-zinc-100">Business Profile</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Company Name</label>
                  <input className="w-full px-3 py-2 bg-zinc-900/80 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-amber-500/40"
                    value={profileData.company_name}
                    onChange={(e) => setProfileData(p => ({ ...p, company_name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Contact Email</label>
                  <input className="w-full px-3 py-2 bg-zinc-900/80 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-amber-500/40"
                    value={profileData.contact_email}
                    onChange={(e) => setProfileData(p => ({ ...p, contact_email: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Phone</label>
                  <input className="w-full px-3 py-2 bg-zinc-900/80 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-amber-500/40"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Location</label>
                  <input className="w-full px-3 py-2 bg-zinc-900/80 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-amber-500/40"
                    value={profileData.city}
                    onChange={(e) => setProfileData(p => ({ ...p, city: e.target.value }))} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleSaveProfile} disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
                  <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                {saveMessage && (
                  <span className={cn('text-sm', saveMessage.includes('success') ? 'text-emerald-400' : 'text-red-400')}>
                    {saveMessage}
                  </span>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-zinc-100">Notification Preferences</h2>
              {[
                { label: 'New lead alerts', description: 'Get notified when a new lead is captured' },
                { label: 'Hot lead alerts', description: 'Instant notification when a lead scores above 80' },
                { label: 'Site visit reminders', description: 'Reminder 24 hours before scheduled visits' },
                { label: 'Weekly report', description: 'Receive weekly analytics summary via email' },
                { label: 'Marketing campaign updates', description: 'Campaign performance notifications' },
              ].map(notification => (
                <div key={notification.label} className="flex items-center justify-between py-3 border-b border-zinc-800/30 last:border-0">
                  <div>
                    <p className="text-sm text-zinc-200">{notification.label}</p>
                    <p className="text-xs text-zinc-500">{notification.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-9 h-5 bg-zinc-700 rounded-full peer peer-checked:bg-amber-500 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                  </label>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'database' && isAdmin && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <DbStatusPanel />
            </motion.div>
          )}

          {activeTab === 'integrations' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <h2 className="text-base font-semibold text-zinc-100 mb-4">Connected Services</h2>
              {[
                { name: 'WhatsApp Business', description: 'Send messages to leads via WhatsApp', connected: false, icon: MessageSquare },
                { name: 'Google Ads', description: 'Import leads from Google Ads campaigns', connected: false, icon: Globe },
                { name: 'Facebook Leads', description: 'Sync leads from Facebook Lead Ads', connected: false, icon: Globe },
                { name: 'Google Analytics', description: 'Track website visitor behavior', connected: false, icon: BarChart3 },
              ].map(integration => {
                const Icon = integration.icon
                return (
                  <div key={integration.name} className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-zinc-800/50 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-zinc-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-200">{integration.name}</p>
                        <p className="text-xs text-zinc-500">{integration.description}</p>
                      </div>
                    </div>
                    <button className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      integration.connected
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                    )}>
                      {integration.connected ? 'Connected' : 'Connect'}
                    </button>
                  </div>
                )
              })}
            </motion.div>
          )}

        </div>
      </div>
    </div>
  )
}

// ─── Admin: DB Status Panel ───────────────────────────────────────────────────

interface DbResult {
  table: string
  existed: boolean
  created: boolean
  error: string | null
  sql: string
}
interface DbResponse {
  success: boolean
  results: DbResult[]
  action_required?: boolean
  instructions?: string
  sql_to_run?: string
  supabase_url?: string
}

function DbStatusPanel() {
  const [status,  setStatus]  = useState<DbResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied,  setCopied]  = useState(false)

  const runCheck = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { session } } = await getSupabase().auth.getSession()
      const token = session?.access_token ?? ''
      const res = await fetch('/api/admin/setup-db', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data: DbResponse = await res.json()
      setStatus(data)
    } catch (e: any) {
      setStatus({ success: false, results: [], action_required: true, instructions: e?.message })
    } finally {
      setLoading(false)
    }
  }, [])

  const copySQL = () => {
    if (!status?.sql_to_run) return
    navigator.clipboard.writeText(status.sql_to_run).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">Database Status</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Check and provision required tables</p>
        </div>
        <button
          onClick={runCheck}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/20 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
          {loading ? 'Checking…' : 'Run check'}
        </button>
      </div>

      {!status && !loading && (
        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-6 text-center text-zinc-500 text-sm">
          Click "Run check" to verify database tables
        </div>
      )}

      {status && (
        <div className="space-y-3">
          {status.results.map(r => (
            <div key={r.table}
              className={cn(
                'flex items-start gap-3 p-4 rounded-xl border',
                r.existed || r.created
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-red-500/5 border-red-500/20',
              )}
            >
              {r.existed || r.created
                ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                : <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono font-medium text-zinc-200">{r.table}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {r.existed  && 'Table exists ✓'}
                  {!r.existed && r.created && 'Created successfully ✓'}
                  {!r.existed && !r.created && `Missing — manual SQL required${r.error ? ` (${r.error})` : ''}`}
                </p>
              </div>
            </div>
          ))}

          {status.action_required && status.sql_to_run && (
            <div className="bg-zinc-900/60 border border-amber-500/20 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <p className="text-sm font-semibold text-amber-300">Manual action required</p>
              </div>
              <p className="text-xs text-zinc-400">{status.instructions}</p>
              <pre className="text-[11px] font-mono text-zinc-300 bg-black/40 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {status.sql_to_run}
              </pre>
              <div className="flex gap-3">
                <button
                  onClick={copySQL}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs hover:bg-zinc-700 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy SQL'}
                </button>
                {status.supabase_url && (
                  <a
                    href={status.supabase_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs hover:bg-emerald-500/20 transition-colors"
                  >
                    Open SQL Editor ↗
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
