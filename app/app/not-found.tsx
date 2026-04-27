import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950 to-black" />
        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(251,191,36,1) 1px,transparent 1px),' +
              'linear-gradient(90deg,rgba(251,191,36,1) 1px,transparent 1px)',
            backgroundSize: '72px 72px',
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px]"
          style={{ background: 'radial-gradient(ellipse,rgba(251,191,36,0.05) 0%,transparent 65%)' }} />
      </div>

      <div className="relative text-center max-w-lg">
        {/* 404 number */}
        <div
          className="text-[120px] sm:text-[160px] font-black leading-none mb-2 select-none"
          style={{
            background: 'linear-gradient(135deg, rgba(251,191,36,0.9) 0%, rgba(251,191,36,0.3) 60%, transparent 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          404
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 mb-3">
          Page not found
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base mb-10 leading-relaxed max-w-sm mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            Back to Tharaga
          </Link>
          <Link
            href="/property-listing"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 rounded-xl text-sm transition-all font-medium"
          >
            Browse Properties
          </Link>
        </div>

        {/* Quick links */}
        <div className="mt-12 pt-8 border-t border-zinc-800/60">
          <p className="text-xs text-zinc-600 mb-4 uppercase tracking-wider font-medium">Quick links</p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { href: '/property-listing', label: 'Properties' },
              { href: '/pricing', label: 'Pricing' },
              { href: '/tools', label: 'Tools' },
              { href: '/builder', label: 'Builder Login' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-zinc-500 hover:text-amber-400 transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
