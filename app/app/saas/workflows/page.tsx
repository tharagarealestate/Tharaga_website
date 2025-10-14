"use client"
import { FeatureGate } from '@/components/ui/FeatureGate'
import { useState } from 'react'

function Step({ title, children }: { title: string; children: React.ReactNode }){
  return (
    <div className="border border-border rounded p-3">
      <div className="font-semibold mb-2">{title}</div>
      {children}
    </div>
  )
}

export default function Workflows(){
  const [flow, setFlow] = useState<any>({ steps: [] })
  return (
    <main className="mx-auto max-w-5xl px-6 py-8 space-y-4">
      <h1 className="text-2xl font-bold">Workflow editor</h1>
      <FeatureGate feature="workflowEditor" fallback={<div className="text-fgMuted">Available on Pro tier.</div>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Step title="Trigger">
            <select className="border rounded p-2 w-full">
              <option>Lead created</option>
              <option>Visit scheduled</option>
              <option>Lead idle for 3 days</option>
            </select>
          </Step>
          <Step title="Action">
            <select className="border rounded p-2 w-full">
              <option>Email sequence</option>
              <option>WhatsApp nudge</option>
              <option>SMS reminder</option>
            </select>
          </Step>
          <Step title="Condition">
            <select className="border rounded p-2 w-full">
              <option>Intent score > 0.7</option>
              <option>Lead source is microsite</option>
              <option>Visited unit page</option>
            </select>
          </Step>
        </div>
        <div>
          <button className="btn mt-3">Save workflow</button>
        </div>
      </FeatureGate>
    </main>
  )
}
