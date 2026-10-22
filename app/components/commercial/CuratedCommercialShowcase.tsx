'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Sun, Mountain, Warehouse, Landmark,
  Shield, CheckCircle2, ArrowRight, ExternalLink,
  MapPin, Zap, Lock, FileText, Phone, X, Sparkles, ChevronRight
} from 'lucide-react'

export interface ShowcaseProps {
  mandates: any[]
  onOpenIntake: () => void
  externalCategory?: string
  externalCorridor?: string
  externalScale?: string
  searchQuery?: string
  onSelectCategory?: (cat: string) => void
}

const CATEGORIES = [
  { id: 'all', label: 'All Projects' },
  { id: 'solar', label: 'Solar & Renewable' },
  { id: 'mines', label: 'Mines & Quarries' },
  { id: 'industrial', label: 'Industrial Land' },
  { id: 'logistics', label: 'Logistics Hubs' },
  { id: 'commercial', label: 'Commercial IT' },
]

export function CuratedCommercialShowcase({
  mandates,
  onOpenIntake,
  externalCategory,
  externalCorridor,
  externalScale,
  searchQuery,
  onSelectCategory,
}: ShowcaseProps) {
  const [internalCategory, setInternalCategory] = useState('all')
  const [selectedAssetForDossier, setSelectedAssetForDossier] = useState<any>(null)

  const activeCategory = externalCategory || internalCategory

  const handleCategoryChange = (cat: string) => {
    setInternalCategory(cat)
    if (onSelectCategory) onSelectCategory(cat)
  }

  // Filtered mandates logic
  const filtered = useMemo(() => {
    return mandates.filter(m => {
      // Category filter
      if (activeCategory && activeCategory !== 'all') {
        const cat = (m.category || '').toLowerCase()
        const type = (m.asset_type || '').toLowerCase()
        if (activeCategory === 'solar' && !cat.includes('solar') && !type.includes('solar')) return false
        if (activeCategory === 'mines' && !cat.includes('mine') && !cat.includes('quarry') && !type.includes('quarry')) return false
        if (activeCategory === 'industrial' && !cat.includes('industrial') && !type.includes('industrial')) return false
        if (activeCategory === 'logistics' && !cat.includes('logistics') && !cat.includes('warehousing') && !type.includes('warehousing')) return false
        if (activeCategory === 'commercial' && !cat.includes('commercial') && !type.includes('commercial')) return false
      }

      // Corridor filter
      if (externalCorridor && externalCorridor !== 'all') {
        const corr = (m.corridor || '').toLowerCase()
        const dist = (m.district || '').toLowerCase()
        const filterStr = externalCorridor.toLowerCase()
        if (!corr.includes(filterStr) && !dist.includes(filterStr)) return false
      }

      // Scale filter
      if (externalScale && externalScale !== 'all') {
        const acres = Number(m.extent_acres) || 0
        if (externalScale === '25' && acres < 25) return false
        if (externalScale === '50' && acres < 50) return false
        if (externalScale === '100' && acres < 100) return false
      }

      // Search Query
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const text = `${m.title} ${m.category} ${m.corridor} ${m.district} ${m.blueprint_code}`.toLowerCase()
        if (!text.includes(q)) return false
      }

      return true
    })
  }, [mandates, activeCategory, externalCorridor, externalScale, searchQuery])

  return (
    <section id="projects" className="py-24 bg-[#FAF8F5] text-[#1A1816] relative border-t border-[#E8E2D6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Editorial Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F4EFE6] border border-[#DDD5C5] mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#9E7B4F]" />
              <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-[#7A5B32] font-semibold">
                Tamil Nadu Portfolio · Direct Advisory
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#1A1816] tracking-tight">
              Recent Active Projects
            </h2>
            <p className="text-[#5A564F] text-sm sm:text-base mt-2 max-w-2xl leading-relaxed font-light">
              Curated commercial land parcels, solar sites, and mineral reserves actively syndicating across Tamil Nadu.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={onOpenIntake}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-[#1A1816] hover:bg-[#2D2926] text-[#FAF8F5] font-sans text-xs tracking-wider uppercase font-medium transition-all shadow-sm"
            >
              <span>List Your Property</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C5A059]" />
            </button>
          </div>
        </div>

        {/* Category Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 mb-10 border-b border-[#E8E2D6]/70">
          {CATEGORIES.map(cat => {
            const active = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-sans tracking-wide transition-all ${
                  active
                    ? 'bg-[#1A1816] text-[#FAF8F5] font-medium shadow-sm'
                    : 'bg-[#F4F0E8] text-[#5A564F] hover:text-[#1A1816] hover:bg-[#ECE6DA]'
                }`}
              >
                {cat.label}
              </button>
            )
          })}
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#E8E2D6] p-8 max-w-md mx-auto">
            <p className="font-serif text-lg text-[#1A1816]">No matching projects found</p>
            <p className="text-xs text-[#8E887E] mt-1">Try resetting your filters or search keywords.</p>
            <button
              onClick={() => handleCategoryChange('all')}
              className="mt-4 px-4 py-2 rounded-full bg-[#F4F0E8] text-xs font-medium text-[#1A1816] hover:bg-[#ECE6DA]"
            >
              Show All Projects
            </button>
          </div>
        )}

        {/* Editorial Project Card Grid — Zero Overlap */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.06 }}
              onClick={() => setSelectedAssetForDossier(item)}
              className="group bg-white rounded-3xl border border-[#E8E2D6] hover:border-[#C5A059]/70 overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-xl cursor-pointer"
            >
              <div>
                {/* Visual Frame */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#F4F0E8]">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  {/* Subtle tint overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

                  {/* Clean Non-Colliding Top Bar Badges */}
                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-sans font-medium px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#1A1816] shadow-sm">
                      {item.blueprint_code || `TN-REF-0${idx + 1}`}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="text-[10px] font-sans font-medium px-2.5 py-1 rounded-full bg-[#1A1816]/80 backdrop-blur-md text-[#FAF8F5]">
                      {item.status || 'Active Advisory'}
                    </span>
                  </div>

                  {/* Bottom Image Sub-bar */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                    <span className="flex items-center gap-1 text-[11px] font-medium drop-shadow-sm">
                      <MapPin className="w-3.5 h-3.5 text-[#C5A059]" /> {item.corridor || item.district}
                    </span>
                    <span className="text-[11px] font-semibold bg-black/50 backdrop-blur-md px-2.5 py-0.5 rounded-full">
                      {item.extent_acres} Acres
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-4">
                  <div>
                    <span className="text-[11px] font-sans uppercase tracking-[0.18em] text-[#9E7B4F] font-semibold block mb-1">
                      {item.category}
                    </span>
                    <h3 className="text-xl font-serif font-bold text-[#1A1816] group-hover:text-[#9E7B4F] transition-colors leading-snug">
                      {item.title}
                    </h3>
                  </div>

                  {/* Highlights Bullet List */}
                  <ul className="space-y-2 text-xs text-[#5A564F] pt-1">
                    {item.highlights?.slice(0, 3).map((h: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 leading-relaxed">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#9E7B4F] shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{h}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Title & Audit Status Pill */}
                  <div className="pt-2">
                    <div className="px-3 py-2 rounded-xl bg-[#F7F4EE] border border-[#E8E2D6] text-[11px] text-[#5A564F] flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-[#9E7B4F] shrink-0" />
                      <span className="truncate">{item.diligence_status || 'Verified Clear Patta'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Outlay & Inquire CTA */}
              <div className="px-6 py-4 border-t border-[#E8E2D6] bg-[#FAF8F5] flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-sans uppercase tracking-wider text-[#8E887E] block">Indicative Outlay</span>
                  <span className="text-sm font-sans font-bold text-[#1A1816]">{item.price_display}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-sans font-semibold text-[#9E7B4F] group-hover:text-[#7A5B32] group-hover:translate-x-1 transition-all">
                  <span>View Dossier</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── BESPOKE PROJECT DOSSIER MODAL ──────────────────────────────── */}
      <AnimatePresence>
        {selectedAssetForDossier && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#E8E2D6] overflow-hidden my-auto max-h-[92vh] flex flex-col"
            >
              {/* Dossier Top Navigation Header */}
              <div className="px-6 sm:px-8 py-5 border-b border-[#E8E2D6] flex items-center justify-between bg-[#FAF8F5] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#F4F0E8] border border-[#DDD5C5] flex items-center justify-center text-[#9E7B4F]">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-sans font-bold tracking-widest uppercase text-[#9E7B4F]">
                        Project Dossier
                      </span>
                      <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-[#1A1816] text-[#FAF8F5]">
                        {selectedAssetForDossier.blueprint_code}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-serif font-bold text-[#1A1816]">
                      {selectedAssetForDossier.title}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedAssetForDossier(null)}
                  className="w-9 h-9 rounded-full bg-[#F4F0E8] hover:bg-[#ECE6DA] flex items-center justify-center text-[#5A564F] hover:text-[#1A1816] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Dossier Scrollable Body */}
              <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
                {/* Hero Banner with Key Metrics Bar */}
                <div className="relative rounded-2xl overflow-hidden aspect-[21/9] bg-[#F4F0E8]">
                  <img
                    src={selectedAssetForDossier.image}
                    alt={selectedAssetForDossier.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-[#C5A059] font-medium block">
                        {selectedAssetForDossier.category}
                      </span>
                      <h4 className="text-lg sm:text-2xl font-serif font-bold">
                        {selectedAssetForDossier.title}
                      </h4>
                      <p className="text-xs text-white/80 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-[#C5A059]" /> {selectedAssetForDossier.corridor}, {selectedAssetForDossier.state}
                      </p>
                    </div>

                    <div className="text-left sm:text-right bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                      <span className="text-[10px] text-white/60 uppercase tracking-wider block">Indicative Outlay</span>
                      <span className="text-lg font-bold text-white font-sans">{selectedAssetForDossier.price_display}</span>
                    </div>
                  </div>
                </div>

                {/* Key Technical Specifications Grid */}
                <div>
                  <h4 className="text-xs font-sans uppercase tracking-[0.18em] text-[#8E887E] font-semibold mb-3">
                    Technical Specifications & Due Diligence Matrix
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D6]">
                      <span className="text-[10px] uppercase font-sans tracking-wider text-[#8E887E] block">Land Extent</span>
                      <span className="text-base font-serif font-bold text-[#1A1816] mt-0.5 block">
                        {selectedAssetForDossier.extent_acres} Acres
                      </span>
                      <span className="text-[11px] text-[#5A564F]">{selectedAssetForDossier.price_per_acre}</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D6]">
                      <span className="text-[10px] uppercase font-sans tracking-wider text-[#8E887E] block">Power & Substation</span>
                      <span className="text-xs font-sans font-medium text-[#1A1816] mt-1 block">
                        {selectedAssetForDossier.substation_detail || 'High Tension Feeder Adjacent'}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D6]">
                      <span className="text-[10px] uppercase font-sans tracking-wider text-[#8E887E] block">Road Frontage</span>
                      <span className="text-xs font-sans font-medium text-[#1A1816] mt-1 block">
                        {selectedAssetForDossier.road_frontage_detail || 'Heavy-haul multi-axle freight access'}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D6]">
                      <span className="text-[10px] uppercase font-sans tracking-wider text-[#8E887E] block">Title Verification</span>
                      <span className="text-xs font-sans font-medium text-[#1A1816] mt-1 block">
                        {selectedAssetForDossier.patta_detail || selectedAssetForDossier.diligence_status}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D6]">
                      <span className="text-[10px] uppercase font-sans tracking-wider text-[#8E887E] block">Statutory Zoning</span>
                      <span className="text-xs font-sans font-medium text-[#1A1816] mt-1 block">
                        {selectedAssetForDossier.zoning_detail || 'Approved Industrial/Commercial classification'}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D6]">
                      <span className="text-[10px] uppercase font-sans tracking-wider text-[#8E887E] block">Water & Site Utilities</span>
                      <span className="text-xs font-sans font-medium text-[#1A1816] mt-1 block">
                        {selectedAssetForDossier.water_infra || 'Piped treated industrial connection + borewells'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="p-5 rounded-2xl bg-[#F7F4EE] border border-[#E8E2D6]">
                  <h4 className="text-xs font-sans uppercase tracking-[0.18em] text-[#7A5B32] font-semibold mb-2">
                    Executive Asset Dossier Summary
                  </h4>
                  <p className="text-xs sm:text-sm text-[#3A3632] leading-relaxed">
                    {selectedAssetForDossier.dossier_summary || selectedAssetForDossier.highlights?.join('. ')}
                  </p>
                </div>

                {/* Key Highlights */}
                <div>
                  <h4 className="text-xs font-sans uppercase tracking-[0.18em] text-[#8E887E] font-semibold mb-3">
                    Critical Due Diligence Highlights
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedAssetForDossier.highlights?.map((h: string, i: number) => (
                      <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D6] text-xs text-[#3A3632]">
                        <CheckCircle2 className="w-4 h-4 text-[#9E7B4F] shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dossier Action Footer */}
              <div className="p-6 border-t border-[#E8E2D6] bg-[#FAF8F5] flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-2 text-xs text-[#5A564F]">
                  <Shield className="w-4 h-4 text-[#9E7B4F]" />
                  <span>Confidential Underwriting · Direct Managing Desk</span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <a
                    href="tel:+918870980839"
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#F4F0E8] hover:bg-[#ECE6DA] text-[#1A1816] text-xs font-sans font-semibold transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#9E7B4F]" /> Call +91 88709 80839
                  </a>

                  <a
                    href={`https://wa.me/918870980839?text=${encodeURIComponent(`Hello Tharaga Real Estate, I wish to review the confidential due diligence packet for ${selectedAssetForDossier.title} (${selectedAssetForDossier.blueprint_code}).`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#1A1816] hover:bg-[#2D2926] text-[#FAF8F5] text-xs font-sans font-semibold tracking-wide transition-all shadow-md"
                  >
                    <span>Request Full Dossier</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#C5A059]" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}