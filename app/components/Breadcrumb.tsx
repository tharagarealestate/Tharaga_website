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
                  color: '#3b82f6',
                  textDecoration: 'none',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  fontWeight: 500,
                  textShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#2563eb'
                  e.currentTarget.style.textShadow = '0 0 25px rgba(37, 99, 235, 0.5)'
                  e.currentTarget.style.textDecoration = 'underline'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#3b82f6'
                  e.currentTarget.style.textShadow = '0 0 20px rgba(59, 130, 246, 0.3)'
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
                textShadow: 'none',
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
