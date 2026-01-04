"use client"

import * as React from 'react'
import Breadcrumb from '@/components/Breadcrumb'
import { matchChennaiLocality, getCanonicalLocality } from '@/lib/tamil-locality-matcher'

const SR = typeof window !== 'undefined' ? (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition : undefined

export default function TamilVoiceSearchPage(){
  const [supported, setSupported] = React.useState<boolean>(false)
  const [listening, setListening] = React.useState(false)
  const [text, setText] = React.useState('')
  const [suggestions, setSuggestions] = React.useState<Array<{canonical: string; similarity: number}>>([])

  React.useEffect(()=>{ setSupported(!!SR) },[])

  React.useEffect(() => {
    if (text) {
      const matches = matchChennaiLocality(text, 2)
      setSuggestions(matches.map(m => ({ canonical: m.canonical, similarity: m.similarity })))
    } else {
      setSuggestions([])
    }
  }, [text])

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

  const canonicalLocality = text ? getCanonicalLocality(text) : null
  const searchUrl = canonicalLocality
    ? `/property-listing/?q=${encodeURIComponent(canonicalLocality)}&locality=${encodeURIComponent(canonicalLocality)}`
    : text
      ? `/property-listing/?q=${encodeURIComponent(text)}`
      : '/property-listing/'

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
        <main className="mx-auto max-w-3xl px-6 py-8">
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Tamil Voice Search' }
      ]} />
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
        
        {/* Locality Suggestions */}
        {suggestions.length > 0 && (
          <div className="rounded-lg border border-border p-3 bg-canvas space-y-2">
            <div className="text-xs text-fgMuted mb-2">Did you mean?</div>
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => {
                  const canonical = suggestion.canonical
                  window.location.href = `/property-listing/?q=${encodeURIComponent(canonical)}&locality=${encodeURIComponent(canonical)}`
                }}
                className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">{suggestion.canonical}</div>
                <div className="text-xs text-gray-500">Match: {(suggestion.similarity * 100).toFixed(0)}%</div>
              </button>
            ))}
          </div>
        )}
        
        {canonicalLocality && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <div className="text-xs text-emerald-700 font-medium mb-1">Matched Locality:</div>
            <div className="text-sm text-emerald-900 font-semibold">{canonicalLocality}</div>
          </div>
        )}
        
        <p className="text-xs text-fgMuted">Tamil-first voice search (Chennai). We set recognition language to ta-IN. You can refine the query after transcription.</p>
      </div>
    </main>
      </div>
    </div>
  )
}
