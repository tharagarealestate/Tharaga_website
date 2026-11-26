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
  try{
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data, error } = await supabase
      .from('leads')
      .select('id,created_at,property_id,name,email,phone,message')
      .order('created_at', { ascending: false })
      .limit(500)
    if (error) return json({ error: error.message, items: [] }, 200)
    return json({ items: data || [] })
  } catch(e){
    return json({ error: 'Unexpected', items: [] }, 200)
  }
}

