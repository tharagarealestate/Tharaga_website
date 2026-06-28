"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ViewingsCalendar } from '../ultra-automation/components/ViewingsCalendar'
import { useBuilderAuth } from '../BuilderAuthProvider'
import { BuilderPageWrapper } from '../BuilderPageWrapper'
import { QrCode, X, Download, Copy, CheckCircle2, ExternalLink, Smartphone } from 'lucide-react'

interface ViewingsSectionProps {
  onNavigate?: (section: string) => void
}

// ─── QR Generator Panel ────────────────────────────────────────────────────
function QRGeneratorPanel({ builderId }: { builderId: string | null }) {
  const [propertyUrl, setPropertyUrl] = useState('')
  const [label, setLabel]             = useState('')
  const [qrUrl, setQrUrl]             = useState<string | null>(null)
  const [copied, setCopied]           = useState(false)
  const [visitCode]                   = useState(() => Math.random().toString(36).slice(2, 8).toUpperCase())

  // Use api.qrserver.com — no library needed, returns a PNG
  const generateQR = () => {
    const target = propertyUrl.trim() || `${window.location.origin}/visit/${visitCode}`
    const encoded = encodeURIComponent(target)
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}&bgcolor=09090b&color=f59e0b&qzone=2`)
  }

  const visitLink = propertyUrl.trim() || (typeof window !== 'undefined' ? `${window.location.origin}/visit/${visitCode}` : '')

  const copyLink = async () => {
    await navigator.clipboard.writeText(visitLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadQR = () => {
    if (!qrUrl) return
    const a = document.createElement('a')
    a.href = qrUrl
    a.download = `${(label || 'site-visit').replace(/\s+/g, '-')}-qr.png`
    a.click()
  }

  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <QrCode className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-zinc-100">Site Visit QR Generator</h2>
          <p className="text-[11px] text-zinc-500">Generate QR codes for property site visits — scan to log attendance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left — Config */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Label / Property Name</label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Sunrise Towers — Block A"
              className="w-full px-3 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Property URL (optional)</label>
            <input
              value={propertyUrl}
              onChange={e => setPropertyUrl(e.target.value)}
              placeholder="https://tharaga.co.in/properties/..."
              className="w-full px-3 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40 transition-colors"
            />
            <p className="text-[10px] text-zinc-600">Leave blank to use auto-generated visit tracking link</p>
          </div>

          {/* Auto-generated visit link */}
          <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3">
            <p className="text-[10px] text-amber-500/80 font-medium uppercase tracking-wider mb-1.5">Auto Visit Link</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[11px] text-amber-400/80 truncate">/visit/{visitCode}</code>
              <button onClick={copyLink} className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg text-amber-400 text-[10px] transition-colors">
                {copied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <button
            onClick={generateQR}
            className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl text-sm font-bold transition-colors"
          >
            <QrCode className="w-4 h-4" /> Generate QR Code
          </button>
        </div>

        {/* Right — QR Preview */}
        <div className="flex flex-col items-center justify-center bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-6 min-h-[220px]">
          {qrUrl ? (
            <div className="space-y-4 text-center">
              <div className="relative inline-block">
                <img src={qrUrl} alt="QR Code" className="w-48 h-48 rounded-xl border border-amber-500/20" />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-amber-500 border-2 border-zinc-950 flex items-center justify-center">
                  <Smartphone className="w-3.5 h-3.5 text-zinc-950" />
                </div>
              </div>
              {label && <p className="text-xs font-medium text-zinc-300">{label}</p>}
              <div className="flex items-center gap-2">
                <button onClick={downloadQR}
                  className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-medium text-zinc-300 transition-colors">
                  <Download className="w-3 h-3" /> Download PNG
                </button>
                <a href={visitLink} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-medium text-zinc-300 transition-colors">
                  <ExternalLink className="w-3 h-3" /> Preview
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <QrCode className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">QR code will appear here</p>
              <p className="text-[11px] text-zinc-600 mt-1">Print and display at the property site</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function ViewingsSection({ onNavigate }: ViewingsSectionProps) {
  const { builderId } = useBuilderAuth()

  return (
    <BuilderPageWrapper
      title="Property Viewings"
      description="Manage scheduled property viewings, generate QR codes for site visits, and track attendance"
      noContainer
    >
      <div className="space-y-6">
        {/* QR Generator */}
        <QRGeneratorPanel builderId={builderId} />

        {/* Calendar */}
        <div className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl">
          <div className="p-6 sm:p-8">
            <ViewingsCalendar builderId={builderId || undefined} />
          </div>
        </div>
      </div>
    </BuilderPageWrapper>
  )
}
