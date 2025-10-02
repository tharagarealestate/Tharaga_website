const { createClient } = require('@supabase/supabase-js')

function json(body, code = 200) {
  return { statusCode: code, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
}

const { URLSearchParams } = require('url')

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors(), body: '' }
  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405)
  try {
    let payload = {}
    const ctype = (event.headers['content-type'] || '').toLowerCase()
    if (ctype.includes('application/json')) {
      payload = JSON.parse(event.body || '{}')
    } else if (ctype.includes('application/x-www-form-urlencoded')) {
      const params = new URLSearchParams(event.body || '')
      params.forEach((v,k)=> payload[k]=v)
    }
    const { property_id, name, email, phone, message } = payload
    if (!(name || email || phone)) return { statusCode: 400, headers: corsJson(), body: JSON.stringify({ error: 'Missing contact' }) }
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE)
    const { error } = await supabase.from('leads').insert([{ property_id: property_id || null, name, email, phone, message }])
    if (error) return { statusCode: 200, headers: corsJson(), body: JSON.stringify({ error: error.message }) }
    // Optional notify via Resend to admin inbox and builder email if available
    try {
      let builderEmail = null
      if (property_id) {
        const { data: prop } = await supabase
          .from('properties')
          .select('id,builder_id,owner_name,owner_phone,owner_whatsapp')
          .eq('id', property_id)
          .single()
        if (prop?.builder_id) {
          try {
            const { data: b } = await supabase
              .from('builders')
              .select('id,email,phone,whatsapp')
              .eq('id', prop.builder_id)
              .single()
            builderEmail = b?.email || null
          } catch {}
        }
      }
      if (process.env.RESEND_API_KEY && (process.env.LEADS_NOTIFY_EMAIL || builderEmail)) {
        const recipients = [process.env.LEADS_NOTIFY_EMAIL, builderEmail].filter(Boolean)
        if (recipients.length) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'Tharaga <notify@tharaga.co.in>',
              to: recipients,
              subject: `New lead ${property_id ? 'for property ' + property_id : ''}`,
              html: `<p><b>Name:</b> ${name||''}<br/><b>Phone:</b> ${phone||''}<br/><b>Email:</b> ${email||''}<br/><b>Message:</b> ${message||''}</p>`
            })
          })
        }
      }
    } catch {}
    return { statusCode: 200, headers: corsJson(), body: JSON.stringify({ ok: true }) }
  } catch (e) {
    return { statusCode: 200, headers: corsJson(), body: JSON.stringify({ error: 'Unexpected' }) }
  }
}

function cors(){ return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } }
function corsJson(){ return { ...cors(), 'Content-Type': 'application/json' } }

