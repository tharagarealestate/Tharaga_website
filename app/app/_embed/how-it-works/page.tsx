import dynamic from 'next/dynamic'

const HowItWorksAnimatedSection = dynamic(() => import('../../../components/AnimatedHowItWorks/HowItWorksAnimatedSection'), { ssr: false })

export default function HowItWorksEmbed(){
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <HowItWorksAnimatedSection />
    </main>
  )
}
