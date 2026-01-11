"use client"

import * as React from 'react'
import Breadcrumb from '@/components/Breadcrumb'

const HAS_AR = typeof window !== 'undefined' && 'ARView' in (window as any) // placeholder flag

export default function ArStagingPage(){
  const [supported, setSupported] = React.useState(false)
  React.useEffect(()=>{ setSupported(!!(navigator as any)?.xr || /Android|iPhone/.test(navigator.userAgent)) },[])

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'AR/VR Tours', href: '/tours' },
        { label: 'AR Furniture Staging' }
      ]} />
      <h1 className="text-2xl font-bold text-plum mb-2">AR furniture staging</h1>
      <div className="rounded-xl border border-plum/10 bg-brandWhite p-4 space-y-3">
        <p className="text-sm text-plum/70">Place sample furniture in your room using your phone camera.</p>
        {!supported && <div className="text-sm text-plum/70">This browser may not support WebXR/AR. Try on a modern mobile device.</div>}
        <div className="grid grid-cols-2 gap-3">
          <a rel="ar" href="https://developer.apple.com/augmented-reality/quick-look/models/retrotv/tv_retro.usdz" className="rounded-lg border px-3 py-2 text-center">View Sofa (AR)</a>
          <a rel="ar" href="https://developer.apple.com/augmented-reality/quick-look/models/drummachine/drummachine.usdz" className="rounded-lg border px-3 py-2 text-center">View Table (AR)</a>
        </div>
        <p className="text-xs text-plum/60">On iOS, USDZ will open in AR Quick Look. On Android, install Scene Viewer compatible app.</p>
      </div>
    </main>
  )
}
