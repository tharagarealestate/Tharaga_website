const { createClient } = require('@supabase/supabase-js')

function json(body, code = 200) {
  return { statusCode: code, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
}

function isAuthorized(event){
  const hdr = event.headers['x-admin-token'] || event.headers['X-Admin-Token']
  return hdr && process.env.ADMIN_TOKEN && hdr === process.env.ADMIN_TOKEN
}

exports.handler = async (event) => {
  if (!isAuthorized(event)) return json({ error: 'Unauthorized' }, 401)
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return json({ error: 'Supabase env missing' }, 500)

  const supabase = createClient(url, key)
  const onlyUnverified = (event.queryStringParameters?.unverified || '1') === '1'
  let q = supabase
    .from('properties')
    .select('id,title,city,locality,listed_at,is_verified,listing_status,builder_id')
    .order('listed_at', { ascending: false })
    .limit(200)
  if (onlyUnverified) q = q.eq('is_verified', false)

  const { data, error } = await q
  if (error) return json({ error: error.message, items: [] }, 200)
  return json({ items: data || [] })
}

