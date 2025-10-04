import React from 'react'

export default function Home() {
  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <h1 className="text-2xl font-bold mb-3">Welcome to Tharaga</h1>
      <p className="max-w-xl text-sm text-plum/80 mb-6">
        This is the unified website. Use the links below or Durable can embed
        each section directly using its own route.
      </p>
      <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-brandBlue">
        <a className="hover:underline" href="/about/">About</a>
        <a className="hover:underline" href="/buyer-form/">Buyer Form</a>
        <a className="hover:underline" href="/property-listing/">Properties</a>
        <a className="hover:underline" href="/rating/">Rating</a>
        <a className="hover:underline" href="/reel-grid/">Reels</a>
        <a className="hover:underline" href="/registration/">Registration</a>
        <a className="hover:underline" href="/search-filter-home/">Search Filter</a>
        <a className="hover:underline" href="/Reset_password/">Reset password</a>
        <a className="hover:underline" href="/auth-landing/">auth landing</a>
        <a className="hover:underline" href="/auth-email-landing/">auth email landing</a>
        <a className="hover:underline" href="/snippets/">login/signup</a>
        <a className="hover:underline" href="/app/">AI Recommendations (Next.js)</a>
        <a className="hover:underline" href="/app/saved">Saved</a>
        <a className="hover:underline" href="/app/tours">Tours</a>
        <a className="hover:underline" href="/app/tours/ar-staging">AR Staging</a>
        <a className="hover:underline" href="/app/tools/roi">ROI</a>
        <a className="hover:underline" href="/app/tools/environment">Env</a>
        <a className="hover:underline" href="/app/dashboard/map">Map</a>
        <a className="hover:underline" href="/app/filters/radial">Filters</a>
      </nav>

      <div className="mt-8">
        <a
          href="https://auth.tharaga.co.in/cta-embed"
          target="_blank"
          rel="noopener"
          className="font-semibold text-brandBlue hover:underline"
        >
          https://auth.tharaga.co.in/cta-embed
        </a>
      </div>

      <footer className="mt-8 text-sm text-plum/60">© {new Date().getFullYear()} Tharaga</footer>
    </main>
  )
}

