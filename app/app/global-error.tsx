'use client'

/**
 * global-error.tsx — catches errors that blow through the root layout itself.
 * Must include its own <html><body> since it replaces the layout.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#09090b', color: '#f4f4f5', fontFamily: 'sans-serif' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '16px',
          padding: '24px',
          textAlign: 'center',
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
          }}>⚠</div>

          <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>
            Something went wrong
          </h1>
          <p style={{ color: '#a1a1aa', fontSize: 14, margin: 0, maxWidth: 360 }}>
            A critical error occurred. Please refresh the page. If this persists,
            contact <a href="mailto:support@tharaga.co.in" style={{ color: '#f59e0b' }}>support@tharaga.co.in</a>
          </p>
          {error?.digest && (
            <p style={{ color: '#52525b', fontSize: 11, fontFamily: 'monospace', margin: 0 }}>
              ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              marginTop: 8,
              padding: '10px 24px',
              background: '#f59e0b',
              color: '#09090b',
              border: 'none',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  )
}
