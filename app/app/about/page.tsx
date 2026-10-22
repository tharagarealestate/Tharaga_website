'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Shield, BarChart3, Building2, Sparkles,
  ArrowRight, ArrowLeft, CheckCircle2, Lock,
  Phone, Globe, Mountain, Sun, Warehouse
} from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#070709] text-white selection:bg-amber-400 selection:text-black py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Navigation */}
        <div className="flex items-center justify-between pb-6 border-b border-white/[0.08]">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Tharaga Institutional Home
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-black font-bold text-xs">
              T
            </div>
            <span className="font-serif font-bold text-lg text-white">Tharaga</span>
          </Link>
        </div>

        {/* Hero */}
        <div className="space-y-6 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Advisory Memorandum // About Tharaga
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold tracking-tight text-white leading-[1.1]">
            Private Commercial &<br />
            <span className="italic bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">
              Industrial Asset Advisory.
            </span>
          </h1>
          <p className="text-white/60 text-base sm:text-lg leading-relaxed font-light">
            Tharaga operates at the intersection of high-value industrial asset holders and global MNC conglomerates. We transact large-extent industrial land banks, grid-connected solar power parcels, and operational quarries with complete confidentiality and zero broker noise.
          </p>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {[
            {
              code: '01 // BOARDROOM SYNERGY',
              title: 'Direct MNC Boardroom Access',
              desc: 'We maintain direct bilateral relationships with leading conglomerates. When a quarry is mandated, we interface directly with procurement heads at cement majors like Chettinad Cements, UltraTech, and Dalmia Bharat. When solar land is syndicated, we engage utility IPPs like NTPC and Adani.',
              icon: Building2,
            },
            {
              code: '02 // DUE DILIGENCE',
              title: '100% Audited Revenue Patta',
              desc: 'Every commercial asset syndicated through Tharaga undergoes rigorous 30-year revenue encumbrance verification, boundary demarcation, and TANGEDCO substation nodal audit before presenting to enterprise investment committees.',
              icon: Shield,
            },
            {
              code: '03 // CONFIDENTIALITY',
              title: 'Mutual NDA Protocol',
              desc: 'We do not publish survey numbers or owner contact numbers on public classifieds. All transactions proceed under strict mutual non-disclosure agreements, protecting proprietary asset coordinates and commercial terms.',
              icon: Lock,
            },
          ].map(col => {
            const Icon = col.icon
            return (
              <div
                key={col.code}
                className="p-8 rounded-3xl bg-[#0F0F14] border border-white/[0.08] space-y-4 hover:border-amber-400/40 transition-all"
              >
                <div className="text-[10px] font-mono text-amber-400 uppercase tracking-widest">
                  {col.code}
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-amber-400">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-serif font-bold text-white">{col.title}</h3>
                <p className="text-xs sm:text-sm text-white/50 leading-relaxed">{col.desc}</p>
              </div>
            )
          })}
        </div>

        {/* Strategic Corridors Summary */}
        <div className="p-8 sm:p-12 rounded-3xl bg-[#0D0D11] border border-white/[0.08] space-y-8">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400 block mb-2">
              Geographic Focus
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
              Primary Tamil Nadu Industrial Belts
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { corridor: 'Tuticorin – Tirunelveli', focus: 'Solar Parks & Renewable Energy', icon: Sun },
              { corridor: 'Ariyalur – Karur', focus: 'Limestone & Mineral Reserves', icon: Mountain },
              { corridor: 'Sriperumbudur – Oragadam', focus: 'Automotive & Heavy Electronics', icon: Building2 },
              { corridor: 'Hosur – Krishnagiri', focus: 'EV Logistics & Advanced Engineering', icon: Warehouse },
            ].map(belt => {
              const Icon = belt.icon
              return (
                <div key={belt.corridor} className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-semibold text-white">{belt.corridor}</h4>
                  <p className="text-xs text-white/50">{belt.focus}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-8 space-y-4">
          <Link
            href="/#mandates"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm tracking-wide uppercase transition-all shadow-xl shadow-amber-500/25"
          >
            Explore Active Mandates <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
