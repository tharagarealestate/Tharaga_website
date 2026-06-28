const { createClient } = require('@supabase/supabase-js')

exports.handler = async () => {
  try {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return resp({ ok: false, error: 'Supabase env missing' })
    const supabase = createClient(url, key)

    // New properties in last 24h
    const since = new Date(Date.now() - 24*60*60*1000).toISOString()
    const { data: props, error: errP } = await supabase
      .from('properties')
      .select('id,title,city,locality,property_type,price_inr,listed_at')
      .eq('is_verified', true)
      .or('listing_status.eq.active,listing_status.is.null')
      .gte('listed_at', since)
      .order('listed_at', { ascending: false })
      .limit(200)
    if (errP) return resp({ ok:false, error: errP.message })

    // Optional saved searches table (if exists)
    let searches = []
    try {
      const { data } = await supabase.from('saved_searches').select('id,email,query,city,locality,ptype,min_price,max_price').limit(1000)
      searches = data || []
    } catch { /* table may not exist; skip */ }

    // For now, compute simple matches; if RESEND_API_KEY is present, email notifications (one-liner per user)
    const matches = searches.map(s => ({
      search_id: s.id,
      email: s.email,
      count: (props||[]).filter(p => {
        if (s.city && p.city !== s.city) return false
        if (s.locality && p.locality !== s.locality) return false
        if (s.ptype && p.property_type !== s.ptype) return false
        if (s.min_price && Number(p.price_inr||0) < Number(s.min_price)) return false
        if (s.max_price && Number(p.price_inr||0) > Number(s.max_price)) return false
        return true
      }).length
    }))

    // Optional: send emails
    try {
      if (process.env.RESEND_API_KEY && searches.length) {
        const toNotify = searches.filter(s => s.count > 0 && s.email)
        // Minimal notify (batch send); replace with proper template
        await Promise.all(toNotify.slice(0, 100).map(s =>
          fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'Tharaga <notify@tharaga.co.in>',
              to: [s.email],
              subject: `New properties in your saved search (${s.count})`,
              html: `<p>You have ${s.count} new matches in the last 24h.</p><p><a href="https://auth.tharaga.co.in/property-listing/">View listings</a></p>`
            })
          })
        ))
      }
    } catch {}

    return resp({ ok:true, new_props: props?.length||0, searches: matches })
  } catch (e) {
    return resp({ ok:false, error: 'Unexpected' })
  }
}

function resp(body){
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
}

