'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Building2, Sun, Mountain, Warehouse,
  Landmark, ArrowRight, CheckCircle2, Shield, AlertCircle,
  FileText, MapPin, Zap, ChevronRight, Loader2, Lock, User, Phone, Mail
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
    desc: 'Heavy industrial, manufacturing, SIPCOT adjacent, automotive or EV clusters',
    icon: Building2,
  },
  {
    id: 'solar_site',
    title: 'Solar & Renewable Site',
    desc: 'Substation contiguous, high irradiance, clear revenue patta',
    icon: Sun,
  },
  {
    id: 'quarry_mineral',
    title: 'Quarry & Mineral Reserve',
    desc: 'Limestone, aggregates, active mining lease, raw feed for cement manufacturing',
    icon: Mountain,
  },
  {
    id: 'warehousing_logistics',
    title: 'Logistics & Warehousing',
    desc: 'Expressway corridor frontage, PEB warehouse feasibility, freight access',
    icon: Warehouse,
  },
  {
    id: 'commercial_office',
    title: 'Commercial IT / Tech Park',
    desc: 'Income-generating grade-A buildings, campus developments',
    icon: Landmark,
  }
]

const STRATEGIC_CORRIDORS = [
  'Tuticorin – Tirunelveli (Renewable / Port Corridor)',
  'Sriperumbudur – Oragadam (Automotive & Manufacturing Hub)',
  'Ariyalur – Karur (Cement & Limestone Belt)',
  'Hosur – Krishnagiri (EV & Advanced Engineering)',
  'Coimbatore – Tiruppur (Industrial & Engineering Belt)',
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
  const [confidentiality, setConfidentiality] = useState('confidential_placement')

  // Principal details
  const [sellerName, setSellerName] = useState(user?.user_metadata?.full_name || user?.user_metadata?.name || '')
  const [sellerEmail, setSellerEmail] = useState(user?.email || '')
  const [sellerPhone, setSellerPhone] = useState(user?.user_metadata?.phone || '')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [assessmentSummary, setAssessmentSummary] = useState<any>(null)
  const [submittedSuccess, setSubmittedSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  const handleSubmitIntake = async () => {
    setIsSubmitting(true)
    setErrorMsg('')
    try {
      const payload = {
        asset_type: assetType,
        title: title || `${extentAcres || 'Prime'} Acres ${assetType.replace('_', ' ')} — ${district}`,
        extent_acres: parseFloat(extentAcres) || 0,
        location_district: district,
        strategic_corridor: corridor,
        price_total_inr: parseFloat(priceTotal) * 10000000 || 0, // Crores -> INR
        price_per_acre_inr: parseFloat(pricePerAcre) * 100000 || 0,
        power_infrastructure: powerInfra || 'Adjacent high tension line',
        road_connectivity: roadAccess || 'Direct all-weather access road',
        title_status: titleStatus,
        quarry_mineral_specs: quarryOrSolarSpecs,
        solar_specs: quarryOrSolarSpecs,
        confidentiality_level: confidentiality,
        seller_name: sellerName || 'Asset Owner',
        seller_email: sellerEmail || user?.email || '',
        seller_phone: sellerPhone || '',
        user_id: user?.id || null
      }

      const res = await fetch('/api/commercial/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit property')

      setAssessmentSummary(data.dossier || data.analysis || {})
      setStep(4)
      if (onSuccess) onSuccess(data)
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Error submitting asset details. Please verify your connection.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFinish = () => {
    setSubmittedSuccess(true)
    setTimeout(() => {
      onClose()
      setSubmittedSuccess(false)
      setStep(1)
      setAssessmentSummary(null)
    }, 1800)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="relative w-full max-w-3xl bg-white border border-[#E8E2D6] rounded-3xl shadow-2xl text-[#1A1816] overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Top Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-[#E8E2D6] flex items-center justify-between bg-[#FAF8F5] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#F4F0E8] border border-[#DDD5C5] flex items-center justify-center text-[#9E7B4F]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-sans font-bold tracking-widest uppercase text-[#9E7B4F]">
                  Property Intake
                </span>
                <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-[#1A1816] text-[#FAF8F5]">
                  Confidential Placement
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-[#1A1816]">
                List Your Commercial Asset
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#F4F0E8] hover:bg-[#ECE6DA] flex items-center justify-center text-[#5A564F] hover:text-[#1A1816] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-4 px-6 sm:px-8 py-3 bg-[#FAF8F5] border-b border-[#E8E2D6] text-xs shrink-0">
          {[
            { num: 1, label: 'Asset Class' },
            { num: 2, label: 'Location & Infra' },
            { num: 3, label: 'Title & Value' },
            { num: 4, label: 'Assessment' },
          ].map(s => (
            <div
              key={s.num}
              className={`flex items-center gap-2 transition-colors ${
                step === s.num
                  ? 'text-[#1A1816] font-semibold'
                  : step > s.num
                  ? 'text-[#9E7B4F]'
                  : 'text-[#8E887E]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step === s.num
                    ? 'bg-[#1A1816] text-[#FAF8F5]'
                    : step > s.num
                    ? 'bg-[#9E7B4F] text-white'
                    : 'bg-[#E8E2D6] text-[#8E887E]'
                }`}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <span className="hidden sm:inline font-sans">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
          {/* STEP 1: Asset Class */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div>
                <h3 className="text-xl font-serif font-bold text-[#1A1816]">Select Commercial Asset Category</h3>
                <p className="text-xs text-[#5A564F] mt-1 font-light">
                  Choose the classification that best represents your property holding in Tamil Nadu.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {ASSET_TYPES.map(type => {
                  const Icon = type.icon
                  const active = assetType === type.id
                  return (
                    <div
                      key={type.id}
                      onClick={() => setAssetType(type.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        active
                          ? 'border-[#1A1816] bg-[#F7F4EE] shadow-sm'
                          : 'border-[#E8E2D6] bg-[#FAF8F5] hover:bg-[#F4F0E8]'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          active ? 'bg-[#1A1816] text-[#C5A059]' : 'bg-[#E8E2D6]/50 text-[#5A564F]'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-serif font-bold text-[#1A1816]">{type.title}</h4>
                          <p className="text-xs text-[#5A564F]">{type.desc}</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        active ? 'border-[#1A1816] bg-[#1A1816]' : 'border-[#DDD5C5]'
                      }`}>
                        {active && <div className="w-2 h-2 rounded-full bg-[#FAF8F5]" />}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div>
                <label className="block text-xs font-sans uppercase tracking-wider text-[#8E887E] font-medium mb-1.5">
                  Working Title / Asset Identifier
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., 60-Acre Contiguous Industrial Parcel adjacent to NH-48"
                  className="w-full px-4 py-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D6] text-xs text-[#1A1816] focus:outline-none focus:border-[#9E7B4F]"
                />
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 rounded-full bg-[#1A1816] hover:bg-[#2D2926] text-[#FAF8F5] font-sans text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-2"
                >
                  <span>Continue to Location</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C5A059]" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Location & Infrastructure */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div>
                <h3 className="text-xl font-serif font-bold text-[#1A1816]">Location & Physical Infrastructure</h3>
                <p className="text-xs text-[#5A564F] mt-1 font-light">
                  Specify the geographic corridor and physical utility access points.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-sans uppercase tracking-wider text-[#8E887E] font-medium mb-1.5">
                    Land Extent (Total Acres) *
                  </label>
                  <input
                    type="number"
                    value={extentAcres}
                    onChange={e => setExtentAcres(e.target.value)}
                    placeholder="e.g., 75"
                    className="w-full px-4 py-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D6] text-xs text-[#1A1816] focus:outline-none focus:border-[#9E7B4F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans uppercase tracking-wider text-[#8E887E] font-medium mb-1.5">
                    District in Tamil Nadu *
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    placeholder="e.g., Kanchipuram, Tuticorin, Ariyalur"
                    className="w-full px-4 py-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D6] text-xs text-[#1A1816] focus:outline-none focus:border-[#9E7B4F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-sans uppercase tracking-wider text-[#8E887E] font-medium mb-1.5">
                  Strategic Corridor
                </label>
                <select
                  value={corridor}
                  onChange={e => setCorridor(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D6] text-xs text-[#1A1816] focus:outline-none focus:border-[#9E7B4F]"
                >
                  {STRATEGIC_CORRIDORS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-sans uppercase tracking-wider text-[#8E887E] font-medium mb-1.5">
                    Power & Substation Proximity
                  </label>
                  <input
                    type="text"
                    value={powerInfra}
                    onChange={e => setPowerInfra(e.target.value)}
                    placeholder="e.g., 110kV Substation within 1.5 km"
                    className="w-full px-4 py-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D6] text-xs text-[#1A1816] focus:outline-none focus:border-[#9E7B4F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans uppercase tracking-wider text-[#8E887E] font-medium mb-1.5">
                    Road Access & Frontage
                  </label>
                  <input
                    type="text"
                    value={roadAccess}
                    onChange={e => setRoadAccess(e.target.value)}
                    placeholder="e.g., 400m direct NH-48 road frontage"
                    className="w-full px-4 py-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D6] text-xs text-[#1A1816] focus:outline-none focus:border-[#9E7B4F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-sans uppercase tracking-wider text-[#8E887E] font-medium mb-1.5">
                  Technical Reserve / Solar / Quarry Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={quarryOrSolarSpecs}
                  onChange={e => setQuarryOrSolarSpecs(e.target.value)}
                  placeholder="e.g., Estimated 15M MT high-calcium limestone, or flat topography ideal for 30MW solar..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D6] text-xs text-[#1A1816] focus:outline-none focus:border-[#9E7B4F]"
                />
              </div>

              <div className="flex justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 rounded-full bg-[#FAF8F5] hover:bg-[#F4F0E8] text-xs text-[#5A564F] transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-3 rounded-full bg-[#1A1816] hover:bg-[#2D2926] text-[#FAF8F5] font-sans text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-2"
                >
                  <span>Continue to Title & Value</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C5A059]" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Title & Value & Principal Contact */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div>
                <h3 className="text-xl font-serif font-bold text-[#1A1816]">Title Verification & Commercial Terms</h3>
                <p className="text-xs text-[#5A564F] mt-1 font-light">
                  Provide your target valuation and contact details for private advisory placement.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-sans uppercase tracking-wider text-[#8E887E] font-medium mb-1.5">
                    Target Total Outlay (in ₹ Crores) *
                  </label>
                  <input
                    type="number"
                    value={priceTotal}
                    onChange={e => setPriceTotal(e.target.value)}
                    placeholder="e.g., 45"
                    className="w-full px-4 py-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D6] text-xs text-[#1A1816] focus:outline-none focus:border-[#9E7B4F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans uppercase tracking-wider text-[#8E887E] font-medium mb-1.5">
                    Revenue Title Status
                  </label>
                  <select
                    value={titleStatus}
                    onChange={e => setTitleStatus(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D6] text-xs text-[#1A1816] focus:outline-none focus:border-[#9E7B4F]"
                  >
                    <option value="Single Owner Clean Patta">Single Owner Clean Revenue Patta</option>
                    <option value="Joint Family Clean Title">Joint Ownership Clean Title</option>
                    <option value="Industrial Converted / DTCP Approved">Industrial Converted / DTCP Approved</option>
                    <option value="Mining Lease / Concession Valid">Active Mining Lease / Concession Valid</option>
                  </select>
                </div>
              </div>

              {/* Principal Information */}
              <div className="p-4 rounded-2xl bg-[#F7F4EE] border border-[#E8E2D6] space-y-3">
                <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#7A5B32] font-semibold block">
                  Principal / Owner Contact Details
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase text-[#8E887E] mb-1">Your Name *</label>
                    <input
                      type="text"
                      value={sellerName}
                      onChange={e => setSellerName(e.target.value)}
                      placeholder="Principal Name"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E2D6] text-xs text-[#1A1816]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-[#8E887E] mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      value={sellerPhone}
                      onChange={e => setSellerPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E2D6] text-xs text-[#1A1816]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-[#8E887E] mb-1">Email Address</label>
                    <input
                      type="email"
                      value={sellerEmail}
                      onChange={e => setSellerEmail(e.target.value)}
                      placeholder="owner@domain.com"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E2D6] text-xs text-[#1A1816]"
                    />
                  </div>
                </div>

                {!user && (
                  <p className="text-[11px] text-[#7A5B32] flex items-center gap-1.5 pt-1">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Signing in with Google lets you track live due diligence status under Property Status.</span>
                  </p>
                )}
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 rounded-full bg-[#FAF8F5] hover:bg-[#F4F0E8] text-xs text-[#5A564F] transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmitIntake}
                  disabled={isSubmitting || !extentAcres || !district}
                  className="px-7 py-3.5 rounded-full bg-[#1A1816] hover:bg-[#2D2926] text-[#FAF8F5] font-sans text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-2 disabled:opacity-50 shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#C5A059]" />
                      <span>Generating Assessment...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Property</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#C5A059]" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Success & Assessment Summary */}
          {step === 4 && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 text-center py-4">
              <div className="w-14 h-14 rounded-full bg-[#F4EFE6] border border-[#DDD5C5] flex items-center justify-center mx-auto text-[#9E7B4F]">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-[#9E7B4F] font-semibold block mb-1">
                  Submission Received
                </span>
                <h3 className="text-2xl font-serif font-bold text-[#1A1816]">
                  Preliminary Asset Assessment Ready
                </h3>
                <p className="text-xs sm:text-sm text-[#5A564F] max-w-lg mx-auto mt-2 leading-relaxed font-light">
                  Your property details have been recorded under your profile. Our advisory team will review revenue records and initiate confidential underwriting.
                </p>
              </div>

              {assessmentSummary && (
                <div className="text-left p-5 rounded-2xl bg-[#F7F4EE] border border-[#E8E2D6] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E8E2D6] pb-2">
                    <span className="text-xs font-serif font-bold text-[#1A1816]">
                      {assessmentSummary.title || title || 'Commercial Land Asset'}
                    </span>
                    <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-[#1A1816] text-[#FAF8F5]">
                      {assessmentSummary.indicative_readiness_score ? `${assessmentSummary.indicative_readiness_score}/100 Readiness` : 'In Progress'}
                    </span>
                  </div>

                  <p className="text-xs text-[#5A564F] leading-relaxed">
                    {assessmentSummary.executive_summary || 'Asset parameters conform with institutional criteria. Title and infrastructure due diligence is underway.'}
                  </p>

                  <div className="pt-2 flex flex-wrap gap-2 text-[10px] text-[#7A5B32]">
                    <span className="px-2.5 py-1 rounded-full bg-white border border-[#E8E2D6]">
                      Extent: {extentAcres} Acres
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-white border border-[#E8E2D6]">
                      Corridor: {district}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-white border border-[#E8E2D6]">
                      Status: Under Due Diligence
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleFinish}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#1A1816] hover:bg-[#2D2926] text-[#FAF8F5] font-sans text-xs uppercase tracking-wider font-semibold transition-all shadow-md"
                >
                  View in Property Status
                </button>

                <a
                  href="tel:+918870980839"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-[#FAF8F5] hover:bg-[#F4F0E8] border border-[#E8E2D6] text-[#1A1816] text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Phone className="w-3.5 h-3.5 text-[#9E7B4F]" /> Call Desk Directly
                </a>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}