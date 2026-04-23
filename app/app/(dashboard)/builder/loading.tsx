/**
 * Builder dashboard loading skeleton.
 * Shown while the server-side layout + auth check runs on Netlify.
 * Prevents the "Dashboard failed to load" flash on cold starts.
 */
export default function BuilderLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Sidebar skeleton */}
      <div className="hidden lg:flex flex-col w-60 border-r border-white/[0.06] p-4 gap-3 shrink-0">
        {/* Logo */}
        <div className="w-28 h-8 rounded-lg bg-amber-500/10 animate-pulse mb-4" />
        {/* Nav items */}
        {[1, 2, 3, 4, 5, 6, 7].map(i => (
          <div
            key={i}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
          >
            <div className="w-4 h-4 rounded bg-white/[0.06] animate-pulse" />
            <div
              className="h-3 rounded bg-white/[0.05] animate-pulse"
              style={{ width: `${60 + i * 8}px`, animationDelay: `${i * 60}ms` }}
            />
          </div>
        ))}
        <div className="flex-1" />
        {/* Profile */}
        <div className="flex items-center gap-3 px-3 py-2 border-t border-white/[0.05] pt-4">
          <div className="w-8 h-8 rounded-full bg-amber-500/15 animate-pulse" />
          <div className="space-y-1">
            <div className="w-24 h-3 rounded bg-white/[0.06] animate-pulse" />
            <div className="w-32 h-2.5 rounded bg-white/[0.04] animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="h-14 border-b border-white/[0.06] flex items-center px-6 gap-4">
          <div className="lg:hidden w-8 h-8 rounded-lg bg-white/[0.05] animate-pulse" />
          <div className="w-40 h-5 rounded bg-white/[0.05] animate-pulse" />
          <div className="flex-1" />
          <div className="w-8 h-8 rounded-full bg-amber-500/10 animate-pulse" />
        </div>

        {/* Dashboard content */}
        <div className="flex-1 p-6 space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-white/[0.03] border border-white/[0.05] animate-pulse"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>

          {/* Main section */}
          <div className="grid lg:grid-cols-[1fr_320px] gap-6">
            <div className="h-80 rounded-2xl bg-white/[0.03] border border-white/[0.05] animate-pulse" />
            <div className="h-80 rounded-2xl bg-white/[0.03] border border-white/[0.05] animate-pulse" style={{ animationDelay: '120ms' }} />
          </div>

          {/* Table skeleton */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.05] overflow-hidden">
            <div className="h-12 border-b border-white/[0.05] px-4 flex items-center gap-4">
              <div className="w-24 h-4 rounded bg-white/[0.06] animate-pulse" />
              <div className="flex-1" />
              <div className="w-20 h-7 rounded-lg bg-amber-500/10 animate-pulse" />
            </div>
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className="h-14 border-b border-white/[0.04] px-4 flex items-center gap-4"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="w-8 h-8 rounded-full bg-white/[0.05] animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="w-36 h-3 rounded bg-white/[0.05] animate-pulse" />
                  <div className="w-24 h-2.5 rounded bg-white/[0.04] animate-pulse" />
                </div>
                <div className="w-16 h-5 rounded-full bg-white/[0.04] animate-pulse" />
                <div className="w-20 h-4 rounded bg-amber-500/[0.08] animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
