'use client'

import Link from 'next/link'
import {
  Shield, CheckCircle2, Building2, ArrowRight,
  ArrowLeft, Lock, FileText, Phone, Sparkles
} from 'lucide-react'

export default function PricingEngagementPage() {
  return (
    <div className="min-h-screen bg-[#070709] text-white selection:bg-amber-400 selection:text-black py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Top Navigation */}
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

        {/* Header */}
        <div className="space-y-6 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono tracking-widest uppercase">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            Advisory Engagement & Mandate Structure
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold tracking-tight text-white leading-[1.1]">
            Success-Aligned Mandate Terms.<br />
            <span className="italic bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">
              Zero Upfront Platform Fees.
            </span>
          </h1>
          <p className="text-white/60 text-base sm:text-lg leading-relaxed font-light">
            Tharaga does not charge monthly listing subscriptions or paywall fees. We operate on institutional success-aligned advisory agreements executed under bilateral non-disclosure agreements.
          </p>
        </div>

        {/* Engagement Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Asset Principals / Sellers */}
          <div className="p-8 sm:p-10 rounded-3xl bg-[#0F0F14] border border-white/[0.08] hover:border-amber-400/40 transition-all space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-widest text-amber-400">
                  For Asset Sellers & Principals
                </span>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  ₹0 Upfront
                </span>
              </div>
              <h3 className="text-2xl font-serif font-bold text-white">Commercial & Land Mandate</h3>
              <p className="text-xs sm:text-sm text-white/50 leading-relaxed">
                For verified title holders of industrial land parcels, solar-ready plots, and active quarries looking to transact with MNC buyers.
              </p>

              <ul className="space-y-2.5 text-xs text-white/70 pt-2">
                {[
                  'Zero upfront fee to submit or underwrite commercial mandate',
                  'Instant Claude 3.5 technical feasibility & offtaker synergy dossier',
                  'Selective MNC syndication (Chettinad, Renewables, Tier-1 Conglomerates)',
                  'Complete confidentiality: survey numbers withheld under mutual NDA',
                  'Standard advisory fee payable strictly upon bilateral settlement',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/#tracker"
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20"
            >
              Submit Commercial Asset <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2: MNC Acquirers & Conglomerates */}
          <div className="p-8 sm:p-10 rounded-3xl bg-[#0C0C10] border border-white/[0.08] hover:border-amber-400/40 transition-all space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-widest text-amber-400">
                  For Corporate Acquirers & MNCs
                </span>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/10 text-white/70 border border-white/10">
                  Direct Boardroom Desk
                </span>
              </div>
              <h3 className="text-2xl font-serif font-bold text-white">Acquisition & Siting Advisory</h3>
              <p className="text-xs sm:text-sm text-white/50 leading-relaxed">
                For corporate strategy teams, cement plants, solar IPPs, and logistics REITs seeking large-extent land or natural resource reserves in Tamil Nadu.
              </p>

              <ul className="space-y-2.5 text-xs text-white/70 pt-2">
                {[
                  'Bespoke corridor sourcing tailored to power/substation criteria',
                  '30-Year clear revenue patta and nil-encumbrance legal audits',
                  'Geological core survey & mining reserve validation (limestone/aggregates)',
                  'Direct principal negotiation and escrow-structured settlement',
                  'Full execution and statutory compliance assistance',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <a
              href="https://wa.me/918870980839?text=Hello%20Tharaga%20Advisory,%20we%20are%20an%20MNC%20corporate%20acquirer%20seeking%20commercial%20land%20or%20quarry%20assets."
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-xs uppercase tracking-wider transition-colors"
            >
              Contact Advisory Desk <Phone className="w-3.5 h-3.5 ml-1 text-amber-400" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
