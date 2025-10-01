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
    if (!url || !key) return { statusCode: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders }, body: JSON.stringify({ items: [] }) }

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

    const { data, error } = await q
    if (error) return { statusCode: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders }, body: JSON.stringify({ items: [] }) }

    const items = (data || []).map(p => ({
      property_id: p.id,
      title: p.title,
      image_url: (p.images && p.images[0]) || 'https://picsum.photos/seed/th/800/600',
      specs: {
        bedrooms: p.bedrooms || null,
        bathrooms: p.bathrooms || null,
        area_sqft: p.sqft || null,
        location: [p.locality, p.city].filter(Boolean).join(', ')
      },
      reasons: ['Newly listed', 'Matches your area'],
      score: 0.6
    }))

    return { statusCode: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders }, body: JSON.stringify({ items }) }
  } catch (e) {
    return { statusCode: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders }, body: JSON.stringify({ items: [] }) }
  }
}

