exports.handler = async (event) => {
  try {
    const backend = process.env.BACKEND_URL || 'http://localhost:8000'
    const url = backend.replace(/\/$/, '') + '/api/recommendations'
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: event.body || '{}' })
    const text = await res.text()
    return { statusCode: res.status, headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' }, body: text }
  } catch (e) {
    // Fallback: minimal response shape
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [] }) }
  }
}
