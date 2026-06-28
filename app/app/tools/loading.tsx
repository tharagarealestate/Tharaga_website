/**
 * Tools page loading skeleton — shown while /tools server-renders.
 * Matches the tools hub layout: sticky tab bar + sidebar + calculator area.
 */
export default function ToolsLoading() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Sticky tab bar skeleton */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-zinc-950/85 border-b border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 py-2">
            <div className="w-10 h-5 rounded bg-white/[0.05] animate-pulse" />
            <div className="w-px h-4 bg-white/[0.06]" />
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div
                  key={i}
                  className="w-16 h-8 rounded-lg bg-white/[0.05] animate-pulse"
                  style={{ animationDelay: `${i * 60}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-20">
        {/* Breadcrumb */}
        <div className="w-48 h-4 rounded bg-white/[0.04] animate-pulse mb-8" />

        <div className="grid lg:grid-cols-[300px_1fr] gap-8">
          {/* Left sidebar skeleton */}
          <div className="space-y-4">
            <div className="w-24 h-6 rounded-full bg-amber-500/10 animate-pulse" />
            <div className="w-40 h-8 rounded-xl bg-white/[0.06] animate-pulse" />
            <div className="w-full h-4 rounded bg-white/[0.04] animate-pulse" />
            <div className="w-4/5 h-4 rounded bg-white/[0.03] animate-pulse" />
            <div className="w-full h-px bg-white/[0.05] my-4" />
            {[1, 2, 3].map(i => (
              <div key={i} className="flex justify-between items-center">
                <div className="w-28 h-3 rounded bg-white/[0.04] animate-pulse" />
                <div className="w-16 h-4 rounded bg-amber-500/10 animate-pulse" />
              </div>
            ))}
          </div>

          {/* Right calculator skeleton */}
          <div className="space-y-4">
            {/* Input fields */}
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-1.5">
                <div className="w-32 h-3 rounded bg-white/[0.04] animate-pulse" />
                <div
                  className="w-full h-11 rounded-xl bg-white/[0.04] border border-white/[0.06] animate-pulse"
                  style={{ animationDelay: `${i * 80}ms` }}
                />
              </div>
            ))}
            {/* CTA */}
            <div className="w-full h-12 rounded-xl bg-amber-500/15 animate-pulse mt-2" />
          </div>
        </div>
      </div>
    </div>
  )
}
