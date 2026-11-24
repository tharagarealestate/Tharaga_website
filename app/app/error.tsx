'use client'

import { useEffect } from 'react'
import { BrandedMessage } from '@/components/brand/BrandedMessage'
import { Button } from '@/components/brand/Button'

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
        <Button variant="outline-light" onClick={reset}>
          Try again
        </Button>
      }
    />
  )
}
