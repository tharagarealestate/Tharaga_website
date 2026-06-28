"use client"

import * as React from 'react'
import { useEffect, useMemo, useState, useRef } from 'react'
import QRCode from 'qrcode'
import {
  Shield, CheckCircle2, XCircle, AlertTriangle, Clock, QrCode,
  ChevronDown, ChevronUp, Info, ExternalLink, AlertCircle,
  Building2, LayoutGrid, RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { verifyRera, verifyTitle, getFraudScore, getPredictiveAnalytics } from '@/lib/api'
import { PageWrapper } from '@/components/ui/PageWrapper'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { PremiumButton } from '@/components/ui/premium-button'
import { DESIGN_TOKENS } from '@/lib/design-system'
import Breadcrumb from '@/components/Breadcrumb'

// ─── 38 Tamil Nadu District Codes ────────────────────────────────────────────
const TN_DISTRICT_CODES: Record<string, string> = {
  '01': 'Chennai', '02': 'Coimbatore', '03': 'Madurai', '04': 'Tirunelveli',
  '05': 'Salem', '06': 'Tiruchirappalli', '07': 'Vellore', '08': 'Erode',
  '09': 'Tiruppur', '10': 'Thoothukudi', '11': 'Dindigul', '12': 'Thanjavur',
  '13': 'Ranipet', '14': 'Kancheepuram', '15': 'Sivaganga', '16': 'Namakkal',
  '17': 'Nagapattinam', '18': 'Cuddalore', '19': 'Villupuram', '20': 'Nilgiris',
  '21': 'Krishnagiri', '22': 'Dharmapuri', '23': 'Perambalur', '24': 'Ariyalur',
  '25': 'Pudukkottai', '26': 'Ramanathapuram', '27': 'Virudhunagar', '28': 'Theni',
  '29': 'Karur', '30': 'Tiruvannamalai', '31': 'Tiruvarur', '32': 'Kanyakumari',
  '33': 'Kallakurichi', '34': 'Tenkasi', '35': 'Chengalpattu', '36': 'Tirupathur',
  '37': 'Mayiladuthurai', '38': 'Tirupattur',
}

// ─── Format Regexes ───────────────────────────────────────────────────────────
const CLASSIC_RE = /^TN\/(\d{1,2})\/(Building|Layout|Regularisation-Layout)\/(\d{1,6})\/(\d{4})$/i
const NEW2026_RE = /^TNRERA\/(\d{1,2})\/(BLG|LO|RLY)\/(\d{1,6})\/(\d{4})$/i

const PROJECT_TYPE_MAP: Record<string, string> = {
  Building: 'Building', Layout: 'Layout', 'Regularisation-Layout': 'Regularisation Layout',
  BUILDING: 'Building', LAYOUT: 'Layout', 'REGULARISATION-LAYOUT': 'Regularisation Layout',
  BLG: 'Building', LO: 'Layout', RLY: 'Regularisation Layout',
}

interface ParsedRERA {
  format: 'classic' | 'new2026' | 'invalid'
  distCode: string
  distName: string
  projectType: string
  seq: string
  year: string
  isValid: boolean
  raw: string
}

function parseRERA(input: string): ParsedRERA {
  const s = input.trim().toUpperCase()
  const classic = s.match(/^TN\/(\d{1,2})\/(BUILDING|LAYOUT|REGULARISATION-LAYOUT)\/(\d{1,6})\/(\d{4})$/)
  if (classic) {
    const distCode = classic[1].padStart(2, '0')
    return {
      format: 'classic', distCode, distName: TN_DISTRICT_CODES[distCode] || 'Unknown',
      projectType: PROJECT_TYPE_MAP[classic[2]] || classic[2],
      seq: classic[3], year: classic[4], isValid: true, raw: input.trim(),
    }
  }
  const newFmt = s.match(/^TNRERA\/(\d{1,2})\/(BLG|LO|RLY)\/(\d{1,6})\/(\d{4})$/)
  if (newFmt) {
    const distCode = newFmt[1].padStart(2, '0')
    return {
      format: 'new2026', distCode, distName: TN_DISTRICT_CODES[distCode] || 'Unknown',
      projectType: PROJECT_TYPE_MAP[newFmt[2]] || newFmt[2],
      seq: newFmt[3], year: newFmt[4], isValid: true, raw: input.trim(),
    }
  }
  return { format: 'invalid', distCode: '', distName: '', projectType: '', seq: '', year: '', isValid: false, raw: input.trim() }
}

// ─── A–F Grade ────────────────────────────────────────────────────────────────
function complianceGrade(score: number): { grade: string; label: string; color: string; bg: string; border: string } {
  if (score >= 90) return { grade: 'A', label: 'Excellent', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25' }
  if (score >= 75) return { grade: 'B', label: 'Good',      color: 'text-green-400',   bg: 'bg-green-500/10',   border: 'border-green-500/25' }
  if (score >= 60) return { grade: 'C', label: 'Fair',      color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/25' }
  if (score >= 40) return { grade: 'D', label: 'Below Avg', color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/25' }
  return              { grade: 'F', label: 'Non-Compliant', color: 'text-red-400',    bg: 'bg-red-500/10',     border: 'border-red-500/25' }
}

// ─── Expiry Countdown Color ───────────────────────────────────────────────────
function expiryColor(daysLeft: number): string {
  if (daysLeft < 0 || daysLeft < 90)  return 'text-red-400'
  if (daysLeft < 180)                  return 'text-amber-400'
  return 'text-emerald-400'
}

// ─── Chip ─────────────────────────────────────────────────────────────────────
function Chip({ label, value, color = 'text-amber-400', bg = 'bg-amber-500/10', border = 'border-amber-500/20' }: {
  label: string; value: string; color?: string; bg?: string; border?: string
}) {
  return (
    <div className={cn('inline-flex flex-col items-start px-3 py-1.5 rounded-lg border text-[10px]', bg, border)}>
      <span className="text-zinc-500 uppercase tracking-widest">{label}</span>
      <span className={cn('font-semibold text-xs mt-0.5', color)}>{value}</span>
    </div>
  )
}

// ─── Format Guide ─────────────────────────────────────────────────────────────
function FormatGuide() {
  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-widest">
        <Info size={12} className="text-amber-400" />
        TNRERA Format Reference
      </div>
      <div className="space-y-2">
        {[
          { label: 'Classic (2017–2025)', example: 'TN/01/Building/0001/2024', note: 'TN · District · Type · Seq · Year' },
          { label: 'New 2026+', example: 'TNRERA/01/BLG/0001/2026', note: 'TNRERA · District · BLG|LO|RLY · Seq · Year' },
        ].map(f => (
          <div key={f.label} className="bg-white/[0.03] rounded-xl p-3">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">{f.label}</div>
            <code className="text-xs font-mono text-amber-300">{f.example}</code>
            <div className="text-[10px] text-zinc-600 mt-1">{f.note}</div>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-zinc-600 leading-relaxed">
        District codes: <span className="text-zinc-400">01=Chennai · 02=Coimbatore · 03=Madurai · 05=Salem · 06=Tiruchirappalli · 07=Vellore · 09=Tiruppur · 14=Kancheepuram · 35=Chengalpattu</span>
        <br />Type codes: <span className="text-zinc-400">Building / BLG · Layout / LO · Regularisation-Layout / RLY</span>
      </div>
    </div>
  )
}

// ─── Exemption Flow ───────────────────────────────────────────────────────────
function ExemptionChecker() {
  const [sqm, setSqm] = useState('')
  const [units, setUnits] = useState('')
  const sqmN = parseFloat(sqm) || 0
  const unitsN = parseInt(units) || 0
  const mandatory = sqmN > 500 || unitsN > 8
  const checked = sqm !== '' || units !== ''

  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-widest">
        <AlertCircle size={12} className="text-amber-400" />
        RERA Exemption Check
      </div>
      <p className="text-[11px] text-zinc-500 leading-relaxed">
        Under <strong className="text-zinc-300">Section 3 read with Section 60 of RERA</strong>, registration is mandatory when:
        plot area exceeds <strong className="text-zinc-300">500 sq.m</strong> OR number of apartments/units exceeds <strong className="text-zinc-300">8</strong>.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1.5">Plot Area (sq.m)</label>
          <input
            type="number"
            value={sqm}
            onChange={e => setSqm(e.target.value)}
            placeholder="e.g., 450"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/40"
          />
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1.5">Number of Units</label>
          <input
            type="number"
            value={units}
            onChange={e => setUnits(e.target.value)}
            placeholder="e.g., 6"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/40"
          />
        </div>
      </div>
      {checked && (
        <div className={cn(
          'rounded-xl border p-3 text-sm font-semibold flex items-center gap-2',
          mandatory
            ? 'bg-red-500/[0.08] border-red-500/20 text-red-400'
            : 'bg-emerald-500/[0.08] border-emerald-500/20 text-emerald-400'
        )}>
          {mandatory ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
          {mandatory
            ? 'RERA Registration is MANDATORY for this project.'
            : 'Project may qualify for exemption under Section 3(2). Verify with TNRERA.'}
        </div>
      )}
      <p className="text-[10px] text-zinc-600 italic leading-relaxed">
        Penalty for non-registration under Section 60: up to 10% of project cost. This check is indicative only — consult TNRERA for final determination.
      </p>
    </div>
  )
}

// ─── Main RERA Verification Tool ─────────────────────────────────────────────
function RERAVerificationTool() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [qrUrl, setQrUrl] = useState('')
  const [showExempt, setShowExempt] = useState(false)

  const parsed = useMemo(() => parseRERA(input), [input])

  async function handleVerify() {
    if (!parsed.isValid) return
    setLoading(true)
    setResult(null)
    setError('')
    setQrUrl('')
    try {
      const res = await verifyRera({ rera_id: parsed.raw, state: 'TN' })
      setResult(res)
      // Generate QR linking to TNRERA portal
      const qrText = `https://rera.tn.gov.in/search?reraId=${encodeURIComponent(parsed.raw)}`
      const dataUrl = await QRCode.toDataURL(qrText, { width: 180, margin: 2, color: { dark: '#f59e0b', light: '#09090b' } })
      setQrUrl(dataUrl)
    } catch (e: any) {
      setError(e?.message || 'Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const score = result?.compliance_score != null ? Math.round(result.compliance_score * 100) : null
  const grade = score != null ? complianceGrade(score) : null
  const daysLeft = result?.expiry_date
    ? Math.floor((new Date(result.expiry_date).getTime() - Date.now()) / 86400000)
    : null
  const complaintsCount = result?.complaints_count ?? 0

  return (
    <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-amber-400" />
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">TNRERA Verification</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[10px] text-zinc-600">Live · Dual Format</span>
        </div>
      </div>

      {/* Input */}
      <div className="space-y-2">
        <label className="text-[10px] text-zinc-500 uppercase tracking-widest">TNRERA Number</label>
        <input
          value={input}
          onChange={e => { setInput(e.target.value); setResult(null); setError('') }}
          placeholder="TN/01/Building/0001/2024 or TNRERA/01/BLG/0001/2026"
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/40 transition-colors"
          onKeyDown={e => e.key === 'Enter' && parsed.isValid && handleVerify()}
        />

        {/* Live parse chips */}
        {input.length > 4 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {parsed.isValid ? (
              <>
                <Chip
                  label="Format"
                  value={parsed.format === 'classic' ? 'Classic 2017–2025' : '2026+ Format'}
                  color={parsed.format === 'classic' ? 'text-blue-400' : 'text-purple-400'}
                  bg={parsed.format === 'classic' ? 'bg-blue-500/10' : 'bg-purple-500/10'}
                  border={parsed.format === 'classic' ? 'border-blue-500/20' : 'border-purple-500/20'}
                />
                <Chip
                  label="District"
                  value={parsed.distName || `Code ${parsed.distCode}`}
                  color="text-amber-400"
                />
                <Chip
                  label="Type"
                  value={parsed.projectType}
                  color="text-emerald-400"
                  bg="bg-emerald-500/10"
                  border="border-emerald-500/20"
                />
                <Chip label="Sequence" value={parsed.seq} color="text-zinc-300" bg="bg-white/[0.04]" border="border-white/[0.08]" />
                <Chip label="Year" value={parsed.year} color="text-zinc-300" bg="bg-white/[0.04]" border="border-white/[0.08]" />
              </>
            ) : (
              <div className="text-[11px] text-red-400 flex items-center gap-1.5">
                <XCircle size={11} />
                Invalid format — see guide below
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleVerify}
          disabled={!parsed.isValid || loading}
          className={cn(
            'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
            parsed.isValid && !loading
              ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
              : 'bg-white/[0.05] text-zinc-600 cursor-not-allowed',
          )}
        >
          {loading ? <RefreshCw size={14} className="animate-spin" /> : <Shield size={14} />}
          {loading ? 'Verifying…' : 'Verify with TNRERA'}
        </button>
        <button
          onClick={() => setShowExempt(v => !v)}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <AlertCircle size={12} />
          {showExempt ? 'Hide' : 'Check if exempt'}
        </button>
      </div>

      {/* Exemption checker */}
      {showExempt && <ExemptionChecker />}

      {/* Error + format guide */}
      {(error || (input.length > 4 && !parsed.isValid)) && <FormatGuide />}
      {error && (
        <div className="bg-red-500/[0.08] border border-red-500/20 rounded-xl p-3 text-sm text-red-400 flex items-center gap-2">
          <XCircle size={14} />
          {error}
        </div>
      )}

      {/* ── Results ── */}
      {result && (
        <div className="space-y-4 pt-1">
          {/* Status banner */}
          <div className={cn(
            'rounded-xl border p-4 flex items-center gap-3',
            result.verified
              ? 'bg-emerald-500/[0.08] border-emerald-500/25'
              : 'bg-red-500/[0.08] border-red-500/25'
          )}>
            {result.verified
              ? <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0" />
              : <XCircle size={20} className="text-red-400 flex-shrink-0" />}
            <div>
              <div className={cn('text-sm font-bold', result.verified ? 'text-emerald-400' : 'text-red-400')}>
                {result.verified ? 'RERA Verified' : 'Verification Failed'}
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">
                Status: <span className="text-zinc-300 font-medium capitalize">{result.status || 'Unknown'}</span>
                {result.confidence != null && (
                  <> · Confidence: <span className="text-zinc-300 font-medium">{Math.round(result.confidence * 100)}%</span></>
                )}
              </div>
            </div>
          </div>

          {/* 3-column: Grade + Expiry + Complaints */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

            {/* A–F Grade */}
            {grade && (
              <div className={cn('rounded-xl border p-4 flex items-center gap-3', grade.bg, grade.border)}>
                <div className={cn('text-5xl font-black leading-none', grade.color)}>{grade.grade}</div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Compliance Grade</div>
                  <div className={cn('text-sm font-semibold mt-0.5', grade.color)}>{grade.label}</div>
                  <div className="text-[10px] text-zinc-600 mt-0.5">{score}% score</div>
                </div>
              </div>
            )}

            {/* Expiry countdown */}
            {daysLeft !== null && (
              <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-4">
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Registration Expiry</div>
                <div className={cn('text-2xl font-black', expiryColor(daysLeft))}>
                  {daysLeft < 0 ? 'EXPIRED' : `${daysLeft}d`}
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  {daysLeft < 0
                    ? 'Registration expired'
                    : daysLeft < 90
                    ? 'Critical — renew urgently'
                    : daysLeft < 180
                    ? 'Renew within 6 months'
                    : 'Valid — good standing'}
                </div>
                {result.expiry_date && (
                  <div className="text-[10px] text-zinc-600 mt-1">
                    Expires: {new Date(result.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                )}
              </div>
            )}

            {/* Complaints */}
            <div className={cn(
              'rounded-xl border p-4',
              complaintsCount > 2
                ? 'bg-red-500/[0.06] border-red-500/15'
                : complaintsCount > 0
                ? 'bg-amber-500/[0.06] border-amber-500/15'
                : 'bg-emerald-500/[0.06] border-emerald-500/15'
            )}>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Complaints on Record</div>
              <div className={cn(
                'text-2xl font-black',
                complaintsCount > 2 ? 'text-red-400' : complaintsCount > 0 ? 'text-amber-400' : 'text-emerald-400'
              )}>
                {complaintsCount}
              </div>
              {complaintsCount > 0 && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertTriangle size={10} className="text-red-400" />
                  <span className="text-[10px] text-red-400 font-semibold">Buyers will see this</span>
                </div>
              )}
              {complaintsCount === 0 && (
                <div className="text-[11px] text-emerald-400 mt-0.5">No complaints — clean record</div>
              )}
            </div>
          </div>

          {/* Project details */}
          {(result.project_name || result.promoter_name || result.registered_address) && (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-2">
              {[
                { label: 'Project Name', value: result.project_name },
                { label: 'Promoter', value: result.promoter_name },
                { label: 'Address', value: result.registered_address },
              ].filter(r => r.value).map(r => (
                <div key={r.label} className="flex items-start gap-3">
                  <span className="text-[10px] text-zinc-600 uppercase tracking-widest w-20 flex-shrink-0 pt-0.5">{r.label}</span>
                  <span className="text-sm text-zinc-300">{r.value}</span>
                </div>
              ))}
              {result.source_url && (
                <a href={result.source_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors mt-1">
                  <ExternalLink size={11} />
                  View on TNRERA portal
                </a>
              )}
            </div>
          )}

          {/* QR Code */}
          {qrUrl && (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex items-start gap-5">
              <img src={qrUrl} alt="RERA QR Code" className="w-[80px] h-[80px] rounded-lg flex-shrink-0" />
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <QrCode size={13} className="text-amber-400" />
                  <span className="text-xs font-semibold text-zinc-300">Buyer Verification QR</span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed max-w-xs">
                  Scan to verify this RERA number directly on the Tamil Nadu RERA portal. Share with buyers for instant trust.
                </p>
                <a
                  href={`https://rera.tn.gov.in/search?reraId=${encodeURIComponent(parsed.raw)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 transition-colors mt-1.5"
                >
                  <ExternalLink size={10} />
                  rera.tn.gov.in
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Format guide shown by default when no input */}
      {!input && <FormatGuide />}
    </div>
  )
}

// ─── Other Sections (kept, minimal style) ────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <GlassCard variant="dark" glow border className="p-4 space-y-3">
      <h2 className={`font-semibold ${DESIGN_TOKENS.colors.text.primary}`}>{title}</h2>
      {children}
    </GlassCard>
  )
}

export default function VerificationTools() {
  // Title
  const [propId, setPropId] = React.useState('P1')
  const [docHash, setDocHash] = React.useState(''.padEnd(64, 'a'))
  const [network, setNetwork] = React.useState('polygon')
  const [titleRes, setTitleRes] = React.useState<any>(null)

  // Fraud
  const [price, setPrice] = React.useState(10000000)
  const [sqft, setSqft] = React.useState(1200)
  const [hasRera, setHasRera] = React.useState(false)
  const [hasTitle, setHasTitle] = React.useState(false)
  const [seller, setSeller] = React.useState('owner')
  const [days, setDays] = React.useState(30)
  const [fraud, setFraud] = React.useState<any>(null)

  // Predictive
  const [city, setCity] = React.useState('Chennai')
  const [locality, setLocality] = React.useState('Anna Nagar')
  const [pred, setPred] = React.useState<any>(null)

  const onTitle = async () => setTitleRes(await verifyTitle({ property_id: propId, document_hash: docHash, network }))
  const onFraud = async () => setFraud(await getFraudScore({ price_inr: price, sqft, has_rera_id: hasRera, has_title_docs: hasTitle, seller_type: seller, listed_days_ago: days }))
  const onPredict = async () => setPred(await getPredictiveAnalytics({ city, locality, sqft, price_inr: price }))

  return (
    <PageWrapper>
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Tools', href: '/tools' },
        { label: 'Verification Tools' }
      ]} />

      <PageHeader
        title="Verification & Risk Tools"
        description="TNRERA dual-format verification, compliance grading, document immutability, and predictive analytics"
        className="text-center mb-8"
      />

      <SectionWrapper noPadding>
        <div className="space-y-6">
          {/* 1. TNRERA Verification — top-tier tool */}
          <RERAVerificationTool />

          {/* 2. Document snapshot immutability */}
          <Section title="Document snapshot immutability (proof-of-snapshot)">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input className="rounded-lg border px-3 py-2" placeholder="Property ID" value={propId} onChange={(e) => setPropId(e.target.value)} />
              <input className="rounded-lg border px-3 py-2 font-mono" placeholder="Document hash (hex)" value={docHash} onChange={(e) => setDocHash(e.target.value)} />
              <select className="rounded-lg border px-3 py-2" value={network} onChange={(e) => setNetwork(e.target.value)}>
                {['polygon', 'ethereum', 'other'].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="flex gap-3"><PremiumButton variant="secondary" size="sm" onClick={onTitle}>Verify title</PremiumButton></div>
            {titleRes && (
              <div className={`rounded-lg border ${DESIGN_TOKENS.colors.border.default} p-3 text-sm`}>
                <div className={DESIGN_TOKENS.colors.text.secondary}>Verified: <span className={`font-semibold ${DESIGN_TOKENS.colors.text.primary}`}>{String(titleRes.verified)}</span> · Confidence: {Math.round((titleRes.confidence || 0) * 100)}%</div>
                <div className={`font-mono break-words ${DESIGN_TOKENS.colors.text.primary}`}>TX: {titleRes.transaction_hash}</div>
                {titleRes.explorer_url && <a className={`${DESIGN_TOKENS.colors.text.accent} underline`} href={titleRes.explorer_url} target="_blank" rel="noopener">Open explorer</a>}
              </div>
            )}
          </Section>

          {/* 3. Fraud risk score */}
          <Section title="Fraud risk score">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              <input className="rounded-lg border px-3 py-2" type="number" placeholder="Price (INR)" value={price} onChange={(e) => setPrice(Number(e.target.value || 0))} />
              <input className="rounded-lg border px-3 py-2" type="number" placeholder="Sqft" value={sqft} onChange={(e) => setSqft(Number(e.target.value || 0))} />
              <select className="rounded-lg border px-3 py-2" value={seller} onChange={(e) => setSeller(e.target.value)}>
                {['owner', 'broker', 'builder'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input className="rounded-lg border px-3 py-2" type="number" placeholder="Days listed" value={days} onChange={(e) => setDays(Number(e.target.value || 0))} />
              <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={hasRera} onChange={(e) => setHasRera(e.target.checked)} /> RERA</label>
              <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={hasTitle} onChange={(e) => setHasTitle(e.target.checked)} /> Title docs</label>
            </div>
            <div className="flex gap-3"><PremiumButton variant="secondary" size="sm" onClick={onFraud}>Compute score</PremiumButton></div>
            {fraud && (
              <div className={`rounded-lg border ${DESIGN_TOKENS.colors.border.default} p-3 text-sm`}>
                <div className={`text-lg font-bold ${DESIGN_TOKENS.colors.text.primary}`}>Risk: {fraud.risk_score}/100 · {fraud.risk_level}</div>
                <ul className="list-disc pl-5">
                  {(fraud.reasons || []).map((r: string, i: number) => (<li key={i} className={DESIGN_TOKENS.colors.text.secondary}>{r}</li>))}
                </ul>
              </div>
            )}
          </Section>

          {/* 4. Predictive analytics */}
          <Section title="Predictive analytics">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input className="rounded-lg border px-3 py-2" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
              <input className="rounded-lg border px-3 py-2" placeholder="Locality" value={locality} onChange={(e) => setLocality(e.target.value)} />
            </div>
            <div className="flex gap-3"><PremiumButton variant="secondary" size="sm" onClick={onPredict}>Predict</PremiumButton></div>
            {pred && (
              <div className={`rounded-lg border ${DESIGN_TOKENS.colors.border.default} p-3 text-sm`}>
                <div className={DESIGN_TOKENS.colors.text.secondary}>1-year appreciation: <span className={`font-semibold ${DESIGN_TOKENS.colors.text.primary}`}>{pred.price_appreciation_1y_pct}%</span></div>
                <div className={DESIGN_TOKENS.colors.text.secondary}>3-year appreciation: <span className={`font-semibold ${DESIGN_TOKENS.colors.text.primary}`}>{pred.price_appreciation_3y_pct}%</span></div>
                <div className={DESIGN_TOKENS.colors.text.secondary}>Expected rent yield: <span className={`font-semibold ${DESIGN_TOKENS.colors.text.primary}`}>{pred.expected_rent_yield_pct}%</span></div>
              </div>
            )}
          </Section>
        </div>
      </SectionWrapper>
    </PageWrapper>
  )
}
