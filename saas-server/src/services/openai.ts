import { config } from '../config'

let _openaiClient: any | null = null
async function getOpenAI() {
  if (!config.openaiApiKey) return null
  if (_openaiClient) return _openaiClient
  const mod: any = await import('openai')
  const OpenAI = mod.default || mod
  _openaiClient = new OpenAI({ apiKey: config.openaiApiKey })
  return _openaiClient
}

export async function generateSeoSummary(input: { title: string; city?: string; description: string }): Promise<string> {
  const client = await getOpenAI()
  const basicFallback = `${input.title} — ${input.city || ''}`.trim()
  if (!client) return basicFallback

  const sys = 'You are a real-estate marketing copywriter for India. Produce a crisp, SEO-friendly 2 sentence summary with emojis avoided.'
  const user = `Title: ${input.title}\nCity: ${input.city || ''}\nDescription: ${input.description}`

  try {
    const resp = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user }
      ],
      temperature: 0.4
    })
    return resp.choices[0]?.message?.content?.trim() || input.description.slice(0, 160)
  } catch (_err) {
    // Resilient fallback to avoid bubbling 500s on property creation
    const desc = (input.description || '').trim()
    if (desc) return `${input.title} — ${desc.slice(0, 120)}`
    return basicFallback
  }
}

export async function analyzeVoiceIntent(transcript: string): Promise<{ intent: 'high'|'medium'|'low'; score: number; summary: string }>{
  const client = await getOpenAI()
  if (!client) return { intent: 'medium', score: 0.5, summary: transcript.slice(0,200) }
  const sys = 'You score home-buyer intent from voice transcripts. Output a JSON with intent: high|medium|low, score:[0,1], and 1-line summary.'
  const resp = await client.chat.completions.create({ model: 'gpt-4o-mini', messages: [ { role:'system', content: sys }, { role:'user', content: transcript } ], response_format: { type: 'json_object' } })
  try { return JSON.parse(resp.choices[0]?.message?.content || '{}') } catch { return { intent: 'medium', score: 0.5, summary: transcript.slice(0,200) } }
}
