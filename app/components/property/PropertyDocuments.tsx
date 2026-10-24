'use client'

import { useState, useEffect } from 'react'
import { Download, FileText, Shield, Info, Loader2 } from 'lucide-react'

interface PropertyDocument {
  id: string
  document_type: string
  document_name: string
  file_url: string
  sha256_hash: string
  uploaded_at: string
  verification_status: string
}

interface PropertyDocumentsProps {
  propertyId: string
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  EC: 'Encumbrance Certificate',
  OC: 'Occupancy Certificate',
  CC: 'Completion Certificate',
  APPROVAL_PLAN: 'Approval Plan',
  NOC: 'No Objection Certificate',
  SALE_DEED: 'Sale Deed',
  KHATA: 'Khata Certificate',
  RERA_CERTIFICATE: 'RERA Certificate',
  OTHER: 'Other Document',
}

const LEGAL_DISCLAIMER = "Legal disclaimer: The information and verification artifacts provided on this page are automated snapshots of public records and uploaded documents as of the timestamp shown. These artifacts are intended for informational purposes only and do not constitute legal advice, title insurance, or a guarantee of property ownership or transferability. For formal legal confirmation and title transfer, consult a licensed property lawyer or the appropriate government registry."

export default function PropertyDocuments({ propertyId }: PropertyDocumentsProps) {
  const [documents, setDocuments] = useState<PropertyDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDocuments()
  }, [propertyId])

  async function fetchDocuments() {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/properties/${propertyId}/documents`)

      if (!response.ok) {
        throw new Error('Failed to fetch documents')
      }

      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (err: any) {
      console.error('Error fetching documents:', err)
      setError(err.message || 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (doc: PropertyDocument) => {
    try {
      // Open document in new tab
      window.open(doc.file_url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      console.error('Download error:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-slate-800/95 glow-border rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">RERA & Legal Documents</h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 text-amber-300 animate-spin" />
          <span className="ml-3 text-white">Loading documents...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-slate-800/95 glow-border rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">RERA & Legal Documents</h2>
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </div>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="bg-slate-800/95 glow-border rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">RERA & Legal Documents</h2>
        <div className="rounded-lg border border-amber-300/30 bg-slate-700/50 p-6 text-center">
          <FileText className="h-12 w-12 text-amber-300 mx-auto mb-3" />
          <p className="text-white mb-2">No documents available yet</p>
          <p className="text-sm text-white">
            Documents will appear here once uploaded by the builder
          </p>
        </div>
        <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900/50 p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-white leading-relaxed">{LEGAL_DISCLAIMER}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800/95 glow-border rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-4">RERA & Legal Documents</h2>
      <div className="space-y-3">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-4 bg-slate-700/50 border border-amber-300/30 rounded-lg hover:border-amber-300 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-300/50 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-amber-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white">{doc.document_name}</div>
                <div className="text-sm text-white">
                  {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {doc.verification_status === 'verified' && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-300/50">
                  ✓ Verified
                </span>
              )}
              <button
                onClick={() => handleDownload(doc)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-300/50 text-amber-300 font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900/50 p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-white leading-relaxed">{LEGAL_DISCLAIMER}</p>
            <div className="mt-3 text-xs text-white">
              <div className="font-semibold mb-1">Verification artifacts:</div>
              <ul className="list-disc ml-5 space-y-1">
                <li>All documents are cryptographically hashed for verification</li>
                <li>RERA verification: See RERA section above</li>
                <li>Risk assessment: See risk flags section above</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
