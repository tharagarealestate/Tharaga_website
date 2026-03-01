import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// Use Node.js runtime for resend and @react-email/render compatibility
export const runtime = 'nodejs'

/**
 * API Route to send weekly newsletter to all active subscribers
 * This endpoint will be called by a cron job weekly
 */
export async function GET(req: NextRequest) {
  // Vercel cron uses GET
  return handleSendWeekly(req)
}

export async function POST(req: NextRequest) {
  // Manual triggers use POST
  return handleSendWeekly(req)
}

async function handleSendWeekly(req: NextRequest) {
  try {
    // Verify this is an authorized request
    const authHeader = req.headers.get('authorization')
    const apiKey = process.env.NEWSLETTER_AUTOMATION_API_KEY
    
    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
    if (!url || !key) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabase = createClient(url, key)
    const resend = new Resend(process.env.RESEND_API_KEY)

    // Get all active subscribers
    const { data: subscribers, error: subscribersError } = await supabase
      .from('newsletter_subscribers')
      .select('email, id')
      .eq('status', 'active')

    if (subscribersError || !subscribers) {
      return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 })
    }

    // Get unsent insights from the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: insights, error: insightsError } = await supabase
      .from('newsletter_insights')
      .select('*')
      .is('sent_at', null)
      .gte('processed_at', sevenDaysAgo.toISOString())
      .order('processed_at', { ascending: false })
      .limit(10)

    if (insightsError) {
      return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 })
    }

    if (!insights || insights.length === 0) {
      return NextResponse.json({ 
        ok: true, 
        message: 'No new insights to send',
        subscribers: subscribers.length 
      })
    }

    // Generate newsletter content
    const newsletterContent = generateNewsletterHTML(insights)
    const newsletterText = generateNewsletterText(insights)
    const subject = `Chennai Real Estate Weekly Update - ${new Date().toLocaleDateString('en-IN', { month: 'long', day: 'numeric' })}`

    // Create campaign record
    const { data: campaign, error: campaignError } = await supabase
      .from('newsletter_campaigns')
      .insert({
        subject,
        content_html: newsletterContent,
        content_text: newsletterText,
        insight_ids: insights.map(i => i.id),
        sent_count: 0,
        opened_count: 0,
        clicked_count: 0
      })
      .select()
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
    }

    // Send emails to subscribers
    let sentCount = 0
    let errorCount = 0

    for (const subscriber of subscribers) {
      try {
        const { error: emailError } = await resend.emails.send({
          from: 'Tharaga <newsletter@tharaga.co.in>',
          to: subscriber.email,
          subject,
          html: newsletterContent,
          text: newsletterText
        })

        if (!emailError) {
          sentCount++
          
          // Update subscriber's last_email_sent_at
          await supabase
            .from('newsletter_subscribers')
            .update({ last_email_sent_at: new Date().toISOString() })
            .eq('id', subscriber.id)

          // Update insights as sent
          await supabase
            .from('newsletter_insights')
            .update({ sent_at: new Date().toISOString() })
            .in('id', insights.map(i => i.id))
        } else {
          errorCount++
          console.error(`Failed to send email to ${subscriber.email}:`, emailError)
        }
      } catch (error: any) {
        errorCount++
        console.error(`Error sending email to ${subscriber.email}:`, error.message)
      }
    }

    // Update campaign with sent count
    await supabase
      .from('newsletter_campaigns')
      .update({ sent_count: sentCount, sent_at: new Date().toISOString() })
      .eq('id', campaign.id)

    return NextResponse.json({
      ok: true,
      campaign_id: campaign.id,
      subscribers: subscribers.length,
      sent: sentCount,
      errors: errorCount,
      insights_count: insights.length
    })
  } catch (e: any) {
    console.error('[Send Weekly Newsletter] Error:', e)
    return NextResponse.json(
      { error: e?.message || 'Unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * Generate HTML content for newsletter
 */
function generateNewsletterHTML(insights: any[]): string {
  const insightsHTML = insights.map(insight => `
    <div style="margin-bottom: 30px; padding: 20px; background: #f9f9f9; border-radius: 8px;">
      <h3 style="color: #1a1a1a; margin-top: 0;">${insight.title}</h3>
      <p style="color: #666; line-height: 1.6;">${insight.summary || insight.content.substring(0, 200) + '...'}</p>
      <p style="font-size: 12px; color: #999; margin-bottom: 0;">
        Source: <a href="${insight.source_url}" style="color: #f59e0b;">Read more</a> | 
        Category: ${insight.category || 'General'}
      </p>
    </div>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Chennai Real Estate Weekly Update</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #f59e0b; font-size: 32px; margin-bottom: 10px;">Tharaga</h1>
        <p style="color: #666; font-size: 16px;">Chennai Real Estate Weekly Update</p>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #1a1a1a; margin-top: 0;">This Week's Market Insights</h2>
        ${insightsHTML}
      </div>
      
      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
        <p>You're receiving this because you subscribed to Tharaga's newsletter.</p>
        <p><a href="https://tharaga.co.in/newsletter/unsubscribe" style="color: #f59e0b;">Unsubscribe</a></p>
        <p>© ${new Date().getFullYear()} Tharaga. All rights reserved.</p>
      </div>
    </body>
    </html>
  `
}

/**
 * Generate plain text content for newsletter
 */
function generateNewsletterText(insights: any[]): string {
  const insightsText = insights.map(insight => `
${insight.title}
${insight.summary || insight.content.substring(0, 200) + '...'}

Source: ${insight.source_url}
Category: ${insight.category || 'General'}

---
  `).join('\n')

  return `
Chennai Real Estate Weekly Update - ${new Date().toLocaleDateString('en-IN')}

This Week's Market Insights
${insightsText}

---
You're receiving this because you subscribed to Tharaga's newsletter.
Unsubscribe: https://tharaga.co.in/newsletter/unsubscribe

© ${new Date().getFullYear()} Tharaga. All rights reserved.
  `.trim()
}

