import React from 'react'

export type IllustrationProps = {
  className?: string
  style?: React.CSSProperties
}

// Modern flat-style outline illustration with a single accent color (#1A73E8)
// viewBox 0 0 300 300, responsive width/height
export default function BuilderUploadingIllustration({ className, style }: IllustrationProps) {
  const accent = '#1A73E8'
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
      {/* Ground shadow */}
      <ellipse cx="150" cy="250" rx="90" ry="10" fill="none" stroke={ink} strokeOpacity="0.15" />

      {/* Laptop */}
      <rect x="95" y="150" width="110" height="60" rx="8" fill="none" stroke={ink} strokeWidth="2" />
      <rect x="105" y="160" width="90" height="36" rx="4" fill="none" stroke={accent} strokeWidth="2" />
      <path d="M90 218h120" stroke={ink} strokeWidth="2" />
      <path d="M112 222h76" stroke={ink} strokeWidth="2" />

      {/* Builder avatar seated */}
      <circle cx="150" cy="106" r="18" fill="none" stroke={ink} strokeWidth="2" />
      {/* Helmet */}
      <path d="M135 98c4-10 26-10 30 0" fill="none" stroke={accent} strokeWidth="2" />
      <path d="M132 110h36" stroke={ink} strokeWidth="2" />
      {/* Torso */}
      <path d="M120 145c0-18 14-28 30-28s30 10 30 28" fill="none" stroke={ink} strokeWidth="2" />
      {/* Arms to laptop */}
      <path d="M120 146c10-6 18-10 30-10s20 4 30 10" fill="none" stroke={accent} strokeWidth="2" />
      {/* Seat lines */}
      <path d="M95 200c-6-22 4-40 20-48" fill="none" stroke={ink} strokeWidth="2" />
      <path d="M205 200c6-22-4-40-20-48" fill="none" stroke={ink} strokeWidth="2" />

      {/* Small crane icon above screen */}
      <g transform="translate(210 86)">
        <rect x="-8" y="20" width="16" height="12" rx="2" fill="none" stroke={ink} strokeWidth="2" />
        <path d="M-30 4 L 6 4" stroke={accent} strokeWidth="2" />
        <path d="M-30 4 l 14 10" stroke={ink} strokeWidth="2" />
        <path d="M-16 14 l 10-10" stroke={ink} strokeWidth="2" />
        <path d="M6 4v28" stroke={ink} strokeWidth="2" />
        <circle cx="6" cy="36" r="3" fill="none" stroke={accent} strokeWidth="2" />
      </g>

      {/* Floating icons */}
      {/* 360 camera */}
      <g transform="translate(60 88)">
        <circle cx="20" cy="20" r="16" fill="none" stroke={ink} strokeWidth="2" />
        <circle cx="20" cy="20" r="6" fill="none" stroke={accent} strokeWidth="2" />
        <path d="M6 20h6m16 0h6" stroke={ink} strokeWidth="2" />
        <path d="M20 4v6m0 20v6" stroke={ink} strokeWidth="2" />
      </g>

      {/* Video play button */}
      <g transform="translate(225 135)">
        <rect x="-20" y="-16" width="40" height="32" rx="6" fill="none" stroke={ink} strokeWidth="2" />
        <path d="M-6 -6 l 14 8 l -14 8 z" fill="none" stroke={accent} strokeWidth="2" />
      </g>

      {/* Floor plan icon */}
      <g transform="translate(70 170)">
        <rect x="0" y="0" width="40" height="28" rx="4" fill="none" stroke={ink} strokeWidth="2" />
        <path d="M0 14h20v14" fill="none" stroke={accent} strokeWidth="2" />
        <path d="M20 0v14h20" fill="none" stroke={ink} strokeWidth="2" />
      </g>
    </svg>
  )
}
