import { Metadata } from 'next'
import { SiteFooter, SiteHeader } from '@/components/brand/SiteHeader'

export const metadata: Metadata = {
  description: 'Privacy Policy, Terms of Use and Refund & Fees Policy of Tharaga Estates.',
}

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F3EC] text-[#15213A]">
      <SiteHeader />
      <div className="relative overflow-hidden bg-[#15213A] pt-36 pb-16">
        <p className="relative max-w-7xl mx-auto px-6 sm:px-10 flex items-center gap-4 font-sans text-[10.5px] uppercase tracking-[0.36em] text-[#E6C9A0]">
          <span className="h-px w-10 bg-[#E6C9A0]/70" /> Tharaga Estates · Legal
        </p>
      </div>
      <div className="relative -mt-8">{children}</div>
      <SiteFooter />
    </div>
  )
}
