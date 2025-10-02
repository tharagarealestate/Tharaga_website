const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  // Basic CORS support for client calls
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' }
  }
  try {
    const body = JSON.parse(event.body || '{}')
    const num = Math.max(1, Math.min(50, Number(body.num_results || 6)))
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE
    if (!url || !key) {
      console.warn('[recs] Missing Supabase env. Returning empty list.')
      return { statusCode: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders }, body: JSON.stringify({ items: [] }) }
    }

    const supabase = createClient(url, key)
    let q = supabase
      .from('properties')
      .select('id,title,city,locality,images,bedrooms,bathrooms,price_inr,sqft,listed_at')
      .eq('is_verified', true)
      .or('listing_status.eq.active,listing_status.is.null')
      .order('listed_at', { ascending: false })
      .limit(num)

    if (body.city) q = q.eq('city', body.city)
    if (body.locality) q = q.eq('locality', body.locality)

    let { data, error } = await q
    if (error) {
      console.error('[recs] Primary query failed:', error?.message || error)
      // Fallback: relax constraints to at least show something
      const fallback = await supabase
        .from('properties')
        .select('id,title,city,locality,images,bedrooms,bathrooms,price_inr,sqft,listed_at')
        .order('listed_at', { ascending: false })
        .limit(num)
      data = fallback.data || []
    }

    const items = (data || []).map(p => {
      let images = []
      if (Array.isArray(p.images)) images = p.images
      else if (typeof p.images === 'string') {
        try { const parsed = JSON.parse(p.images); if (Array.isArray(parsed)) images = parsed } catch(_) {}
      }
      return ({
      property_id: p.id,
      title: p.title,
      image_url: (images[0]) || 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=60',
      specs: {
        bedrooms: p.bedrooms || null,
        bathrooms: p.bathrooms || null,
        area_sqft: p.sqft || null,
        location: [p.locality, p.city].filter(Boolean).join(', ')
      },
      reasons: ['Newly listed', 'Matches your area'],
      score: 0.6
    })})

    return { statusCode: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders }, body: JSON.stringify({ items }) }
  } catch (e) {
    console.error('[recs] Unexpected failure:', e?.message || e)
    return { statusCode: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders }, body: JSON.stringify({ items: [] }) }
  }
}

