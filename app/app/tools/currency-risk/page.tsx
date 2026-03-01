"use client"

import * as React from 'react'
import Breadcrumb from '@/components/Breadcrumb'
import { useTranslations } from 'next-intl'
import { PageWrapper } from '@/components/ui/PageWrapper'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { DESIGN_TOKENS } from '@/lib/design-system'

const FX: Record<string, number> = { USD: 0.012, AED: 0.044, GBP: 0.0095, EUR: 0.011 }

function fmt(n: number, code: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: code, maximumFractionDigits: 0 }).format(n)
}

export default function CurrencyRiskPage() {
  const t = useTranslations('tools.fx')
  const [amountINR, setAmountINR] = React.useState(10000000)
  const [fx, setFx] = React.useState('USD')
  const [driftPct, setDriftPct] = React.useState(4)
  const [volPct, setVolPct] = React.useState(6)
  const [horizonY, setHorizonY] = React.useState(3)
  const [paths, setPaths] = React.useState(200)

  const now = (amountINR * (FX[fx] || 0.012))
  const best = now * Math.pow(1 + driftPct / 100, horizonY)
  const worst = now * Math.pow(1 - driftPct / 100, horizonY)

  function simulateVaR() {
    const mu = driftPct / 100
    const sigma = volPct / 100
    const T = horizonY
    const arr: number[] = []
    for (let i = 0; i < paths; i++) {
      // Geometric Brownian Motion terminal value
      const z = gaussian()
      const ST = now * Math.exp((mu - 0.5 * sigma * sigma) * T + sigma * Math.sqrt(T) * z)
      arr.push(ST)
    }
    arr.sort((a,b)=>a-b)
    const p05 = arr[Math.floor(0.05 * arr.length)]
    const p50 = arr[Math.floor(0.50 * arr.length)]
    const p95 = arr[Math.floor(0.95 * arr.length)]
    return { p05, p50, p95 }
  }

  function gaussian(){
    // Box-Muller
    let u = 0, v = 0
    while (u === 0) u = Math.random()
    while (v === 0) v = Math.random()
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  }

  const sim = simulateVaR()

  return (
    <PageWrapper>
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Tools', href: '/sitemap' },
        { label: 'Currency Risk' }
      ]} />
      
      <PageHeader
        title={t('title')}
        description="Analyze currency risk for international property investments"
        className="text-center mb-8"
      />

      <SectionWrapper noPadding>
        <GlassCard variant="dark" glow border className="p-6 sm:p-8 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">{t('fields.investment')}</label>
            <input type="number" value={amountINR} onChange={(e)=>setAmountINR(Number(e.target.value||0))} className="w-full rounded-lg border px-3 py-2"/>
          </div>
          <div>
            <label className="block text-sm mb-1">{t('fields.currency')}</label>
            <select value={fx} onChange={(e)=>setFx(e.target.value)} className="w-full rounded-lg border px-3 py-2">
              {Object.keys(FX).map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">{t('fields.drift')}</label>
            <input type="number" step="0.1" value={driftPct} onChange={(e)=>setDriftPct(Number(e.target.value||0))} className="w-full rounded-lg border px-3 py-2"/>
          </div>
          <div>
            <label className="block text-sm mb-1">{t('fields.volatility')}</label>
            <input type="number" step="0.1" value={volPct} onChange={(e)=>setVolPct(Number(e.target.value||0))} className="w-full rounded-lg border px-3 py-2"/>
          </div>
          <div>
            <label className="block text-sm mb-1">{t('fields.horizon')}</label>
            <input type="number" value={horizonY} onChange={(e)=>setHorizonY(Number(e.target.value||0))} className="w-full rounded-lg border px-3 py-2"/>
          </div>
          <div>
            <label className="block text-sm mb-1">{t('fields.paths')}</label>
            <input type="number" value={paths} onChange={(e)=>setPaths(Number(e.target.value||0))} className="w-full rounded-lg border px-3 py-2"/>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card label={t('cards.current')} value={fmt(now, fx)} />
          <Card label={t('cards.best')} value={fmt(best, fx)} />
          <Card label={t('cards.worst')} value={fmt(worst, fx)} />
          <Card label={t('cards.var5')} value={fmt(sim.p05, fx)} />
          <Card label={t('cards.median')} value={fmt(sim.p50, fx)} />
          <Card label={t('cards.p95')} value={fmt(sim.p95, fx)} />
        </div>
        <p className={`text-xs ${DESIGN_TOKENS.colors.text.muted}`}>{t('disclaimer')}</p>
        </GlassCard>
      </SectionWrapper>
    </PageWrapper>
  )
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className={`rounded-lg border ${DESIGN_TOKENS.colors.border.default} p-3`}>
      <div className={`text-xs ${DESIGN_TOKENS.colors.text.muted}`}>{label}</div>
      <div className={`font-semibold ${DESIGN_TOKENS.colors.text.primary}`}>{value}</div>
    </div>
  )
}
