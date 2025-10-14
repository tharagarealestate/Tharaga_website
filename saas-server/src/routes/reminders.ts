import { Router } from 'express'
import { sendEmail, sendSMS } from '../services/notifier'

export const reminders = Router()

reminders.post('/reminders/visit', async (req, res, next) => {
  try {
    const { email, phone, whenISO, propertyTitle } = req.body || {}
    const when = new Date(whenISO)
    const text = `Reminder: Your site visit for ${propertyTitle || 'the property'} is scheduled at ${when.toLocaleString()}. Reply to reschedule.`
    const okMail = email ? await sendEmail(email, 'Site visit reminder', text) : false
    const okSMS = phone ? await sendSMS(phone, text) : false
    res.json({ emailSent: okMail, smsSent: okSMS })
  } catch (e) { next(e) }
})
