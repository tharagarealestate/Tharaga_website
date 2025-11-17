'use client'

import { useState, useRef } from 'react'
import { Upload, File, Check, X, Loader2, Download, Shield, AlertCircle } from 'lucide-react'

interface DocumentUploadProps {
  propertyId: string
  existingDocuments?: Document[]
}

interface Document {
  id: string
  document_type: string
  document_name: string
  file_url: string
  sha256_hash: string
  uploaded_at: string
  verification_status: string
}

const ALLOWED_DOC_TYPES = [
  { value: 'EC', label: 'Encumbrance Certificate' },
  { value: 'OC', label: 'Occupancy Certificate' },
  { value: 'CC', label: 'Completion Certificate' },
  { value: 'APPROVAL_PLAN', label: 'Approval Plan' },
  { value: 'NOC', label: 'No Objection Certificate' },
  { value: 'SALE_DEED', label: 'Sale Deed' },
  { value: 'KHATA', label: 'Khata Certificate' },
  { value: 'OTHER', label: 'Other' },
]

const LEGAL_DISCLAIMER = "Legal disclaimer: The information and verification artifacts provided on this page are automated snapshots of public records and uploaded documents as of the timestamp shown. These artifacts are intended for informational purposes only and do not constitute legal advice, title insurance, or a guarantee of property ownership or transferability. For formal legal confirmation and title transfer, consult a licensed property lawyer or the appropriate government registry."

export default function DocumentUpload({ propertyId, existingDocuments = [] }: DocumentUploadProps) {
  const [documents, setDocuments] = useState<Document[]>(existingDocuments)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string>('EC')
  const [documentName, setDocumentName] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(file: File) {
    if (!file || !selectedType || !documentName) {
      setMessage('Please fill all fields')
      return
    }

    try {
      setUploading(true)
      setMessage(null)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('document_type', selectedType)
      formData.append('document_name', documentName)

      const response = await fetch(`/api/properties/${propertyId}/documents`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()
      setDocuments([result.document, ...documents])
      setDocumentName('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setMessage('Document uploaded successfully!')
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      console.error('Upload error:', error)
      setMessage(error.message || 'Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  async function downloadAuditPDF() {
    try {
      const response = await fetch(`/api/properties/${propertyId}/audit-pdf`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `property-audit-${propertyId}-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: any) {
      console.error('PDF download error:', error)
      setMessage(error.message || 'Failed to download PDF')
    }
  }

  const docTypeLabel = (type: string) => {
    const found = ALLOWED_DOC_TYPES.find(dt => dt.value === type)
    return found?.label || type
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-primary-900 to-primary-700 bg-clip-text text-transparent">
              Property Documents
            </h3>
            <p className="text-sm text-gray-600 mt-1">Upload official property documents with cryptographic verification</p>
          </div>
          <button
            onClick={downloadAuditPDF}
            className="px-4 py-2 bg-gradient-to-r from-gold-600 to-gold-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download Verification Report (PDF)
          </button>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg ${
            message.includes('success') 
              ? 'bg-emerald-50 text-emerald-700' 
              : 'bg-red-50 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* Upload Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            >
              {ALLOWED_DOC_TYPES.map(dt => (
                <option key={dt.value} value={dt.value}>{dt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Document Name</label>
            <input
              type="text"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="e.g., EC 2024"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">File</label>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleUpload(file)
                  }
                }}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex-1 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gold-500 transition-colors flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                ) : (
                  <Upload className="w-5 h-5 text-gray-400" />
                )}
                <span className="text-sm text-gray-600">Choose file</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Table - Similar to Pricing Comparison */}
      {documents.length > 0 && (
        <div className="backdrop-blur-xl bg-white/70 border border-gray-200/50 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Uploaded Documents</h3>
            <p className="text-sm text-gray-600 mt-1">All documents are cryptographically hashed for verification</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left p-4 text-gray-700 font-semibold">Document</th>
                  <th className="text-left p-4 text-gray-700 font-semibold">Type</th>
                  <th className="text-left p-4 text-gray-700 font-semibold">SHA256 Hash</th>
                  <th className="text-left p-4 text-gray-700 font-semibold">Status</th>
                  <th className="text-left p-4 text-gray-700 font-semibold">Uploaded</th>
                  <th className="text-center p-4 text-gray-700 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <File className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{doc.document_name}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(doc.uploaded_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {docTypeLabel(doc.document_type)}
                      </span>
                    </td>
                    <td className="p-4">
                      <code className="text-xs text-gray-600 font-mono">
                        {doc.sha256_hash.slice(0, 16)}...
                      </code>
                    </td>
                    <td className="p-4">
                      {doc.verification_status === 'verified' ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 flex items-center gap-1 w-fit">
                          <Check className="w-3 h-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 flex items-center gap-1 w-fit">
                          <AlertCircle className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {new Date(doc.uploaded_at).toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 text-sm flex items-center justify-center gap-1"
                      >
                        <Download className="w-4 h-4" />
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legal Disclaimer */}
      <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-gray-700 leading-relaxed">{LEGAL_DISCLAIMER}</p>
            <a href="/how-verification-works" className="text-primary-600 hover:text-primary-700 text-xs mt-2 inline-block">
              How verification works →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}







