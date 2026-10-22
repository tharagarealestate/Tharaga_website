'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Sun, Mountain, Warehouse, Landmark,
  Shield, CheckCircle2, ArrowRight, ExternalLink,
  MapPin, Zap, Lock, FileText, Phone
} from 'lucide-react'

interface ShowcaseProps {
  mandates: any[]
  onOpenIntake: () => void
}

const CATEGORIES = [
  { id: 'all', label: 'All Mandates' },
  { id: 'industrial', label: 'Industrial Land' },
  { id: 'solar', label: 'Solar & Renewable' },
  { id: 'mines', label: 'Mines & Quarries' },
  { id: 'logistics', label: 'Logistics & 3PL' },
  { id: 'commercial', label: 'Commercial IT' },
]

export function CuratedCommercialShowcase({ mandates, onOpenIntake }: ShowcaseProps) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedAssetForInquiry, setSelectedAssetForInquiry] = useState<any>(null)

  const filtered = mandates.filter(m => {
    if (selectedCategory === 'all') return true
    const cat = (m.category || '').toLowerCase()
    const type = (m.asset_type || '').toLowerCase()
    if (selectedCategory === 'industrial') return cat.includes('industrial') || type.includes('industrial')
    if (selectedCategory === 'solar') return cat.includes('solar') || cat.includes('renewable') || type.includes('solar')
    if (selectedCategory === 'mines') return cat.includes('mine') || cat.includes('quarry') || type.includes('quarry')
    if (selectedCategory === 'logistics') return cat.includes('logistics') || cat.includes('warehousing') || type.includes('warehousing')
    if (selectedCategory === 'commercial') return cat.includes('commercial') || type.includes('commercial')
    return true
  })

  return (
    <section id="mandates" className="py-24 bg-[#0A0A0D] text-white border-y border-white/[0.08] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Editorial Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300">
                Institutional Portfolio // Q4 Mandates
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white tracking-tight">
              Curated Commercial & Industrial Assets
            </h2>
            <p className="text-white/60 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Direct syndication of verified land banks, solar parcels, and operational quarries to MNC conglomerates and institutional capital.
            </p>
          </div>

          <button
            onClick={onOpenIntake}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs tracking-wider uppercase transition-all shadow-lg shadow-amber-500/20 whitespace-nowrap self-start md:self-auto"
          >
            Mandate an Asset <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-4 mb-10">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-mono tracking-wider transition-all uppercase ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                  : 'bg-white/[0.03] hover:bg-white/[0.07] text-white/60 hover:text-white border border-white/[0.06]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Architectural Asset Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filtered.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
              className="group bg-[#0F0F14] rounded-3xl border border-white/[0.08] hover:border-amber-400/50 overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/5"
            >
              <div>
                {/* Image / Banner Frame */}
                <div className="relative h-56 w-full overflow-hidden bg-black/50">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F14] via-[#0F0F14]/30 to-transparent" />
                  
                  {/* Blueprint Code & Status Badges */}
                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-amber-300 border border-white/10">
                      {item.blueprint_code || `TN-MANDATE-0${idx + 1}`}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-emerald-500/20 backdrop-blur-md text-emerald-300 border border-emerald-500/30">
                      {item.status || 'Active Syndicate'}
                    </span>
                  </div>

                  <div className="absolute top-4 right-4">
                    <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-white/10 backdrop-blur-md text-white/80 border border-white/10 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-amber-400" /> {item.confidentiality || 'Selective MNC'}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-white/80">
                    <span className="flex items-center gap-1 font-mono text-[11px] text-amber-400">
                      <MapPin className="w-3.5 h-3.5" /> {item.corridor || item.district}
                    </span>
                    <span className="font-mono text-[11px] text-white/90 font-bold">
                      {item.extent_acres} Acres
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 space-y-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400/80 block mb-1">
                      {item.category}
                    </span>
                    <h3 className="text-lg font-serif font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
                      {item.title}
                    </h3>
                  </div>

                  {/* Highlights Bullet List */}
                  <ul className="space-y-1.5 text-xs text-white/60">
                    {item.highlights?.slice(0, 3).map((h: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400/80 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{h}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Corporate Synergy Offtakers */}
                  {item.target_buyers && (
                    <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-[11px]">
                      <span className="text-[10px] font-mono uppercase text-white/40 block mb-1">
                        Corporate Target Synergies:
                      </span>
                      <p className="text-white/80 leading-relaxed font-medium">
                        {item.target_buyers}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Outlay & Inquire CTA */}
              <div className="px-6 py-4 border-t border-white/[0.06] bg-black/30 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono text-white/40 block">Indicative Outlay</span>
                  <span className="text-sm font-mono font-bold text-white">{item.price_display}</span>
                </div>

                <a
                  href={`https://wa.me/918870980839?text=${encodeURIComponent(`Hello Tharaga Advisory, I am interested in confidential underwriting and due diligence data for ${item.title} (${item.blueprint_code}).`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-amber-500 hover:text-black text-white text-xs font-semibold transition-all"
                >
                  Request NDA <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
