/**
 * Land Check — rule-based, transparent feasibility guidance for Tamil Nadu.
 *
 * Everything here is general, verifiable guidance: what must be checked and which
 * approvals typically apply for a use. It never invents scores, reserves, prices or
 * properties. Matches come only from the live portfolio in lib/mandates.ts.
 */
import { MANDATES, zoneOf, type Mandate, type MandateCategory } from './mandates'

export type Use = 'solar' | 'quarry' | 'industrial' | 'commercial' | 'residential' | 'investment'
export type Region = 'chennai' | 'north' | 'west' | 'delta' | 'south' | 'open'
export type Extent = 'lt1' | '1to10' | '10to100' | 'gt100'
export type Stage = 'exploring' | 'buying' | 'own'

export const USES: { id: Use; label: string; hint: string }[] = [
  { id: 'solar', label: 'Solar plant', hint: 'Ground-mounted solar or renewable energy' },
  { id: 'quarry', label: 'Quarry or crusher', hint: 'Blue metal, M-sand, rough stone' },
  { id: 'industrial', label: 'Factory or warehouse', hint: 'Manufacturing, logistics, storage' },
  { id: 'commercial', label: 'Commercial building', hint: 'Offices, retail, hospitality' },
  { id: 'residential', label: 'Homes or plotted layout', hint: 'Villas, apartments, plots for sale' },
  { id: 'investment', label: 'Hold as an investment', hint: 'Buy land for long-term value' },
]

export const REGIONS: { id: Region; label: string; hint: string }[] = [
  { id: 'chennai', label: 'Chennai & suburbs', hint: 'OMR, ECR, GST Road, Sriperumbudur' },
  { id: 'north', label: 'North Tamil Nadu', hint: 'Vellore, Ranipet, Kancheepuram, Chengalpattu' },
  { id: 'west', label: 'West Tamil Nadu', hint: 'Coimbatore, Karur, Hosur, Salem' },
  { id: 'delta', label: 'Central & Delta', hint: 'Tiruchirappalli, Thanjavur, Nagapattinam' },
  { id: 'south', label: 'South Tamil Nadu', hint: 'Madurai, Virudhunagar, Thoothukudi, Tenkasi' },
  { id: 'open', label: 'Not decided yet', hint: 'Show me every option' },
]

export const EXTENTS: { id: Extent; label: string; hint: string }[] = [
  { id: 'lt1', label: 'Under 1 acre', hint: 'Up to about 18 grounds' },
  { id: '1to10', label: '1 – 10 acres', hint: 'A mid-size parcel' },
  { id: '10to100', label: '10 – 100 acres', hint: 'A large holding' },
  { id: 'gt100', label: 'Over 100 acres', hint: 'Industrial or utility scale' },
]

export const STAGES: { id: Stage; label: string; hint: string }[] = [
  { id: 'exploring', label: 'Exploring options', hint: 'Researching what is possible' },
  { id: 'buying', label: 'Ready to buy', hint: 'Within the next three months' },
  { id: 'own', label: 'I own the land', hint: 'I want to know its best use' },
]

/** Checks that apply to every land purchase in Tamil Nadu. */
const COMMON_CHECKS = [
  'Patta, chitta and adangal in the seller’s name, matching the survey numbers',
  'Encumbrance certificate (EC) covering at least the last 30 years',
  'FMB sketch and a physical survey to confirm boundaries and extent',
  'Motorable access road, and its width, on record',
  'Current guideline value for stamp duty and registration',
]

const RULES: Record<Use, { checks: string[]; approvals: string[]; siteStudy: string[] }> = {
  solar: {
    checks: [
      'Contiguous, shadow-free land — ground-mounted plants typically need about 4–5 acres per MW',
      'Distance to the nearest substation and whether it has spare capacity to accept power',
      'Route for the transmission line from the site to the substation',
      'Access for heavy vehicles during construction',
    ],
    approvals: [
      'Land-use classification permitting the project (conversion where the rules require it)',
      'Grid connectivity approval from the state transmission / distribution utility',
      'Electrical safety approval from the Chief Electrical Inspector (CEIG)',
    ],
    siteStudy: ['Solar irradiation and shading study', 'Soil and drainage survey', 'Substation capacity confirmation'],
  },
  quarry: {
    checks: [
      'Whether the land falls in a zone where mining leases can be granted',
      'Distance from habitations, water bodies, highways and protected areas',
      'Haulage road able to carry loaded trucks',
      'Existing lease history and any pending disputes',
    ],
    approvals: [
      'Quarry lease from the Department of Geology and Mining',
      'Approved mining plan',
      'Environmental clearance (SEIAA / MoEFCC, by lease size)',
      'Consent to Establish and Operate from the Tamil Nadu Pollution Control Board (TNPCB)',
    ],
    siteStudy: ['Geological survey of the deposit and its depth', 'Reserve estimation by a qualified geologist'],
  },
  industrial: {
    checks: [
      'Zoning that permits industrial use, or the feasibility of reclassification',
      'Power availability — HT supply and the distance to a feeder or substation',
      'Water source and permissions',
      'Connectivity to national highways, ports or rail',
    ],
    approvals: [
      'Layout and building approval from CMDA / DTCP or the local body',
      'Consent to Establish and Operate from TNPCB',
      'Factory licence (Directorate of Industrial Safety and Health)',
      'Fire safety NOC',
    ],
    siteStudy: ['Soil bearing capacity test', 'Flood and drainage assessment'],
  },
  commercial: {
    checks: [
      'Zoning and the floor space index (FSI) permitted on the plot',
      'Road width in front of the plot — it decides the height and use allowed',
      'Parking requirements for the intended use',
      'Footfall, visibility and anchor tenants nearby',
    ],
    approvals: ['Planning permission and building approval from CMDA / DTCP', 'Fire safety NOC', 'Completion certificate before occupation'],
    siteStudy: ['Market and rental study for the micro-market', 'Structural feasibility for the intended height'],
  },
  residential: {
    checks: [
      'Zoning for residential use, or conversion of agricultural land',
      'Approach road width and its effect on what can be built',
      'Water, power and drainage connections',
      'Demand and price levels in the micro-market',
    ],
    approvals: [
      'Layout or building approval from CMDA / DTCP',
      'Registration with TNRERA for projects above the threshold size',
      'Completion certificate for buildings',
    ],
    siteStudy: ['Soil test', 'Flood-risk check for the locality'],
  },
  investment: {
    checks: [
      'Clear, undisputed title — the single biggest factor in long-term value',
      'Planned infrastructure nearby (metro, highways, industrial corridors)',
      'Land classification and whether conversion would be needed to develop it',
      'Encroachment risk and how the boundary will be secured',
    ],
    approvals: ['None to hold the land — approvals depend on what is later built'],
    siteStudy: ['Physical inspection of the boundary', 'Comparable sales in the village'],
  },
}

const USE_TO_CATEGORY: Record<Use, MandateCategory[]> = {
  solar: ['energy', 'land'],
  quarry: ['quarry'],
  industrial: ['land'],
  commercial: ['commercial', 'land'],
  residential: ['residence', 'land'],
  investment: ['land'],
}

function extentFits(m: Mandate, e: Extent) {
  if (m.acres == null) return true // extent on request — do not exclude
  if (e === 'lt1') return m.acres < 1
  if (e === '1to10') return m.acres >= 1 && m.acres <= 10
  if (e === '10to100') return m.acres > 10 && m.acres <= 100
  return m.acres > 100
}

const REGION_PATTERNS: Record<Exclude<Region, 'open'>, RegExp> = {
  chennai: /^Chennai$/i,
  north: /Vellore|Ranipet|Kancheepuram|Kanchipuram|Chengalpattu|Tiruvallur|Tiruvannamalai/i,
  west: /Karur|Coimbatore|Salem|Hosur|Krishnagiri|Erode|Tiruppur|Namakkal/i,
  delta: /Tiruchirappalli|Trichy|Thanjavur|Nagapattinam|Pudukkottai|Ariyalur/i,
  south: /Thoothukudi|Virudhunagar|Courtalam|Tenkasi|Senkottai|Madurai|Tirunelveli|Kanyakumari|Ramanathapuram|Sivaganga/i,
}

function regionFits(m: Mandate, r: Region) {
  // The solar plant's location is withheld, so it is offered for every region (never placed in one).
  if (r === 'open' || m.category === 'energy') return true
  if (r === 'chennai') return m.region === 'Chennai'
  return REGION_PATTERNS[r].test(`${m.region} ${m.location}`)
}

/** Parcels that must never be presented as suited to a use (e.g. no confirmed grid capacity). */
const EXCLUDE_FOR_USE: Partial<Record<Use, string[]>> = {
  solar: ['malaipatti-500-acres'],
}

export interface LandCheckAnswers {
  use: Use
  region: Region
  extent: Extent
  stage: Stage
}

export function buildReport(a: LandCheckAnswers) {
  const rule = RULES[a.use]
  const cats = USE_TO_CATEGORY[a.use]
  const excluded = new Set(EXCLUDE_FOR_USE[a.use] ?? [])
  const pool = MANDATES.filter(m => cats.includes(m.category) && !excluded.has(m.slug))
  const strong = pool.filter(m => regionFits(m, a.region) && extentFits(m, a.extent))
  const loose = strong.length ? [] : pool.filter(m => regionFits(m, a.region) || extentFits(m, a.extent)).slice(0, 3)
  return {
    checks: [...rule.checks, ...COMMON_CHECKS],
    approvals: rule.approvals,
    siteStudy: rule.siteStudy,
    matches: strong.slice(0, 3),
    nearMatches: loose,
  }
}

export function summaryText(a: LandCheckAnswers, matches: { name: string }[] = []) {
  const f = (list: { id: string; label: string }[], id: string) => list.find(x => x.id === id)?.label
  const lines = [
    'Hello Tharaga, I did the Land Check on tharaga.in.',
    `Use: ${f(USES, a.use)}`,
    `Area: ${f(REGIONS, a.region)}`,
    `Extent: ${f(EXTENTS, a.extent)}`,
    `Stage: ${f(STAGES, a.stage)}`,
  ]
  if (matches.length) lines.push(`Interested in: ${matches.map(m => m.name).join(', ')}`)
  lines.push(a.stage === 'own' ? 'Please help me verify my land and its best use.' : 'Please verify this for a specific parcel.')
  return lines.join('\n')
}
