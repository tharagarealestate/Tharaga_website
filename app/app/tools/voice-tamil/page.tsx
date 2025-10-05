"use client"

import * as React from 'react'

const SR = typeof window !== 'undefined' ? (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition : undefined

export default function TamilVoiceSearchPage(){
  const [supported, setSupported] = React.useState<boolean>(false)
  const [listening, setListening] = React.useState(false)
  const [text, setText] = React.useState('')

  React.useEffect(()=>{ setSupported(!!SR) },[])

  function start(){
    if (!SR) return
    const rec = new SR()
    rec.lang = 'ta-IN'
    rec.interimResults = true
    rec.continuous = false
    rec.onresult = (e: any) => {
      let t = ''
      for (const res of e.results) { t += res[0].transcript }
      setText(t)
    }
    rec.onend = ()=> setListening(false)
    setListening(true)
    rec.start()
  }

  const searchUrl = text ? `/property-listing/?q=${encodeURIComponent(text)}` : '/property-listing/'

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-bold text-fg mb-4">Tamil voice search</h1>
      <div className="rounded-xl border border-border bg-canvas p-4 space-y-4">
        {!supported && <div className="text-sm text-fgMuted">Voice recognition is not supported in this browser.</div>}
        <div className="flex gap-3 items-center">
          <button onClick={start} disabled={!supported || listening} className="rounded-lg border px-3 py-2 disabled:opacity-50">
            {listening ? 'Listening…' : 'Start Tamil voice input'}
          </button>
          <a className="rounded-lg border px-3 py-2" href={searchUrl}>Search listings</a>
        </div>
        <div className="rounded-lg border border-border p-3 bg-canvas">
          <div className="text-xs text-fgMuted mb-1">Recognized text</div>
          <div className="font-mono text-sm break-words">{text || '—'}</div>
        </div>
        <p className="text-xs text-fgMuted">We set recognition language to ta-IN. You can refine the query after transcription.</p>
      </div>
    </main>
  )
}
