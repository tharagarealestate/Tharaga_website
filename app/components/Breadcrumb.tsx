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
      padding: '16px 24px',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.85), rgba(248,250,252,0.90))',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(226,232,240,0.6)',
      position: 'sticky',
      top: 0,
      zIndex: 20,
    }}>
      <ol style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        listStyle: 'none',
        margin: 0,
        padding: 0,
        maxWidth: '1100px',
        marginLeft: 'auto',
        marginRight: 'auto',
      }}>
        {items.map((item, index) => (
          <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {index > 0 && (
              <span style={{ color: '#94a3b8', fontSize: '14px' }}>→</span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                style={{
                  color: '#1e40af',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '14px',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                {item.label}
              </Link>
            ) : (
              <span style={{
                color: '#334155',
                fontWeight: 700,
                fontSize: '14px',
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
