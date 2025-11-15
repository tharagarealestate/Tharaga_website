'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, Shield, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

interface RERAVerificationProps {
  propertyId: string
  reraId?: string | null
}

interface RERASnapshot {
  rera_id: string
  state: string
  project_name?: string
  developer_name?: string
  registration_number?: string
  status?: string
  expiry_date?: string | null
  snapshot_hash: string
  source_url?: string
  collected_at: string
  data_source: string
}

const LEGAL_DISCLAIMER = "Legal disclaimer: The information and verification artifacts provided on this page are automated snapshots of public records and uploaded documents as of the timestamp shown. These artifacts are intended for informational purposes only and do not constitute legal advice, title insurance, or a guarantee of property ownership or transferability. For formal legal confirmation and title transfer, consult a licensed property lawyer or the appropriate government registry."

export default function RERAVerification({ propertyId, reraId }: RERAVerificationProps) {
  const [snapshot, setSnapshot] = useState<RERASnapshot | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (propertyId) {
      loadRERASnapshot()
    }
  }, [propertyId])

  async function loadRERASnapshot() {
    try {
      setLoading(true)
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('rera_snapshots')
        .select('*')
        .eq('property_id', propertyId)
        .order('collected_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') throw error
      if (data) {
        setSnapshot(data)
      }
    } catch (err: any) {
      console.error('Error loading RERA snapshot:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!reraId && !snapshot) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-amber-800">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">RERA not available — manual verification recommended</span>
        </div>
        <p className="text-sm text-amber-700 mt-2">
          This property does not have a RERA registration number. We recommend verifying property documents manually.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <Clock className="w-5 h-5 animate-spin" />
        <span>Loading RERA verification...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Error loading RERA data</span>
        </div>
        <p className="text-sm text-red-700 mt-2">{error}</p>
      </div>
    )
  }

  const displayReraId = snapshot?.rera_id || reraId
  const isSynthetic = snapshot?.data_source === 'SYNTHETIC'
  const isActive = snapshot?.status?.toLowerCase() === 'active' || !snapshot

  return (
    <div className="space-y-4">
      {/* RERA Display Line */}
      <div className="flex items-center gap-3">
        <Shield className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-amber-600'}`} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">
              RERA: <span className="font-mono">{displayReraId}</span>
            </span>
            {snapshot && (
              <a
                href={`/api/rera-snapshot/${snapshot.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                View RERA snapshot
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
          {snapshot && (
            <div className="text-sm text-gray-600 mt-1">
              Last verified on {new Date(snapshot.collected_at).toLocaleString()}
              {isSynthetic && (
                <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs">
                  SYNTHETIC DATA
                </span>
              )}
            </div>
          )}
        </div>
        {isActive ? (
          <CheckCircle className="w-5 h-5 text-emerald-600" />
        ) : (
          <AlertCircle className="w-5 h-5 text-amber-600" />
        )}
      </div>

      {/* Additional RERA Details */}
      {snapshot && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
          {snapshot.project_name && (
            <div>
              <span className="font-medium text-gray-700">Project:</span>{' '}
              <span className="text-gray-900">{snapshot.project_name}</span>
            </div>
          )}
          {snapshot.developer_name && (
            <div>
              <span className="font-medium text-gray-700">Developer:</span>{' '}
              <span className="text-gray-900">{snapshot.developer_name}</span>
            </div>
          )}
          {snapshot.status && (
            <div>
              <span className="font-medium text-gray-700">Status:</span>{' '}
              <span className="text-gray-900">{snapshot.status}</span>
            </div>
          )}
          {snapshot.expiry_date && (
            <div>
              <span className="font-medium text-gray-700">Expiry:</span>{' '}
              <span className="text-gray-900">{new Date(snapshot.expiry_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      )}

      {/* Legal Disclaimer */}
      <div className="bg-gray-50 border-l-4 border-gray-400 p-3 text-xs text-gray-700">
        <p>{LEGAL_DISCLAIMER}</p>
        <a href="/how-verification-works" className="text-primary-600 hover:text-primary-700 mt-2 inline-block">
          How verification works →
        </a>
      </div>
    </div>
  )
}



