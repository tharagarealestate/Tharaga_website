'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

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
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(ellipse,rgba(239,68,68,0.06) 0%,transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(ellipse,rgba(251,191,36,0.04) 0%,transparent 70%)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative text-center max-w-md w-full"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
          className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6"
        >
          <svg className="w-9 h-9 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </motion.div>

        {/* Title */}
        <h1 className="text-2xl font-black text-zinc-100 mb-2">Something went wrong</h1>
        <p className="text-zinc-400 text-sm mb-2 leading-relaxed">
          An unexpected error occurred. Your data is safe and no action was lost.
        </p>
        {error?.digest && (
          <p className="text-zinc-600 text-xs font-mono mb-6">Error ID: {error.digest}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-center mt-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={reset}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold rounded-xl text-sm transition-colors shadow-lg shadow-amber-500/20"
          >
            Try Again
          </motion.button>
          <Link
            href="/"
            className="px-5 py-2.5 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 rounded-xl text-sm transition-colors font-medium"
          >
            Go Home
          </Link>
        </div>

        {/* Support link */}
        <p className="text-zinc-600 text-xs mt-6">
          Persistent issue?{' '}
          <a href="mailto:support@tharaga.co.in" className="text-amber-500/70 hover:text-amber-400 transition-colors">
            Contact support
          </a>
        </p>
      </motion.div>
    </div>
  )
}
