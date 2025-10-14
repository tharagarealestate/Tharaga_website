import { Router } from 'express'
import { generateSeoSummary, analyzeVoiceIntent } from '../services/openai'

export const ai = Router()

ai.post('/ai/summary', async (req, res, next) => {
  try {
    const { title, city, description } = req.body || {}
    const summary = await generateSeoSummary({ title, city, description })
    res.json({ summary })
  } catch (e) { next(e) }
})

ai.post('/ai/intent', async (req, res, next) => {
  try {
    const { transcript } = req.body || {}
    const result = await analyzeVoiceIntent(transcript)
    res.json(result)
  } catch (e) { next(e) }
})

ai.post('/ai/video-script', async (req, res, next) => {
  try {
    const { title, highlights, city } = req.body || {}
    const script = await generateSeoSummary({ title: `${title} video`, city, description: `Create a 60s walkthrough shot list. Highlights: ${highlights || ''}` })
    res.json({ script })
  } catch (e) { next(e) }
})
