'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, AlertCircle, ShieldCheck, ShieldOff, Clock } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface RERAVerificationProps {
  propertyId: string
  reraId?: string | null
}

interface RERARegistration {
  id: string
  rera_number: string
  rera_state: string
  project_name: string | null
  promoter_name: string | null
  registration_date: string | null
  expiry_date: string | null
  status: 'active' | 'expired' | 'suspended' | 'cancelled' | 'pending' | null
  verified: boolean
  verification_status: string
  compliance_score: number | null
  is_active: boolean
  last_verified_at: string | null
  raw_data: any
}

const STATUS_CONFIG = {
  active:    { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Active' },
  expired:   { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     label: 'Expired' },
  suspended: { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     label: 'Suspended' },
  cancelled: { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     label: 'Cancelled' },
  pending:   { color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   label: 'Pending' },
}

export default function RERAVerification({ propertyId, reraId }: RERAVerificationProps) {
  const [registration, setRegistration] = useState<RERARegistration | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (propertyId) loadRERARegistration()
  }, [propertyId])

  async function loadRERARegistration() {
    try {
      setLoading(true)
      const supabase = getSupabase()

      const { data: reraData, error: reraError } = await supabase
        .from('rera_registrations')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!reraError && reraData) { setRegistration(reraData); return }

      if (reraId) {
        const { data: byNum } = await supabase
          .from('rera_registrations')
          .select('*')
          .eq('rera_number', reraId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (byNum) { setRegistration(byNum); return }
      }

      // Fallback: rera_snapshots table
      const { data: snap } = await supabase
        .from('rera_snapshots')
        .select('*')
        .eq('property_id', propertyId)
        .order('collected_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (snap) {
        setRegistration({
          id: snap.id,
          rera_number: snap.rera_id,
          rera_state: snap.state,
          project_name: snap.project_name || null,
          promoter_name: snap.developer_name || null,
          registration_date: null,
          expiry_date: snap.expiry_date || null,
          status: (snap.status?.toLowerCase() as any) || 'pending',
          verified: snap.data_source !== 'SYNTHETIC',
          verification_status: snap.data_source === 'SYNTHETIC' ? 'pending' : 'verified',
          compliance_score: null,
          is_active: snap.status?.toLowerCase() === 'active',
          last_verified_at: snap.collected_at,
          raw_data: snap,
        })
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const displayId = registration?.rera_number || reraId
  const status = registration?.status
  const statusCfg = status ? (STATUS_CONFIG[status] || STATUS_CONFIG.pending) : null
  const isSynthetic = registration?.raw_data?.data_source === 'SYNTHETIC'
  const compliance = registration?.compliance_score

  /* ── No RERA ── */
  if (!reraId && !registration && !loading) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ShieldOff size={13} className="text-zinc-600" />
          <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">RERA Verification</h3>
        </div>
        <div className="bg-amber-500/[0.07] border border-amber-500/20 rounded-xl p-3">
          <p className="text-xs text-amber-400 font-medium">No RERA ID — manual verification recommended</p>
          <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
            This property doesn't have a RERA registration number on file. Verify property documents independently.
          </p>
        </div>
      </div>
    )
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={13} className="text-zinc-600" />
          <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">RERA Verification</h3>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={12} className="text-amber-400 animate-spin" />
          <span className="text-xs text-zinc-500">Loading RERA data…</span>
        </div>
      </div>
    )
  }

  /* ── Error ── */
  if (error) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle size={13} className="text-red-400" />
          <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">RERA Verification</h3>
        </div>
        <p className="text-xs text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={13} className={registration?.verified ? 'text-emerald-400' : 'text-zinc-500'} />
          <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">RERA Verification</h3>
        </div>
        {statusCfg && (
          <span className={cn(
            'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
            statusCfg.bg, statusCfg.border, statusCfg.color,
          )}>
            {statusCfg.label}
          </span>
        )}
      </div>

      {/* RERA number */}
      {displayId && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-amber-300 tracking-wider">{displayId}</span>
          <a
            href={`https://www.tn-rera.in/search?rera_number=${displayId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-zinc-500 hover:text-amber-400 transition-colors flex-shrink-0"
          >
            Verify <ExternalLink size={9} />
          </a>
        </div>
      )}

      {/* Details rows */}
      {registration && (
        <div className="space-y-1.5">
          {registration.project_name && (
            <div className="flex items-start justify-between py-1.5 border-b border-white/[0.04]">
              <span className="text-[11px] text-zinc-500">Project</span>
              <span className="text-[11px] text-zinc-200 font-medium text-right max-w-[60%]">{registration.project_name}</span>
            </div>
          )}
          {registration.promoter_name && (
            <div className="flex items-start justify-between py-1.5 border-b border-white/[0.04]">
              <span className="text-[11px] text-zinc-500">Promoter</span>
              <span className="text-[11px] text-zinc-200 font-medium text-right max-w-[60%]">{registration.promoter_name}</span>
            </div>
          )}
          {registration.expiry_date && (
            <div className="flex items-start justify-between py-1.5 border-b border-white/[0.04]">
              <span className="text-[11px] text-zinc-500">Expires</span>
              <span className="text-[11px] text-zinc-200 font-medium">
                {new Date(registration.expiry_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              </span>
            </div>
          )}
          {compliance !== null && compliance !== undefined && (
            <div className="pt-1.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest">Compliance</span>
                <span className="text-[10px] font-semibold text-zinc-400">{compliance}%</span>
              </div>
              <div className="h-1 w-full bg-white/[0.05] rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    compliance >= 80 ? 'bg-emerald-500' : compliance >= 50 ? 'bg-amber-500' : 'bg-red-500',
                    'opacity-70',
                  )}
                  style={{ width: `${compliance}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Verified timestamp */}
      {registration?.last_verified_at && (
        <p className="text-[10px] text-zinc-600">
          Last verified {new Date(registration.last_verified_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          {isSynthetic && <span className="ml-2 text-zinc-700">· Synthetic data</span>}
        </p>
      )}
    </div>
  )
}
