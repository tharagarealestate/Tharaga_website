'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sun, Building2, Mountain, Warehouse, Cpu,
  ArrowRight, ShieldCheck, CheckCircle2,
  AlertCircle, Loader2, FileDown, ExternalLink, Zap,
  Compass, MapPin, Gauge
} from 'lucide-react'

const SECTORS = [
  { id: 'solar_energy', label: 'Solar & Renewable', icon: Sun, defaultScale: '50 MW', defaultBudget: 40, power: '230kV / 110kV Substation Bay' },
  { id: 'cement_quarry', label: 'Limestone & Quarry', icon: Mountain, defaultScale: '40,000 MT/month', defaultBudget: 60, power: '33kV Dedicated Feeder' },
  { id: 'manufacturing_plant', label: 'Heavy Industrial / EV', icon: Building2, defaultScale: '75 Acres', defaultBudget: 110, power: '230kV Dedicated HT Tap' },
  { id: 'logistics_park', label: 'Logistics & 3PL Hub', icon: Warehouse, defaultScale: '500,000 sq.ft PEB', defaultBudget: 55, power: '11kV Dual Express Feeders' },
  { id: 'commercial_office', label: 'Commercial IT Campus', icon: Cpu, defaultScale: '150,000 sq.ft Built', defaultBudget: 95, power: '33kV Dual Ring Feeds' },
]

const CORRIDORS = [
  { id: 'tuticorin', label: 'Tuticorin – Tirunelveli', desc: 'Renewable & Deepwater Port Belt' },
  { id: 'sriperumbudur', label: 'Sriperumbudur – Oragadam', desc: 'Auto, EV & High-Tech Corridor' },
  { id: 'ariyalur', label: 'Ariyalur – Karur', desc: 'Mineral, Quarry & Cement Belt' },
  { id: 'hosur', label: 'Hosur – Krishnagiri', desc: 'Logistics & Advanced Manufacturing' },
  { id: 'omr', label: 'Chennai OMR – Guindy', desc: 'Commercial & Institutional Hub' },
]

const SCALES = ['25 Acres', '50 Acres', '100+ Acres', '50 MW Solar', '40,000 MT/mo']

export function InstitutionalScreener() {
  const [selectedSector, setSelectedSector] = useState(SECTORS[0].id)
  const [selectedCorridor, setSelectedCorridor] = useState(CORRIDORS[0].label)
  const [scale, setScale] = useState(SECTORS[0].defaultScale)
  const [budgetCrores, setBudgetCrores] = useState(SECTORS[0].defaultBudget)

  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const [error, setError] = useState('')

  const activeSectorObj = SECTORS.find(s => s.id === selectedSector) || SECTORS[0]

  const handleRunScreener = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/commercial/screener', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mandate_category: selectedSector,
          scale_or_capacity: scale,
          target_corridors: [selectedCorridor],
          power_substation_need: activeSectorObj.power,
          budget_crores: budgetCrores,
          corporate_entity: 'Commercial Real Estate Principal',
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to screen feasibility parameters')
      setAnalysis(data.analysis)
    } catch (err: any) {
      setError(err.message || 'Error executing feasibility analysis')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-3xl bg-white border border-[#E8E2D6] overflow-hidden text-[#1A1816] shadow-xl">
      {/* Editorial Header */}
      <div className="p-6 sm:p-10 border-b border-[#E8E2D6] bg-[#FAF8F5] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F4EFE6] border border-[#DDD5C5] mb-2.5">
            <Compass className="w-3.5 h-3.5 text-[#9E7B4F]" />
            <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-[#7A5B32] font-semibold">
              Strategic Advisory Tool
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#1A1816] tracking-tight">
            Land & Industrial Feasibility Study
          </h3>
          <p className="text-xs sm:text-sm text-[#5A564F] max-w-2xl mt-1.5 leading-relaxed font-light">
            Evaluate grid evacuation capacity, logistics latency, statutory zoning, and capital outlay for industrial land, solar parks, or quarries across Tamil Nadu.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-sans px-3.5 py-1.5 rounded-full bg-white border border-[#E8E2D6] text-[#7A5B32] font-medium shadow-sm">
            Live Substation & Zoning Index
          </span>
        </div>
      </div>

      {/* Main Console: 4 Questions Layout (Perfume Finder Style) */}
      <div className="p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Side: 4 Questions Inputs */}
        <div className="lg:col-span-6 space-y-7">
          {/* Question 01: Asset / Industry */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-[11px] font-sans uppercase tracking-[0.18em] text-[#8E887E] font-semibold">
                Question 01 · Asset & Industry Class
              </label>
              <span className="text-[10px] text-[#9E7B4F] font-medium">Select Class</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SECTORS.map(sec => {
                const Icon = sec.icon
                const active = selectedSector === sec.id
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => {
                      setSelectedSector(sec.id)
                      setScale(sec.defaultScale)
                      setBudgetCrores(sec.defaultBudget)
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                      active
                        ? 'bg-[#1A1816] border-[#1A1816] text-[#FAF8F5] shadow-sm'
                        : 'bg-[#FAF8F5] border-[#E8E2D6] text-[#5A564F] hover:text-[#1A1816] hover:bg-[#F4F0E8]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-[#C5A059]' : 'text-[#8E887E]'}`} />
                    <span className="text-xs font-sans font-medium">{sec.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Question 02: Strategic Corridor */}
          <div>
            <label className="block text-[11px] font-sans uppercase tracking-[0.18em] text-[#8E887E] font-semibold mb-2.5">
              Question 02 · Strategic Tamil Nadu Corridor
            </label>
            <div className="space-y-1.5">
              {CORRIDORS.map(c => {
                const active = selectedCorridor === c.label
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCorridor(c.label)}
                    className={`w-full p-2.5 px-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                      active
                        ? 'bg-[#F7F4EE] border-[#C5A059] text-[#1A1816] font-medium'
                        : 'bg-[#FAF8F5] border-[#E8E2D6] text-[#5A564F] hover:text-[#1A1816] hover:bg-[#F4F0E8]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className={`w-3.5 h-3.5 ${active ? 'text-[#9E7B4F]' : 'text-[#8E887E]'}`} />
                      <span className="text-xs font-sans">{c.label}</span>
                    </div>
                    <span className="text-[10px] text-[#8E887E] hidden sm:inline">{c.desc}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Question 03: Scale & Capacity */}
          <div>
            <label className="block text-[11px] font-sans uppercase tracking-[0.18em] text-[#8E887E] font-semibold mb-2.5">
              Question 03 · Target Extent / Capacity
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {SCALES.map(sc => (
                <button
                  key={sc}
                  type="button"
                  onClick={() => setScale(sc)}
                  className={`px-3 py-1.5 rounded-full text-xs font-sans transition-all ${
                    scale === sc
                      ? 'bg-[#1A1816] text-[#FAF8F5] font-medium'
                      : 'bg-[#FAF8F5] border border-[#E8E2D6] text-[#5A564F] hover:bg-[#F4F0E8]'
                  }`}
                >
                  {sc}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={scale}
              onChange={e => setScale(e.target.value)}
              placeholder="Or specify custom requirement..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D6] text-xs text-[#1A1816] focus:outline-none focus:border-[#9E7B4F]"
            />
          </div>

          {/* Question 04: Indicative Budget Outlay */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-sans uppercase tracking-[0.18em] text-[#8E887E] font-semibold">
                Question 04 · Target Capital Outlay
              </label>
              <span className="text-sm font-sans font-bold text-[#1A1816]">
                ₹{budgetCrores} Crores
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="250"
              step="5"
              value={budgetCrores}
              onChange={e => setBudgetCrores(Number(e.target.value))}
              className="w-full accent-[#1A1816] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#8E887E] mt-1">
              <span>₹15 Cr</span>
              <span>₹100 Cr</span>
              <span>₹250+ Cr</span>
            </div>
          </div>

          {/* Submit Action */}
          <button
            onClick={handleRunScreener}
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-[#1A1816] hover:bg-[#2D2926] text-[#FAF8F5] font-sans text-xs uppercase tracking-wider font-semibold transition-all shadow-md flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#C5A059]" />
                <span>Evaluating Corridor Indices...</span>
              </>
            ) : (
              <>
                <span>Run Feasibility Study</span>
                <ArrowRight className="w-4 h-4 text-[#C5A059] group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right Side: Luxury Editorial Result Output (Dark Ink Card reminiscent of Image 4) */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="rounded-3xl bg-[#171513] text-[#FAF8F5] p-6 sm:p-8 flex-1 flex flex-col justify-between border border-[#2D2926] shadow-2xl relative overflow-hidden">
            {/* Subtle light accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-[#C5A059]/10 to-transparent pointer-events-none" />

            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <div>
                  <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#C5A059] font-medium block">
                    Strategic Feasibility Assessment
                  </span>
                  <h4 className="text-lg font-serif font-bold text-white mt-0.5">
                    {activeSectorObj.label} · {selectedCorridor.split('–')[0].trim()}
                  </h4>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-sans text-white/50 uppercase tracking-wider block">Feasibility Rating</span>
                  <span className="text-xl font-serif font-bold text-[#C5A059]">
                    {analysis ? `${analysis.feasibility_score}/100` : '92/100'}
                  </span>
                </div>
              </div>

              {/* Dynamic Assessment Output */}
              {analysis ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-5"
                >
                  {/* Viability Rating */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs text-[#FAF8F5] border border-white/15">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span className="font-medium">{analysis.viability_rating || 'High Corridor Viability'}</span>
                  </div>

                  {/* Executive Brief */}
                  <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-light">
                    {analysis.executive_brief}
                  </p>

                  {/* Technical Synthesis Grid */}
                  <div className="space-y-3 pt-2">
                    <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                      <span className="text-[10px] font-sans uppercase tracking-wider text-[#C5A059] block mb-1">
                        Grid & Evacuation Readiness
                      </span>
                      <p className="text-xs text-white/70 leading-relaxed">
                        {analysis.infrastructure_synthesis?.grid_or_power_feasibility}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                      <span className="text-[10px] font-sans uppercase tracking-wider text-[#C5A059] block mb-1">
                        Freight & Highway Connectivity
                      </span>
                      <p className="text-xs text-white/70 leading-relaxed">
                        {analysis.infrastructure_synthesis?.logistics_and_connectivity}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                      <span className="text-[10px] font-sans uppercase tracking-wider text-[#C5A059] block mb-1">
                        Statutory Clearances & Patta Verification
                      </span>
                      <ul className="space-y-1 text-xs text-white/70">
                        {analysis.statutory_roadmap?.map((step: string, i: number) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-[#C5A059]" />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* Default Preview State */
                <div className="space-y-5">
                  <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-light">
                    Select your parameters on the left and run the study. We instantly assess TANGEDCO substation clearance proximity, NH freight haulage access, and revenue title records across Tamil Nadu.
                  </p>

                  <div className="space-y-2.5 pt-2">
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs">
                      <span className="text-white/60">Substation Proximity</span>
                      <span className="text-[#C5A059] font-medium">{activeSectorObj.power}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs">
                      <span className="text-white/60">Target Corridor</span>
                      <span className="text-white font-medium">{selectedCorridor}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs">
                      <span className="text-white/60">Target Scale</span>
                      <span className="text-white font-medium">{scale}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs">
                      <span className="text-white/60">Allocated Budget</span>
                      <span className="text-white font-medium">₹{budgetCrores} Cr</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Action Footer */}
            <div className="pt-6 border-t border-white/10 mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-white/50">
                Confidential Preliminary Screening
              </span>

              <a
                href={`https://wa.me/918870980839?text=${encodeURIComponent(`Hello Tharaga Real Estate, I ran a feasibility study for ${activeSectorObj.label} in ${selectedCorridor} (${scale}, ₹${budgetCrores} Cr budget). I wish to discuss matching site options.`)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#FAF8F5] hover:bg-white text-[#1A1816] text-xs font-sans font-semibold transition-all flex items-center justify-center gap-1.5"
              >
                <span>Discuss Feasibility With Desk</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#9E7B4F]" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}