/**
 * Property detail page loading skeleton.
 * Shown while ISR regenerates the property page.
 */
export default function PropertyDetailLoading() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Back nav */}
      <div className="h-14 border-b border-white/[0.06] flex items-center px-6 gap-3">
        <div className="w-6 h-6 rounded bg-white/[0.06] animate-pulse" />
        <div className="w-32 h-4 rounded bg-white/[0.05] animate-pulse" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          {/* Main content */}
          <div className="space-y-6">
            {/* Image gallery */}
            <div className="rounded-2xl overflow-hidden bg-white/[0.04] aspect-video animate-pulse" />

            {/* Title block */}
            <div className="space-y-3">
              <div className="w-3/4 h-8 rounded-xl bg-white/[0.06] animate-pulse" />
              <div className="w-1/2 h-5 rounded bg-white/[0.04] animate-pulse" />
            </div>

            {/* Spec chips */}
            <div className="flex gap-3 flex-wrap">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-20 h-8 rounded-xl bg-white/[0.05] animate-pulse" />
              ))}
            </div>

            {/* Description */}
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div
                  key={i}
                  className="h-3 rounded bg-white/[0.04] animate-pulse"
                  style={{ width: `${70 + i * 5}%`, animationDelay: `${i * 40}ms` }}
                />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="h-64 rounded-2xl bg-white/[0.04] border border-amber-500/10 animate-pulse" />
            <div className="h-40 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
