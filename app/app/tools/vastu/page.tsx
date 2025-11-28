"use client"

import * as React from 'react'
import Breadcrumb from '@/components/Breadcrumb'
import { useTranslations } from 'next-intl'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm mb-2">
      <span className="block mb-1 text-plum/80">{label}</span>
      {children}
    </label>
  )
}

export default function VastuPage() {
  const t = useTranslations('vastu')
  const [entranceDir, setEntranceDir] = React.useState('East')
  const [kitchenDir, setKitchenDir] = React.useState('South-East')
  const [masterBedDir, setMasterBedDir] = React.useState('South-West')
  const [toiletDir, setToiletDir] = React.useState('North-West')
  const [sunlight, setSunlight] = React.useState('Good')
  const [facing, setFacing] = React.useState<string>('Unknown')

  React.useEffect(()=>{
    if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) return
    const handler = (e: any) => {
      const alpha = e.alpha
      if (typeof alpha !== 'number') return
      // Map degrees to cardinal
      const deg = (alpha + 360) % 360
      const dirs = ['North','North-East','East','South-East','South','South-West','West','North-West']
      const idx = Math.round(deg / 45) % 8
      setFacing(dirs[idx])
    }
    window.addEventListener('deviceorientation', handler, true)
    return ()=> window.removeEventListener('deviceorientation', handler, true)
  }, [])

  const recommendations: string[] = []
  let score = 100

  if (!['East', 'North-East'].includes(entranceDir)) { score -= 15; recommendations.push('Prefer entrance in East or North-East.') }
  if (!['South-East', 'North-West'].includes(kitchenDir)) { score -= 15; recommendations.push('Kitchen in South-East (Agni) preferred; North-West acceptable.') }
  if (masterBedDir !== 'South-West') { score -= 10; recommendations.push('Master bedroom best in South-West.') }
  if (toiletDir === 'North-East') { score -= 20; recommendations.push('Avoid toilet in North-East; consider relocation or ventilation fixes.') }
  if (sunlight !== 'Good') { score -= 10; recommendations.push('Improve natural light and cross-ventilation.') }

  const level = score >= 80 ? t('levels.excellent') : score >= 60 ? t('levels.good') : score >= 40 ? t('levels.average') : t('levels.poor')

  return (
    <>
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Tools', href: '/tools' },
        { label: 'Vastu Checker' }
      ]} />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="text-2xl font-bold text-plum mb-4">{t('title')}</h1>
      <div className="rounded-xl border border-plum/10 bg-brandWhite p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={t('fields.entrance')}>
            <select className="w-full rounded-lg border px-3 py-2" value={entranceDir} onChange={(e)=>setEntranceDir(e.target.value)}>
              {['East','North-East','North','West','South','South-West','North-West'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label={t('fields.kitchen')}>
            <select className="w-full rounded-lg border px-3 py-2" value={kitchenDir} onChange={(e)=>setKitchenDir(e.target.value)}>
              {['South-East','North-West','North','West','East','South','South-West'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label={t('fields.master')}>
            <select className="w-full rounded-lg border px-3 py-2" value={masterBedDir} onChange={(e)=>setMasterBedDir(e.target.value)}>
              {['South-West','North-East','North-West','South-East'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label={t('fields.toilet')}>
            <select className="w-full rounded-lg border px-3 py-2" value={toiletDir} onChange={(e)=>setToiletDir(e.target.value)}>
              {['North-West','West','South','South-West','North-East'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label={t('fields.sunVent')}>
            <select className="w-full rounded-lg border px-3 py-2" value={sunlight} onChange={(e)=>setSunlight(e.target.value)}>
              {['Good','Average','Poor'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
        </div>
        <div className="rounded-lg bg-plum/5 border border-plum/10 p-4">
          <div className="text-sm text-plum/70">{t('scoreLabel')}</div>
          <div className="text-xl font-bold">{score}/100 · {level}</div>
          <div className="text-xs text-plum/60">{t('detectedFacing')}: {facing}</div>
        </div>
        {!!recommendations.length && (
          <div className="rounded-lg border border-plum/10 p-3">
            <div className="font-semibold mb-2">{t('reco')}</div>
            <ul className="list-disc pl-5 space-y-1">
              {recommendations.map((r,i)=>(<li key={i}>{r}</li>))}
            </ul>
          </div>
        )}
      </div>
      </main>
    </>
  )
}
