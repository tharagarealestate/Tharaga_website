import Link from 'next/link'
import { Sparkles } from 'lucide-react'

const footerLinks = {
  Product: [
    { label: 'Property Search', href: '/property-listing' },
    { label: 'Builder Dashboard', href: '/builder' },
    { label: 'Buyer Dashboard', href: '/buyer' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Trial Signup', href: '/trial-signup' },
  ],
  Tools: [
    { label: 'ROI Calculator', href: '/tools/roi' },
    { label: 'EMI Calculator', href: '/tools/emi' },
    { label: 'Budget Planner', href: '/tools/budget-planner' },
    { label: 'Loan Eligibility', href: '/tools/loan-eligibility' },
    { label: 'Property Valuation', href: '/tools/property-valuation' },
    { label: 'Neighborhood Finder', href: '/tools/neighborhood-finder' },
  ],
  Resources: [
    { label: 'About', href: '/about' },
    { label: 'Chennai Market', href: '/chennai/chennai' },
    { label: 'RERA Verification', href: '/tools/verification' },
    { label: 'Help', href: '/help' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Refund Policy', href: '/refund' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="container-page section-gap">
        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-zinc-950" />
              </div>
              <span className="text-lg font-bold font-display text-zinc-100">Tharaga</span>
            </Link>
            <p className="text-sm text-zinc-500 leading-relaxed">
              India&apos;s first AI-powered zero-commission real estate platform.
            </p>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-zinc-300 mb-4">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} Tharaga Real Estate. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              RERA Verified
            </span>
            <span className="text-xs text-zinc-600">Tamil Nadu, India</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
