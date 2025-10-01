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
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE)
    const since7 = new Date(Date.now() - 7*24*60*60*1000).toISOString()
    const [{ count: newProps }, { count: verified }, { count: leads }] = await Promise.all([
      supabase.from('properties').select('id', { count: 'exact', head: true }).gte('listed_at', since7),
      supabase.from('properties').select('id', { count: 'exact', head: true }).eq('is_verified', true).gte('listed_at', since7),
      supabase.from('leads').select('id', { count: 'exact', head: true }),
    ])
    return json({ ok:true, newProps: newProps||0, verifiedLast7: verified||0, leads: leads||0 })
  } catch(e){
    return json({ ok:false, error: 'Unexpected' })
  }
}

