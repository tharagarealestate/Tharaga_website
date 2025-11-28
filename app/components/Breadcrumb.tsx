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
      marginBottom: '24px',
      paddingLeft: '4px',
    }}>
      <ol style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        listStyle: 'none',
        margin: 0,
        padding: 0,
        flexWrap: 'wrap',
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
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#2563eb'
                  e.currentTarget.style.textShadow = '0 0 25px rgba(37, 99, 235, 0.5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#3b82f6'
                  e.currentTarget.style.textShadow = '0 0 20px rgba(59, 130, 246, 0.3)'
                }}
              >
                {item.label}
              </Link>
            ) : (
              <span style={{
                color: '#1e293b',
                fontWeight: 600,
                fontSize: '14px',
                textShadow: '0 0 15px rgba(30, 41, 59, 0.15)',
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
