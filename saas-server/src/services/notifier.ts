import nodemailer from 'nodemailer'
import twilio from 'twilio'
import { config } from '../config'

const mailer = () => nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
})

const smsClient = () => (config.twilio.sid && config.twilio.authToken ? twilio(config.twilio.sid, config.twilio.authToken) : null)

export async function sendEmail(to: string, subject: string, text: string){
  if (!config.smtp.host) return false
  const t = mailer()
  await t.sendMail({ from: config.smtp.from, to, subject, text })
  return true
}

export async function sendSMS(to: string, body: string){
  const c = smsClient()
  if (!c || !config.twilio.from) return false
  await c.messages.create({ to, from: config.twilio.from, body })
  return true
}
