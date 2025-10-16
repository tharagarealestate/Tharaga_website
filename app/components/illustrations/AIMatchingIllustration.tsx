import React from 'react'

export type IllustrationProps = {
  className?: string
  style?: React.CSSProperties
}

// Builder viewing AI brain with matched buyers; accent #FF6B35
export default function AIMatchingIllustration({ className, style }: IllustrationProps) {
  const accent = '#FF6B35'
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
      {/* Ground */}
      <ellipse cx="150" cy="254" rx="92" ry="10" fill="none" stroke={ink} strokeOpacity="0.15" />

      {/* Builder standing */}
      <circle cx="84" cy="98" r="16" fill="none" stroke={ink} strokeWidth="2" />
      <path d="M70 130c0-16 14-24 28-24s28 8 28 24" fill="none" stroke={ink} strokeWidth="2" />
      {/* Helmet hint */}
      <path d="M70 96c4-10 28-10 32 0" fill="none" stroke={accent} strokeWidth="2" />
      {/* Body */}
      <path d="M84 150v44" stroke={ink} strokeWidth="2" />
      <path d="M72 194h24" stroke={ink} strokeWidth="2" />

      {/* AI brain (neural network outline) */}
      <g transform="translate(180 110)">
        <path d="M-30 0c-10 4-18 14-18 26s8 22 18 26c6 10 18 16 30 16s24-6 30-16c10-4 18-14 18-26s-8-22-18-26c-6-10-18-16-30-16s-24 6-30 16z" fill="none" stroke={ink} strokeWidth="2" />
        {/* Nodes */}
        <circle cx="-18" cy="10" r="3" fill="none" stroke={accent} strokeWidth="2" />
        <circle cx="0" cy="-6" r="3" fill="none" stroke={accent} strokeWidth="2" />
        <circle cx="18" cy="10" r="3" fill="none" stroke={accent} strokeWidth="2" />
        <circle cx="0" cy="22" r="3" fill="none" stroke={accent} strokeWidth="2" />
        {/* Connections */}
        <path d="M-18 10L0 -6L18 10L0 22Z" fill="none" stroke={accent} strokeWidth="2" />
        <path d="M-18 10L0 22" fill="none" stroke={accent} strokeWidth="2" />
        <path d="M0 -6L0 22" fill="none" stroke={accent} strokeWidth="2" />
      </g>

      {/* Buyers connected with lines */}
      {[
        { x: 200, y: 56 },
        { x: 248, y: 80 },
        { x: 224, y: 26 },
      ].map((b, i) => (
        <g key={i} transform={`translate(${b.x} ${b.y})`}>
          {/* silhouette */}
          <circle cx="0" cy="0" r="10" fill="none" stroke={ink} strokeWidth="2" />
          <path d="M-12 16c0-8 8-12 12-12s12 4 12 12" fill="none" stroke={ink} strokeWidth="2" />
          {/* checkmark badge */}
          <g transform="translate(12 -10)">
            <circle cx="0" cy="0" r="6" fill="none" stroke={accent} strokeWidth="2" />
            <path d="M-2 0 l2 2 l4-4" fill="none" stroke={accent} strokeWidth="2" />
          </g>
        </g>
      ))}

      {/* Connector lines to brain center */}
      <g stroke={accent} strokeWidth="2" fill="none">
        <path d="M200 56 C205 80 210 98 210 110" />
        <path d="M248 80 C240 98 230 110 222 120" />
        <path d="M224 26 C218 60 214 86 210 104" />
      </g>
    </svg>
  )
}
