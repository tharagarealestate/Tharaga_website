const removeHopByHop = (headers) => {
  const banned = new Set(['host','connection','keep-alive','proxy-authenticate','proxy-authorization','te','trailers','transfer-encoding','upgrade'])
  const out = {}
  for (const [k,v] of Object.entries(headers || {})) {
    if (!banned.has(k.toLowerCase())) out[k] = v
  }
  return out
}

exports.handler = async (event) => {
  try {
    const backend = process.env.BACKEND_URL || 'http://localhost:8000'
    const subpath = event.path.replace('/.netlify/functions/api', '') || ''
    const url = backend.replace(/\/$/, '') + subpath
    const method = event.httpMethod || 'GET'
    const headers = removeHopByHop(event.headers || {})
    const body = ['GET','HEAD'].includes(method.toUpperCase()) ? undefined : event.body
    const res = await fetch(url, { method, headers, body })
    const text = await res.text()
    return { statusCode: res.status, headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' }, body: text }
  } catch (e) {
    return { statusCode: 502, headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ error: 'proxy_failed', message: e?.message || String(e) }) }
  }
}
