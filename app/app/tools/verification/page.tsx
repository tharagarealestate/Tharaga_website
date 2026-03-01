"use client"

import * as React from 'react'
import Breadcrumb from '@/components/Breadcrumb'
import { verifyRera, verifyTitle, getFraudScore, getPredictiveAnalytics } from '@/lib/api'
import { PageWrapper } from '@/components/ui/PageWrapper'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { PremiumButton } from '@/components/ui/premium-button'
import { DESIGN_TOKENS } from '@/lib/design-system'

function Section({ title, children }: { title: string; children: React.ReactNode }){
  return (
    <GlassCard variant="dark" glow border className="p-4 space-y-3">
      <h2 className={`font-semibold ${DESIGN_TOKENS.colors.text.primary}`}>{title}</h2>
      {children}
    </GlassCard>
  )
}

export default function VerificationTools(){
  // RERA
  const [reraId, setReraId] = React.useState('TN-1234-XYZ')
  const [reraState, setReraState] = React.useState('TN')
  const [projectName, setProjectName] = React.useState('')
  const [promoterName, setPromoterName] = React.useState('')
  const [reraRes, setReraRes] = React.useState<any>(null)

  // Title
  const [propId, setPropId] = React.useState('P1')
  const [docHash, setDocHash] = React.useState(''.padEnd(64,'a'))
  const [network, setNetwork] = React.useState('polygon')
  const [titleRes, setTitleRes] = React.useState<any>(null)

  // Fraud
  const [price, setPrice] = React.useState(10000000)
  const [sqft, setSqft] = React.useState(1200)
  const [hasRera, setHasRera] = React.useState(false)
  const [hasTitle, setHasTitle] = React.useState(false)
  const [seller, setSeller] = React.useState('owner')
  const [days, setDays] = React.useState(30)
  const [fraud, setFraud] = React.useState<any>(null)

  // Predictive
  const [city, setCity] = React.useState('Chennai')
  const [locality, setLocality] = React.useState('Anna Nagar')
  const [pred, setPred] = React.useState<any>(null)

  const onRera = async ()=> setReraRes(await verifyRera({ rera_id: reraId, state: reraState, project_name: projectName, promoter_name: promoterName }))
  const onTitle = async ()=> setTitleRes(await verifyTitle({ property_id: propId, document_hash: docHash, network }))
  const onFraud = async ()=> setFraud(await getFraudScore({ price_inr: price, sqft, has_rera_id: hasRera, has_title_docs: hasTitle, seller_type: seller, listed_days_ago: days }))
  const onPredict = async ()=> setPred(await getPredictiveAnalytics({ city, locality, sqft, price_inr: price }))

  return (
    <PageWrapper>
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Tools', href: '/sitemap' },
        { label: 'Verification Tools' }
      ]} />
      
      <PageHeader
        title="Verification & Risk Tools"
        description="Verify RERA compliance, title documents, fraud risk, and predictive analytics"
        className="text-center mb-8"
      />

      <SectionWrapper noPadding>
        <div className="space-y-6">

      <Section title="RERA verification">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input className="rounded-lg border px-3 py-2" placeholder="RERA ID" value={reraId} onChange={(e)=>setReraId(e.target.value)} />
          <input className="rounded-lg border px-3 py-2" placeholder="State (e.g., TN)" value={reraState} onChange={(e)=>setReraState(e.target.value)} />
          <input className="rounded-lg border px-3 py-2" placeholder="Project name" value={projectName} onChange={(e)=>setProjectName(e.target.value)} />
          <input className="rounded-lg border px-3 py-2" placeholder="Promoter name" value={promoterName} onChange={(e)=>setPromoterName(e.target.value)} />
        </div>
        <div className="flex gap-3"><PremiumButton variant="secondary" size="sm" onClick={onRera}>Verify RERA</PremiumButton></div>
        {reraRes && (
          <div className={`rounded-lg border ${DESIGN_TOKENS.colors.border.default} p-3 text-sm`}>
            <div className={DESIGN_TOKENS.colors.text.secondary}>Status: <span className={`font-semibold ${DESIGN_TOKENS.colors.text.primary}`}>{reraRes.status}</span> · Verified: <span className={`font-semibold ${DESIGN_TOKENS.colors.text.primary}`}>{String(reraRes.verified)}</span> · Confidence: {Math.round((reraRes.confidence||0)*100)}%</div>
            {reraRes.source_url && <a className={`${DESIGN_TOKENS.colors.text.accent} underline`} href={reraRes.source_url} target="_blank" rel="noopener">Open portal</a>}
          </div>
        )}
      </Section>

      <Section title="Document snapshot immutability (proof-of-snapshot)">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="rounded-lg border px-3 py-2" placeholder="Property ID" value={propId} onChange={(e)=>setPropId(e.target.value)} />
          <input className="rounded-lg border px-3 py-2 font-mono" placeholder="Document hash (hex)" value={docHash} onChange={(e)=>setDocHash(e.target.value)} />
          <select className="rounded-lg border px-3 py-2" value={network} onChange={(e)=>setNetwork(e.target.value)}>
            {['polygon','ethereum','other'].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="flex gap-3"><PremiumButton variant="secondary" size="sm" onClick={onTitle}>Verify title</PremiumButton></div>
        {titleRes && (
          <div className={`rounded-lg border ${DESIGN_TOKENS.colors.border.default} p-3 text-sm`}>
            <div className={DESIGN_TOKENS.colors.text.secondary}>Verified: <span className={`font-semibold ${DESIGN_TOKENS.colors.text.primary}`}>{String(titleRes.verified)}</span> · Confidence: {Math.round((titleRes.confidence||0)*100)}%</div>
            <div className={`font-mono break-words ${DESIGN_TOKENS.colors.text.primary}`}>TX: {titleRes.transaction_hash}</div>
            {titleRes.explorer_url && <a className={`${DESIGN_TOKENS.colors.text.accent} underline`} href={titleRes.explorer_url} target="_blank" rel="noopener">Open explorer</a>}
          </div>
        )}
      </Section>

      <Section title="Fraud risk score">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <input className="rounded-lg border px-3 py-2" type="number" placeholder="Price (INR)" value={price} onChange={(e)=>setPrice(Number(e.target.value||0))} />
          <input className="rounded-lg border px-3 py-2" type="number" placeholder="Sqft" value={sqft} onChange={(e)=>setSqft(Number(e.target.value||0))} />
          <select className="rounded-lg border px-3 py-2" value={seller} onChange={(e)=>setSeller(e.target.value)}>
            {['owner','broker','builder'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input className="rounded-lg border px-3 py-2" type="number" placeholder="Days listed" value={days} onChange={(e)=>setDays(Number(e.target.value||0))} />
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={hasRera} onChange={(e)=>setHasRera(e.target.checked)} /> RERA</label>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={hasTitle} onChange={(e)=>setHasTitle(e.target.checked)} /> Title docs</label>
        </div>
        <div className="flex gap-3"><PremiumButton variant="secondary" size="sm" onClick={onFraud}>Compute score</PremiumButton></div>
        {fraud && (
          <div className={`rounded-lg border ${DESIGN_TOKENS.colors.border.default} p-3 text-sm`}>
            <div className={`text-lg font-bold ${DESIGN_TOKENS.colors.text.primary}`}>Risk: {fraud.risk_score}/100 · {fraud.risk_level}</div>
            <ul className="list-disc pl-5">
              {(fraud.reasons||[]).map((r:string,i:number)=>(<li key={i} className={DESIGN_TOKENS.colors.text.secondary}>{r}</li>))}
            </ul>
          </div>
        )}
      </Section>

      <Section title="Predictive analytics">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input className="rounded-lg border px-3 py-2" placeholder="City" value={city} onChange={(e)=>setCity(e.target.value)} />
          <input className="rounded-lg border px-3 py-2" placeholder="Locality" value={locality} onChange={(e)=>setLocality(e.target.value)} />
        </div>
        <div className="flex gap-3"><PremiumButton variant="secondary" size="sm" onClick={onPredict}>Predict</PremiumButton></div>
        {pred && (
          <div className={`rounded-lg border ${DESIGN_TOKENS.colors.border.default} p-3 text-sm`}>
            <div className={DESIGN_TOKENS.colors.text.secondary}>1-year appreciation: <span className={`font-semibold ${DESIGN_TOKENS.colors.text.primary}`}>{pred.price_appreciation_1y_pct}%</span></div>
            <div className={DESIGN_TOKENS.colors.text.secondary}>3-year appreciation: <span className={`font-semibold ${DESIGN_TOKENS.colors.text.primary}`}>{pred.price_appreciation_3y_pct}%</span></div>
            <div className={DESIGN_TOKENS.colors.text.secondary}>Expected rent yield: <span className={`font-semibold ${DESIGN_TOKENS.colors.text.primary}`}>{pred.expected_rent_yield_pct}%</span></div>
          </div>
        )}
      </Section>
        </div>
      </SectionWrapper>
    </PageWrapper>
  )
}
