const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return resp({ error: 'Method not allowed' }, 405)
  try{
    const { endpoint, keys, user } = JSON.parse(event.body || '{}')
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) return resp({ error: 'Invalid subscription' }, 400)
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE)
    await supabase.from('push_subscriptions').upsert({ endpoint, keys, user: user||null }, { onConflict: 'endpoint' })
    return resp({ ok:true })
  } catch(e){ return resp({ error: 'Unexpected' }) }
}

function resp(body, status=200){ return { statusCode: status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } }
