/**
 * Pricing page loading skeleton.
 */
export default function PricingLoading() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Nav */}
      <div className="h-14 border-b border-white/[0.06] flex items-center px-6 gap-4">
        <div className="w-24 h-5 rounded-md bg-white/[0.06] animate-pulse" />
        <div className="flex-1" />
        <div className="w-20 h-7 rounded-lg bg-white/[0.06] animate-pulse" />
      </div>

      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 pt-20 pb-12 text-center space-y-4">
        <div className="w-40 h-6 rounded-full bg-amber-500/10 animate-pulse mx-auto" />
        <div className="w-72 h-10 rounded-xl bg-white/[0.06] animate-pulse mx-auto" />
        <div className="w-80 h-4 rounded bg-white/[0.04] animate-pulse mx-auto" />
      </div>

      {/* Pricing card */}
      <div className="max-w-lg mx-auto px-4 pb-20">
        <div className="w-full h-[520px] rounded-2xl bg-white/[0.04] border border-amber-500/20 animate-pulse" />
      </div>
    </div>
  )
}
