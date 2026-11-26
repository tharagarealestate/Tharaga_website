/**
 * Property page loading state — a quiet navy masthead in the house style,
 * so navigating from a card never flashes an off-brand skeleton.
 */
export default function PropertyDetailLoading() {
  return (
    <div className="min-h-screen bg-[#F7F3EC]">
      <div className="relative bg-[#15213A] pb-20 pt-40">
        <div aria-hidden className="pointer-events-none absolute inset-4 border border-[#E6C9A0]/15 sm:inset-6" />
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <div className="h-3 w-40 animate-pulse bg-white/10" />
            <div className="h-12 w-4/5 animate-pulse bg-white/10" />
            <div className="h-12 w-3/5 animate-pulse bg-white/[0.07]" />
            <div className="h-6 w-2/3 animate-pulse bg-[#E6C9A0]/15" />
          </div>
          <div className="aspect-[4/5] w-full animate-pulse bg-white/[0.06] lg:col-span-5" />
        </div>
      </div>
    </div>
  )
}
