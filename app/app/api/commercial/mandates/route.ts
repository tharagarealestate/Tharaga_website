import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase env not configured')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

// Curated institutional portfolio for premier B2B commercial showcase
export const CURATED_COMMERCIAL_MANDATES = [
  {
    id: 'mandate-solar-01',
    title: '150-Acre Grid-Connected Solar Ready Parcel',
    category: 'Solar & Renewable',
    asset_type: 'solar_site',
    corridor: 'Tuticorin – Tirunelveli Green Belt',
    district: 'Tuticorin',
    state: 'Tamil Nadu',
    extent_acres: 150,
    price_display: '₹38 Cr Total Outlay',
    price_per_acre: '₹25.3 L / Acre',
    highlights: [
      'Adjacent to 230/110kV TANGEDCO Substation (1.2 km)',
      'High DNI (Direct Normal Irradiance) 5.8 kWh/m²/day',
      'Contiguous single-patta land bank, zero flood inundation',
      'Immediate CTU/STU open-access evacuation feasibility'
    ],
    target_buyers: 'Utility-Scale Solar IPPs, Green Hydrogen Developers & Clean Energy Funds',
    confidentiality: 'Confidential Placement',
    status: 'Active Advisory',
    diligence_status: '100% Clear Patta / Technical Grid Audited',
    image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80',
    blueprint_code: 'TN-SOLAR-TUT-150',
    substation_detail: '1.2 km to 230/110kV Kayathar Substation (45 MW evacuation clearance feasible)',
    road_frontage_detail: '12m all-weather asphalt link road with direct access to NH-44',
    patta_detail: 'Single Owner Clean Revenue Patta, Zero Encumbrances (30-Year Search Certified)',
    zoning_detail: 'Designated Green Energy / Industrial classification, zero eco-buffer constraints',
    water_infra: 'Two high-yield test borewells on-site (6-inch casing, 450 ft)',
    dossier_summary: 'An exceptional contiguous 150-acre solar land bank situated within Tamil Nadu’s highest solar irradiation corridor. Flat topography, zero rocky outcroppings, and immediate proximity to the 230kV substation make this property ready for rapid balance-of-plant deployment with minimal civil earthworks.'
  },
  {
    id: 'mandate-quarry-02',
    title: '48-Acre High-Purity Limestone & Mineral Reserve',
    category: 'Mines & Quarries',
    asset_type: 'quarry_mineral',
    corridor: 'Ariyalur – Karur Cement Belt',
    district: 'Ariyalur',
    state: 'Tamil Nadu',
    extent_acres: 48,
    price_display: '₹62 Cr Target Consideration',
    price_per_acre: '₹1.29 Cr / Acre (Valued on Proven Reserves)',
    highlights: [
      'Estimated 28 Million Metric Tonnes verified high-grade calcium carbonate',
      'Valid 25-Year Department of Geology & Mining lease',
      'Direct freight access for major cement producers',
      'Heavy-haul asphalt road to NH-81 freight corridor'
    ],
    target_buyers: 'Major Cement Manufacturers & Mineral Processing Conglomerates',
    confidentiality: 'Confidential Placement',
    status: 'Private Mandate',
    diligence_status: 'Geological Core Survey & TNPCB Clearance Ready',
    image: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=1200&q=80',
    blueprint_code: 'TN-MINERAL-ARY-048',
    substation_detail: 'Dedicated 33kV industrial feeder line traversing property boundary',
    road_frontage_detail: 'Heavy-haul multi-axle freight route connecting directly to NH-81 (3.4 km)',
    patta_detail: 'Fully converted revenue title with clear surface rights and approved mineral concession',
    zoning_detail: 'Approved Mining & Extraction Zone with TNPCB Consent to Establish and Operate',
    water_infra: 'Industrial water supply allocation and quarry sump retention capacity',
    dossier_summary: 'High-purity crystalline limestone deposit with over 28 Million Metric Tonnes of verified reserves at 51.5% CaO. Positioned strategically within Tamil Nadu’s central cement corridor, offering captive raw material security for regional clinker manufacturing facilities.'
  },
  {
    id: 'mandate-industrial-03',
    title: '85-Acre Heavy Industrial & Auto Ancillary Park',
    category: 'Industrial Land',
    asset_type: 'industrial_land',
    corridor: 'Sriperumbudur – Oragadam Manufacturing Hub',
    district: 'Kanchipuram',
    state: 'Tamil Nadu',
    extent_acres: 85,
    price_display: '₹145 Cr Total Valuation',
    price_per_acre: '₹1.70 Cr / Acre',
    highlights: [
      'Frontage on 4-Lane NH-48 Expressway (600m commercial frontage)',
      'Adjacent to major automotive and electronics manufacturing clusters',
      '230kV dedicated HT power transformer tap available on-site',
      'Zoned Red/Orange industrial classification with CMDA NOC'
    ],
    target_buyers: 'Global Electronics, EV Assemblers & Large-Scale Manufacturing Enterprises',
    confidentiality: 'Exclusive Advisory',
    status: 'Active Advisory',
    diligence_status: 'Direct Title Verification & Environmental NOC Ready',
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80',
    blueprint_code: 'TN-IND-SRP-085',
    substation_detail: '230kV dedicated HT power transformer tap available on property boundary',
    road_frontage_detail: '600-meter direct frontage on 4-lane NH-48 corridor with deceleration lanes',
    patta_detail: 'Contiguous single-patta institutional holding, 100% encumbrance-free',
    zoning_detail: 'CMDA Masterplan Approved Industrial Red/Orange Category Classification',
    water_infra: 'SIPCOT piped industrial treated water corridor adjacent + high ground water table',
    dossier_summary: 'Prime large-extent industrial parcel located in South India’s premier manufacturing corridor. Featuring exceptional NH-48 road frontage and heavy industrial zoning, this asset is pre-cleared for heavy machinery assembly, EV powertrain facilities, or global supplier campuses.'
  },
  {
    id: 'mandate-logistics-04',
    title: '42-Acre Multimodal Logistics & Fulfillment Hub',
    category: 'Logistics & Warehousing',
    asset_type: 'warehousing_logistics',
    corridor: 'Hosur – Bengaluru Border Logistics Corridor',
    district: 'Krishnagiri',
    state: 'Tamil Nadu',
    extent_acres: 42,
    price_display: '₹75 Cr Consideration',
    price_per_acre: '₹1.78 Cr / Acre',
    highlights: [
      'Direct railway freight siding linkage within 3 km',
      'Engineered for 800,000 sq.ft PEB high-bay warehouse footprint',
      'Immediate access to NH-44 connecting Bengaluru & Chennai ports',
      'High ground-water yield and dual-source industrial power feeders'
    ],
    target_buyers: 'National 3PL Operators, E-commerce Logistics & Industrial Real Estate Funds',
    confidentiality: 'Active Advisory',
    status: 'Active Advisory',
    diligence_status: 'Topographical & Soil Bearing Capacity Certified',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
    blueprint_code: 'TN-LOG-HSR-042',
    substation_detail: 'Dual 11kV dedicated industrial express feeders from Bagalur Substation',
    road_frontage_detail: '30-meter wide arterial access road directly into NH-44 cloverleaf',
    patta_detail: 'Clean commercial conversion with validated FMB sketches and survey boundaries',
    zoning_detail: 'Logistics, Warehousing & Cold Chain designated statutory zoning',
    water_infra: 'Dual rainwater harvesting reservoirs + municipal bulk line connection',
    dossier_summary: 'Engineered specifically for institutional distribution and multimodal fulfillment. Level grading with soil-bearing capacity exceeding 25 T/m², allowing for rapid PEB erection with zero structural piling requirement.'
  },
  {
    id: 'mandate-commercial-05',
    title: '140,000 sq.ft Grade-A Commercial IT Campus',
    category: 'Commercial Asset',
    asset_type: 'commercial_office',
    corridor: 'OMR – Guindy Innovation Spine',
    district: 'Chennai',
    state: 'Tamil Nadu',
    extent_acres: 3.2,
    price_display: '₹115 Cr Valuation',
    price_per_acre: 'High Cap Rate (8.8% Net Yield)',
    highlights: [
      '100% Leased to Fortune 500 Technology Conglomerate',
      '9-Year Long-term institutional lease with 15% escalation every 3 years',
      'IGBC Platinum Green Building Certified with 100% power backup',
      'Triple-basement parking for 320 cars + Metro Phase 2 station at 250m'
    ],
    target_buyers: 'Commercial REITs, Private Equity Real Estate Funds, Family Offices',
    confidentiality: 'Confidential Placement',
    status: 'Private Mandate',
    diligence_status: 'Complete Rent-Roll & Title Audit Pack Available Under NDA',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    blueprint_code: 'TN-COM-OMR-140',
    substation_detail: 'Dual independent 33kV dedicated power ring feeds with automatic bus coupler',
    road_frontage_detail: '6-Lane Old Mahabalipuram Road (OMR) frontage with separate ingress/egress',
    patta_detail: '100% Freehold clear patta with DTCP / CMDA Completion Certificate & Occupancy Certificate',
    zoning_detail: 'Commercial IT / ITES Institutional Mixed Use Zone',
    water_infra: 'CMWSSB water connection + on-site 200 KLD tertiary Sewage Treatment Plant',
    dossier_summary: 'Prime income-generating institutional asset on Chennai’s premier IT corridor. Fully fitted out to global corporate standards with high-efficiency floor plates, LEED Platinum sustainability benchmarks, and long-term locked-in cash flows.'
  }
]

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')
    const email = searchParams.get('email')
    const category = searchParams.get('category')

    let userMandates: any[] = []

    // Fetch user submissions from Supabase if authenticated
    if (userId || email) {
      try {
        const supabase = getServiceSupabase()
        let query = supabase
          .from('properties')
          .select('id, title, description, property_type, city, locality, price_inr, plot_area, verification_status, listing_status, property_metadata, created_at')
          .order('created_at', { ascending: false })

        if (userId) {
          query = query.eq('property_metadata->seller->>user_id', userId)
        } else if (email) {
          query = query.ilike('property_metadata->seller->>email', email)
        }

        const { data, error } = await query
        if (!error && data) {
          userMandates = data.map(item => {
            const meta = item.property_metadata || {}
            return {
              id: item.id,
              title: item.title,
              category: item.property_type || 'Commercial Asset',
              district: item.city,
              corridor: item.locality,
              extent_acres: meta.extent_acres || (item.plot_area ? (item.plot_area / 43560).toFixed(1) : '—'),
              price_display: item.price_inr ? `₹${(item.price_inr / 10000000).toFixed(2)} Cr` : 'Under Technical Review',
              verification_status: item.verification_status || 'in_review',
              listing_status: item.listing_status || 'in_progress',
              tracking_stage: meta.tracking_stage || 'confidential_underwriting',
              tracking_stage_title: meta.tracking_stage_title || 'Confidential Technical Underwriting',
              tracking_stage_description: meta.tracking_stage_description || 'Our desk is auditing clear patta and coordinating with registered MNC buyers.',
              tracking_history: meta.tracking_history || [
                { stage: 'mandate_received', label: 'Commercial Mandate Submitted & Encrypted', timestamp: item.created_at, status: 'completed' },
                { stage: 'confidential_underwriting', label: 'Technical Underwriting & Title Due Diligence', timestamp: item.created_at, status: 'active' },
                { stage: 'buyer_matching', label: 'Private MNC Buyer Matching (Chettinad, Renewables, PE)', timestamp: null, status: 'pending' },
              ],
              target_offtakers: meta.claude_analysis?.target_offtakers || ['MNC Industrial Offtakers', 'Infrastructure Funds'],
              created_at: item.created_at
            }
          })
        }
      } catch (dbErr: any) {
        console.warn('Could not fetch user mandates from DB:', dbErr.message)
      }
    }

    // Filter curated portfolio by category if requested
    let showcase = CURATED_COMMERCIAL_MANDATES
    if (category && category !== 'all') {
      showcase = showcase.filter(m => m.category.toLowerCase().includes(category.toLowerCase()) || m.asset_type.toLowerCase() === category.toLowerCase())
    }

    return NextResponse.json({
      success: true,
      showcase,
      user_mandates: userMandates,
      authenticated: Boolean(userId || email)
    })
  } catch (err: any) {
    console.error('Commercial mandates GET error:', err)
    return NextResponse.json({ success: false, showcase: CURATED_COMMERCIAL_MANDATES, user_mandates: [] })
  }
}
