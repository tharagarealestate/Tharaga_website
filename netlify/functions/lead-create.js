const { createClient } = require('@supabase/supabase-js')

function json(body, code = 200) {
  return { statusCode: code, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors(), body: '' }
  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405)
  try {
    const { property_id, name, email, phone, message } = JSON.parse(event.body || '{}')
    if (!(name || email || phone)) return { statusCode: 400, headers: corsJson(), body: JSON.stringify({ error: 'Provide contact: phone or email' }) }
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE)
    const { error } = await supabase.from('leads').insert([{ property_id: property_id || null, name, email, phone, message }])
    if (error) return { statusCode: 200, headers: corsJson(), body: JSON.stringify({ error: error.message }) }
    return { statusCode: 200, headers: corsJson(), body: JSON.stringify({ ok: true }) }
  } catch (e) {
    return { statusCode: 200, headers: corsJson(), body: JSON.stringify({ error: 'Unexpected' }) }
  }
}

function cors(){ return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } }
function corsJson(){ return { ...cors(), 'Content-Type': 'application/json' } }

