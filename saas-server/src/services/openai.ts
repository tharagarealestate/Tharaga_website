import OpenAI from 'openai'
import { config } from '../config'

const client = new OpenAI({ apiKey: config.openaiApiKey })

export async function generateSeoSummary(input: { title: string; city?: string; description: string }): Promise<string> {
  if (!config.openaiApiKey) return `${input.title} — ${input.city || ''}`.trim()
  const sys = 'You are a real-estate marketing copywriter for India. Produce a crisp, SEO-friendly 2 sentence summary with emojis avoided.'
  const user = `Title: ${input.title}\nCity: ${input.city || ''}\nDescription: ${input.description}`
  const resp = await client.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role:'system', content: sys }, { role:'user', content: user }], temperature: 0.4 })
  return resp.choices[0]?.message?.content?.trim() || input.description.slice(0, 160)
}

export async function analyzeVoiceIntent(transcript: string): Promise<{ intent: 'high'|'medium'|'low'; score: number; summary: string }>{
  if (!config.openaiApiKey) return { intent: 'medium', score: 0.5, summary: transcript.slice(0,200) }
  const sys = 'You score home-buyer intent from voice transcripts. Output a JSON with intent: high|medium|low, score:[0,1], and 1-line summary.'
  const resp = await client.chat.completions.create({ model: 'gpt-4o-mini', messages: [ { role:'system', content: sys }, { role:'user', content: transcript } ], response_format: { type: 'json_object' } })
  try { return JSON.parse(resp.choices[0]?.message?.content || '{}') } catch { return { intent: 'medium', score: 0.5, summary: transcript.slice(0,200) } }
}
