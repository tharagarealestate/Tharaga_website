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
    target_buyers: 'Utility-Scale Solar IPPs, Green Hydrogen Developers (NTPC, Adani, ReNew)',
    confidentiality: 'Selective MNC Mandate',
    status: 'Active Syndicate',
    diligence_status: '100% Clear Patta / Technical Grid Audited',
    image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80',
    blueprint_code: 'TN-SOLAR-TUT-150'
  },
  {
    id: 'mandate-quarry-02',
    title: '48-Acre High-Purity Limestone & Mineral Reserve',
    category: 'Mines & Natural Resources',
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
      'Ideal proximity for Tier-1 Cement plants (Chettinad, Dalmia, Ramco)',
      'Direct heavy-haul asphalt road to NH-81 freight corridor'
    ],
    target_buyers: 'MNC Cement Conglomerates (Chettinad Cements, UltraTech, Dalmia Bharat)',
    confidentiality: 'Confidential Blind Mandate',
    status: 'Private Mandate',
    diligence_status: 'Geological Core Survey & TNPCB Clearance Ready',
    image: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=1200&q=80',
    blueprint_code: 'TN-MINERAL-ARY-048'
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
      'Adjacent to Hyundai, Renault-Nissan, and Foxconn industrial supplier clusters',
      '230kV dedicated HT power transformer tap available on-site',
      'Zoned Red/Orange industrial classification with CMDA NOC'
    ],
    target_buyers: 'Global Electronics, EV Giants & Tier-1 Auto Assemblers',
    confidentiality: 'Exclusive Syndicate',
    status: 'Active Syndicate',
    diligence_status: 'Direct Title Verification & Environmental NOC Ready',
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80',
    blueprint_code: 'TN-IND-SRP-085'
  },
  {
    id: 'mandate-logistics-04',
    title: '42-Acre Multimodal Logistics & Grade-A Fulfillment Hub',
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
    target_buyers: 'National 3PL Logistics Operators, E-commerce Giants & Industrial REITs',
    confidentiality: 'Institutional Showcase',
    status: 'Active Syndicate',
    diligence_status: 'Topographical & Soil Bearing Capacity Certified',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
    blueprint_code: 'TN-LOG-HSR-042'
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
      '100% Leased to Fortune 500 US Technology Conglomerate',
      '9-Year Long-term institutional lease with 15% escalation every 3 years',
      'IGBC Platinum Green Building Certified with 100% power backup',
      'Triple-basement parking for 320 cars + Metro Phase 2 station at 250m'
    ],
    target_buyers: 'Commercial REITs, Private Equity Real Estate Funds, Family Offices',
    confidentiality: 'Confidential Blind Mandate',
    status: 'Private Mandate',
    diligence_status: 'Complete Rent-Roll & Title Audit Pack Available Under NDA',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    blueprint_code: 'TN-COM-OMR-140'
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
