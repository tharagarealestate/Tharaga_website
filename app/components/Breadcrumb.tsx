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
    <nav aria-label="Breadcrumb" className="container mx-auto px-4 sm:px-6 lg:px-8" style={{
      marginBottom: '24px',
      paddingTop: '20px',
    }}>
      <ol style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        listStyle: 'none',
        margin: 0,
        padding: 0,
        flexWrap: 'wrap',
        maxWidth: '1280px',
      }}>
        {items.map((item, index) => (
          <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {index > 0 && (
              <span style={{
                color: '#94a3b8',
                fontSize: '14px',
                userSelect: 'none',
                fontWeight: 400,
              }}>→</span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                style={{
                  color: '#e5e7eb',
                  textDecoration: 'none',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ffffff'
                  e.currentTarget.style.textDecoration = 'underline'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#e5e7eb'
                  e.currentTarget.style.textDecoration = 'none'
                }}
              >
                {item.label}
              </Link>
            ) : (
              <span style={{
                color: '#e5e7eb',
                fontWeight: 600,
                fontSize: '14px',
                opacity: 0.9,
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
