"use client";

import { useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { LeadsList, type Lead } from './_components/LeadsList';
import { FilterProvider } from '@/contexts/FilterContext';
import { FilterCollections } from './_components/FilterCollections';
import AdvancedFilters from './_components/AdvancedFilters';

export default function BuilderLeadsPage() {
  const router = useRouter();

  const handleSelectLead = useCallback(
    (lead: Lead) => {
      router.push(`/builder/leads/${lead.id}`);
    },
    [router]
  );

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 overflow-hidden">
      {/* Animated Background Elements - EXACT from pricing page */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gold-500 rounded-full blur-3xl animate-pulse-slow" />
        <div
          className="absolute bottom-20 right-10 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDelay: '1s' }}
        />
      </div>

      <div className="relative z-10 px-4 py-12 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-7xl space-y-10">
          <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-sm text-emerald-100 backdrop-blur">
                <span className="h-2 w-2 animate-ping rounded-full bg-emerald-300" />
                Real-time scoring with AI intelligence
              </div>
              <div>
                <h1 className="font-display text-4xl font-bold text-white sm:text-5xl lg:text-[3.25rem]">
                  Lead Intelligence Command Center
                </h1>
                <p className="mt-3 max-w-2xl text-base text-blue-100/80 sm:text-lg">
                  Monitor, prioritize, and act on buyer intent instantly with live scoring, enriched insights, and
                  premium glassmorphism inspired by our pricing experience.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/builder/leads/pipeline"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition-all hover:border-white/40 hover:bg-white/20"
              >
                View Pipeline Overview
              </Link>
              <Link
                href="/builder/properties/add"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-500/30 transition-transform hover:scale-[1.02]"
              >
                Add New Lead Source
              </Link>
            </div>
          </header>

          <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-xl shadow-blue-900/20 backdrop-blur-2xl sm:p-8">
            <FilterProvider>
              <div className="space-y-10">
                <AdvancedFilters />
                <FilterCollections />
                <LeadsList onSelectLead={handleSelectLead} showInlineFilters={false} />
              </div>
            </FilterProvider>
          </section>
        </div>
      </div>
    </div>
  );
}



