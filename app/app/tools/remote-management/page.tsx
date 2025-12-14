"use client"

import * as React from 'react'
import Breadcrumb from '@/components/Breadcrumb'

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }){
  return (
    <div className="rounded-xl border border-plum/10 bg-brandWhite p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-semibold">{title}</div>
        {action}
      </div>
      {children}
    </div>
  )
}

export default function RemoteManagementPage(){
  const [caretaker, setCaretaker] = React.useState('')
  const [visitDate, setVisitDate] = React.useState('')
  const [notes, setNotes] = React.useState('')

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden">
      {/* Animated Background Elements - EXACT from pricing page */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gold-500 rounded-full blur-3xl animate-pulse-slow" />
        <div
          className="absolute bottom-20 right-10 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDelay: '1s' }}
        />
      </div>

      <div className="relative z-10">
        <main className="mx-auto max-w-4xl px-6 py-8">
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Remote Management' }
      ]} />
      <h1 className="text-2xl font-bold text-plum mb-4">Remote property management</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Schedule caretaker visit" action={<button className="rounded-lg border px-3 py-1 text-sm">Book</button>}>
          <div className="grid grid-cols-1 gap-2">
            <input className="rounded-lg border px-3 py-2" placeholder="Caretaker name" value={caretaker} onChange={(e)=>setCaretaker(e.target.value)} />
            <input className="rounded-lg border px-3 py-2" type="date" value={visitDate} onChange={(e)=>setVisitDate(e.target.value)} />
            <textarea className="rounded-lg border px-3 py-2" placeholder="Instructions" value={notes} onChange={(e)=>setNotes(e.target.value)} />
          </div>
        </Card>
        <Card title="Digital documents">
          <div className="flex items-center gap-3">
            <input type="file" className="rounded-lg border px-3 py-2" />
            <button className="rounded-lg border px-3 py-2">Upload</button>
          </div>
          <div className="text-xs text-plum/60 mt-2">Store agreements, EC, tax receipts.</div>
        </Card>
        <Card title="Utility payments">
          <div className="text-sm text-plum/70">Connect EB, water, maintenance via your provider portals. We’ll add connectors soon.</div>
        </Card>
        <Card title="Tenant management">
          <div className="text-sm text-plum/70">Keep tenant details, reminders for rent and renewals.</div>
        </Card>
      </div>
        </main>
      </div>
    </div>
  )
}
