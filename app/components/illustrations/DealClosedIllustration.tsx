import React from 'react'

export type IllustrationProps = {
  className?: string
  style?: React.CSSProperties
}

// Builder and buyer handshake with dashboard chart and phone; accent #10B981
export default function DealClosedIllustration({ className, style }: IllustrationProps) {
  const accent = '#10B981'
  const ink = '#111111'
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 300 300"
      width="100%"
      height="auto"
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="150" cy="254" rx="92" ry="10" fill="none" stroke={ink} strokeOpacity="0.15" />

      {/* Background dashboard */}
      <g transform="translate(70 54)">
        <rect x="0" y="0" width="160" height="90" rx="8" fill="none" stroke={ink} strokeWidth="2" />
        <path d="M10 70 L 52 46 L 86 58 L 120 36 L 148 40" fill="none" stroke={accent} strokeWidth="2" />
        <path d="M10 70h138" stroke={ink} strokeWidth="1" opacity="0.4" />
      </g>

      {/* Phone with notification */}
      <g transform="translate(226 140)">
        <rect x="-18" y="-34" width="36" height="68" rx="6" fill="none" stroke={ink} strokeWidth="2" />
        <rect x="-12" y="-20" width="24" height="34" rx="3" fill="none" stroke={ink} strokeWidth="2" />
        <circle cx="12" cy="-28" r="6" fill="none" stroke={accent} strokeWidth="2" />
      </g>

      {/* Builder avatar (left) */}
      <g transform="translate(84 140)">
        <circle cx="-30" cy="-24" r="14" fill="none" stroke={ink} strokeWidth="2" />
        <path d="M-44 -26c4-10 28-10 32 0" fill="none" stroke={ink} strokeWidth="2" />
        <path d="M-52 4c0-14 12-22 22-22s22 8 22 22" fill="none" stroke={ink} strokeWidth="2" />
      </g>

      {/* Buyer avatar (right) */}
      <g transform="translate(216 140)">
        <circle cx="30" cy="-24" r="14" fill="none" stroke={ink} strokeWidth="2" />
        <path d="M14 -26c4-10 28-10 32 0" fill="none" stroke={ink} strokeWidth="2" />
        <path d="M8 4c0-14 12-22 22-22s22 8 22 22" fill="none" stroke={ink} strokeWidth="2" />
      </g>

      {/* Handshake */}
      <g stroke={accent} strokeWidth="3" fill="none">
        <path d="M110 172 c12 -10 24 -10 40 0" />
        <path d="M150 172 c12 -10 24 -10 40 0" />
        <path d="M150 172 l -10 8 l 20 0 z" fill="none" stroke={accent} />
      </g>

      {/* Arms connecting to handshake */}
      <path d="M84 156 c12 4 20 10 26 16" fill="none" stroke={ink} strokeWidth="2" />
      <path d="M216 156 c-12 4 -20 10 -26 16" fill="none" stroke={ink} strokeWidth="2" />
    </svg>
  )
}
