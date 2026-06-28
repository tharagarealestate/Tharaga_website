# Newsletter Automation System - Setup Guide

## Overview

Tharaga's automated newsletter system collects Chennai real estate market insights from multiple sources, processes them using AI, and sends weekly newsletters to subscribers.

## Components

### 1. Database Tables
- `newsletter_subscribers` - Stores subscriber email addresses
- `newsletter_insights` - Stores collected market insights
- `newsletter_campaigns` - Tracks sent newsletters with analytics

**Migration File:** `supabase/migrations/022_newsletter_subscribers.sql`

### 2. API Endpoints

#### `/api/newsletter/subscribe` (POST)
- Subscribes users to the newsletter
- Handles email validation and duplicate prevention
- Returns success/error messages

#### `/api/newsletter/collect-insights` (POST)
- Collects insights from various Chennai sources
- Requires API key authentication
- Stores insights in database

#### `/api/newsletter/send-weekly` (POST)
- Sends weekly newsletter to all active subscribers
- Generates HTML and plain text emails
- Tracks campaign analytics

### 3. Data Sources

The system is designed to collect insights from:

1. **Chennai Metro Rail Corporation (CMRL)**
   - Official website: https://chennaimetrorail.org/
   - Metro expansion news
   - New station announcements
   - Route updates

2. **RERA Tamil Nadu**
   - Official website: https://rera.tn.gov.in/
   - Project registrations
   - Compliance updates
   - Regulatory changes

3. **Google Alerts**
   - Set up alerts for: "Chennai real estate", "Chennai property market", "Chennai metro expansion"
   - Process email alerts via IMAP or API

4. **Chennai Real Estate Platforms**
   - MagicBricks Chennai section
   - 99acres Chennai listings
   - CommonFloor Chennai updates

5. **Government Websites**
   - Chennai Corporation announcements
   - Tamil Nadu Housing Board updates
   - Infrastructure project announcements

## Setup Instructions

### Step 1: Run Database Migration

Execute the migration file in Supabase:
```sql
-- Run: supabase/migrations/022_newsletter_subscribers.sql
```

### Step 2: Configure Environment Variables

Add to `.env` or environment configuration:

```env
# Newsletter Automation
NEWSLETTER_AUTOMATION_API_KEY=your-secure-api-key-here

# Email Service (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Supabase
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 3: Set Up Cron Jobs

#### Option A: Vercel Cron (Recommended)

Create `vercel.json` cron configuration:

```json
{
  "crons": [
    {
      "path": "/api/newsletter/collect-insights",
      "schedule": "0 9 * * 1"
    },
    {
      "path": "/api/newsletter/send-weekly",
      "schedule": "0 10 * * 1"
    }
  ]
}
```

#### Option B: External Cron Service

Use services like:
- EasyCron
- Cron-job.org
- GitHub Actions (Scheduled workflows)

Schedule:
- **Collect Insights:** Every Monday at 9 AM IST
- **Send Newsletter:** Every Monday at 10 AM IST

### Step 4: Implement Data Collection

The current implementation includes placeholder functions. To enable actual data collection:

1. **Install Web Scraping Libraries:**
```bash
npm install cheerio puppeteer axios
```

2. **Set Up Google Alerts:**
   - Create Google Alert: https://www.google.com/alerts
   - Query: "Chennai real estate"
   - Frequency: As-it-happens
   - Email to: alerts@tharaga.co.in
   - Use IMAP to fetch emails or Google Alerts RSS feed

3. **Implement Scraping Functions:**

Update `app/app/api/newsletter/collect-insights/route.ts`:

```typescript
import * as cheerio from 'cheerio'
import axios from 'axios'

async function collectCMRLInsights() {
  try {
    const response = await axios.get('https://chennaimetrorail.org/news/')
    const $ = cheerio.load(response.data)
    // Extract news items
    // Return structured insights
  } catch (error) {
    console.error('CMRL scraping error:', error)
    return []
  }
}
```

4. **AI Summarization:**

To add AI-powered summarization, integrate with:
- OpenAI GPT-4
- Anthropic Claude
- Google Gemini

Example:
```typescript
async function summarizeContent(content: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "Summarize this Chennai real estate news in 150 words, focusing on market impact."
      },
      { role: "user", content }
    ]
  })
  return response.choices[0].message.content
}
```

### Step 5: Test the System

1. **Test Subscription:**
```bash
curl -X POST https://your-domain.com/api/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "source": "footer"}'
```

2. **Test Insight Collection:**
```bash
curl -X POST https://your-domain.com/api/newsletter/collect-insights \
  -H "Authorization: Bearer your-api-key"
```

3. **Test Newsletter Sending:**
```bash
curl -X POST https://your-domain.com/api/newsletter/send-weekly \
  -H "Authorization: Bearer your-api-key"
```

## Content Processing Workflow

1. **Collection:** Fetch insights from sources daily
2. **Processing:** Extract, clean, and categorize content
3. **Summarization:** Generate short summaries (AI-powered)
4. **Storage:** Save to `newsletter_insights` table
5. **Curation:** Weekly review and selection
6. **Email Generation:** Create HTML/text newsletters
7. **Distribution:** Send to all active subscribers
8. **Analytics:** Track opens, clicks, unsubscribes

## Email Template Customization

Customize templates in `app/app/api/newsletter/send-weekly/route.ts`:
- Update HTML template in `generateNewsletterHTML()`
- Update text template in `generateNewsletterText()`
- Add branding, images, and links

## Monitoring & Analytics

Track newsletter performance:
- Open rates
- Click-through rates
- Unsubscribe rates
- Bounce rates
- Subscriber growth

Query analytics:
```sql
SELECT 
  campaign_id,
  sent_count,
  opened_count,
  clicked_count,
  (opened_count::float / sent_count * 100) as open_rate
FROM newsletter_campaigns
ORDER BY sent_at DESC;
```

## Security Considerations

1. **API Key Protection:** Store `NEWSLETTER_AUTOMATION_API_KEY` securely
2. **Rate Limiting:** Implement rate limits on collection endpoints
3. **Email Validation:** Verify email addresses before subscription
4. **Unsubscribe:** Implement one-click unsubscribe links
5. **Data Privacy:** Comply with GDPR and Indian privacy laws

## Troubleshooting

### Issues with Collection
- Check network connectivity to source websites
- Verify scraping selectors haven't changed
- Review error logs in function logs

### Email Delivery Issues
- Verify Resend API key is valid
- Check sender domain is verified in Resend
- Review bounce/complaint rates

### Database Errors
- Ensure migration ran successfully
- Check RLS policies allow service role access
- Verify table permissions

## Future Enhancements

1. **AI-Powered Content Curation:** Automatically select best insights
2. **Personalization:** Send personalized newsletters based on preferences
3. **Multi-language Support:** Tamil and English versions
4. **Real-time Alerts:** Push notifications for urgent updates
5. **Interactive Content:** Include property recommendations, market charts
6. **A/B Testing:** Test subject lines and content formats

## Support

For issues or questions:
- Email: tech@tharaga.co.in
- Documentation: https://tharaga.co.in/help
- GitHub: [Repository link if public]

