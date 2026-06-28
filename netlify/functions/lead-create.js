const { createClient } = require('@supabase/supabase-js')

function json(body, code = 200) {
  return { statusCode: code, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors(), body: '' }
  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405)
  try {
    const { property_id, name, email, phone, message, _hp } = JSON.parse(event.body || '{}')
    // Honeypot
    if (_hp) return { statusCode: 200, headers: corsJson(), body: JSON.stringify({ ok: true }) }
    // Simple rate limit by IP per 60s using in-memory map (best-effort on function cold starts)
    const ip = (event.headers['x-forwarded-for'] || '').split(',')[0] || event.headers['client-ip'] || '0.0.0.0'
    if (!global.__thg_rl) global.__thg_rl = new Map()
    const now = Date.now();
    const last = global.__thg_rl.get(ip) || 0
    if (now - last < 60 * 1000) return { statusCode: 200, headers: corsJson(), body: JSON.stringify({ error: 'Too many requests. Try again shortly.' }) }
    global.__thg_rl.set(ip, now)
    if (!(name || email || phone)) return { statusCode: 400, headers: corsJson(), body: JSON.stringify({ error: 'Provide contact: phone or email' }) }
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const source = (event.headers['origin'] || event.headers['referer'] || '').slice(0, 200)
    const { error } = await supabase.from('leads').insert([{ property_id: property_id || null, name, email, phone, message, source }])
    if (error) {
      // Gracefully degrade if the table is temporarily unavailable (eg. schema cache issue)
      const softErrors = /schema cache|does not exist|relation .* does not exist|table .* not found/i
      if (softErrors.test(error.message || '')) {
        try { await notifySlack({ name, email, phone, message: `(SOFT) ${message}`, source }) } catch(_) {}
        return { statusCode: 200, headers: corsJson(), body: JSON.stringify({ ok: true, soft: true }) }
      }
      return { statusCode: 200, headers: corsJson(), body: JSON.stringify({ error: error.message }) }
    }
    try { await notifySlack({ name, email, phone, message, source }) } catch(_) {}
    return { statusCode: 200, headers: corsJson(), body: JSON.stringify({ ok: true }) }
  } catch (e) {
    return { statusCode: 200, headers: corsJson(), body: JSON.stringify({ error: 'Unexpected' }) }
  }
}

function cors(){ return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } }
function corsJson(){ return { ...cors(), 'Content-Type': 'application/json' } }

async function notifySlack(payload){
  const url = process.env.SLACK_WEBHOOK_URL
  if (!url) return
  const text = `New lead: ${payload.name||'-'} | ${payload.phone||payload.email||'-'}\nSource: ${payload.source||'-'}\nMessage: ${payload.message||'-'}`
  await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text }) })
}

