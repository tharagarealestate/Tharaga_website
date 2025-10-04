exports.handler = async (event) => {
  try{
    const qs = event.queryStringParameters || {}
    const lat = parseFloat(qs.lat || '0')
    const lng = parseFloat(qs.lng || '0')

    // Mock integrations: replace with real AQI/flood APIs
    const aqi = Math.max(10, Math.min(300, Math.round(50 + (lat+lng) % 200)))
    const floodRisk = (lat && lng) ? Math.abs(((lat*lng) % 1)) : 0.2
    const climateScore = Math.max(0, 100 - (aqi/3) - floodRisk*30)

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ aqi, floodRisk, climateScore }) }
  } catch(e){
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Unexpected' }) }
  }
}
