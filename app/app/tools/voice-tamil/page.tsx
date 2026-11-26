"use client"

import * as React from 'react'
import Breadcrumb from '@/components/Breadcrumb'
import { matchChennaiLocality, getCanonicalLocality } from '@/lib/tamil-locality-matcher'
import { PageWrapper } from '@/components/ui/PageWrapper'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { PremiumButton } from '@/components/ui/premium-button'
import { DESIGN_TOKENS } from '@/lib/design-system'

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
    <PageWrapper>
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Tools', href: '/sitemap' },
        { label: 'Tamil Voice Search' }
      ]} />
      
      <PageHeader
        title="Tamil Voice Search"
        description="Search properties using Tamil voice commands - Chennai locality recognition"
        className="text-center mb-8"
      />

      <SectionWrapper noPadding>
        <GlassCard variant="dark" glow border className="p-6 sm:p-8 space-y-4">
        {!supported && <div className={`text-sm ${DESIGN_TOKENS.colors.text.muted}`}>Voice recognition is not supported in this browser.</div>}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <PremiumButton 
            variant="secondary" 
            size="sm" 
            onClick={start} 
            disabled={!supported || listening}
          >
            {listening ? 'Listening…' : 'Start Tamil voice input'}
          </PremiumButton>
          <PremiumButton variant="outline" size="sm" asChild>
            <a href={searchUrl}>Search listings</a>
          </PremiumButton>
        </div>
        <div className={`rounded-lg border ${DESIGN_TOKENS.colors.border.default} p-3 ${DESIGN_TOKENS.colors.background.card}`}>
          <div className={`text-xs ${DESIGN_TOKENS.colors.text.muted} mb-1`}>Recognized text</div>
          <div className={`font-mono text-sm break-words ${DESIGN_TOKENS.colors.text.primary}`}>{text || '—'}</div>
        </div>
        
        {/* Locality Suggestions */}
        {suggestions.length > 0 && (
          <div className={`rounded-lg border ${DESIGN_TOKENS.colors.border.default} p-3 ${DESIGN_TOKENS.colors.background.card} space-y-2`}>
            <div className={`text-xs ${DESIGN_TOKENS.colors.text.muted} mb-2`}>Did you mean?</div>
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => {
                  const canonical = suggestion.canonical
                  window.location.href = `/property-listing/?q=${encodeURIComponent(canonical)}&locality=${encodeURIComponent(canonical)}`
                }}
                className={`w-full text-left px-3 py-2 rounded-lg border ${DESIGN_TOKENS.colors.border.default} ${DESIGN_TOKENS.effects.hover} transition-colors`}
              >
                <div className={`font-medium ${DESIGN_TOKENS.colors.text.primary}`}>{suggestion.canonical}</div>
                <div className={`text-xs ${DESIGN_TOKENS.colors.text.muted}`}>Match: {(suggestion.similarity * 100).toFixed(0)}%</div>
              </button>
            ))}
          </div>
        )}
        
        {canonicalLocality && (
          <div className={`rounded-lg border ${DESIGN_TOKENS.effects.border.amberClass} ${DESIGN_TOKENS.colors.background.card} p-3`}>
            <div className={`text-xs ${DESIGN_TOKENS.colors.text.accent} font-medium mb-1`}>Matched Locality:</div>
            <div className={`text-sm ${DESIGN_TOKENS.colors.text.primary} font-semibold`}>{canonicalLocality}</div>
          </div>
        )}
        
        <p className={`text-xs ${DESIGN_TOKENS.colors.text.muted}`}>Tamil-first voice search (Chennai). We set recognition language to ta-IN. You can refine the query after transcription.</p>
        </GlassCard>
      </SectionWrapper>
    </PageWrapper>
  )
}
