import dynamic from 'next/dynamic'

const HowItWorksAnimatedSection = dynamic(() => import('../components/AnimatedHowItWorks/HowItWorksAnimatedSection'), { ssr: false })

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-4">
      <section className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Tharaga — Premium Real Estate</h1>
        <p className="text-gray-600 mt-2">AI‑powered assistant for builders and buyers.</p>
      </section>
      {/* Place the animated section on homepage */}
      <HowItWorksAnimatedSection compact />
    </main>
  )
}

