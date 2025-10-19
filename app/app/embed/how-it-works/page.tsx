import dynamic from 'next/dynamic'

// Client animated section for embeddable usage
const HowItWorksAnimatedSection = dynamic(
  () => import('../../../components/AnimatedHowItWorks/HowItWorksAnimatedSection'),
  { ssr: false }
)

export default function HowItWorksEmbed(){
  return (
    <main className="mx-auto max-w-5xl px-3 py-2 sm:py-3">
      <HowItWorksAnimatedSection compact />
    </main>
  )
}
