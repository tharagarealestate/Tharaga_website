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
    <nav aria-label="Breadcrumb" style={{
      marginBottom: '20px',
    }}>
      <ol style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        listStyle: 'none',
        margin: 0,
        padding: 0,
        flexWrap: 'wrap',
      }}>
        {items.map((item, index) => (
          <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {index > 0 && (
              <span style={{ color: '#cbd5e1', fontSize: '13px', userSelect: 'none' }}>/</span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                style={{
                  color: '#64748b',
                  textDecoration: 'none',
                  fontSize: '13px',
                  transition: 'color 0.15s ease',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#0f172a'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
              >
                {item.label}
              </Link>
            ) : (
              <span style={{
                color: '#0f172a',
                fontWeight: 600,
                fontSize: '13px',
              }}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
