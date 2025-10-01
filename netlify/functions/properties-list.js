const { createClient } = require('@supabase/supabase-js')

function json(body, code = 200) {
  return { statusCode: code, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
}

exports.handler = async () => {
  try {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE
    if (!url || !key) {
      return json({ error: 'Supabase env missing' }, 500)
    }
    const supabase = createClient(url, key)
    const { data, error } = await supabase
      .from('properties')
      .select('id,title,description,city,locality,property_type,bedrooms,bathrooms,price_inr,sqft,images,listed_at,furnished,facing,category,project,builder')
      .eq('is_verified', true)
      .or('listing_status.eq.active,listing_status.is.null')
      .order('listed_at', { ascending: false })
      .limit(200)

    if (error) return json({ error: error.message, items: [] }, 200)

    const out = (data || []).map(p => ({
      id: p.id,
      title: p.title,
      project: p.project || '',
      builder: p.builder || '',
      listingStatus: 'Verified',
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
      images: Array.isArray(p.images) ? p.images : [],
      amenities: [],
      rera: '',
      docsLink: '',
      owner: { name: 'Owner', phone: '', whatsapp: '' },
      postedAt: p.listed_at || null,
      summary: p.description || ''
    }))

    return json(out)
  } catch (e) {
    return json({ error: 'Unexpected', items: [] }, 200)
  }
}

