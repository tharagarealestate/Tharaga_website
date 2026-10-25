/**
 * Property listing loading skeleton — AI-world grid layout.
 */
export default function PropertyListingLoading() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Search bar skeleton */}
      <div className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-xl border-b border-white/[0.05] px-4 py-3">
        <div className="max-w-6xl mx-auto flex gap-3 items-center">
          <div className="flex-1 h-11 rounded-xl bg-white/[0.05] animate-pulse" />
          <div className="w-24 h-11 rounded-xl bg-amber-500/15 animate-pulse" />
        </div>
      </div>

      {/* Filter chips */}
      <div className="max-w-6xl mx-auto px-4 py-4 flex gap-2 overflow-hidden">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className="w-20 h-8 rounded-full bg-white/[0.05] animate-pulse flex-shrink-0"
            style={{ animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>

      {/* Property grid */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div className="w-32 h-4 rounded bg-white/[0.04] animate-pulse mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white/[0.03] border border-white/[0.05] overflow-hidden animate-pulse"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="h-48 bg-white/[0.05]" />
              <div className="p-4 space-y-2">
                <div className="w-3/4 h-4 rounded bg-white/[0.06]" />
                <div className="w-1/2 h-3 rounded bg-white/[0.04]" />
                <div className="flex gap-2 mt-3">
                  <div className="w-16 h-5 rounded-full bg-white/[0.04]" />
                  <div className="w-16 h-5 rounded-full bg-white/[0.04]" />
                </div>
                <div className="w-24 h-6 rounded bg-amber-500/10 mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
