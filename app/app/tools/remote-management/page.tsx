"use client"

import * as React from 'react'
import Breadcrumb from '@/components/Breadcrumb'
import { PageWrapper } from '@/components/ui/PageWrapper'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { PremiumButton } from '@/components/ui/premium-button'
import { DESIGN_TOKENS } from '@/lib/design-system'

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }){
  return (
    <GlassCard variant="dark" glow border className="p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className={`font-semibold ${DESIGN_TOKENS.colors.text.primary}`}>{title}</div>
        {action}
      </div>
      {children}
    </GlassCard>
  )
}

export default function RemoteManagementPage(){
  const [caretaker, setCaretaker] = React.useState('')
  const [visitDate, setVisitDate] = React.useState('')
  const [notes, setNotes] = React.useState('')

  return (
    <PageWrapper>
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Tools', href: '/sitemap' },
        { label: 'Remote Management' }
      ]} />
      
      <PageHeader
        title="Remote Property Management"
        description="Manage your properties remotely with caretaker scheduling, document storage, and tenant management"
        className="text-center mb-8"
      />

      <SectionWrapper noPadding>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Schedule caretaker visit" action={<PremiumButton variant="secondary" size="sm">Book</PremiumButton>}>
          <div className="grid grid-cols-1 gap-2">
            <input className={`rounded-lg border ${DESIGN_TOKENS.colors.border.default} px-3 py-2 ${DESIGN_TOKENS.colors.background.card} ${DESIGN_TOKENS.colors.text.primary}`} placeholder="Caretaker name" value={caretaker} onChange={(e)=>setCaretaker(e.target.value)} />
            <input className={`rounded-lg border ${DESIGN_TOKENS.colors.border.default} px-3 py-2 ${DESIGN_TOKENS.colors.background.card} ${DESIGN_TOKENS.colors.text.primary}`} type="date" value={visitDate} onChange={(e)=>setVisitDate(e.target.value)} />
            <textarea className={`rounded-lg border ${DESIGN_TOKENS.colors.border.default} px-3 py-2 ${DESIGN_TOKENS.colors.background.card} ${DESIGN_TOKENS.colors.text.primary}`} placeholder="Instructions" value={notes} onChange={(e)=>setNotes(e.target.value)} />
          </div>
        </Card>
        <Card title="Digital documents">
          <div className="flex items-center gap-3">
            <input type="file" className={`rounded-lg border ${DESIGN_TOKENS.colors.border.default} px-3 py-2 ${DESIGN_TOKENS.colors.background.card}`} />
            <PremiumButton variant="secondary" size="sm">Upload</PremiumButton>
          </div>
          <div className={`text-xs ${DESIGN_TOKENS.colors.text.muted} mt-2`}>Store agreements, EC, tax receipts.</div>
        </Card>
        <Card title="Utility payments">
          <div className={`text-sm ${DESIGN_TOKENS.colors.text.secondary}`}>Connect EB, water, maintenance via your provider portals. We'll add connectors soon.</div>
        </Card>
        <Card title="Tenant management">
          <div className={`text-sm ${DESIGN_TOKENS.colors.text.secondary}`}>Keep tenant details, reminders for rent and renewals.</div>
        </Card>
      </div>
      </SectionWrapper>
    </PageWrapper>
  )
}
