import type { Metadata } from 'next'
import { LegalDocumentLayout } from '@/components/legal/LegalDocumentLayout'
import { LegalTableOfContents } from '@/components/legal/LegalTableOfContents'
import { TERMS } from '@/lib/legal/content'

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Terms for using tharaga.in — free property listing, sign-in, buyer due diligence and acceptable use.',
  alternates: { canonical: '/terms' },
}

export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <aside className="hidden lg:col-span-1 lg:block">
          <LegalTableOfContents sections={TERMS.sections} />
        </aside>
        <div className="lg:col-span-3">
          <LegalDocumentLayout
            title={TERMS.title}
            lastUpdated={TERMS.last_updated}
            documentType="terms_of_service"
            sections={TERMS.sections}
            metadata={TERMS.metadata}
          />
        </div>
      </div>
    </div>
  )
}
