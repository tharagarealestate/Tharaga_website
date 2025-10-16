import React from 'react'
import BuilderUploadingIllustration from './illustrations/BuilderUploadingIllustration'
import AIMatchingIllustration from './illustrations/AIMatchingIllustration'
import DealClosedIllustration from './illustrations/DealClosedIllustration'

// Deprecated: legacy static section kept for backward compatibility if imported elsewhere.
export default function HowItWorks() {
  return (
    <section aria-label="Legacy static how it works" style={{ padding: 16 }}>
      <div style={{ color: '#6b7280', fontSize: 14 }}>
        This section has been replaced by the animated onboarding experience.
      </div>
    </section>
  )
}
