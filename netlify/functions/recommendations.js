exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }
  try {
    const body = JSON.parse(event.body || '{}')
    const num = Math.max(1, Math.min(50, Number(body.num_results || 6)))
    const items = Array.from({ length: num }).map((_, i) => ({
      property_id: `DEMO_${i + 1}`,
      title: `Recommended Property #${i + 1}`,
      image_url: `https://picsum.photos/seed/th_${i + 1}/800/600`,
      specs: {
        bedrooms: [1, 2, 3, 4][i % 4],
        bathrooms: [1, 2, 3][i % 3],
        area_sqft: 900 + i * 50,
        location: ['Chennai', 'Coimbatore', 'Madurai', 'Salem'][i % 4],
      },
      reasons: ['Popular in your cohort', 'Matches preferences'],
      score: 0.5 + i * 0.01,
    }))
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) }
  } catch (e) {
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [] }) }
  }
}

