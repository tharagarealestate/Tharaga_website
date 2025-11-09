"use client"

import { useState } from 'react'
import { X, Download, FileSpreadsheet, FileText, Check } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

interface ExportModalProps {
  filters: any
  onClose: () => void
}

const AVAILABLE_FIELDS = [
  { key: 'email', label: 'Email' },
  { key: 'full_name', label: 'Full Name' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'score', label: 'Lead Score' },
  { key: 'category', label: 'Category' },
  { key: 'budget_min', label: 'Min Budget' },
  { key: 'budget_max', label: 'Max Budget' },
  { key: 'preferred_location', label: 'Preferred Location' },
  { key: 'preferred_property_type', label: 'Property Type' },
  { key: 'total_views', label: 'Total Property Views' },
  { key: 'total_interactions', label: 'Total Interactions' },
  { key: 'last_activity', label: 'Last Activity' },
  { key: 'created_at', label: 'Created Date' },
  { key: 'budget_alignment_score', label: 'Budget Alignment Score' },
  { key: 'engagement_score', label: 'Engagement Score' },
  { key: 'property_fit_score', label: 'Property Fit Score' },
  { key: 'contact_intent_score', label: 'Contact Intent Score' },
  { key: 'recency_score', label: 'Recency Score' },
]

const DEFAULT_FIELDS = ['email', 'full_name', 'phone', 'score', 'category', 'budget_min', 'budget_max', 'last_activity']

export function ExportModal({ filters, onClose }: ExportModalProps) {
  const [format, setFormat] = useState<'csv' | 'excel'>('csv')
  const [selectedFields, setSelectedFields] = useState<string[]>(DEFAULT_FIELDS)
  const [isExporting, setIsExporting] = useState(false)
  
  const handleFieldToggle = (fieldKey: string) => {
    if (selectedFields.includes(fieldKey)) {
      setSelectedFields(selectedFields.filter(f => f !== fieldKey))
    } else {
      setSelectedFields([...selectedFields, fieldKey])
    }
  }
  
  const handleSelectAll = () => {
    if (selectedFields.length === AVAILABLE_FIELDS.length) {
      setSelectedFields([])
    } else {
      setSelectedFields(AVAILABLE_FIELDS.map(f => f.key))
    }
  }
  
  const handleExport = async () => {
    if (selectedFields.length === 0) {
      alert('Please select at least one field to export')
      return
    }
    
    setIsExporting(true)
    
    try {
      // Get Supabase client (cached instance)
      const supabase = getSupabase()
      
      // Get current session - this will refresh if needed
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (!session || sessionError) {
        // Try to get user directly (this will refresh the session)
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          alert('Your session has expired. Please log in again.')
          setIsExporting(false)
          return
        }
        // If getUser succeeded but getSession didn't, try getSession again
        const retrySession = await supabase.auth.getSession()
        if (!retrySession.data?.session) {
          alert('Unable to retrieve session. Please log in again.')
          setIsExporting(false)
          return
        }
      }
      
      // Build query params from filters
      const params = new URLSearchParams()
      params.set('format', format)
      params.set('fields', selectedFields.join(','))
      
      if (filters.category) params.set('category', filters.category)
      if (filters.score_min) params.set('score_min', String(filters.score_min))
      if (filters.score_max) params.set('score_max', String(filters.score_max))
      
      // Get the current session again to ensure we have the latest token
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      
      // Use fetch API to download the file properly
      // Include both cookies AND authorization header as fallback
      const url = `/api/leads/export?${params.toString()}`
      const headers: HeadersInit = {
        'Accept': format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv',
      }
      
      // Add authorization header if we have a session token
      if (currentSession?.access_token) {
        headers['Authorization'] = `Bearer ${currentSession.access_token}`
      }
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include', // CRITICAL: Include cookies for authentication
        headers,
        cache: 'no-store', // Ensure fresh request
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to export leads';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = `Export failed: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      // Get the blob from response
      const blob = await response.blob()
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `leads-export-${Date.now()}.${format === 'excel' ? 'xlsx' : 'csv'}`
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose()
      }, 500)
    } catch (error) {
      console.error('Export failed:', error)
      alert(`Failed to export leads: ${error instanceof Error ? error.message : 'Please try again.'}`)
      setIsExporting(false)
    }
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold mb-1">Export Leads</h2>
            <p className="text-sm text-fgMuted">Choose format and fields to export</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted/40 rounded transition-colors"
            disabled={isExporting}
          >
            <X className="w-5 h-5 text-fgMuted" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">Export Format</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`p-4 rounded border transition-all text-left ${
                  format === 'csv'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-border hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className={`w-5 h-5 ${format === 'csv' ? 'text-primary-600' : 'text-fgMuted'}`} />
                  <div>
                    <div className="font-medium">CSV</div>
                    <div className="text-xs text-fgMuted">Comma-separated values</div>
                  </div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setFormat('excel')}
                className={`p-4 rounded border transition-all text-left ${
                  format === 'excel'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-border hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className={`w-5 h-5 ${format === 'excel' ? 'text-primary-600' : 'text-fgMuted'}`} />
                  <div>
                    <div className="font-medium">Excel</div>
                    <div className="text-xs text-fgMuted">Microsoft Excel format</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
          
          {/* Field Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium">Select Fields</label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                {selectedFields.length === AVAILABLE_FIELDS.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="border border-border rounded overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2 p-3">
                  {AVAILABLE_FIELDS.map((field) => {
                    const isSelected = selectedFields.includes(field.key)
                    return (
                      <button
                        key={field.key}
                        type="button"
                        onClick={() => handleFieldToggle(field.key)}
                        className={`p-2 rounded text-left text-sm transition-all ${
                          isSelected
                            ? 'bg-primary-50 border border-primary-200'
                            : 'hover:bg-muted/40 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-primary-600 bg-primary-600'
                              : 'border-border'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className={isSelected ? 'font-medium' : ''}>{field.label}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            
            <div className="mt-2 text-xs text-fgMuted">
              {selectedFields.length} of {AVAILABLE_FIELDS.length} fields selected
            </div>
          </div>
          
          {/* Filter Info */}
          <div className="p-3 bg-muted/40 rounded border border-border">
            <div className="text-xs font-medium mb-1">Current Filters Applied:</div>
            <div className="text-xs text-fgMuted space-y-1">
              {filters.category && <div>Category: {filters.category}</div>}
              {filters.score_min && <div>Min Score: {filters.score_min}</div>}
              {filters.score_max && <div>Max Score: {filters.score_max}</div>}
              {!filters.category && !filters.score_min && !filters.score_max && (
                <div>All leads will be exported</div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-muted/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-fgMuted hover:bg-muted/60 rounded font-medium transition-colors"
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || selectedFields.length === 0}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export Leads
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

