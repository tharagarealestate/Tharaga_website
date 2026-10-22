'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Sun, Building2, Mountain, Warehouse,
  Cpu, ArrowRight, ShieldCheck, CheckCircle2,
  AlertCircle, Loader2, FileDown, ExternalLink, Zap
} from 'lucide-react'

const SECTORS = [
  { id: 'solar_energy', label: 'Solar & Renewable (MW)', icon: Sun, defaultScale: '50 MW', defaultBudget: 45 },
  { id: 'cement_quarry', label: 'Limestone / Quarry', icon: Mountain, defaultScale: '40,000 MT/month feed', defaultBudget: 60 },
  { id: 'manufacturing_plant', label: 'Heavy Industrial / EV', icon: Building2, defaultScale: '75 Acres', defaultBudget: 120 },
  { id: 'logistics_park', label: 'Logistics & 3PL Hub', icon: Warehouse, defaultScale: '500,000 sq.ft PEB', defaultBudget: 55 },
  { id: 'datacenter', label: 'Data Center / Tech Campus', icon: Cpu, defaultScale: '20 MW IT Load', defaultBudget: 180 },
]

export function InstitutionalScreener() {
  const [selectedSector, setSelectedSector] = useState(SECTORS[0].id)
  const [scale, setScale] = useState(SECTORS[0].defaultScale)
  const [budgetCrores, setBudgetCrores] = useState(SECTORS[0].defaultBudget)
  const [corridor, setCorridor] = useState('Tuticorin – Tirunelveli Green Belt')
  const [powerNeed, setPowerNeed] = useState('230kV / 110kV Dedicated Bay')
  const [corporateName, setCorporateName] = useState('Tier-1 Industrial Conglomerate')

  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const [error, setError] = useState('')

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
          target_corridors: [corridor],
          power_substation_need: powerNeed,
          budget_crores: budgetCrores,
          corporate_entity: corporateName,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to screen institutional mandate')
      setAnalysis(data.analysis)
    } catch (err: any) {
      setError(err.message || 'Error executing Claude screener')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-3xl bg-[#09090C] border border-white/[0.08] overflow-hidden text-white shadow-2xl">
      {/* Monograph Top Bar */}
      <div className="p-6 sm:p-8 border-b border-white/[0.08] bg-[#0E0E13] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300">
              Institutional Intelligence Engine · Powered by Claude API
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
            MNC Acquisition & Siting Feasibility Screener
          </h3>
          <p className="text-xs sm:text-sm text-white/50 max-w-xl">
            Evaluate grid evacuation capacity, logistics latency, statutory zoning, and capital outlay for industrial land, solar parks, or quarries across Tamil Nadu.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-[11px] font-mono px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/70">
            Realtime TANGEDCO / TNPCB Nodal Indices
          </span>
        </div>
      </div>

      <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Console Inputs */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-white/40 mb-3">
              01 // Target Industrial Sector
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                      active
                        ? 'bg-amber-500/15 border-amber-400 text-white shadow-md'
                        : 'bg-white/[0.02] border-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-amber-400' : 'text-white/40'}`} />
                    <span className="text-xs font-medium truncate">{sec.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-white/40 mb-2">
                Mandate Scale
              </label>
              <input
                type="text"
                value={scale}
                onChange={e => setScale(e.target.value)}
                placeholder="e.g. 50 MW or 100 Acres"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-white/40 mb-2">
                Budget (₹ Crores)
              </label>
              <input
                type="number"
                value={budgetCrores}
                onChange={e => setBudgetCrores(Number(e.target.value))}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-white/40 mb-2">
              Strategic Tamil Nadu Corridor
            </label>
            <select
              value={corridor}
              onChange={e => setCorridor(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
            >
              <option value="Tuticorin – Tirunelveli Green Belt">Tuticorin – Tirunelveli (Renewable & Port Hub)</option>
              <option value="Sriperumbudur – Oragadam Automotive Corridor">Sriperumbudur – Oragadam (Manufacturing & Auto)</option>
              <option value="Ariyalur – Karur Cement Mineral Spine">Ariyalur – Karur (Limestone & Mineral Reserve)</option>
              <option value="Hosur – Krishnagiri EV Belt">Hosur – Krishnagiri (EV & Advanced Engineering)</option>
              <option value="Coimbatore – Tiruppur Engineering Corridor">Coimbatore – Tiruppur (Industrial & Heavy Tech)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-white/40 mb-2">
              Power Substation / Grid Proximity
            </label>
            <select
              value={powerNeed}
              onChange={e => setPowerNeed(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
            >
              <option value="230kV / 110kV Dedicated Bay">230kV / 110kV Dedicated Bay (Substation &lt; 2 km)</option>
              <option value="33kV High-Tension Industrial Line">33kV High-Tension Industrial Line</option>
              <option value="Standard 11kV Feeder Line">Standard 11kV Feeder Line</option>
            </select>
          </div>

          <button
            onClick={handleRunScreener}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold text-sm shadow-xl shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Executing Claude Feasibility Engine...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-black" />
                Generate Feasibility Brief
              </>
            )}
          </button>
        </div>

        {/* Right Output Terminal */}
        <div className="lg:col-span-7 bg-[#050507] border border-white/[0.08] rounded-2xl p-6 relative min-h-[420px] flex flex-col justify-between">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs mb-4">
              {error}
            </div>
          )}

          {!analysis && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-base font-semibold text-white">Screener Idle</h4>
              <p className="text-xs text-white/40 max-w-sm">
                Select your parameters on the left and click "Generate Feasibility Brief" to synthesize grid, statutory, and land bank intelligence using Claude API.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              <p className="text-xs font-mono text-white/60">
                Cross-referencing TANGEDCO nodal capacity, TNPCB zoning codes & private land archives...
              </p>
            </div>
          )}

          {analysis && !loading && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              {/* Score header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div>
                  <span className="text-[10px] font-mono uppercase text-amber-400 block">Viability Verdict</span>
                  <h4 className="text-base font-bold text-white">{analysis.viability_rating}</h4>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-mono font-bold text-emerald-400">{analysis.feasibility_score}/100</div>
                  <span className="text-[10px] text-white/40">Institutional Index</span>
                </div>
              </div>

              {/* Brief */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-xs text-white/80 leading-relaxed font-serif italic text-sm">
                  "{analysis.executive_brief}"
                </p>
              </div>

              {/* Infrastructure pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06]">
                  <span className="text-[10px] font-mono text-amber-400 block mb-1">Power / Substation</span>
                  <p className="text-white/70 text-[11px] leading-relaxed">
                    {analysis.infrastructure_synthesis?.grid_or_power_feasibility}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06]">
                  <span className="text-[10px] font-mono text-amber-400 block mb-1">Logistics / Highway</span>
                  <p className="text-white/70 text-[11px] leading-relaxed">
                    {analysis.infrastructure_synthesis?.logistics_and_connectivity}
                  </p>
                </div>
              </div>

              {/* Capital & Timeline */}
              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-white/40 block">Est. Land Outlay</span>
                  <span className="font-semibold text-white">{analysis.capital_benchmark?.indicative_land_outlay}</span>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 block">Timeline to Possession</span>
                  <span className="font-semibold text-amber-300">{analysis.capital_benchmark?.timeline_to_possession}</span>
                </div>
              </div>

              {/* Matching Pipeline */}
              <div>
                <span className="text-[10px] font-mono uppercase text-white/40 block mb-1.5">
                  Matching Assets in Tharaga Pipeline
                </span>
                <div className="space-y-1.5">
                  {analysis.matching_tharaga_assets?.map((asset: string, i: number) => (
                    <div key={i} className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-between text-xs text-white">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        {asset}
                      </span>
                      <a href="#mandates" className="text-[11px] text-amber-400 hover:underline">
                        View Dossier
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Protocol */}
              <div className="pt-2 text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-[11px] text-white/50">{analysis.next_steps}</span>
                <a
                  href="https://wa.me/918870980839?text=Hello%20Tharaga%20Advisory,%20I%20have%20an%20institutional%20mandate%20feasibility%20inquiry."
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                >
                  Request NDA / Data Room <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
