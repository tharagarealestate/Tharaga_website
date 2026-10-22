'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Sparkles, Building2, Sun, Mountain, Warehouse,
  Landmark, ArrowRight, CheckCircle2, Shield, AlertCircle,
  FileText, MapPin, Zap, ChevronRight, Loader2, Lock, User
} from 'lucide-react'
import { openAuthModal } from '@/components/ui/AuthButton'

interface CommercialIntakeModalProps {
  isOpen: boolean
  onClose: () => void
  user: any
  onSuccess?: (mandate: any) => void
}

const ASSET_TYPES = [
  {
    id: 'industrial_land',
    title: 'Industrial Land Bank',
    desc: 'Heavy industrial, manufacturing, SIPCOT adjacent, automotive clusters',
    icon: Building2,
    badge: 'High Demand'
  },
  {
    id: 'solar_site',
    title: 'Solar & Renewable Site',
    desc: 'Substation contiguous, high GHI/DNI, clear revenue patta',
    icon: Sun,
    badge: 'MNC Offtakers'
  },
  {
    id: 'quarry_mineral',
    title: 'Quarry & Mineral Reserve',
    desc: 'Limestone, aggregates, active mining lease, raw feed for cement MNCs',
    icon: Mountain,
    badge: 'Chettinad / Cement Feed'
  },
  {
    id: 'warehousing_logistics',
    title: 'Logistics & Warehousing',
    desc: 'Expressway corridor, high-bay PEB feasibility, freight siding',
    icon: Warehouse,
    badge: '3PL & REITs'
  },
  {
    id: 'commercial_office',
    title: 'Commercial IT / Complex',
    desc: 'Pre-leased tech parks, institutional grade office buildings, high cap rates',
    icon: Landmark,
    badge: 'Institutional Yield'
  }
]

const STRATEGIC_CORRIDORS = [
  'Tuticorin – Tirunelveli (Renewable / Port Corridor)',
  'Sriperumbudur – Oragadam (Automotive & Electronics Hub)',
  'Ariyalur – Karur (Cement & Limestone Belt)',
  'Hosur – Krishnagiri (EV & Advanced Engineering)',
  'Coimbatore – Tiruppur (Industrial & Engineering)',
  'Chennai Port – Ennore – Gummidipoondi (Logistics Spine)',
  'OMR – Guindy (Commercial & Technology Corridor)'
]

export function CommercialIntakeModal({ isOpen, onClose, user, onSuccess }: CommercialIntakeModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [assetType, setAssetType] = useState('industrial_land')
  const [title, setTitle] = useState('')
  const [extentAcres, setExtentAcres] = useState('')
  const [corridor, setCorridor] = useState(STRATEGIC_CORRIDORS[0])
  const [district, setDistrict] = useState('Tuticorin')
  const [priceTotal, setPriceTotal] = useState('')
  const [pricePerAcre, setPricePerAcre] = useState('')
  const [powerInfra, setPowerInfra] = useState('')
  const [roadAccess, setRoadAccess] = useState('')
  const [titleStatus, setTitleStatus] = useState('Single Owner Clean Patta')
  const [quarryOrSolarSpecs, setQuarryOrSolarSpecs] = useState('')
  const [confidentiality, setConfidentiality] = useState('selective_mnc')
  
  // Principal details
  const [sellerName, setSellerName] = useState(user?.user_metadata?.full_name || user?.user_metadata?.name || '')
  const [sellerEmail, setSellerEmail] = useState(user?.email || '')
  const [sellerPhone, setSellerPhone] = useState(user?.user_metadata?.phone || '')

  // Claude AI state
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [claudeDossier, setClaudeDossier] = useState<any>(null)
  const [submittedSuccess, setSubmittedSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  // Trigger Claude API to generate the executive underwriting analysis
  const handleAnalyzeWithClaude = async () => {
    setIsAnalyzing(true)
    setErrorMsg('')
    try {
      const payload = {
        asset_type: assetType,
        title: title || `${extentAcres || 'Prime'} Acres ${assetType.replace('_', ' ')} — ${corridor}`,
        extent_acres: parseFloat(extentAcres) || 0,
        location_district: district,
        strategic_corridor: corridor,
        price_total_inr: parseFloat(priceTotal) * 10000000 || 0, // In Crores -> INR
        price_per_acre_inr: parseFloat(pricePerAcre) * 100000 || 0, // In Lakhs -> INR
        power_infrastructure: powerInfra,
        road_connectivity: roadAccess,
        title_status: titleStatus,
        quarry_mineral_specs: quarryOrSolarSpecs,
        solar_specs: quarryOrSolarSpecs,
        confidentiality_level: confidentiality,
        seller_name: sellerName,
        seller_email: sellerEmail || user?.email,
        seller_phone: sellerPhone,
        user_id: user?.id || null
      }

      const res = await fetch('/api/commercial/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to complete institutional analysis')

      setClaudeDossier(data.dossier)
      setStep(4)
      if (onSuccess) onSuccess(data)
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Error communicating with Claude analysis engine')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleFinalSubmit = () => {
    setSubmittedSuccess(true)
    setTimeout(() => {
      onClose()
      setSubmittedSuccess(false)
      setStep(1)
      setClaudeDossier(null)
    }, 2800)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-3xl bg-[#0D0D10] border border-white/[0.12] rounded-3xl shadow-2xl text-white overflow-hidden my-auto"
      >
        {/* Top Architectural Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-white/[0.08] flex items-center justify-between bg-[#131318]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono tracking-widest uppercase text-amber-400">Institutional Syndicate</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white/60 font-mono">Claude 3.5 Intelligence</span>
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-white/95">Commercial Mandate Intake Assistant</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Tracker Strip */}
        <div className="grid grid-cols-4 px-6 sm:px-8 py-3 bg-[#0A0A0D] border-b border-white/[0.06] text-xs">
          {[
            { num: 1, label: 'Asset Class' },
            { num: 2, label: 'Infrastructure' },
            { num: 3, label: 'Commercials' },
            { num: 4, label: 'Claude Dossier' },
          ].map(s => (
            <div
              key={s.num}
              className={`flex items-center gap-2 cursor-pointer transition-colors ${
                step === s.num
                  ? 'text-amber-400 font-semibold'
                  : step > s.num
                  ? 'text-emerald-400'
                  : 'text-white/30'
              }`}
              onClick={() => {
                if (step > s.num || (s.num < 4 && claudeDossier)) setStep(s.num as any)
              }}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === s.num
                  ? 'bg-amber-400 text-black font-bold'
                  : step > s.num
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-white/10 text-white/50'
              }`}>
                {step > s.num ? '✓' : s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Body content */}
        <div className="p-6 sm:p-8 max-h-[72vh] overflow-y-auto">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: ASSET CLASSIFICATION */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-white/50 mb-3">
                  01 // Select Commercial Asset Class
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ASSET_TYPES.map(type => {
                    const Icon = type.icon
                    const isSelected = assetType === type.id
                    return (
                      <div
                        key={type.id}
                        onClick={() => setAssetType(type.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-400/80 shadow-lg shadow-amber-500/10'
                            : 'bg-white/[0.03] border-white/[0.08] hover:border-white/20 hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            isSelected ? 'bg-amber-500 text-black' : 'bg-white/10 text-amber-400'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-amber-300/80 border border-white/10">
                            {type.badge}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-white mb-1">{type.title}</h4>
                        <p className="text-xs text-white/50 leading-relaxed">{type.desc}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-white/50 mb-2">
                    Strategic Corridor
                  </label>
                  <select
                    value={corridor}
                    onChange={e => {
                      setCorridor(e.target.value)
                      if (e.target.value.includes('Tuticorin')) setDistrict('Tuticorin')
                      else if (e.target.value.includes('Ariyalur')) setDistrict('Ariyalur')
                      else if (e.target.value.includes('Sriperumbudur')) setDistrict('Kanchipuram')
                      else if (e.target.value.includes('Hosur')) setDistrict('Krishnagiri')
                      else if (e.target.value.includes('Coimbatore')) setDistrict('Coimbatore')
                    }}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    {STRATEGIC_CORRIDORS.map(c => (
                      <option key={c} value={c} className="bg-[#121216] text-white">{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-white/50 mb-2">
                    Land Extent (Acres)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 50, 120, 250"
                      value={extentAcres}
                      onChange={e => setExtentAcres(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-400"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-white/40">Acres</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-white/[0.08]">
                <button
                  onClick={() => setStep(2)}
                  disabled={!extentAcres}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue to Infrastructure <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: INFRASTRUCTURE & TECHNICAL SPECS */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-white/50 mb-2">
                  02 // Power Grid & Substation Capacity
                </label>
                <input
                  type="text"
                  placeholder="e.g. 110kV Substation within 1.5 km, dedicated HT feeder line permitted"
                  value={powerInfra}
                  onChange={e => setPowerInfra(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-white/50 mb-2">
                  Logistics & Highway Frontage
                </label>
                <input
                  type="text"
                  placeholder="e.g. Direct 4-lane NH-48 / NH-44 frontage with 400m clearance for freight trucks"
                  value={roadAccess}
                  onChange={e => setRoadAccess(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-white/50 mb-2">
                  Title & Regulatory Standing
                </label>
                <select
                  value={titleStatus}
                  onChange={e => setTitleStatus(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="Single Owner Clean Revenue Patta (Zero Encumbrance)">Single Owner Clean Revenue Patta (Zero Encumbrance)</option>
                  <option value="Industrial Land Conversion Approved (DTCP / CMDA)">Industrial Land Conversion Approved (DTCP / CMDA)</option>
                  <option value="Valid Mining Lease & Department of Geology Consent">Valid Mining Lease & Department of Geology Consent</option>
                  <option value="Private Joint Ownership with Single Power of Attorney">Private Joint Ownership with Single Power of Attorney</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-white/50 mb-2">
                  {assetType === 'quarry_mineral'
                    ? 'Quarry / Mineral Reserves (Estimated Million MT & Rock Type)'
                    : assetType === 'solar_site'
                    ? 'Solar Irradiance / Evacuation Tier (GHI, slope, open access)'
                    : 'Specific Industrial Readiness Notes'}
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    assetType === 'quarry_mineral'
                      ? 'e.g. High-grade limestone deposit ~25-30M MT, verified core borehole report available, 20-year valid lease for cement feed'
                      : assetType === 'solar_site'
                      ? 'e.g. Level terrain with 5.7 kWh/m²/day GHI, zero shadow obstructions, direct STU nodal clearance'
                      : 'e.g. Ground water boreholes at 400 ft, SIPCOT Phase 2 proximity, industrial gas pipeline 3 km'
                  }
                  value={quarryOrSolarSpecs}
                  onChange={e => setQuarryOrSolarSpecs(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-all"
                >
                  Commercials & Confidentiality <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: VALUATION & CONFIDENTIALITY */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-white/50 mb-2">
                    03 // Target Consideration (₹ Crores)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 45"
                      value={priceTotal}
                      onChange={e => setPriceTotal(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-400"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-white/40">₹ Crores</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-white/50 mb-2">
                    Price per Acre (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 35"
                      value={pricePerAcre}
                      onChange={e => setPricePerAcre(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-400"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-white/40">₹ Lakhs/Acre</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-white/50 mb-3">
                  Confidentiality & Syndication Protocol
                </label>
                <div className="space-y-2.5">
                  {[
                    {
                      id: 'selective_mnc',
                      title: 'Selective MNC Matching (Recommended)',
                      desc: 'Discreet matching exclusively to verified MNCs (Chettinad, Renewables, PE) without public disclosure.'
                    },
                    {
                      id: 'confidential_blind',
                      title: 'Confidential Blind Mandate',
                      desc: 'Coordinates and exact survey numbers withheld until counterparty signs mutual NDA.'
                    },
                    {
                      id: 'public_showcase',
                      title: 'Active Institutional Showcase',
                      desc: 'Featured in Tharaga Institutional Showcase with verified commercial badge.'
                    }
                  ].map(tier => (
                    <div
                      key={tier.id}
                      onClick={() => setConfidentiality(tier.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        confidentiality === tier.id
                          ? 'bg-amber-500/10 border-amber-400 text-white'
                          : 'bg-white/[0.02] border-white/[0.06] text-white/70 hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                        confidentiality === tier.id ? 'border-amber-400 bg-amber-400' : 'border-white/30'
                      }`}>
                        {confidentiality === tier.id && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{tier.title}</div>
                        <div className="text-xs text-white/50">{tier.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Principal / Seller Information */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-amber-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Principal / Asset Representative
                  </span>
                  {!user && (
                    <button
                      onClick={() => openAuthModal()}
                      className="text-xs text-amber-400 hover:underline"
                    >
                      Sign In with Google for instant tracking
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Principal / Entity Name"
                    value={sellerName}
                    onChange={e => setSellerName(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30"
                  />
                  <input
                    type="email"
                    placeholder="Corporate Email"
                    value={sellerEmail}
                    onChange={e => setSellerEmail(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30"
                  />
                  <input
                    type="tel"
                    placeholder="Direct Phone / WhatsApp"
                    value={sellerPhone}
                    onChange={e => setSellerPhone(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleAnalyzeWithClaude}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold text-sm shadow-xl shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing with Claude...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-black" />
                      Generate Institutional Dossier
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: CLAUDE AI GENERATED DOSSIER & FINAL AUTHORIZATION */}
          {step === 4 && claudeDossier && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {submittedSuccess ? (
                <div className="text-center py-10 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Commercial Mandate Registered</h3>
                  <p className="text-white/60 text-sm max-w-md mx-auto">
                    Your asset is under confidential due diligence. Our senior desk is matching with registered MNC acquisition mandates. You can monitor live progress under your Google profile.
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-amber-400">
                    Status: Confidential Underwriting In Progress
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Institutional Synthesis
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                        {claudeDossier.estimated_valuation_band}
                      </span>
                    </div>
                    <p className="text-sm text-white/90 leading-relaxed font-serif italic text-base">
                      "{claudeDossier.executive_summary}"
                    </p>
                  </div>

                  {/* Target Corporate Offtakers */}
                  <div>
                    <h4 className="text-xs font-mono uppercase tracking-widest text-white/50 mb-3">
                      Target MNC & Offtaker Matches Identified
                    </h4>
                    <div className="space-y-2">
                      {claudeDossier.target_offtakers?.map((offtaker: string, idx: number) => (
                        <div key={idx} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-3 text-xs text-white/90">
                          <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">
                            0{idx + 1}
                          </div>
                          <span>{offtaker}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Due Diligence Checklist */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] space-y-2">
                    <h4 className="text-xs font-mono uppercase tracking-widest text-white/40">
                      Technical Underwriting Protocol
                    </h4>
                    <ul className="space-y-1.5 text-xs text-white/70">
                      {claudeDossier.due_diligence_checklist?.map((item: string, i: number) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
                    <button
                      onClick={() => setStep(3)}
                      className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
                    >
                      Adjust Commercials
                    </button>
                    <button
                      onClick={handleFinalSubmit}
                      className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm shadow-xl shadow-amber-500/30 transition-all"
                    >
                      <Lock className="w-4 h-4" /> Authorize Private Syndication
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
