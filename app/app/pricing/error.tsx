'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function PricingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Pricing Error]', error?.message)
  }, [error])

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-xl font-black text-zinc-100 mb-2">Pricing failed to load</h1>
        <p className="text-zinc-400 text-sm mb-6">Please refresh to try again.</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold rounded-xl text-sm"
          >
            Retry
          </button>
          <Link href="/" className="px-5 py-2.5 border border-zinc-700 text-zinc-300 rounded-xl text-sm">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}
