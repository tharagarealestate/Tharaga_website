/**
 * Root loading skeleton — shown by Next.js while ANY page is server-rendering.
 * Critical for Netlify cold-start: the browser receives this HTML instantly,
 * so users see an animated skeleton instead of a black screen.
 *
 * Design: matches bg-zinc-950 AI-world theme.
 */
export default function RootLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Nav skeleton */}
      <div className="h-14 bg-zinc-950/85 border-b border-white/[0.06] flex items-center px-6 gap-4">
        <div className="w-24 h-5 rounded-md bg-white/[0.06] animate-pulse" />
        <div className="flex-1" />
        <div className="w-20 h-7 rounded-lg bg-white/[0.06] animate-pulse" />
        <div className="w-28 h-7 rounded-lg bg-amber-500/10 animate-pulse" />
      </div>

      {/* Hero skeleton */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 gap-8">
        {/* Badge */}
        <div className="w-48 h-6 rounded-full bg-white/[0.05] animate-pulse" />

        {/* Heading */}
        <div className="flex flex-col items-center gap-3 w-full max-w-2xl">
          <div className="w-full max-w-xl h-10 rounded-xl bg-white/[0.06] animate-pulse" />
          <div className="w-3/4 h-10 rounded-xl bg-white/[0.04] animate-pulse" />
          <div className="w-1/2 h-10 rounded-xl bg-amber-500/[0.08] animate-pulse" />
        </div>

        {/* Subtext */}
        <div className="flex flex-col items-center gap-2 w-full max-w-lg">
          <div className="w-full h-4 rounded-full bg-white/[0.04] animate-pulse" />
          <div className="w-4/5 h-4 rounded-full bg-white/[0.03] animate-pulse" />
        </div>

        {/* Command bar */}
        <div className="w-full max-w-xl h-14 rounded-2xl bg-white/[0.04] border border-white/[0.07] animate-pulse" />

        {/* CTA buttons */}
        <div className="flex gap-3">
          <div className="w-36 h-11 rounded-xl bg-amber-500/20 animate-pulse" />
          <div className="w-32 h-11 rounded-xl bg-white/[0.05] animate-pulse" />
        </div>

        {/* Cards row */}
        <div className="flex gap-4 mt-4 w-full max-w-3xl overflow-hidden">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="flex-1 h-32 rounded-2xl bg-white/[0.03] border border-white/[0.05] animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>

      {/* Floating AI chat skeleton */}
      <div className="fixed bottom-5 right-5 w-14 h-14 rounded-2xl bg-amber-500/20 animate-pulse" />
    </div>
  )
}
