'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[]
  className?: string
}

/* Label map — turns URL segments into readable names */
const segmentLabels: Record<string, string> = {
  builder: 'Builder Dashboard',
  buyer: 'Buyer Dashboard',
  admin: 'Admin',
  properties: 'Properties',
  leads: 'Leads',
  analytics: 'Analytics',
  revenue: 'Revenue',
  messaging: 'Messaging',
  integrations: 'Integrations',
  settings: 'Settings',
  billing: 'Billing',
  subscription: 'Subscription',
  trial: 'Trial',
  tools: 'Tools',
  roi: 'ROI Calculator',
  emi: 'EMI Calculator',
  'budget-planner': 'Budget Planner',
  'loan-eligibility': 'Loan Eligibility',
  'neighborhood-finder': 'Neighborhood Finder',
  'property-valuation': 'Property Valuation',
  verification: 'RERA Verification',
  'currency-risk': 'Currency Risk',
  vastu: 'Vastu',
  pricing: 'Pricing',
  about: 'About',
  help: 'Help',
  'property-listing': 'Properties',
  'trial-signup': 'Trial Signup',
  onboard: 'Onboarding',
  performance: 'Performance',
  pipeline: 'Pipeline',
  'smartscore': 'SmartScore',
  'rera-compliance': 'RERA Compliance',
  distribution: 'Distribution',
}

/**
 * Breadcrumb — Supabase-style navigation hierarchy
 *
 * Usage:
 *   <Breadcrumb />                           — auto-generated from URL
 *   <Breadcrumb items={[{label:'X',href:'/'}]} />  — manual items
 */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const pathname = usePathname()

  /* Build crumbs automatically if none provided */
  const crumbs: BreadcrumbItem[] = items || (() => {
    const segments = pathname
      .split('/')
      .filter(Boolean)
      .filter((s) => s !== '(dashboard)' && s !== '(auth)')

    const result: BreadcrumbItem[] = []
    let cumulativePath = ''

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      cumulativePath += `/${segment}`
      const isLast = i === segments.length - 1
      result.push({
        label: segmentLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
        href: isLast ? undefined : cumulativePath,
      })
    }
    return result
  })()

  if (crumbs.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1 text-sm', className)}>
      {/* Home icon */}
      <Link
        href="/"
        className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors rounded"
        aria-label="Home"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>

      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight className="w-3 h-3 text-zinc-600" />
          {crumb.href ? (
            <Link
              href={crumb.href}
              className="text-zinc-500 hover:text-zinc-300 transition-colors truncate max-w-[160px]"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="text-zinc-300 font-medium truncate max-w-[200px]">
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}
