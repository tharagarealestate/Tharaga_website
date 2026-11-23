/**
 * SurveyPlate — a bespoke, generated "survey plate" used in place of stock photography
 * for land mandates whose exact location is withheld. Each plate is deterministic per
 * mandate: topographic contours, a hatched parcel outline, a graticule, north point and
 * scale bar, in navy and copper. Pure SVG: no network request, no layout shift.
 */

import { useMemo } from 'react'

function rng(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  return () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5
    return ((h >>> 0) % 100000) / 100000
  }
}

function blobPath(cx: number, cy: number, r: number, phase: number[], amp: number) {
  const pts: [number, number][] = []
  const N = 72
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2
    const k =
      1 +
      amp * (0.5 * Math.sin(2 * t + phase[0]) + 0.3 * Math.sin(3 * t + phase[1]) + 0.2 * Math.sin(5 * t + phase[2]))
    pts.push([cx + Math.cos(t) * r * k * 1.25, cy + Math.sin(t) * r * k])
  }
  // Smooth closed path through points (Catmull-Rom → Bézier)
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N], p1 = pts[i], p2 = pts[(i + 1) % N], p3 = pts[(i + 2) % N]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  return d + 'Z'
}

export function SurveyPlate({
  seed,
  label,
  caption,
  tone = 'navy',
}: {
  seed: string
  label: string
  caption?: string
  tone?: 'navy' | 'ivory'
}) {
  const W = 800, H = 1000
  const bg = tone === 'navy' ? '#15213A' : '#EFE8DC'
  const line = tone === 'navy' ? 'rgba(230,201,160,0.30)' : 'rgba(21,33,58,0.22)'
  const strong = tone === 'navy' ? '#D9AE78' : '#94643A'
  const text = tone === 'navy' ? 'rgba(247,243,236,0.72)' : 'rgba(21,33,58,0.7)'

  const art = useMemo(() => {
    const r = rng(seed)
    const hills = Array.from({ length: 2 + Math.floor(r() * 2) }, () => ({
      cx: 120 + r() * 560,
      cy: 160 + r() * 680,
      phase: [r() * 6, r() * 6, r() * 6],
      rings: 7 + Math.floor(r() * 6),
      amp: 0.18 + r() * 0.2,
    }))
    const contours = hills.flatMap(h =>
      Array.from({ length: h.rings }, (_, i) => ({
        d: blobPath(h.cx, h.cy, 26 + i * 34, h.phase.map(p => p + i * 0.22), h.amp),
        major: i % 4 === 3,
      })),
    )
    // Parcel polygon: an irregular cadastral shape near centre
    const pcx = 300 + r() * 200, pcy = 380 + r() * 240
    const n = 6 + Math.floor(r() * 3)
    const parcel = Array.from({ length: n }, (_, i) => {
      const t = (i / n) * Math.PI * 2 + r() * 0.3
      const rad = 120 + r() * 90
      return [pcx + Math.cos(t) * rad * 1.15, pcy + Math.sin(t) * rad] as [number, number]
    })
    return { contours, parcel, pcx, pcy }
  }, [seed])

  const id = `p-${seed.replace(/[^a-z0-9]/gi, '')}`
  const parcelD = 'M' + art.parcel.map(p => p.map(v => v.toFixed(1)).join(',')).join(' L') + 'Z'

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      role="img"
      aria-label={`Survey plate — ${label}`}
    >
      <defs>
        <pattern id={`${id}-hatch`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="10" stroke={strong} strokeWidth="1.2" opacity="0.55" />
        </pattern>
        <radialGradient id={`${id}-vig`} cx="50%" cy="45%" r="75%">
          <stop offset="60%" stopColor={bg} stopOpacity="0" />
          <stop offset="100%" stopColor="#0B1222" stopOpacity={tone === 'navy' ? 0.55 : 0.12} />
        </radialGradient>
      </defs>

      <rect width={W} height={H} fill={bg} />

      {/* Graticule */}
      {Array.from({ length: 9 }, (_, i) => (
        <line key={`v${i}`} x1={i * 100} y1={0} x2={i * 100} y2={H} stroke={line} strokeWidth="0.6" strokeDasharray="2 8" />
      ))}
      {Array.from({ length: 11 }, (_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 100} x2={W} y2={i * 100} stroke={line} strokeWidth="0.6" strokeDasharray="2 8" />
      ))}

      {/* Contours */}
      {art.contours.map((c, i) => (
        <path key={i} d={c.d} fill="none" stroke={line} strokeWidth={c.major ? 1.5 : 0.8} />
      ))}

      {/* Parcel */}
      <path d={parcelD} fill={`url(#${id}-hatch)`} stroke={strong} strokeWidth="2" />
      {art.parcel.map((p, i) => (
        <rect key={i} x={p[0] - 4} y={p[1] - 4} width="8" height="8" fill={bg} stroke={strong} strokeWidth="1.5" transform={`rotate(45 ${p[0]} ${p[1]})`} />
      ))}

      {caption && (
        <text x={art.pcx} y={art.pcy + 8} textAnchor="middle" fontFamily="Cinzel, serif" fontSize="26" letterSpacing="5" fill={strong}
          stroke={bg} strokeWidth="6" paintOrder="stroke">
          {caption}
        </text>
      )}

      {/* North point */}
      <g transform="translate(690 300)">
        <circle r="30" fill="none" stroke={strong} strokeWidth="1" />
        <path d="M0,-24 L7,6 L0,0 L-7,6 Z" fill={strong} />
        <text y="-38" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="16" fill={strong}>N</text>
      </g>

      <rect width={W} height={H} fill={`url(#${id}-vig)`} />
    </svg>
  )
}
