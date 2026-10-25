'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Building2, Sun, Mountain, Warehouse,
  Landmark, ArrowRight, CheckCircle2, Shield, AlertCircle,
  FileText, MapPin, Zap, ChevronRight, Loader2, Lock, User,
  Phone, Mail, Upload, Image as ImageIcon, Video, Trash2,
  Sparkles, Home, Trees, Laptop, Plus, IndianRupee
} from 'lucide-react'
import { openAuthModal } from '@/components/ui/AuthButton'

interface CommercialIntakeModalProps {
  isOpen: boolean
  onClose: () => void
  user: any
  onSuccess?: (mandate: any) => void
}

const PROPERTY_CATEGORIES = [
  { id: 'commercial_building', label: 'Commercial Building (Shops/Offices)', icon: Building2, example: 'e.g. Building with 6-7 shops, retail complex, showroom' },
  { id: 'residential', label: 'Residential (Villa / House / Flat)', icon: Home, example: 'e.g. Independent villa, apartment, residential building' },
  { id: 'land_parcel', label: 'Land Parcel & Plots', icon: Trees, example: 'e.g. Commercial land, layout plots, agricultural land' },
  { id: 'it_tech_hub', label: 'IT Hub & Tech Campus', icon: Laptop, example: 'e.g. Grade-A office space, tech campus, IT building' },
  { id: 'industrial_warehouse', label: 'Industrial & Warehouse', icon: Warehouse, example: 'e.g. Heavy manufacturing, warehouse, factory unit' },
  { id: 'solar_quarry', label: 'Solar Park / Quarry', icon: Sun, example: 'e.g. Grid-connected solar land, limestone quarry lease' },
]

interface MediaItem {
  name: string
  type: string
  size: number
  url: string
  data?: string
}

export function CommercialIntakeModal({ isOpen, onClose, user, onSuccess }: CommercialIntakeModalProps) {
  const [step, setStep] = useState<'input' | 'analyzing' | 'success'>('input')
  const [selectedCategory, setSelectedCategory] = useState('commercial_building')
  const [description, setDescription] = useState('')
  const [askingPrice, setAskingPrice] = useState('')
  const [cityOrLocation, setCityOrLocation] = useState('')
  const [rentalIncome, setRentalIncome] = useState('')

  // Seller details
  const [sellerName, setSellerName] = useState(user?.user_metadata?.full_name || user?.user_metadata?.name || '')
  const [sellerPhone, setSellerPhone] = useState(user?.user_metadata?.phone || '')
  const [sellerEmail, setSellerEmail] = useState(user?.email || '')

  // Media files (photos & videos)
  const [mediaFiles, setMediaFiles] = useState<MediaItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // AI response state
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  // File upload handler for photos & videos
  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return
    const fileArray = Array.from(files)

    fileArray.forEach(file => {
      // Create local preview URL
      const previewUrl = URL.createObjectURL(file)
      const reader = new FileReader()

      reader.onloadend = () => {
        setMediaFiles(prev => [
          ...prev,
          {
            name: file.name,
            type: file.type,
            size: file.size,
            url: previewUrl,
            data: typeof reader.result === 'string' ? reader.result : undefined
          }
        ])
      }

      // Read small files as data URL for persistence, or preview URL
      if (file.size < 4 * 1024 * 1024 && file.type.startsWith('image/')) {
        reader.readAsDataURL(file)
      } else {
        setMediaFiles(prev => [
          ...prev,
          {
            name: file.name,
            type: file.type,
            size: file.size,
            url: previewUrl
          }
        ])
      }
    })
  }

  const handleRemoveMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Quick insertion helpers for user comfort
  const handleAppendSnippet = (snippet: string) => {
    setDescription(prev => (prev ? `${prev} ${snippet}` : snippet))
  }

  // Trigger AI assistant analysis with Claude API
  const handleSubmitListing = async () => {
    if (!description.trim() && mediaFiles.length === 0) {
      setErrorMsg('Please describe your property or upload at least one photo/video.')
      return
    }

    setStep('analyzing')
    setErrorMsg('')

    try {
      // Parse asking price into clean number if given
      let numericPrice = 0
      if (askingPrice) {
        const cleaned = askingPrice.replace(/[^0-9.]/g, '')
        const num = parseFloat(cleaned)
        if (!isNaN(num)) {
          // If less than 100, assume in Crores
          numericPrice = num < 500 ? num * 10000000 : num
        }
      }

      const payload = {
        raw_description: description,
        property_category: selectedCategory,
        location_district: cityOrLocation,
        price_total_inr: numericPrice,
        rental_income_monthly: rentalIncome,
        media: mediaFiles.map(m => ({
          name: m.name,
          type: m.type,
          size: m.size,
          url: m.data || m.url
        })),
        seller_name: sellerName || (user?.email ? user.email.split('@')[0] : 'Property Principal'),
        seller_phone: sellerPhone,
        seller_email: sellerEmail || user?.email || '',
        user_id: user?.id || null
      }

      const res = await fetch('/api/commercial/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to list property')

      setAnalysisResult(data.dossier || {})
      setStep('success')
      if (onSuccess) onSuccess(data)
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Error communicating with property assistant.')
      setStep('input')
    }
  }

  const handleFinish = () => {
    onClose()
    setStep('input')
    setDescription('')
    setMediaFiles([])
    setAnalysisResult(null)
    // Scroll to status section
    const el = document.getElementById('status')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const imageCount = mediaFiles.filter(m => m.type.startsWith('image/')).length
  const videoCount = mediaFiles.filter(m => m.type.startsWith('video/')).length

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
            <div className="w-10 h-10 rounded-full bg-[#F4EFE6] border border-[#DDD5C5] flex items-center justify-center text-[#9E7B4F]">
              <Sparkles className="w-5 h-5 text-[#9E7B4F]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-sans font-bold tracking-widest uppercase text-[#9E7B4F]">
                  AI Property Assistant
                </span>
                <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-[#1A1816] text-[#FAF8F5]">
                  Effortless Placement
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-[#1A1816]">
                List Any Property in Minutes
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

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
          {/* ── STEP 1: INPUT SCREEN ────────────────────────────────────────── */}
          {step === 'input' && (
            <div className="space-y-6">
              {/* Introduction Note */}
              <div className="p-4 rounded-2xl bg-[#F7F4EE] border border-[#E8E2D6] text-xs text-[#5A564F] leading-relaxed font-light">
                <p>
                  List any property type — residential houses, commercial buildings with 6-7 shops, IT parks, vacant land, or industrial assets. Upload your photos or videos and tell us what you have in your own words. Our AI assistant will structure the underwriting dossier automatically.
                </p>
              </div>

              {/* 1. Quick Property Category Pills */}
              <div>
                <label className="block text-xs font-sans uppercase tracking-wider text-[#8E887E] font-semibold mb-2.5">
                  1. Select Property Class
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PROPERTY_CATEGORIES.map(cat => {
                    const Icon = cat.icon
                    const active = selectedCategory === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                          active
                            ? 'bg-[#1A1816] border-[#1A1816] text-[#FAF8F5] shadow-sm'
                            : 'bg-[#FAF8F5] border-[#E8E2D6] text-[#5A564F] hover:bg-[#F4F0E8] hover:text-[#1A1816]'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#C5A059]' : 'text-[#8E887E]'}`} />
                        <span className="text-xs font-sans font-medium truncate">{cat.label.split('(')[0].trim()}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 2. Natural Language Description Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-sans uppercase tracking-wider text-[#8E887E] font-semibold">
                    2. Describe Your Property in Your Own Words *
                  </label>
                  <span className="text-[11px] text-[#9E7B4F] font-medium">Type or paste naturally</span>
                </div>

                <textarea
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Example: Commercial building on Trichy Main Road, Madurai. 7 shops on ground floor with running grocery & pharmacy, 1st floor office suites. Total built-up 5,200 sq.ft on 6 cents land. Current rental income is ₹1.5 Lakhs/month. Clear title, 40ft road frontage. Asking price ₹3.25 Crores."
                  className="w-full p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D6] text-xs sm:text-sm text-[#1A1816] leading-relaxed focus:outline-none focus:border-[#9E7B4F]"
                />

                {/* Helper Snippet Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 text-[11px]">
                  <span className="text-[#8E887E] mr-1">Quick Add:</span>
                  <button
                    type="button"
                    onClick={() => handleAppendSnippet('7 rental shops on ground floor.')}
                    className="px-2.5 py-1 rounded-full bg-[#F4F0E8] hover:bg-[#ECE6DA] text-[#5A564F] transition-colors"
                  >
                    + 7 Shops
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAppendSnippet('Monthly rental income is ₹1.5 Lakhs.')}
                    className="px-2.5 py-1 rounded-full bg-[#F4F0E8] hover:bg-[#ECE6DA] text-[#5A564F] transition-colors"
                  >
                    + Rental Income
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAppendSnippet('Total built-up area 5,000 sq.ft.')}
                    className="px-2.5 py-1 rounded-full bg-[#F4F0E8] hover:bg-[#ECE6DA] text-[#5A564F] transition-colors"
                  >
                    + Built-up Area
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAppendSnippet('40-foot main road frontage.')}
                    className="px-2.5 py-1 rounded-full bg-[#F4F0E8] hover:bg-[#ECE6DA] text-[#5A564F] transition-colors"
                  >
                    + Road Frontage
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAppendSnippet('Single owner clean revenue patta.')}
                    className="px-2.5 py-1 rounded-full bg-[#F4EFE6] text-[#7A5B32] hover:bg-[#ECE6DA] transition-colors font-medium"
                  >
                    + Clean Patta
                  </button>
                </div>
              </div>

              {/* 3. Photos & Videos Upload Hub */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-sans uppercase tracking-wider text-[#8E887E] font-semibold flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-[#9E7B4F]" />
                    <span>3. Upload Photos & Videos (Optional but Recommended)</span>
                  </label>
                  {(imageCount > 0 || videoCount > 0) && (
                    <span className="text-[11px] font-sans font-medium text-[#7A5B32]">
                      {imageCount} Photo{imageCount === 1 ? '' : 's'}{videoCount > 0 ? `, ${videoCount} Video${videoCount === 1 ? '' : 's'}` : ''}
                    </span>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,application/pdf"
                  className="hidden"
                  onChange={e => handleFilesSelected(e.target.files)}
                />

                {/* Dropzone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={e => {
                    e.preventDefault()
                    setIsDragging(false)
                    handleFilesSelected(e.dataTransfer.files)
                  }}
                  className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center ${
                    isDragging
                      ? 'border-[#9E7B4F] bg-[#F7F4EE]'
                      : 'border-[#E8E2D6] bg-[#FAF8F5] hover:bg-[#F4F0E8]'
                  }`}
                >
                  <div className="flex items-center justify-center gap-3 text-[#9E7B4F] mb-2">
                    <ImageIcon className="w-6 h-6" />
                    <Video className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-medium text-[#1A1816]">
                    Click or drag & drop photos and videos here
                  </p>
                  <p className="text-[11px] text-[#8E887E] mt-0.5">
                    Upload facade photos, shop interiors, walkthrough videos, site clips, or survey sketches
                  </p>
                </div>

                {/* Media Previews Row */}
                {mediaFiles.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3">
                    {mediaFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="relative rounded-xl border border-[#E8E2D6] overflow-hidden bg-white p-1.5 flex flex-col justify-between group shadow-sm"
                      >
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-[#F4F0E8] flex items-center justify-center">
                          {file.type.startsWith('image/') ? (
                            <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-[#9E7B4F] gap-1">
                              <Video className="w-6 h-6" />
                              <span className="text-[9px] uppercase font-bold tracking-wider">Video</span>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveMedia(idx)
                            }}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-[10px] text-[#5A564F] truncate mt-1 px-0.5">
                          {file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Quick Details & Contact Info */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D6] space-y-3">
                <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#7A5B32] font-semibold block">
                  4. Location & Contact Details
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase text-[#8E887E] mb-1">City / District in TN</label>
                    <input
                      type="text"
                      value={cityOrLocation}
                      onChange={e => setCityOrLocation(e.target.value)}
                      placeholder="e.g. Madurai, Chennai, Coimbatore"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E2D6] text-xs text-[#1A1816]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-[#8E887E] mb-1">Asking Price / Outlay</label>
                    <input
                      type="text"
                      value={askingPrice}
                      onChange={e => setAskingPrice(e.target.value)}
                      placeholder="e.g. ₹3.25 Cr or ₹45 L"
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
                </div>

                {!user && (
                  <p className="text-[11px] text-[#7A5B32] flex items-center gap-1.5 pt-1">
                    <Shield className="w-3.5 h-3.5 text-[#9E7B4F]" />
                    <span>Sign in with Google to track your live review milestones in real time.</span>
                  </p>
                )}
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSubmitListing}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#1A1816] hover:bg-[#2D2926] text-[#FAF8F5] font-sans text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-2 shadow-md group"
                >
                  <Sparkles className="w-4 h-4 text-[#C5A059] group-hover:rotate-12 transition-transform" />
                  <span>Analyze & List Property</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C5A059]" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: ANALYZING STATE ────────────────────────────────────── */}
          {step === 'analyzing' && (
            <div className="py-16 text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-[#F4EFE6] border border-[#DDD5C5] flex items-center justify-center mx-auto text-[#9E7B4F]">
                <Loader2 className="w-8 h-8 animate-spin text-[#9E7B4F]" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold text-[#1A1816]">
                  AI Property Assistant is Underwriting...
                </h3>
                <p className="text-xs text-[#5A564F] max-w-md mx-auto mt-2 leading-relaxed">
                  Parsing your natural language notes, evaluating rental yields, structuring the asset dossier, and attaching your media files.
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 3: SUCCESS & DOSSIER PREVIEW ──────────────────────────── */}
          {step === 'success' && analysisResult && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#9E7B4F] font-semibold block">
                  Property Listed Successfully
                </span>
                <h3 className="text-2xl font-serif font-bold text-[#1A1816]">
                  {analysisResult.title}
                </h3>
                <p className="text-xs text-[#5A564F] max-w-lg mx-auto leading-relaxed">
                  Your property has been underwritten and recorded under your account. It is now active for confidential review and buyer syndication.
                </p>
              </div>

              {/* Extracted Specifications Grid */}
              <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D6] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E2D6] pb-3">
                  <span className="px-3 py-1 rounded-full bg-[#1A1816] text-[#FAF8F5] text-xs font-medium">
                    {analysisResult.property_type || 'Commercial Asset'}
                  </span>
                  <span className="text-xs font-sans font-bold text-[#1A1816]">
                    {analysisResult.price_display}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-[#E8E2D6]">
                    <span className="text-[10px] uppercase text-[#8E887E] block">Location</span>
                    <span className="font-medium text-[#1A1816] mt-0.5 block truncate">
                      {analysisResult.locality || analysisResult.city}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-[#E8E2D6]">
                    <span className="text-[10px] uppercase text-[#8E887E] block">Size / Extent</span>
                    <span className="font-medium text-[#1A1816] mt-0.5 block truncate">
                      {analysisResult.extent_display || 'Verified Size'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-[#E8E2D6]">
                    <span className="text-[10px] uppercase text-[#8E887E] block">Rental Yield</span>
                    <span className="font-medium text-[#1A1816] mt-0.5 block truncate">
                      {analysisResult.rental_yield_display || 'High Capital Growth'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-[#E8E2D6]">
                    <span className="text-[10px] uppercase text-[#8E887E] block">Media Attached</span>
                    <span className="font-medium text-[#1A1816] mt-0.5 block">
                      {mediaFiles.length} file{mediaFiles.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>

                {/* AI Executive Summary */}
                <div className="p-4 rounded-xl bg-[#F7F4EE] border border-[#E8E2D6]">
                  <span className="text-[10px] uppercase font-sans tracking-wider text-[#7A5B32] font-semibold block mb-1">
                    Executive Dossier Summary
                  </span>
                  <p className="text-xs text-[#3A3632] leading-relaxed">
                    {analysisResult.executive_summary}
                  </p>
                </div>

                {/* Highlights */}
                {analysisResult.key_highlights && analysisResult.key_highlights.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-sans tracking-wider text-[#8E887E] font-semibold block mb-2">
                      Key Verified Strengths
                    </span>
                    <div className="space-y-1.5">
                      {analysisResult.key_highlights.map((h: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-[#3A3632]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#9E7B4F] shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleFinish}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#1A1816] hover:bg-[#2D2926] text-[#FAF8F5] font-sans text-xs uppercase tracking-wider font-semibold transition-all shadow-md"
                >
                  View in Property Status
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('input')
                    setDescription('')
                    setMediaFiles([])
                    setAnalysisResult(null)
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-[#FAF8F5] hover:bg-[#F4F0E8] border border-[#E8E2D6] text-[#1A1816] font-sans text-xs font-semibold transition-colors"
                >
                  List Another Property
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}