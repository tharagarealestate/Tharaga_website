/**
 * Tharaga — live mandate portfolio.
 *
 * Single source of truth for every project shown on tharaga.in.
 * Rules for editing:
 *  - Prices are NEVER published. Pricing is shared only on enquiry.
 *  - Only state facts confirmed by the owner / mandate. Lifestyle copy is framing, not a claim.
 *  - All enquiries route to the managing desk: +91 88709 80839.
 *  - Images are representative stock photography until project photography is shot.
 */

export const DESK_PHONE_E164 = '918870980839'
export const DESK_PHONE_DISPLAY = '+91 88709 80839'

export type MandateCategory = 'land' | 'energy' | 'quarry' | 'commercial' | 'residence'

export const CATEGORY_LABELS: Record<MandateCategory, string> = {
  land: 'Land Banks',
  energy: 'Solar & Energy',
  quarry: 'Quarries',
  commercial: 'Commercial',
  residence: 'Residences',
}

export type Badge =
  | { kind: 'scarcity'; label: string }   // e.g. "Only 5 MW Remaining", "Limited Release"
  | { kind: 'curated'; label: string }    // e.g. "Exclusively Curated", "By Invitation"

export interface Mandate {
  slug: string
  name: string
  category: MandateCategory
  location: string
  region: string
  /** One-line lifestyle hook shown on the card. */
  tagline: string
  /** Teaser revealed on hover / shown on the card body. */
  teaser: string
  /** Long-form narrative shown in the detail sheet. */
  story: string
  /** Horizontal stat pills (extent, type, status). Never a price. */
  stats: string[]
  highlights: string[]
  idealFor: string
  badge?: Badge
  featured?: boolean
  /** Photograph (representative until project photography is shot). */
  image?: string
  imageAlt?: string
  /**
   * Generated survey plate used instead of a photograph for land whose location is
   * withheld — avoids misleading stock imagery of somewhere else.
   */
  plate?: { caption: string; tone: 'navy' | 'ivory' }
  /** Acreage used for the portfolio total, when known. */
  acres?: number
}

const u = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1800&q=80`

export const MANDATES: Mandate[] = [
  // ── FLAGSHIPS ────────────────────────────────────────────────────
  {
    slug: 'grid-scale-solar-15mw',
    name: '15 MW Grid-Scale Solar Plant',
    category: 'energy',
    location: 'Tamil Nadu',
    region: 'Site disclosed to verified buyers',
    tagline: 'Twenty-five years of sunlight, already spoken for.',
    teaser:
      'Ten megawatts are booked by industrial clients. The final five are being built to the next owner’s load — and switch on together on 15 December.',
    story:
      'A utility-scale solar plant nearing completion in Tamil Nadu, offered to factories that want their own clean power and to investors who want a long, quiet income. Capacity is built to each client’s requirement, panels are chosen from the plant’s bill of materials, and every megawatt commissions on the same day. The exact site is shared only with verified buyers.',
    stats: ['15 MW plant', '5 MW available', 'Commissioning 15 Dec 2026'],
    highlights: [
      '10 MW already booked by Tamil Nadu industrial clients',
      'Remaining capacity built to your consumption requirement',
      'Choose your panels from the plant’s bill of materials',
      'All capacity commissions together on 15 December 2026',
      'PPA structured over 25 years, including warranty',
    ],
    idealFor: 'Manufacturers seeking captive green power · Investors seeking 25-year income',
    badge: { kind: 'scarcity', label: 'Only 5 MW Remaining' },
    featured: true,
    image: u('1509391365360-2e959784a276'),
    imageAlt: 'Rows of solar panels under a clear sky',
  },
  {
    slug: 'courtalam-hill-estates',
    name: 'Courtalam Hill Estates',
    category: 'land',
    location: 'Near Courtalam',
    region: 'Kollam – Senkottai Highway',
    tagline: 'Wake to the sound of your own waterfall.',
    teaser:
      'Hill-view plots a kilometre off the highway, with private waterfalls, pools and orchard planting — in the valley Tamil Nadu escapes to every monsoon.',
    story:
      'A limited release of hill-land plots in the Courtalam belt, within a kilometre of the Kollam – Senkottai highway, with the Mekkarai and Gundar hills two to three kilometres away. The estate is planned around water and green: swimming pools, private waterfalls, a children’s play area and planted fruit and wildlife-friendly trees. Plots begin at 21 cents.',
    stats: ['From 21 cents', 'Hill-view plots', 'Pools & waterfalls'],
    highlights: [
      'Within 1 km of the Kollam – Senkottai highway',
      'Mekkarai and Gundar hills within 2–3 km',
      'Swimming pools and private waterfalls',
      'Play area and planted orchard trees',
      'Minimum holding of 21 cents',
    ],
    idealFor: 'Second-home buyers · Families planning a weekend retreat · Long-term land holders',
    badge: { kind: 'scarcity', label: 'Limited Release' },
    featured: true,
    image: u('1433086966358-54859d0ed716'),
    imageAlt: 'A waterfall falling through dense green forest',
  },
  {
    slug: 'malaipatti-500-acres',
    name: '500-Acre Land Bank, Malaipatti',
    category: 'land',
    location: 'Malaipatti',
    region: 'Thoothukudi District',
    tagline: 'Room for an entire enterprise to take root.',
    teaser:
      'Five hundred acres in one of south Tamil Nadu’s fastest-industrialising districts — scale that rarely comes to market in a single conversation.',
    story:
      'A 500-acre land holding at Malaipatti in Thoothukudi district, offered privately to corporate land-acquisition teams. Large, contiguous extents of this size are seldom available in one transaction; survey details and maps are shared with verified buyers.',
    stats: ['500 acres', 'Large-format land', 'Thoothukudi'],
    highlights: [
      'Single 500-acre holding',
      'Thoothukudi district, south Tamil Nadu',
      'Survey maps shared with verified buyers',
    ],
    idealFor: 'Corporate land-acquisition teams · Industrial and infrastructure developers',
    badge: { kind: 'curated', label: 'By Invitation' },
    featured: true,
    plate: { caption: '500 ACRES', tone: 'navy' },
    acres: 500,
  },

  // ── LAND ─────────────────────────────────────────────────────────
  {
    slug: 'valukkalotti-464-acres',
    name: '464-Acre Contiguous Block, Valukkalotti',
    category: 'land',
    location: 'Valukkalotti, Kariyapatti Taluk',
    region: 'Virudhunagar District',
    tagline: 'A horizon you can put your name on.',
    teaser:
      '464 acres near Palavanatham on the Virudhunagar – Aruppukottai road, reached one kilometre in along the 33-ft Mangammal Salai.',
    story:
      'A 464-acre block within roughly 700 acres mapped at Valukkalotti village, Kariyapatti taluk. It sits near Palavanatham on the Virudhunagar – Aruppukottai road, one kilometre in via the 33-foot Mangammal Salai. Village maps are shared with verified buyers.',
    stats: ['464 acres', 'Within ~700 acres mapped', 'Virudhunagar'],
    highlights: [
      'Near Palavanatham, Virudhunagar – Aruppukottai road',
      '1 km in via 33-ft Mangammal Salai',
      'Part of roughly 700 acres mapped',
    ],
    idealFor: 'Corporate land banks · Industrial parks · Long-horizon investors',
    badge: { kind: 'curated', label: 'Exclusively Curated' },
    plate: { caption: '464 ACRES', tone: 'ivory' },
    acres: 464,
  },
  {
    slug: 'ottapidaram-land',
    name: 'S. Kumarapuram Land Mandate',
    category: 'land',
    location: 'S. Kumarapuram, Ottapidaram',
    region: 'Thoothukudi District',
    tagline: 'Mapped to the survey number. Ready for a serious buyer.',
    teaser:
      'A crores-value land mandate with survey-number village maps prepared — shared only after a buyer is verified.',
    story:
      'A client land mandate at S. Kumarapuram in Ottapidaram taluk, Thoothukudi district. Survey-number-highlighted village maps have been prepared so a serious buyer can assess the holding quickly.',
    stats: ['Extent on request', 'Survey maps ready', 'Thoothukudi'],
    highlights: ['Survey-number-highlighted village maps', 'Ottapidaram taluk, Thoothukudi district'],
    idealFor: 'Industrial buyers · Land investors',
    badge: { kind: 'curated', label: 'By Invitation' },
    plate: { caption: 'S. KUMARAPURAM', tone: 'navy' },
  },
  {
    slug: 'padur-omr-13-acres',
    name: '13-Acre Institutional Land, Padur',
    category: 'land',
    location: 'Padur, OMR',
    region: 'Chennai',
    tagline: 'Thirteen acres on the corridor Chennai keeps building toward.',
    teaser:
      'An institutional land parcel on Old Mahabalipuram Road — the rare large extent left inside the city’s IT spine.',
    story:
      'A 13-acre institutional land parcel at Padur on OMR, presented to leading Chennai developers and institutions. Extents of this size on OMR are increasingly scarce.',
    stats: ['13 acres', 'Institutional', 'OMR, Chennai'],
    highlights: ['13-acre single parcel', 'Padur, on Old Mahabalipuram Road'],
    idealFor: 'Residential developers · Educational and healthcare institutions',
    badge: { kind: 'curated', label: 'Exclusively Curated' },
    plate: { caption: '13 ACRES', tone: 'ivory' },
    acres: 13,
  },
  {
    slug: 'madavaram-11-grounds',
    name: '11 Grounds near Metro Phase 2, Madhavaram',
    category: 'land',
    location: 'Madhavaram',
    region: 'Chennai',
    tagline: 'Where the metro arrives, value follows.',
    teaser: 'An 11-ground development parcel close to Chennai Metro Phase 2.',
    story:
      'An 11-ground land parcel near the Chennai Metro Phase 2 alignment at Madhavaram, suited to a mid-size residential or commercial development.',
    stats: ['11 grounds', 'Development land', 'Near Metro Phase 2'],
    highlights: ['11 grounds', 'Close to Chennai Metro Phase 2'],
    idealFor: 'Developers · Investors tracking metro-led growth',
    plate: { caption: '11 GROUNDS', tone: 'navy' },
  },
  {
    slug: 'anna-nagar-west-corner-plot',
    name: 'Corner Plot, Anna Nagar West Extension',
    category: 'land',
    location: 'Anna Nagar West Extension',
    region: 'Chennai',
    tagline: 'Two frontages in one of Chennai’s most settled addresses.',
    teaser: 'A three-ground corner plot in Anna Nagar West Extension.',
    story: 'A three-ground corner plot in Anna Nagar West Extension — a mature, well-connected residential neighbourhood.',
    stats: ['3 grounds', 'Corner plot', 'Anna Nagar'],
    highlights: ['Three grounds', 'Corner position'],
    idealFor: 'Families building a signature home · Boutique developers',
    plate: { caption: '3 GROUNDS', tone: 'ivory' },
  },
  {
    slug: 'santhome-heritage-parcel',
    name: 'Heritage Land Parcel, Santhome',
    category: 'land',
    location: 'Santhome',
    region: 'Chennai',
    tagline: 'A rare address by the sea and the cathedral.',
    teaser: 'A 2,537 sq.ft land parcel in Santhome’s heritage micro-market.',
    story: 'A 2,537 sq.ft parcel in Santhome, one of Chennai’s oldest and most tightly held neighbourhoods.',
    stats: ['2,537 sq.ft', 'Heritage micro-market', 'Santhome'],
    highlights: ['2,537 sq.ft land', 'Santhome heritage micro-market'],
    idealFor: 'End-users building a city home · Long-term holders',
    plate: { caption: '2,537 SQ.FT', tone: 'navy' },
  },
  {
    slug: 'muttukadu-land',
    name: 'Muttukadu Land Mandate',
    category: 'land',
    location: 'Muttukadu, ECR',
    region: 'Chennai',
    tagline: 'Backwaters on one side, the Bay of Bengal on the other.',
    teaser: 'Land on the East Coast Road at Muttukadu.',
    story: 'A land mandate at Muttukadu on the East Coast Road, Chennai’s coastal leisure corridor.',
    stats: ['Extent on request', 'Coastal', 'ECR'],
    highlights: ['Muttukadu, East Coast Road'],
    idealFor: 'Weekend-home buyers · Hospitality developers',
    image: u('1507525428034-b723cf961d3e'),
    imageAlt: 'Calm sea meeting a sandy shore',
  },
  {
    slug: 'egmore-land',
    name: 'Egmore Land Parcel',
    category: 'land',
    location: 'Egmore',
    region: 'Chennai',
    tagline: 'Central Chennai, at the heart of everything.',
    teaser: 'A land parcel in Egmore, minutes from the city’s rail and civic core.',
    story: 'A land mandate in Egmore, central Chennai.',
    stats: ['Extent on request', 'Central city', 'Egmore'],
    highlights: ['Egmore, central Chennai'],
    idealFor: 'Commercial developers · Institutions',
    plate: { caption: 'EGMORE', tone: 'ivory' },
  },

  // ── QUARRY ───────────────────────────────────────────────────────
  {
    slug: 'karur-quarry-crusher',
    name: 'Quarry & Crusher Plant, Karur',
    category: 'quarry',
    location: 'Karur',
    region: 'Karur District',
    tagline: 'Raw material security, ready to run.',
    teaser: '6.7 acres of quarry land paired with 7.7 acres of crusher land in the Karur belt.',
    story:
      'A quarry and crusher plant in Karur: 6.7 acres of quarry land and 7.7 acres of crusher land, offered together as one integrated asset.',
    stats: ['14.4 acres total', 'Quarry + crusher', 'Karur'],
    highlights: ['6.7 acres quarry land', '7.7 acres crusher land', 'Offered as one asset'],
    idealFor: 'M-Sand and aggregate producers · Cement and infrastructure companies',
    badge: { kind: 'curated', label: 'Exclusively Curated' },
    image: u('1578662996442-48f60103fc96'),
    imageAlt: 'Layered stone of an open quarry',
    acres: 14.4,
  },

  // ── COMMERCIAL ───────────────────────────────────────────────────
  {
    slug: 'adyar-starbucks-anchored',
    name: 'Starbucks-Anchored Commercial Building, Adyar',
    category: 'commercial',
    location: 'Adyar',
    region: 'Chennai',
    tagline: 'An income asset with a name everyone recognises.',
    teaser: 'A commercial building in Adyar anchored by Starbucks.',
    story:
      'A commercial building in Adyar with Starbucks as its anchor — the kind of tenant profile that gives an income asset its quiet confidence.',
    stats: ['Commercial building', 'Starbucks anchor', 'Adyar'],
    highlights: ['Anchored by Starbucks', 'Adyar, south Chennai'],
    idealFor: 'Family offices · HNI investors seeking anchored retail',
    badge: { kind: 'curated', label: 'By Invitation' },
    image: u('1486406146926-c627a92ad1ab'),
    imageAlt: 'A modern commercial building facade',
  },

  // ── RESIDENCES ───────────────────────────────────────────────────
  {
    slug: 'mogappair-8bhk-bungalow',
    name: '8 BHK Bungalow, Mogappair',
    category: 'residence',
    location: 'Mogappair',
    region: 'Chennai',
    tagline: 'Space for every generation under one roof.',
    teaser: 'An eight-bedroom independent bungalow in Mogappair.',
    story: 'An 8 BHK independent bungalow in Mogappair, west Chennai.',
    stats: ['8 BHK', 'Independent bungalow', 'Mogappair'],
    highlights: ['Eight bedrooms', 'Independent house'],
    idealFor: 'Joint families · Buyers wanting a statement home',
    image: u('1600585154340-be6161a56a0c'),
    imageAlt: 'A modern home exterior at dusk',
  },
  {
    slug: 'adyar-3bhk-residence',
    name: '3 BHK Residence, Adyar',
    category: 'residence',
    location: 'Adyar',
    region: 'Chennai',
    tagline: 'Leafy Adyar, close to everything that matters.',
    teaser: 'A three-bedroom apartment in Adyar.',
    story: 'A 3 BHK apartment in Adyar, one of south Chennai’s most sought-after neighbourhoods.',
    stats: ['3 BHK', 'Apartment', 'Adyar'],
    highlights: ['Three bedrooms', 'Adyar, south Chennai'],
    idealFor: 'Families · End-users',
    image: u('1502672260266-1c1ef2d93688'),
    imageAlt: 'A bright, calm apartment living room',
  },
  {
    slug: 'nolambur-3bhk-residence',
    name: '3 BHK Residence, Nolambur',
    category: 'residence',
    location: 'Nolambur',
    region: 'Chennai',
    tagline: 'Quiet streets, quick access to the bypass.',
    teaser: 'A three-bedroom apartment in Nolambur.',
    story: 'A 3 BHK apartment in Nolambur, west Chennai.',
    stats: ['3 BHK', 'Apartment', 'Nolambur'],
    highlights: ['Three bedrooms', 'Nolambur, west Chennai'],
    idealFor: 'Families · First-time buyers',
    image: u('1522708323590-d24dbb6b0267'),
    imageAlt: 'A modern apartment interior',
  },
]

/** Buy-side mandates: assets Tharaga is actively sourcing for its clients. */
export interface AcquisitionBrief {
  slug: string
  title: string
  region: string
  seeking: string
  forWhom: string
}

export const ACQUISITION_BRIEFS: AcquisitionBrief[] = [
  {
    slug: 'msand-blue-metal-quarries',
    title: 'M-Sand & Blue-Metal Quarries',
    region: 'Vellore · Ranipet · Kancheepuram · Karur',
    seeking: 'Operating or leasable quarries for outright acquisition.',
    forWhom: 'A leading Tamil Nadu cement manufacturer',
  },
  {
    slug: 'boulder-stone-thoothukudi',
    title: 'Boulder Stone Quarries',
    region: 'Near Thoothukudi Harbour',
    seeking: 'Quarries able to supply boulder stone in bulk, by weight.',
    forWhom: 'A bulk buyer with a confirmed order',
  },
  {
    slug: 'solar-land-mandsaur-neemuch',
    title: 'Land for Utility-Scale Solar',
    region: 'Mandsaur – Neemuch belt, Madhya Pradesh',
    seeking: 'Large contiguous land parcels to developer specification.',
    forWhom: 'Utility-scale solar power producers',
  },
  {
    slug: 'marriage-halls-chennai',
    title: 'Marriage Halls & Convention Venues',
    region: 'Chennai',
    seeking: 'Established halls open to an outright sale.',
    forWhom: 'A private investor',
  },
]

export const PORTFOLIO_ACRES = Math.round(MANDATES.reduce((s, m) => s + (m.acres || 0), 0))

export function whatsappLink(subject: string) {
  const text = `Hello Tharaga, I would like to know more about: ${subject}`
  return `https://wa.me/${DESK_PHONE_E164}?text=${encodeURIComponent(text)}`
}

export const telLink = `tel:+${DESK_PHONE_E164}`

/** Broad zone for filtering on the portfolio page. */
export type Zone = 'Chennai' | 'South Tamil Nadu' | 'Location withheld'
export function zoneOf(m: Mandate): Zone {
  if (m.region === 'Chennai') return 'Chennai'
  if (m.category === 'energy') return 'Location withheld'
  return 'South Tamil Nadu'
}

export function shortlistWhatsappLink(names: string[]) {
  const text = `Hello Tharaga, I would like a private briefing on the following mandates:\n${names
    .map((n, i) => `${i + 1}. ${n}`)
    .join('\n')}`
  return `https://wa.me/${DESK_PHONE_E164}?text=${encodeURIComponent(text)}`
}
