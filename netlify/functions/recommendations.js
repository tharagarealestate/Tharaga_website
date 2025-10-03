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
    const anon = process.env.SUPABASE_ANON_KEY
    if (!url) {
      console.warn('[recs] Missing Supabase URL. Returning empty list.')
      return { statusCode: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders }, body: JSON.stringify({ items: [] }) }
    }

    let data = []
    if (key) {
      // Preferred: service role client
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
      // Budget band filter if provided (~20% tolerance)
      if (body.budget_inr && Number(body.budget_inr) > 0) {
        const b = Number(body.budget_inr)
        const min = Math.round(b * 0.8)
        const max = Math.round(b * 1.2)
        q = q.gte('price_inr', min).lte('price_inr', max)
      }
      // Bedrooms minimum
      if (body.bedrooms_min && Number(body.bedrooms_min) > 0) {
        q = q.gte('bedrooms', Number(body.bedrooms_min))
      }
      // Minimum sqft if present
      if (body.sqft_min && Number(body.sqft_min) > 0) {
        q = q.gte('sqft', Number(body.sqft_min))
      }

      const res = await q
      if (res.error) {
        console.error('[recs] Primary query failed:', res.error?.message || res.error)
        const fb = await supabase
          .from('properties')
          .select('id,title,city,locality,images,bedrooms,bathrooms,price_inr,sqft,listed_at')
          .order('listed_at', { ascending: false })
          .limit(num)
        data = fb.data || []
      } else {
        data = res.data || []
      }
    } else if (anon) {
      // Last-ditch fallback: REST with anon key (subject to RLS)
      try {
        const qs = new URLSearchParams();
        qs.set('select', 'id,title,city,locality,images,bedrooms,bathrooms,price_inr,sqft,listed_at')
        if (body.city) qs.set('city', `eq.${body.city}`)
        if (body.budget_inr && Number(body.budget_inr) > 0) {
          const b = Number(body.budget_inr)
          const min = Math.round(b * 0.8)
          const max = Math.round(b * 1.2)
          qs.set('price_inr', `gte.${min}`) // Note: REST needs two filters; using and=true
          qs.append('price_inr', `lte.${max}`)
          qs.set('and', 'true')
        }
        if (body.bedrooms_min && Number(body.bedrooms_min) > 0) {
          qs.set('bedrooms', `gte.${Number(body.bedrooms_min)}`)
        }
        if (body.sqft_min && Number(body.sqft_min) > 0) {
          qs.set('sqft', `gte.${Number(body.sqft_min)}`)
        }
        const restUrl = `${url}/rest/v1/properties?${qs.toString()}`
        const r = await fetch(restUrl, { headers: { apikey: anon, Authorization: `Bearer ${anon}`, Accept: 'application/json' } })
        if (r.ok) data = await r.json(); else console.warn('[recs] REST anon fallback failed:', r.status)
      } catch (e) { console.warn('[recs] REST anon exception', e?.message || e) }
    } else {
      console.warn('[recs] No service role or anon key available')
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

