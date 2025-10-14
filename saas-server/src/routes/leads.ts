import { Router } from 'express'
import { trackUsage } from '../middleware/usage'
import { query } from '../db'
import { analyzeVoiceIntent } from '../services/openai'

export const leads = Router()

leads.post('/leads', trackUsage('lead', { softLimit: true }), async (req, res, next) => {
  try {
    const orgId = req.user?.orgId || req.user?.id || 'demo'
    const { property_id, name, email, phone, message, voice_transcript } = req.body || {}

    let intent_score: number | null = null
    let intent_label: string | null = null
    let intent_summary: string | null = null

    if (voice_transcript) {
      const a = await analyzeVoiceIntent(voice_transcript)
      intent_score = a.score
      intent_label = a.intent
      intent_summary = a.summary
    }
    // Basic automated scoring for Growth+ when no transcript is provided
    if (!intent_label && typeof message === 'string' && message.trim().length > 0) {
      const m = message.toLowerCase()
      const signals = [
        [/ready|finali[sz]e|this week|book(ing)?/g, 0.85, 'high'],
        [/loan|emi|visit|site|tour/g, 0.65, 'medium'],
        [/info|details|more|interested/g, 0.45, 'medium'],
      ] as const
      let best = { score: 0.35, label: 'low' as 'low'|'medium'|'high' }
      for (const [re, sc, lab] of signals) { if (re.test(m)) { best = { score: Math.max(best.score, sc), label: lab } } }
      intent_score = best.score
      intent_label = best.label
      intent_summary = 'Heuristic score from message'
    }

    const { rows } = await query(
      'insert into leads(org_id, property_id, name, email, phone, message, intent_score, intent_label, intent_summary) values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id',
      [orgId, property_id, name, email, phone, message, intent_score, intent_label, intent_summary]
    )

    res.json({ id: rows[0].id, overLimit: !!res.locals.overLimit })
  } catch (e) { next(e) }
})
