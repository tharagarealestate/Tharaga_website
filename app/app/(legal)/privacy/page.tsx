import type { Metadata } from 'next'
import { LegalDocumentLayout } from '@/components/legal/LegalDocumentLayout'
import { LegalTableOfContents } from '@/components/legal/LegalTableOfContents'
import { PRIVACY } from '@/lib/legal/content'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Tharaga Estates collects, uses and protects personal data under the Digital Personal Data Protection Act, 2023.',
  alternates: { canonical: '/privacy' },
}

export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <aside className="hidden lg:col-span-1 lg:block">
          <LegalTableOfContents sections={PRIVACY.sections} />
        </aside>
        <div className="lg:col-span-3">
          <LegalDocumentLayout
            title={PRIVACY.title}
            lastUpdated={PRIVACY.last_updated}
            documentType="privacy_policy"
            sections={PRIVACY.sections}
            metadata={PRIVACY.metadata}
          />
        </div>
      </div>
    </div>
  )
}
