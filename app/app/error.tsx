'use client'

import { useEffect } from 'react'
import { BrandedMessage } from '@/components/brand/BrandedMessage'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Tharaga Error Boundary]', error?.message, error?.digest)
  }, [error])

  return (
    <BrandedMessage
      numeral="—"
      title="A brief pause"
      italic="on our side."
      body="Something did not load as it should. Please try again — or speak to the desk directly."
      action={
        <button
          onClick={reset}
          className="font-sans text-[10.5px] uppercase tracking-[0.3em] text-[#F7F3EC] border-b border-[#D9AE78] pb-1"
        >
          Try again
        </button>
      }
    />
  )
}
