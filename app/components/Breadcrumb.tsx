"use client"

import Link from 'next/link'

interface BreadcrumbProps {
  items: Array<{
    label: string
    href?: string
  }>
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-2 text-sm">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {index > 0 && (
              <span className="text-gray-400">/</span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-700 font-medium">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
