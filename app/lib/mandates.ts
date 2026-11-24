/**
 * Tharaga — live mandate portfolio.
 *
 * Single source of truth for every project shown on tharaga.in.
 * Rules for editing:
 *  - Prices are NEVER published. Pricing is shared only on enquiry.
 *  - Only state facts confirmed by the owner / mandate. Lifestyle copy is framing, not a claim.
 *  - All enquiries route to the managing desk: +91 88709 80839.
 *  - Stock photographs are labelled "Representative image" on property pages. Real site
 *    media (video, field photographs, plans) lives in /public/properties/<slug>/.
 *  - Survey numbers are never published: plans are cropped or blurred before upload.
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

/** One item in a property's media gallery. Only real, owner-supplied media goes here. */
export interface MediaItem {
  kind: 'photo' | 'video' | 'plan'
  src: string
  alt: string
  caption: string
  /** Poster frame for videos. */
  poster?: string
  /** Portrait (phone-shot) media is framed differently in the gallery. */
  portrait?: boolean
}

export interface Fact { label: string; value: string }
export interface SpecGroup { title: string; rows: { label: string; value: string; note?: string }[] }
export interface Nearby { place: string; distance: string; note?: string }

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
  /** Real site media from the owner (videos, field photos, plans). */
  media?: MediaItem[]
  /** Confirmed key facts for the property page. Falls back to `stats`. */
  facts?: Fact[]
  /** Technical specification tables (plant & machinery, compliance). */
  specs?: SpecGroup[]
  /** Approximate distances to places buyers know. */
  nearby?: Nearby[]
  /** What a verified buyer receives after the first call. */
  dossier?: string[]
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
    image: u('1508514177221-188b1cf16e9d'),
    imageAlt: 'Utility-scale solar arrays under a clear blue sky',
    facts: [
      { label: 'Plant size', value: '15 MW' },
      { label: 'Available', value: '5 MW' },
      { label: 'Booked', value: '10 MW, industrial clients' },
      { label: 'Commissioning', value: '15 December 2026' },
      { label: 'Agreement', value: '25-year PPA incl. warranty' },
      { label: 'Site', value: 'Shared with verified buyers' },
    ],
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
    media: [
      { kind: 'plan', src: '/properties/courtalam-hill-estates/layout-plan.jpg', alt: 'Estate layout sketch showing individual plots and the internal road', caption: 'Estate layout — every plot reached by the internal road' },
    ],
    facts: [
      { label: 'Plot sizes', value: 'From 21 cents' },
      { label: 'Setting', value: 'Hill-view, Courtalam belt' },
      { label: 'Highway', value: 'Within 1 km of Kollam – Senkottai' },
      { label: 'Hills', value: 'Mekkarai & Gundar, 2–3 km' },
      { label: 'Amenities', value: 'Pools, waterfalls, play area, orchard' },
    ],
    dossier: ['Plot-wise layout with measurements', 'Walkthrough videos of the land', 'Site visit with the desk'],
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
    media: [
      { kind: 'video', src: '/properties/malaipatti-500-acres/site-walk.mp4', poster: '/properties/malaipatti-500-acres/field-horizon.jpg', alt: 'A slow walk across the open land at Malaipatti', caption: 'Site walk — filmed on the land', portrait: true },
      { kind: 'photo', src: '/properties/malaipatti-500-acres/field-palm.jpg', alt: 'Open, level farmland with a lone palmyra palm under a wide sky', caption: 'Level, open ground under a wide sky', portrait: true },
      { kind: 'photo', src: '/properties/malaipatti-500-acres/field-turbines.jpg', alt: 'Cleared land running to a flat horizon', caption: 'Cleared ground to the horizon', portrait: true },
      { kind: 'plan', src: '/properties/malaipatti-500-acres/parcel-plan.jpg', alt: 'Parcel plan of the 500-acre holding with survey numbers blurred', caption: 'Parcel plan — survey numbers withheld until verification' },
    ],
    facts: [
      { label: 'Extent', value: '500 acres' },
      { label: 'Village', value: 'Malaipatti' },
      { label: 'District', value: 'Thoothukudi' },
      { label: 'Access', value: 'Road runs through the holding' },
      { label: 'Survey details', value: 'Shared with verified buyers' },
    ],
    dossier: ['Full parcel plan with survey numbers', 'Ownership and title summary', 'Guided site visit'],
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
    facts: [
      { label: 'Extent', value: '464 acres' },
      { label: 'Mapped block', value: '~700 acres' },
      { label: 'Village', value: 'Valukkalotti, Kariyapatti taluk' },
      { label: 'Approach', value: '1 km in via 33-ft Mangammal Salai' },
      { label: 'Rail', value: 'Line runs through the village' },
    ],
    nearby: [
      { place: 'Palavanatham', distance: '2.1 km', note: 'by road' },
      { place: 'Virudhunagar Junction', distance: '6.7 km' },
      { place: 'Aruppukottai', distance: '10.8 km' },
      { place: 'PM MITRA Textile Park', distance: '19.1 km' },
      { place: 'Madurai Airport', distance: '31.2 km' },
      { place: 'Thoothukudi Port', distance: '93 km', note: 'straight line' },
    ],
    dossier: ['Village map, parcel by parcel', 'Satellite view of the block', 'Guided site visit'],
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
    media: [
      { kind: 'plan', src: '/properties/ottapidaram-land/parcel-plan.jpg', alt: 'S. Kumarapuram village map with the mandate parcels highlighted in copper and survey numbers blurred', caption: 'Village map — mandate parcels highlighted, survey numbers withheld' },
    ],
    facts: [
      { label: 'Village', value: 'S. Kumarapuram' },
      { label: 'Taluk', value: 'Ottapidaram' },
      { label: 'District', value: 'Thoothukudi' },
      { label: 'Maps', value: 'Survey-wise, parcel by parcel' },
      { label: 'Extent', value: 'Shared on enquiry' },
    ],
    dossier: ['Survey-wise village maps', 'Land records summary', 'Guided site visit'],
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
    teaser: 'A three-ground south-east corner with two 30-ft frontages and a 19,100 sq.ft building, beside SBOA School.',
    story:
      'A 7,200 sq.ft (three-ground) south-east corner in Anna Nagar West Extension, 60 × 120 ft, with frontage on two 30-foot roads and an existing 19,100 sq.ft building. It sits beside SBOA School & Junior College, close to the Padi 200-ft Road — a mature, well-connected address.',
    stats: ['3 grounds', 'Corner plot', 'Anna Nagar'],
    highlights: ['Three grounds, 60 × 120 ft', 'South-east corner, two 30-ft roads', '19,100 sq.ft existing building', 'Beside SBOA School, near Padi 200-ft Road'],
    idealFor: 'Families building a signature home · Boutique developers',
    plate: { caption: '3 GROUNDS', tone: 'ivory' },
    facts: [
      { label: 'Land', value: '7,200 sq.ft (3 grounds)' },
      { label: 'Built-up', value: '19,100 sq.ft' },
      { label: 'Dimensions', value: '60 × 120 ft' },
      { label: 'Facing', value: 'South-east corner' },
      { label: 'Roads', value: 'Two 30-ft frontages' },
      { label: 'Landmark', value: 'Beside SBOA School & Junior College' },
    ],
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
    stats: ['14.4 acres total', 'Quarry + crusher', 'Karur'],
    highlights: ['6.7 acres quarry land + 7.7 acres crusher land', 'Complete line: jaw, cone, VSI, screens, washing, M-Sand', 'Pollution and quarry licences current', 'Ready to run or transfer'],
    idealFor: 'M-Sand and aggregate producers · Cement and infrastructure companies',
    badge: { kind: 'curated', label: 'Exclusively Curated' },
    acres: 14.4,
    story:
      'A fully operational quarry and crusher plant across 14.4 acres in Karur — 6.7 acres of quarry land and 7.7 acres of crusher land, offered together. The production line runs from jaw crushing through cone crushing, VSI shaping, screening, washing and M-Sand processing, fed by fourteen conveyors. Pollution and quarry licence certificates are current, so the plant is ready to run or transfer.',
    facts: [
      { label: 'Total land', value: '14.4 acres' },
      { label: 'Quarry land', value: '6.7 acres' },
      { label: 'Crusher land', value: '7.7 acres' },
      { label: 'Status', value: 'Fully operational' },
      { label: 'Licences', value: 'Pollution & quarry — current' },
    ],
    specs: [
      {
        title: 'Plant & machinery',
        rows: [
          { label: 'Jaw crusher', value: '42 × 32', note: 'Agarwala' },
          { label: 'Cone crusher', value: '200 TPH', note: 'Propel' },
          { label: 'VSI (vertical shaft impactor)', value: '100 TPH', note: 'Propel' },
          { label: '4-deck screen', value: '20 × 6' },
          { label: 'Washing plant', value: '1 unit' },
          { label: 'M-Sand screen', value: '1 unit' },
          { label: 'Conveyors', value: '14', note: 'production & product' },
        ],
      },
      {
        title: 'Compliance',
        rows: [
          { label: 'Pollution certificate', value: 'Current / valid' },
          { label: 'Quarry licence', value: 'Current / valid' },
        ],
      },
    ],
    dossier: ['Property detail sheet', 'Plant walkthrough videos', 'Licence copies on verification'],
    media: [
      { kind: 'video', src: '/properties/karur-quarry-crusher/crusher-plant.mp4', poster: '/properties/karur-quarry-crusher/crusher-plant.jpg', alt: 'The crusher line with its conveyors and screening towers on the Karur site', caption: 'The crusher line — filmed on site' },
      { kind: 'photo', src: '/properties/karur-quarry-crusher/conveyors.jpg', alt: 'Conveyor belts feeding the VSI and screening units', caption: 'Conveyors feeding the VSI and screens' },
      { kind: 'video', src: '/properties/karur-quarry-crusher/land-walk.mp4', poster: '/properties/karur-quarry-crusher/land-walk.jpg', alt: 'A walk across the open land with hills in the distance', caption: 'Walking the land', portrait: true },
      { kind: 'photo', src: '/properties/karur-quarry-crusher/rock-outcrop.jpg', alt: 'Exposed rock sheet on the quarry land', caption: 'Exposed rock on the quarry land', portrait: true },
    ],
  },
  {
    slug: 'vellore-blue-metal-quarry',
    name: 'Blue Metal Quarry, Anaicut',
    category: 'quarry',
    location: 'Anaicut',
    region: 'Vellore District',
    tagline: 'A working quarry with land to grow into.',
    teaser: 'A blue metal quarry with 35 acres of patta quarry land, 10 acres of commercial land and a running crushing line.',
    story:
      'A working blue metal quarry in Anaicut taluk, about 28 km from Vellore bus stand. It holds a sanctioned 2.5-acre permit valid for five years, with a further 2.5 acres at the final stage of sanction. Behind it sit 35 acres of patta quarry land and 10 acres of commercial land that includes a petrol bunk. A 150 TPH jaw crusher and a 220 TPH cone crusher run on a 500 HP HT service with generator back-up.',
    stats: ['45 acres patta land', 'Jaw 150 · Cone 220 TPH', 'Vellore'],
    highlights: ['2.5-acre sanctioned permit, valid five years', 'Further 2.5 acres at final sanction stage', '35 acres patta quarry land + 10 acres commercial land with petrol bunk', '500 HP HT power with 500 kVA generator back-up'],
    idealFor: 'Aggregate and M-Sand producers · Cement and infrastructure companies',
    badge: { kind: 'curated', label: 'Exclusively Curated' },
    acres: 45,
    media: [
      { kind: 'video', src: '/properties/vellore-blue-metal-quarry/quarry-walk.mp4', poster: '/properties/vellore-blue-metal-quarry/quarry-pit.jpg', alt: 'The quarry pit and the crushing line, filmed walking the site', caption: 'The quarry pit and plant — filmed on site', portrait: true },
      { kind: 'video', src: '/properties/vellore-blue-metal-quarry/crusher.mp4', poster: '/properties/vellore-blue-metal-quarry/crusher.jpg', alt: 'The jaw crusher tower and conveyors', caption: 'Crusher tower and conveyors', portrait: true },
      { kind: 'photo', src: '/properties/vellore-blue-metal-quarry/stockpile.jpg', alt: 'Aggregate stockpiles under the conveyor discharge', caption: 'Aggregate stockpiles', portrait: true },
    ],
    facts: [
      { label: 'Permit', value: '2.5 acres sanctioned, 5-year validity' },
      { label: 'In sanction', value: '2.5 acres, final stage' },
      { label: 'Patta quarry land', value: '35 acres' },
      { label: 'Commercial land', value: '10 acres incl. petrol bunk' },
      { label: 'Distance', value: '28 km from Vellore bus stand' },
    ],
    specs: [
      {
        title: 'Plant & power',
        rows: [
          { label: 'Primary jaw crusher', value: '150 TPH' },
          { label: 'Cone crusher', value: '220 TPH' },
          { label: 'EB HT service', value: '500 HP' },
          { label: 'EB LT service', value: '111 kVA', note: '2 connections' },
          { label: 'Generator', value: '500 kVA', note: '2019 model' },
        ],
      },
      {
        title: 'Equipment on site (per quarry profile)',
        rows: [
          { label: 'Excavators', value: '2', note: 'Tata Hitachi · Komatsu PC 200' },
          { label: 'Rock breakers', value: '2', note: 'ACT 1500 · ACT 1200' },
          { label: 'Loaders', value: '2', note: 'JCB loader · JCB 225' },
          { label: 'Tippers', value: '6', note: 'Tata 2518 · 1618 · 407E · 912E' },
        ],
      },
    ],
    nearby: [{ place: 'Vellore bus stand', distance: '28 km' }],
    dossier: ['Quarry profile and permit details', 'Plant walkthrough videos', 'Guided site visit'],
  },
  {
    slug: 'vengaimandalam-16-acres',
    name: '16-Acre Land, Vengaimandalam',
    category: 'land',
    location: 'Vengaimandalam',
    region: 'Tiruchirappalli District',
    tagline: 'Sixteen green acres in the Cauvery country.',
    teaser: 'Sixteen acres of open, green farmland with mature tree cover in Tiruchirappalli district.',
    story:
      'Sixteen acres of open land at Vengaimandalam in Tiruchirappalli district — level, green fields edged with mature trees and reached by a village road. Large, clean extents like this suit farmhouse estates, agri ventures and long-hold investors looking at the Tiruchirappalli growth belt.',
    stats: ['16 acres', 'Open farmland', 'Tiruchirappalli'],
    highlights: ['16 acres in one location', 'Level, green fields with mature trees', 'Village road access', 'Patta details shared with verified buyers'],
    idealFor: 'Farmhouse and agri ventures · Long-hold land investors',
    badge: { kind: 'scarcity', label: 'New Mandate' },
    acres: 16,
    media: [
      { kind: 'video', src: '/properties/vengaimandalam-16-acres/field-walk.mp4', poster: '/properties/vengaimandalam-16-acres/field-walk.jpg', alt: 'A walk across the green fields of the 16-acre land', caption: 'Walking the fields — filmed on site', portrait: true },
      { kind: 'photo', src: '/properties/vengaimandalam-16-acres/open-field.jpg', alt: 'Open green field framed by a neem tree', caption: 'Open fields under a wide sky' },
      { kind: 'photo', src: '/properties/vengaimandalam-16-acres/shade-tree.jpg', alt: 'Mature shade tree on the land', caption: 'Mature tree cover', portrait: true },
    ],
    facts: [
      { label: 'Extent', value: '16 acres' },
      { label: 'Village', value: 'Vengaimandalam' },
      { label: 'District', value: 'Tiruchirappalli' },
      { label: 'Land', value: 'Open, level farmland' },
      { label: 'Patta & survey', value: 'Shared with verified buyers' },
    ],
    dossier: ['Patta and survey details', 'Location pin and boundary walk', 'Guided site visit'],
  },
  {
    slug: 'kattankulathur-plot',
    name: 'Residential Plot, Kattankulathur',
    category: 'land',
    location: 'Kattankulathur · GST Road',
    region: 'Chennai',
    tagline: 'A clean plot, two minutes off GST Road.',
    teaser: 'A 3,600 sq.ft residential plot behind A2B, Kattankulathur — 200 m from GST Road.',
    story:
      'A 3,600 sq.ft residential plot behind A2B in Kattankulathur, 200 metres from GST Road, inside an established layout. The SRM campus skyline rises just beyond the plot — one of the busiest education and employment corridors on Chennai\'s southern edge.',
    stats: ['3,600 sq.ft', '200 m from GST Road', 'Kattankulathur'],
    highlights: ['3,600 sq.ft (1.5 grounds)', '200 m from GST Road, behind A2B', 'Inside a residential layout with internal roads', 'SRM campus within sight'],
    idealFor: 'Home builders · Rental investors near SRM',
    badge: { kind: 'scarcity', label: 'New Mandate' },
    media: [
      { kind: 'video', src: '/properties/kattankulathur-plot/plot-walk.mp4', poster: '/properties/kattankulathur-plot/plot-walk.jpg', alt: 'The plot with the SRM campus skyline behind it', caption: 'The plot — filmed on site', portrait: true },
      { kind: 'video', src: '/properties/kattankulathur-plot/gst-road.mp4', poster: '/properties/kattankulathur-plot/gst-road.jpg', alt: 'GST Road and the shops at the layout entrance', caption: 'GST Road, 200 m away', portrait: true },
      { kind: 'photo', src: '/properties/kattankulathur-plot/skyline.jpg', alt: 'View across the plot to the city skyline', caption: 'View across the plot', portrait: true },
      { kind: 'plan', src: '/properties/kattankulathur-plot/layout-plan.jpg', alt: 'Layout sketch with the plot highlighted in copper and plot numbers blurred', caption: 'Layout — the plot highlighted, numbers withheld' },
    ],
    facts: [
      { label: 'Plot', value: '3,600 sq.ft (1.5 grounds)' },
      { label: 'Location', value: 'Behind A2B, Kattankulathur' },
      { label: 'GST Road', value: '200 m' },
      { label: 'Use', value: 'Residential' },
    ],
    dossier: ['Layout copy and plot details', 'Title documents on verification', 'Site visit'],
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
    plate: { caption: 'ADYAR', tone: 'navy' },
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

export function getMandate(slug: string) {
  return MANDATES.find(m => m.slug === slug)
}

/** Up to `n` other mandates, same category first. */
export function relatedMandates(m: Mandate, n = 3) {
  const same = MANDATES.filter(x => x.slug !== m.slug && x.category === m.category)
  const rest = MANDATES.filter(x => x.slug !== m.slug && x.category !== m.category && x.featured)
  return [...same, ...rest].slice(0, n)
}

export const hasRealMedia = (m: Mandate) => Boolean(m.media?.some(x => x.kind !== 'plan'))

export const PORTFOLIO_ACRES = Math.round(MANDATES.reduce((s, m) => s + (m.acres || 0), 0))

export function whatsappLink(subject: string) {
  const text = `Hello Tharaga, I would like to know more about: ${subject}`
  return `https://wa.me/${DESK_PHONE_E164}?text=${encodeURIComponent(text)}`
}

export const telLink = `tel:+${DESK_PHONE_E164}`

/** Broad zone for filtering on the portfolio page. */
export type Zone = 'Chennai' | 'Across Tamil Nadu' | 'Location withheld'
export function zoneOf(m: Mandate): Zone {
  if (m.region === 'Chennai') return 'Chennai'
  if (m.category === 'energy') return 'Location withheld'
  return 'Across Tamil Nadu'
}

export function shortlistWhatsappLink(names: string[]) {
  const text = `Hello Tharaga, I would like a private briefing on the following mandates:\n${names
    .map((n, i) => `${i + 1}. ${n}`)
    .join('\n')}`
  return `https://wa.me/${DESK_PHONE_E164}?text=${encodeURIComponent(text)}`
}
