'use client'

import { PageWrapper } from '@/components/ui/PageWrapper'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { PremiumButton } from '@/components/ui/premium-button'
import { DESIGN_TOKENS } from '@/lib/design-system'
import Link from 'next/link'
import { Shield, Home, Lock } from 'lucide-react'

export default function UnauthorizedPage(){
  return (
    <PageWrapper>
      <PageHeader
        title="Access Restricted"
        description="Your account does not have the required permissions for this area"
        className="text-center mb-8"
      />

      <SectionWrapper noPadding>
        <GlassCard variant="dark" glow border className="p-12 text-center">
          <div className="flex justify-center mb-6">
            <div className={`w-20 h-20 rounded-full ${DESIGN_TOKENS.colors.background.card} border-2 ${DESIGN_TOKENS.effects.border.amberClass} flex items-center justify-center`}>
              <Lock className="w-10 h-10 text-amber-300" />
            </div>
          </div>
          <h2 className={`${DESIGN_TOKENS.typography.h2} mb-4`}>Unauthorized Access</h2>
          <p className={`${DESIGN_TOKENS.typography.body} mb-8 max-w-md mx-auto`}>
            You need administrator permissions to access this area. Please contact your administrator or sign in with an admin account.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <PremiumButton variant="secondary" size="md" asChild>
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </PremiumButton>
            <PremiumButton variant="gold" size="md" asChild>
              <Link href="/login?next=/admin">
                <Shield className="w-4 h-4 mr-2" />
                Sign in with Admin
              </Link>
            </PremiumButton>
          </div>
        </GlassCard>
      </SectionWrapper>
    </PageWrapper>
  )
}
