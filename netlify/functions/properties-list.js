const { createClient } = require('@supabase/supabase-js')

function json(body, code = 200) {
  return { statusCode: code, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
}

exports.handler = async () => {
  try {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE
    if (!url || !key) {
      console.warn('[properties-list] Missing env SUPABASE_URL or SUPABASE_SERVICE_ROLE')
      return json({ error: 'Supabase env missing', items: [] }, 200)
    }
    const supabase = createClient(url, key)
    let { data, error } = await supabase
      .from('properties')
      .select('id,title,description,city,locality,property_type,bedrooms,bathrooms,price_inr,sqft,images,listed_at,furnished,facing,category,project,builder,is_verified,listing_status,tour_url,rera_id')
      .eq('is_verified', true)
      .or('listing_status.eq.active,listing_status.is.null')
      .order('listed_at', { ascending: false })
      .limit(200)
    if (error) {
      console.error('[properties-list] Primary query failed:', error?.message || error)
      const fb = await supabase
        .from('properties')
        .select('id,title,description,city,locality,property_type,bedrooms,bathrooms,price_inr,sqft,images,listed_at,furnished,facing,category,project,builder,is_verified,listing_status,tour_url,rera_id')
        .order('listed_at', { ascending: false })
        .limit(200)
      data = fb.data || []
    }

    const out = (data || []).map(p => ({
      id: p.id,
      title: p.title,
      project: p.project || '',
      builder: p.builder || '',
      listingStatus: p.is_verified ? 'Verified' : (p.listing_status || ''),
      category: p.category || '',
      type: p.property_type || '',
      bhk: p.bedrooms || null,
      bathrooms: p.bathrooms || null,
      furnished: p.furnished || '',
      carpetAreaSqft: p.sqft || null,
      priceINR: Number(p.price_inr || 0),
      priceDisplay: p.price_inr ? `₹${Math.round(Number(p.price_inr)).toLocaleString('en-IN')}` : 'Price on request',
      pricePerSqftINR: (p.price_inr && p.sqft) ? Math.round(Number(p.price_inr) / Math.max(1, Number(p.sqft))) : null,
      facing: p.facing || '',
      city: p.city || '',
      locality: p.locality || '',
      state: '',
      address: '',
      lat: null,
      lng: null,
      images: Array.isArray(p.images) ? p.images : (typeof p.images === 'string' ? (safeParseArray(p.images)) : []),
      amenities: [],
      rera: p.rera_id || '',
      tourUrl: p.tour_url || '',
      docsLink: '',
      owner: { name: 'Owner', phone: '', whatsapp: '' },
      postedAt: p.listed_at || null,
      summary: p.description || ''
    }))

    return json(out)
  } catch (e) {
    console.error('[properties-list] Unexpected error:', e?.message || e)
    return json({ error: 'Unexpected', items: [] }, 200)
  }
}

function safeParseArray(s) {
  try { const j = JSON.parse(s); return Array.isArray(j) ? j : [] } catch(_) { return [] }
}

