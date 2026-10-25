'use client'

import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Dashboard Error Boundary]', error?.message, error?.digest)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
          <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-zinc-100 mb-2">Dashboard error</h2>
        <p className="text-zinc-400 text-sm mb-5 leading-relaxed">
          Something went wrong loading this section. Your data is safe.
        </p>
        {error?.digest && (
          <p className="text-zinc-600 text-xs font-mono mb-4">ID: {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold rounded-lg text-sm transition-colors"
          >
            Retry
          </button>
          <button
            onClick={() => window.location.href = '/builder'}
            className="px-4 py-2 border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 rounded-lg text-sm transition-colors"
          >
            Reload Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
