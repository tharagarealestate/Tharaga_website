'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckSquare,
  X,
  RefreshCw,
  Trash2,
  Download,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

interface BulkOperationsProps {
  selectedLeads: string[]
  onClose: () => void
  onSuccess?: () => void
}

export function BulkOperations({ selectedLeads, onClose, onSuccess }: BulkOperationsProps) {
  const [operation, setOperation] = useState<'update_status' | 'sync_crm' | 'delete' | 'export' | null>(null)
  const [status, setStatus] = useState<string>('new')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleOperation = async () => {
    if (!operation) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/leads/bulk/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation,
          lead_ids: selectedLeads,
          ...(operation === 'update_status' && { data: { status } }),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Operation failed')
      }

      setResult(data)
      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      setError(err.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  const operations = [
    {
      id: 'update_status' as const,
      label: 'Update Status',
      icon: CheckSquare,
      description: 'Change status for selected leads',
      color: 'blue',
    },
    {
      id: 'sync_crm' as const,
      label: 'Sync to ZOHO CRM',
      icon: RefreshCw,
      description: 'Sync selected leads to ZOHO CRM',
      color: 'green',
    },
    {
      id: 'export' as const,
      label: 'Export',
      icon: Download,
      description: 'Export selected leads data',
      color: 'amber',
    },
    {
      id: 'delete' as const,
      label: 'Delete',
      icon: Trash2,
      description: 'Delete selected leads',
      color: 'red',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl p-6 shadow-2xl w-full max-w-2xl mx-4"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Bulk Operations</h2>
            <p className="text-slate-400 text-sm mt-1">
              {selectedLeads.length} lead{selectedLeads.length !== 1 ? 's' : ''} selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-700/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!result && !error && (
          <>
            {!operation ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {operations.map((op) => {
                  const Icon = op.icon
                  return (
                    <button
                      key={op.id}
                      onClick={() => setOperation(op.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        op.color === 'blue'
                          ? 'border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20'
                          : op.color === 'green'
                          ? 'border-green-500/50 bg-green-500/10 hover:bg-green-500/20'
                          : op.color === 'amber'
                          ? 'border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20'
                          : 'border-red-500/50 bg-red-500/10 hover:bg-red-500/20'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className={`w-6 h-6 ${
                          op.color === 'blue'
                            ? 'text-blue-400'
                            : op.color === 'green'
                            ? 'text-green-400'
                            : op.color === 'amber'
                            ? 'text-amber-400'
                            : 'text-red-400'
                        }`} />
                        <span className="font-semibold text-white">{op.label}</span>
                      </div>
                      <p className="text-sm text-slate-400">{op.description}</p>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {operation === 'update_status' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      New Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="converted">Converted</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>
                )}

                {operation === 'delete' && (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <span className="font-semibold text-red-200">Warning</span>
                    </div>
                    <p className="text-sm text-red-200/80">
                      This will permanently delete {selectedLeads.length} lead{selectedLeads.length !== 1 ? 's' : ''}. This action cannot be undone.
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setOperation(null)
                      setError(null)
                    }}
                    className="flex-1 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-white font-semibold transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleOperation}
                    disabled={loading}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                      operation === 'delete'
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Confirm
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="font-semibold text-red-200">Error</span>
            </div>
            <p className="text-sm text-red-200/80">{error}</p>
            <button
              onClick={() => {
                setError(null)
                setOperation(null)
              }}
              className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-200 text-sm font-semibold transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {result && (
          <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="font-semibold text-green-200">Success</span>
            </div>
            <p className="text-sm text-green-200/80 mb-4">
              {result.processed} lead{result.processed !== 1 ? 's' : ''} processed successfully
              {result.failed > 0 && `, ${result.failed} failed`}
            </p>
            {operation === 'export' && result.data && (
              <button
                onClick={() => {
                  const csv = convertToCSV(result.data)
                  const blob = new Blob([csv], { type: 'text/csv' })
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `leads-export-${Date.now()}.csv`
                  a.click()
                  window.URL.revokeObjectURL(url)
                }}
                className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg text-green-200 text-sm font-semibold transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>
            )}
            <button
              onClick={onClose}
              className="mt-4 w-full px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg text-green-200 text-sm font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return ''

  const headers = Object.keys(data[0])
  const rows = data.map((row) =>
    headers.map((header) => {
      const value = row[header]
      if (value === null || value === undefined) return ''
      if (typeof value === 'object') return JSON.stringify(value)
      return String(value).replace(/"/g, '""')
    })
  )

  const csv = [
    headers.map((h) => `"${h}"`).join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  return csv
}

