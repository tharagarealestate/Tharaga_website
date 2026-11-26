import type { Metadata } from 'next'
import { LegalDocumentLayout } from '@/components/legal/LegalDocumentLayout'
import { LegalTableOfContents } from '@/components/legal/LegalTableOfContents'
import { REFUND_POLICY } from '@/lib/legal/content'

export const metadata: Metadata = {
  title: 'Refund & Fees Policy',
  description: 'Listing a property with Tharaga Estates is free. No fees for owners or buyers, and no payments are taken on tharaga.in.',
  alternates: { canonical: '/refund' },
}

export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <aside className="hidden lg:col-span-1 lg:block">
          <LegalTableOfContents sections={REFUND_POLICY.sections} />
        </aside>
        <div className="lg:col-span-3">
          <LegalDocumentLayout
            title={REFUND_POLICY.title}
            lastUpdated={REFUND_POLICY.last_updated}
            documentType="refund_policy"
            sections={REFUND_POLICY.sections}
            metadata={REFUND_POLICY.metadata}
          />
        </div>
      </div>
    </div>
  )
}
