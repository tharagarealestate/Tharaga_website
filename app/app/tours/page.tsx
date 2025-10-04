"use client"

import * as React from 'react'

function IframeTour({ src }: { src: string }) {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl border border-plum/10 bg-black">
      <iframe src={src} className="w-full h-full" allow="xr-spatial-tracking; gyroscope; accelerometer; vr; fullscreen" allowFullScreen />
    </div>
  )
}

export default function ToursPage(){
  const [url, setUrl] = React.useState('https://my.matterport.com/show/?m=xxxxxxxxxxx')
  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-bold text-plum mb-4">AR/VR property tours</h1>
      <div className="rounded-xl border border-plum/10 bg-brandWhite p-4 space-y-4">
        <div>
          <label className="block text-sm mb-1">360/3D tour URL (Matterport, Kuula, or compatible)</label>
          <input type="url" value={url} onChange={(e)=>setUrl(e.target.value)} className="w-full rounded-lg border px-3 py-2"/>
        </div>
        <IframeTour src={url} />
        <p className="text-xs text-plum/60">Paste a share link. Many providers support WebXR or device motion for immersive view.</p>
      </div>
    </main>
  )
}
