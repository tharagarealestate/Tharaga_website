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
  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405)
  try{
    const { id, name, email, phone, whatsapp } = JSON.parse(event.body || '{}')
    if (!id) return json({ error: 'id required' }, 400)
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE)
    const { error } = await supabase
      .from('builders')
      .update({ name, email, phone, whatsapp })
      .eq('id', id)
    if (error) return json({ error: error.message }, 200)
    return json({ ok:true })
  } catch(e){
    return json({ error: 'Unexpected' }, 200)
  }
}

