"use client"

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, MapPin, Eye, TrendingUp, Plus,
  LayoutGrid, List, Search, Users,
  Star, Shield, ArrowLeft, RefreshCw, ExternalLink,
  Sparkles, Globe, TrendingUp, FileText, AlertTriangle,
  CheckCircle2, XCircle, Loader2, Upload, Share2, X, Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBuilderDataContext, useRealtimeData, formatINR } from '../hooks/useBuilderData'
import { AdvancedPropertyUploadForm } from '@/components/property/AdvancedPropertyUploadForm'

// ─── Virtual Staging Modal ────────────────────────────────────────────────────
function VirtualStagingModal({ propertyId, propertyTitle, onClose }: {
  propertyId: string; propertyTitle: string; onClose: () => void
}) {
  const [file, setFile]         = useState<File | null>(null)
  const [preview, setPreview]   = useState<string | null>(null)
  const [staged, setStaged]     = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const inputRef                = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    setFile(f); setStaged(null); setError('')
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(f)
  }

  const handleStage = async () => {
    if (!file) return
    setLoading(true); setError('')
    try {
      const form = new FormData()
      form.append('image', file)
      form.append('property_id', propertyId)
      form.append('room_type', 'living_room')
      form.append('style', 'modern')
      const res = await fetch('/api/ai/virtual-staging', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Staging failed')
      setStaged(data.staged_image_url || data.url || '')
    } catch (e: any) {
      setError(e.message || 'Virtual staging failed. Try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4" style={{ background: 'rgba(9,9,11,0.88)', backdropFilter: 'blur(14px)' }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="w-full max-w-2xl bg-zinc-900/95 border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-100">AI Virtual Staging</p>
              <p className="text-[11px] text-zinc-500 truncate max-w-[280px]">{propertyTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all"><X className="w-3.5 h-3.5" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Upload zone */}
          <div onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-zinc-700 hover:border-purple-500/40 rounded-xl p-6 text-center cursor-pointer transition-colors group">
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <Upload className="w-8 h-8 text-zinc-600 group-hover:text-purple-400 mx-auto mb-2 transition-colors" />
            <p className="text-sm text-zinc-400">{file ? file.name : 'Upload empty room photo'}</p>
            <p className="text-[11px] text-zinc-600 mt-1">JPG, PNG up to 10MB</p>
          </div>

          {/* Before / After */}
          {(preview || staged) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Before</p>
                {preview && <img src={preview} alt="Before" className="w-full h-40 object-cover rounded-xl border border-zinc-800" />}
              </div>
              <div className="space-y-1">
                <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">After (AI Staged)</p>
                {staged ? (
                  <img src={staged} alt="AI Staged" className="w-full h-40 object-cover rounded-xl border border-purple-500/30" />
                ) : (
                  <div className="w-full h-40 rounded-xl border border-zinc-800 bg-zinc-800/40 flex items-center justify-center">
                    <p className="text-xs text-zinc-600">Will appear here</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-400 bg-red-500/8 border border-red-500/15 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex justify-end gap-3">
            {staged && (
              <a href={staged} download className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-sm font-medium text-zinc-300 transition-colors">
                <Download className="w-3.5 h-3.5" /> Download
              </a>
            )}
            <button onClick={handleStage} disabled={!file || loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-white transition-colors">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {loading ? 'Staging…' : 'Stage with AI'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Portal Sync Modal ────────────────────────────────────────────────────────
const PORTALS = [
  { id: '99acres',      label: '99acres',      color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  { id: 'magicbricks',  label: 'MagicBricks',  color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20'       },
  { id: 'housing',      label: 'Housing.com',  color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20'     },
]

function PortalSyncModal({ propertyId, propertyTitle, onClose }: {
  propertyId: string; propertyTitle: string; onClose: () => void
}) {
  const [syncState, setSyncState] = useState<Record<string, 'idle' | 'syncing' | 'done' | 'error'>>({
    '99acres': 'idle', 'magicbricks': 'idle', 'housing': 'idle',
  })
  const [lastSync, setLastSync]   = useState<Record<string, string>>({})

  const syncPortal = async (portalId: string) => {
    setSyncState(s => ({ ...s, [portalId]: 'syncing' }))
    try {
      const res = await fetch('/api/portals/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: propertyId, portals: [portalId] }),
      })
      if (!res.ok) throw new Error('Sync failed')
      setSyncState(s => ({ ...s, [portalId]: 'done' }))
      setLastSync(s => ({ ...s, [portalId]: new Date().toLocaleTimeString() }))
    } catch {
      setSyncState(s => ({ ...s, [portalId]: 'error' }))
    }
  }

  const syncAll = () => PORTALS.forEach(p => { if (syncState[p.id] !== 'syncing') syncPortal(p.id) })

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4" style={{ background: 'rgba(9,9,11,0.88)', backdropFilter: 'blur(14px)' }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="w-full max-w-md bg-zinc-900/95 border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
              <Globe className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-100">Portal Sync</p>
              <p className="text-[11px] text-zinc-500 truncate max-w-[220px]">{propertyTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all"><X className="w-3.5 h-3.5" /></button>
        </div>

        <div className="p-5 space-y-3">
          {PORTALS.map(portal => {
            const state = syncState[portal.id]
            return (
              <div key={portal.id} className={cn('flex items-center justify-between p-4 rounded-xl border', portal.bg)}>
                <div>
                  <p className={cn('text-sm font-semibold', portal.color)}>{portal.label}</p>
                  {lastSync[portal.id] && <p className="text-[11px] text-zinc-500 mt-0.5">Synced at {lastSync[portal.id]}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {state === 'done'    && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {state === 'error'   && <XCircle className="w-4 h-4 text-red-400" />}
                  {state === 'syncing' && <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />}
                  <button onClick={() => syncPortal(portal.id)} disabled={state === 'syncing'}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 border border-zinc-700 rounded-lg text-[11px] font-medium text-zinc-300 transition-colors">
                    {state === 'done' ? 'Re-sync' : 'Sync'}
                  </button>
                </div>
              </div>
            )
          })}

          <button onClick={syncAll} disabled={Object.values(syncState).some(s => s === 'syncing')}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-xl text-sm font-semibold text-white transition-colors mt-2">
            <Share2 className="w-4 h-4" /> Sync to All Portals
          </button>
          <p className="text-center text-[11px] text-zinc-600">Syncs listing to 99acres, MagicBricks & Housing.com simultaneously</p>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Price Optimizer Modal ────────────────────────────────────────────────────
function PriceOptimizerModal({ propertyId, propertyTitle, currentPrice, onClose }: {
  propertyId: string; propertyTitle: string; currentPrice: number | null; onClose: () => void
}) {
  const [data, setData]       = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    fetch(`/api/ai/optimize/${propertyId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setError('Could not load price analysis.'); setLoading(false) })
  }, [propertyId])

  const suggested  = data?.suggested_price || data?.recommended_price || null
  const confidence = data?.confidence || data?.score || null
  const reasoning  = data?.reasoning || data?.analysis || ''

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4" style={{ background: 'rgba(9,9,11,0.88)', backdropFilter: 'blur(14px)' }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="w-full max-w-md bg-zinc-900/95 border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-100">AI Price Optimizer</p>
              <p className="text-[11px] text-zinc-500 truncate max-w-[220px]">{propertyTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all"><X className="w-3.5 h-3.5" /></button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-zinc-500">
              <Loader2 className="w-4 h-4 animate-spin" /> <span className="text-sm">Analysing market data…</span>
            </div>
          ) : error ? (
            <p className="text-sm text-red-400 text-center py-6">{error}</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/40">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Current Price</p>
                  <p className="text-lg font-bold text-zinc-300">{currentPrice ? formatINR(currentPrice) : 'N/A'}</p>
                </div>
                <div className="bg-emerald-500/8 rounded-xl p-4 border border-emerald-500/20">
                  <p className="text-[10px] text-emerald-500/80 uppercase tracking-wider mb-1">AI Suggested</p>
                  <p className="text-lg font-bold text-emerald-400">{suggested ? formatINR(suggested) : '—'}</p>
                </div>
              </div>
              {confidence !== null && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(confidence, 100)}%` }} />
                  </div>
                  <span className="text-[11px] text-zinc-400 shrink-0">{Math.round(confidence)}% confidence</span>
                </div>
              )}
              {reasoning && (
                <div className="bg-zinc-800/40 rounded-xl p-4 border border-zinc-700/30">
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{reasoning.slice(0, 300)}{reasoning.length > 300 ? '…' : ''}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

interface PropertiesProps {
  onNavigate?: (section: string) => void
}

type ViewMode = 'grid' | 'list'

interface PropertyItem {
  id: string
  title: string
  city: string
  locality: string
  priceINR: number | null
  image: string | null
  bedrooms: number | null
  sqft: number | null
  listed_at: string | null
  status: string
  views: number
  inquiries: number
}

export function PropertiesSection({ onNavigate }: PropertiesProps) {
  const { isAdmin } = useBuilderDataContext()
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // ── AI Feature modals ──────────────────────────────────────────────────────
  const [activeModal, setActiveModal] = useState<{ type: 'staging' | 'portals' | 'price'; id: string; title: string; price?: number | null } | null>(null)
  const [auditLoading, setAuditLoading] = useState<string | null>(null)
  const [riskData, setRiskData]         = useState<Record<string, any>>({})
  const [riskLoading, setRiskLoading]   = useState<string | null>(null)

  const handleAuditPdf = useCallback(async (id: string, title: string) => {
    setAuditLoading(id)
    try {
      const res = await fetch(`/api/properties/${id}/audit-pdf`)
      if (!res.ok) throw new Error('Failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `${title.replace(/\s+/g, '-')}-audit.pdf`
      a.click(); URL.revokeObjectURL(url)
    } catch { alert('Audit PDF generation failed. Please try again.') }
    finally { setAuditLoading(null) }
  }, [])

  const handleRiskFlags = useCallback(async (id: string) => {
    if (riskData[id]) return // already loaded
    setRiskLoading(id)
    try {
      const res = await fetch(`/api/properties/${id}/compute-risk-flags`)
      const data = await res.json()
      setRiskData(prev => ({ ...prev, [id]: data }))
    } catch { setRiskData(prev => ({ ...prev, [id]: { error: true } })) }
    finally { setRiskLoading(null) }
  }, [riskData])

  // Real properties from Supabase
  const { data: propertiesResponse, isLoading } = useRealtimeData<{
    items: PropertyItem[]
  }>(`/api/builder/properties?_r=${refreshKey}`, { refreshInterval: 30000 })

  const properties = propertiesResponse?.items || []

  const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    available: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-500' },
    active:    { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-500' },
    sold:      { bg: 'bg-blue-500/10',    text: 'text-blue-400',    dot: 'bg-blue-500'    },
    reserved:  { bg: 'bg-amber-500/10',   text: 'text-amber-400',   dot: 'bg-amber-500'   },
    upcoming:  { bg: 'bg-purple-500/10',  text: 'text-purple-400',  dot: 'bg-purple-500'  },
    draft:     { bg: 'bg-zinc-800',       text: 'text-zinc-400',    dot: 'bg-zinc-500'    },
    pending:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   dot: 'bg-amber-500'   },
  }

  const filteredProperties = searchQuery
    ? properties.filter(p =>
        (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.locality || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : properties

  const stats = {
    total: properties.length,
    active: properties.filter(p => ['available', 'active'].includes((p.status || '').toLowerCase())).length,
    sold: properties.filter(p => (p.status || '').toLowerCase() === 'sold').length,
    totalViews: properties.reduce((sum, p) => sum + (p.views || 0), 0),
  }

  const handleFormSuccess = useCallback((propertyId: string) => {
    setShowAddForm(false)
    // Bump refreshKey to force a fresh API call with the new property
    setRefreshKey(k => k + 1)
  }, [])

  const handleFormCancel = useCallback(() => {
    setShowAddForm(false)
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-zinc-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* ─── AI Feature Modals ───────────────────────────────────────────── */}
      <AnimatePresence>
        {activeModal?.type === 'staging' && (
          <VirtualStagingModal key="staging" propertyId={activeModal.id} propertyTitle={activeModal.title} onClose={() => setActiveModal(null)} />
        )}
        {activeModal?.type === 'portals' && (
          <PortalSyncModal key="portals" propertyId={activeModal.id} propertyTitle={activeModal.title} onClose={() => setActiveModal(null)} />
        )}
        {activeModal?.type === 'price' && (
          <PriceOptimizerModal key="price" propertyId={activeModal.id} propertyTitle={activeModal.title} currentPrice={activeModal.price ?? null} onClose={() => setActiveModal(null)} />
        )}
      </AnimatePresence>

      {/* ─── In-Dashboard Add Property Overlay ───────────────────────────── */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            key="add-property-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-zinc-950 overflow-y-auto"
          >
            {/* Sticky top bar */}
            <div className="sticky top-0 z-10 flex items-center gap-3 px-4 sm:px-6 py-3 bg-zinc-950/95 backdrop-blur border-b border-zinc-800/60">
              <button
                onClick={handleFormCancel}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Properties
              </button>
              <span className="text-sm text-zinc-500">New Property Listing</span>
            </div>

            {/* Form body */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
              <AdvancedPropertyUploadForm
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Properties List ──────────────────────────────────────────────── */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-zinc-100">Properties</h1>
              {isAdmin && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-400 font-medium">
                  <Shield className="w-3 h-3" /> All
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-500 mt-1">{stats.total} properties managed</p>
          </div>
          <div className="flex items-center gap-2">
            {/* View public listing */}
            <a
              href="/property-listing"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900/60 border border-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 text-sm font-medium transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Public Listing
            </a>
            {/* Refresh */}
            <button
              onClick={() => setRefreshKey(k => k + 1)}
              title="Refresh"
              className="p-2 bg-zinc-900/60 border border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Property
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total',       value: stats.total,      icon: Building2,   color: 'text-blue-400',    bg: 'bg-blue-500/10'    },
            { label: 'Active',      value: stats.active,     icon: Star,        color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Sold',        value: stats.sold,       icon: TrendingUp,  color: 'text-amber-400',   bg: 'bg-amber-500/10'   },
            { label: 'Total Views', value: stats.totalViews, icon: Eye,         color: 'text-purple-400',  bg: 'bg-purple-500/10'  },
          ].map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-zinc-500 uppercase tracking-wider">{stat.label}</span>
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', stat.bg)}>
                    <Icon className={cn('w-3.5 h-3.5', stat.color)} />
                  </div>
                </div>
                <span className="text-2xl font-bold text-zinc-100 tabular-nums">{stat.value}</span>
              </motion.div>
            )
          })}
        </div>

        {/* Search + View toggle */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search properties..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-900/80 border border-zinc-800 rounded-lg text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40 transition-colors"
            />
          </div>
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            <button onClick={() => setViewMode('grid')} className={cn('p-2 rounded-md transition-colors', viewMode === 'grid' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300')}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')} className={cn('p-2 rounded-md transition-colors', viewMode === 'list' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300')}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Empty state */}
        {properties.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/40 border border-zinc-800/60 rounded-xl">
            <Building2 className="w-12 h-12 text-zinc-700 mb-4" />
            <p className="text-base font-medium text-zinc-400 mb-1">No properties yet</p>
            <p className="text-sm text-zinc-600 mb-6">Add your first property to get started</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Property
            </button>
          </div>
        )}

        {/* Grid */}
        {viewMode === 'grid' && properties.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProperties.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Building2 className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">No properties match your search</p>
              </div>
            ) : (
              filteredProperties.map((property, i) => {
                const statusKey = (property.status || 'active').toLowerCase()
                const status = statusColors[statusKey] || statusColors.active
                return (
                  <motion.a
                    key={property.id}
                    href={`/properties/${property.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl overflow-hidden hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/[0.05] transition-all cursor-pointer group block"
                  >
                    {/* Image */}
                    <div className="h-44 bg-zinc-800/50 flex items-center justify-center relative overflow-hidden">
                      {property.image ? (
                        <img
                          src={property.image}
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <Building2 className="w-10 h-10 text-zinc-700" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent" />
                      {property.bedrooms && (
                        <span className="absolute bottom-2 left-2 text-[10px] bg-black/70 text-zinc-200 px-2 py-0.5 rounded backdrop-blur-sm">
                          {property.bedrooms} BHK
                        </span>
                      )}
                      <span className={cn('absolute top-2 right-2 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full capitalize backdrop-blur-sm', status.bg, status.text)}>
                        <div className={cn('w-1.5 h-1.5 rounded-full', status.dot)} />
                        {statusKey}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-zinc-100 truncate mb-1">{property.title}</h3>
                      <div className="flex items-center gap-1 text-xs text-zinc-500 mb-3">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{property.locality ? `${property.locality}, ` : ''}{property.city || 'Location N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-amber-400">
                          {property.priceINR ? formatINR(property.priceINR) : 'Contact'}
                        </span>
                        <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{property.views || 0}</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{property.inquiries || 0}</span>
                        </div>
                      </div>
                      {property.sqft && (
                        <p className="text-[11px] text-zinc-600 mt-1">{property.sqft.toLocaleString()} sq.ft</p>
                      )}

                      {/* ── AI Action Bar ── */}
                      <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center gap-1.5" onClick={e => e.preventDefault()}>
                        <button onClick={() => setActiveModal({ type: 'staging', id: property.id, title: property.title })}
                          title="AI Virtual Staging"
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 text-[10px] font-medium transition-colors">
                          <Sparkles className="w-3 h-3" /> Stage
                        </button>
                        <button onClick={() => setActiveModal({ type: 'portals', id: property.id, title: property.title })}
                          title="Sync to Portals"
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-[10px] font-medium transition-colors">
                          <Globe className="w-3 h-3" /> Sync
                        </button>
                        <button onClick={() => setActiveModal({ type: 'price', id: property.id, title: property.title, price: property.priceINR })}
                          title="AI Price Optimizer"
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium transition-colors">
                          <TrendingUp className="w-3 h-3" /> Price
                        </button>
                        <button onClick={() => handleAuditPdf(property.id, property.title)}
                          disabled={auditLoading === property.id}
                          title="Download Audit PDF"
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-[10px] font-medium transition-colors disabled:opacity-50">
                          {auditLoading === property.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />} PDF
                        </button>
                        <button
                          onClick={() => handleRiskFlags(property.id)}
                          disabled={riskLoading === property.id}
                          title="Compute Risk Flags"
                          className={cn('flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border text-[10px] font-medium transition-colors disabled:opacity-50',
                            riskData[property.id]?.flags?.length > 0
                              ? 'bg-red-500/15 border-red-500/30 text-red-400'
                              : riskData[property.id] && !riskData[property.id]?.error
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-zinc-800/60 border-zinc-700/40 text-zinc-500 hover:text-zinc-300'
                          )}>
                          {riskLoading === property.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <AlertTriangle className="w-3 h-3" />
                          }
                          {riskData[property.id]?.flags?.length > 0
                            ? `${riskData[property.id].flags.length} Risk`
                            : riskData[property.id] && !riskData[property.id]?.error ? 'Safe' : 'Risk'
                          }
                        </button>
                      </div>
                    </div>
                  </motion.a>
                )
              })
            )}
          </div>
        )}

        {/* List */}
        {viewMode === 'list' && properties.length > 0 && (
          <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_130px_130px_110px_80px] gap-4 px-4 py-3 border-b border-zinc-800/50 bg-zinc-900/40">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Property</span>
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Location</span>
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Price</span>
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</span>
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Views</span>
            </div>
            <div className="divide-y divide-zinc-800/30">
              {filteredProperties.map((property) => {
                const statusKey = (property.status || 'active').toLowerCase()
                const status = statusColors[statusKey] || statusColors.active
                return (
                  <a key={property.id} href={`/properties/${property.id}`} target="_blank" rel="noopener noreferrer"
                    className="grid grid-cols-[1fr_130px_130px_110px_80px] gap-4 px-4 py-3 hover:bg-zinc-800/30 transition-colors cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-zinc-200 truncate">{property.title}</p>
                      <p className="text-xs text-zinc-500">
                        {property.bedrooms ? `${property.bedrooms} BHK` : ''}{property.sqft ? ` · ${property.sqft.toLocaleString()} sqft` : ''}
                      </p>
                    </div>
                    <span className="text-xs text-zinc-400 self-center truncate">{property.city}</span>
                    <span className="text-xs text-amber-400 font-medium self-center">{property.priceINR ? formatINR(property.priceINR) : 'Contact'}</span>
                    <div className="self-center">
                      <span className={cn('inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full capitalize', status.bg, status.text)}>
                        <div className={cn('w-1.5 h-1.5 rounded-full', status.dot)} />
                        {statusKey}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-400 self-center tabular-nums">{property.views || 0}</span>
                  </a>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
