const { createClient } = require('@supabase/supabase-js')

async function sendWebPush(sub, payload){
  // Placeholder: integrate a webpush service like WebPush or OneSignal
  // Here we just no-op to keep flow consistent
  return { ok: true }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return resp({ error: 'Method not allowed' }, 405)
  try{
    const { title = 'Tharaga', body = 'New matches available', test = false } = JSON.parse(event.body || '{}')
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE)
    const { data } = await supabase.from('push_subscriptions').select('endpoint, keys').limit(test?10:1000)
    const results = await Promise.all((data||[]).map(s => sendWebPush(s, { title, body })))
    return resp({ ok:true, sent: results.length })
  } catch(e){ return resp({ error: 'Unexpected' }) }
}

function resp(body, status=200){ return { statusCode: status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } }
