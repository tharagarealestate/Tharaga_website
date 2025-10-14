import { Router } from 'express'
import { createEvent } from 'ics'

export const calendar = Router()

calendar.post('/calendar/ics', async (req, res, next) => {
  try {
    const { title, startISO, durationMinutes, description, location } = req.body || {}
    const start = new Date(startISO)
    const event = {
      title: title || 'Site visit',
      description: description || '',
      start: [start.getFullYear(), start.getMonth()+1, start.getDate(), start.getHours(), start.getMinutes()],
      duration: { minutes: Number(durationMinutes || 45) },
      location
    } as any
    createEvent(event, (error: any, value: string) => {
      if (error) return next(error)
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
      res.setHeader('Content-Disposition', 'attachment; filename="site-visit.ics"')
      res.send(value)
    })
  } catch (e) { next(e) }
})
