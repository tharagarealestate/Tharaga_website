"use client"

import { useEffect, useState } from 'react'
import Joyride, { type CallBackProps, STATUS, type Step } from 'react-joyride'
import { trackEvent } from '@/lib/analytics'

const buyerSteps: Step[] = [
  { target: '#search-bar', content: 'Start by searching for properties in your preferred location', placement: 'bottom' },
  { target: '#filter-button', content: 'Use filters to narrow down by budget, BHK, amenities, etc.', placement: 'left' },
  { target: '#ai-recommendations', content: 'Our AI learns your preferences and suggests perfect matches', placement: 'top' },
  { target: '#save-button', content: 'Save properties you like. Compare them side-by-side later!', placement: 'bottom' },
  { target: '#schedule-visit', content: 'Schedule site visits directly. No broker needed!', placement: 'left' },
]

export function BuyerOnboarding() {
  const [run, setRun] = useState(false)
  const [stage, setStage] = useState<1|2|3|4>(1)

  useEffect(() => {
    try {
      const seen = localStorage.getItem('buyer_onboarding_seen') === 'true'
      if (!seen) setTimeout(() => setRun(true), 1500)
    } catch {}

    const onReplay = () => setRun(true)
    const onSaved = () => setStage((s) => (s < 2 ? 2 : s))
    const onScheduled = () => setStage((s) => (s < 3 ? 3 : s))
    window.addEventListener('thg:buyer:showOnboarding', onReplay)
    window.addEventListener('thg:buyer:saved', onSaved)
    window.addEventListener('thg:buyer:schedule-visit', onScheduled)
    return () => {
      window.removeEventListener('thg:buyer:showOnboarding', onReplay)
      window.removeEventListener('thg:buyer:saved', onSaved)
      window.removeEventListener('thg:buyer:schedule-visit', onScheduled)
    }
  }, [])

  function handleCallback(data: CallBackProps) {
    const { status, index, type } = data
    if (type === 'step:after') trackEvent('buyer_onboarding_step', 'engagement', { stepIndex: index })
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false)
      try { localStorage.setItem('buyer_onboarding_seen', 'true') } catch {}
      trackEvent('buyer_onboarding_completed', 'engagement')
    }
  }

  return (
    <Joyride
      run={run}
      steps={
        stage === 1 ? buyerSteps.slice(0, 2) :
        stage === 2 ? buyerSteps.slice(2, 4) :
        stage === 3 ? buyerSteps.slice(4) :
        buyerSteps
      }
      continuous
      showSkipButton
      showProgress
      disableOverlayClose
      styles={{ options: { zIndex: 10000 } }}
      callback={handleCallback}
    />
  )
}
