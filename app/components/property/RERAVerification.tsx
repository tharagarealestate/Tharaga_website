'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, AlertCircle, Clock } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { RERABadge } from '@/components/rera/RERABadge'

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

const LEGAL_DISCLAIMER = "Legal disclaimer: The information and verification artifacts provided on this page are automated snapshots of public records and uploaded documents as of the timestamp shown. These artifacts are intended for informational purposes only and do not constitute legal advice, title insurance, or a guarantee of property ownership or transferability. For formal legal confirmation and title transfer, consult a licensed property lawyer or the appropriate government registry."

export default function RERAVerification({ propertyId, reraId }: RERAVerificationProps) {
  const [registration, setRegistration] = useState<RERARegistration | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (propertyId) {
      loadRERARegistration()
    }
  }, [propertyId])

  async function loadRERARegistration() {
    try {
      setLoading(true)
      const supabase = getSupabase()
      
      // Try to fetch from new rera_registrations table first
      const { data: reraData, error: reraError } = await supabase
        .from('rera_registrations')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!reraError && reraData) {
        setRegistration(reraData)
        return
      }

      // Fallback: try to fetch by RERA number if provided
      if (reraId) {
        const { data: reraByNumber, error: reraByNumberError } = await supabase
          .from('rera_registrations')
          .select('*')
          .eq('rera_number', reraId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (!reraByNumberError && reraByNumber) {
          setRegistration(reraByNumber)
          return
        }
      }

      // If no registration found, check old rera_snapshots table for backward compatibility
      const { data: snapshotData, error: snapshotError } = await supabase
        .from('rera_snapshots')
        .select('*')
        .eq('property_id', propertyId)
        .order('collected_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!snapshotError && snapshotData) {
        // Map old snapshot format to new registration format
        setRegistration({
          id: snapshotData.id,
          rera_number: snapshotData.rera_id,
          rera_state: snapshotData.state,
          project_name: snapshotData.project_name || null,
          promoter_name: snapshotData.developer_name || null,
          registration_date: null,
          expiry_date: snapshotData.expiry_date || null,
          status: (snapshotData.status?.toLowerCase() as any) || 'pending',
          verified: snapshotData.data_source !== 'SYNTHETIC',
          verification_status: snapshotData.data_source === 'SYNTHETIC' ? 'pending' : 'verified',
          compliance_score: null,
          is_active: snapshotData.status?.toLowerCase() === 'active',
          last_verified_at: snapshotData.collected_at,
          raw_data: snapshotData,
        })
      }
    } catch (err: any) {
      console.error('Error loading RERA registration:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!reraId && !registration) {
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

  const displayReraId = registration?.rera_number || reraId
  const isSynthetic = registration?.raw_data?.data_source === 'SYNTHETIC'

  return (
    <div className="space-y-4">
      {/* RERA Badge and Display */}
      <div className="flex items-center gap-4">
        <RERABadge
          verified={registration?.verified || false}
          reraNumber={displayReraId || undefined}
          status={registration?.status || null}
          expiryDate={registration?.expiry_date || null}
          complianceScore={registration?.compliance_score || null}
          size="lg"
          variant="card"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">
              RERA Number: <span className="font-mono">{displayReraId}</span>
            </span>
            {registration && (
              <a
                href={`https://www.tn-rera.in/search?rera_number=${displayReraId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                Verify on Portal
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
          {registration?.last_verified_at && (
            <div className="text-sm text-gray-600 mt-1">
              Last verified on {new Date(registration.last_verified_at).toLocaleString()}
              {isSynthetic && (
                <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs">
                  SYNTHETIC DATA
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Additional RERA Details */}
      {registration && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
          {registration.project_name && (
            <div>
              <span className="font-medium text-gray-700">Project:</span>{' '}
              <span className="text-gray-900">{registration.project_name}</span>
            </div>
          )}
          {registration.promoter_name && (
            <div>
              <span className="font-medium text-gray-700">Promoter:</span>{' '}
              <span className="text-gray-900">{registration.promoter_name}</span>
            </div>
          )}
          {registration.status && (
            <div>
              <span className="font-medium text-gray-700">Status:</span>{' '}
              <span className="text-gray-900 capitalize">{registration.status}</span>
            </div>
          )}
          {registration.expiry_date && (
            <div>
              <span className="font-medium text-gray-700">Expiry:</span>{' '}
              <span className="text-gray-900">{new Date(registration.expiry_date).toLocaleDateString()}</span>
            </div>
          )}
          {registration.compliance_score !== null && (
            <div>
              <span className="font-medium text-gray-700">Compliance Score:</span>{' '}
              <span className="text-gray-900">{registration.compliance_score}%</span>
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









