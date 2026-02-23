# Resend Webhook Setup Guide

Complete step-by-step instructions to configure Resend webhooks for email event tracking in Tharaga.

## Prerequisites

1. **Resend Account**: You must have an active Resend account
2. **API Key**: Your Resend API key (stored as `RESEND_API_KEY`)
3. **Deployed Application**: Your Next.js app must be deployed and accessible via HTTPS
4. **Environment Variables**: Access to your deployment environment variables

---

## Step 1: Get Your Webhook Endpoint URL

Your webhook endpoint is already implemented at:

```
https://yourdomain.com/api/webhooks/resend
```

**For local development/testing:**
- Use [ngrok](https://ngrok.com/) or similar tool to expose your local server
- Example: `https://abc123.ngrok.io/api/webhooks/resend`

**For production:**
- Use your actual domain: `https://tharaga.co.in/api/webhooks/resend`
- Or your Vercel/Netlify URL: `https://your-app.vercel.app/api/webhooks/resend`

---

## Step 2: Create Webhook in Resend Dashboard

### Option A: Via Resend Dashboard (Recommended)

1. **Log in to Resend**
   - Go to [https://resend.com/login](https://resend.com/login)
   - Sign in with your credentials

2. **Navigate to Webhooks**
   - Click on **"Webhooks"** in the left sidebar
   - Or go directly to: [https://resend.com/webhooks](https://resend.com/webhooks)

3. **Add New Webhook**
   - Click the **"Add Webhook"** or **"Create Webhook"** button
   - You'll see a form with the following fields:

4. **Configure Webhook Settings**
   
   **Endpoint URL:**
   ```
   https://yourdomain.com/api/webhooks/resend
   ```
   - Replace `yourdomain.com` with your actual domain
   - Must be HTTPS (required by Resend)
   - Must be publicly accessible

   **Description (Optional):**
   ```
   Tharaga Email Event Tracking
   ```

   **Events to Subscribe:**
   Select ALL of the following events (checkboxes):
   - ✅ `email.sent` - Email was successfully sent
   - ✅ `email.delivered` - Email was delivered to recipient
   - ✅ `email.opened` - Recipient opened the email
   - ✅ `email.clicked` - Recipient clicked a link
   - ✅ `email.bounced` - Email bounced (hard or soft)
   - ✅ `email.complained` - Recipient marked as spam
   - ✅ `email.failed` - Email send failed

5. **Save Webhook**
   - Click **"Create Webhook"** or **"Save"**
   - Resend will generate a **Webhook Secret** (signing secret)

6. **Copy the Webhook Secret**
   - After creation, you'll see a **"Signing Secret"** or **"Webhook Secret"**
   - It looks like: `whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **IMPORTANT**: Copy this immediately - you won't be able to see it again!

---

## Step 3: Set Environment Variable

Add the webhook secret to your environment variables:

### For Local Development (.env.local)

```bash
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### For Production (Vercel)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Click **"Add New"**
4. Add:
   - **Name**: `RESEND_WEBHOOK_SECRET`
   - **Value**: `whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (paste your secret)
   - **Environment**: Production, Preview, Development (select all)
5. Click **"Save"**

### For Production (Netlify)

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Click **"Add a variable"** for each variable below:

**Required Variables:**
- **Key**: `RESEND_API_KEY` → **Value**: `re_H9TCXTNw_LDFKwRKd92qow9MNng5adhH6`
- **Key**: `RESEND_WEBHOOK_SECRET` → **Value**: `whsec_6ye4RO8LdTMW1yAY8qOJEGKEfazhmeR1`
- **Key**: `RESEND_FROM_EMAIL` → **Value**: `noreply@send.notify.tharaga.co.in`
- **Key**: `RESEND_FROM_NAME` → **Value**: `Tharaga Real Estate`

4. Set scope: Production, Preview, Development
5. Click **"Save"** for each variable

### For Production (Other Platforms)

Add the environment variable according to your platform's documentation:
- **Name**: `RESEND_WEBHOOK_SECRET`
- **Value**: Your webhook secret from Resend

---

## Step 4: Verify Webhook Configuration

### Test the Webhook Endpoint

1. **Send a Test Email**
   - Use your application to send a test email
   - Or use Resend's test email feature

2. **Check Webhook Delivery**
   - Go back to Resend Dashboard → **Webhooks**
   - Click on your webhook
   - View the **"Recent Events"** or **"Logs"** section
   - You should see webhook delivery attempts

3. **Check Application Logs**
   - Look for log entries like:
     ```
     [Resend Webhook] Processed event: email.sent
     [Resend Webhook] Processed event: email.delivered
     ```

4. **Verify Database Updates**
   - Check `email_deliveries` table for new records
   - Check `email_campaign_recipients` for status updates
   - Check campaign statistics for incremented counters

---

## Step 5: Handle Webhook Failures

### Monitor Webhook Health

1. **Resend Dashboard**
   - Go to **Webhooks** → Your webhook
   - Check **"Status"** (should be "Active")
   - Review **"Recent Events"** for failed deliveries

2. **Common Issues**

   **401 Unauthorized:**
   - Check `RESEND_WEBHOOK_SECRET` is set correctly
   - Verify the secret matches what Resend shows

   **400 Bad Request:**
   - Check webhook endpoint URL is correct
   - Verify endpoint accepts POST requests
   - Check endpoint returns 200 status

   **500 Internal Server Error:**
   - Check application logs for errors
   - Verify database connections
   - Check `resendClient.handleWebhook` implementation

3. **Retry Failed Webhooks**
   - Resend automatically retries failed webhooks
   - Check Resend dashboard for retry status
   - Fix the underlying issue and webhooks will resume

---

## Step 6: Programmatic Webhook Creation (Alternative)

If you prefer to create webhooks via API:

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const { data, error } = await resend.webhooks.create({
  endpoint: 'https://yourdomain.com/api/webhooks/resend',
  description: 'Tharaga Email Event Tracking',
  events: [
    'email.sent',
    'email.delivered',
    'email.opened',
    'email.clicked',
    'email.bounced',
    'email.complained',
    'email.failed',
  ],
})

if (error) {
  console.error('Error creating webhook:', error)
} else {
  console.log('Webhook created:', data)
  console.log('Webhook Secret:', data.signing_secret) // Save this!
}
```

**Note**: You still need to save the `signing_secret` from the response as `RESEND_WEBHOOK_SECRET`.

---

## Webhook Event Payload Structure

Your webhook handler expects events in this format:

```json
{
  "type": "email.sent",
  "data": {
    "email_id": "abc123",
    "from": "noreply@tharaga.co.in",
    "to": ["lead@example.com"],
    "subject": "Welcome to Tharaga!",
    "created_at": "2025-01-15T10:00:00Z"
  }
}
```

The handler automatically processes:
- `email.sent` → Updates delivery status to "sent"
- `email.delivered` → Updates status to "delivered", increments campaign stats
- `email.opened` → Updates status to "opened", tracks open count
- `email.clicked` → Updates status to "clicked", tracks click count
- `email.bounced` → Updates status to "bounced", records bounce type
- `email.complained` → Updates status to "complained"
- `email.failed` → Updates status to "failed", records error

---

## Security Best Practices

1. **Never commit secrets to Git**
   - Use environment variables only
   - Add `.env.local` to `.gitignore`

2. **Use HTTPS only**
   - Resend requires HTTPS for webhook endpoints
   - Never use HTTP in production

3. **Verify signatures**
   - The webhook handler automatically verifies Svix signatures
   - Rejects requests with invalid signatures

4. **Rotate secrets periodically**
   - If compromised, regenerate webhook secret in Resend
   - Update `RESEND_WEBHOOK_SECRET` in all environments

5. **Monitor webhook health**
   - Set up alerts for webhook failures
   - Review logs regularly

---

## Troubleshooting

### Webhook not receiving events

1. Check webhook is "Active" in Resend dashboard
2. Verify endpoint URL is correct and accessible
3. Test endpoint with curl:
   ```bash
   curl -X POST https://yourdomain.com/api/webhooks/resend \
     -H "Content-Type: application/json" \
     -H "svix-signature: v1,test" \
     -H "svix-timestamp: 1234567890" \
     -d '{"type":"test","data":{}}'
   ```

### Signature verification failing

1. Verify `RESEND_WEBHOOK_SECRET` matches Resend dashboard
2. Check secret doesn't have extra spaces or quotes
3. Ensure secret starts with `whsec_`

### Events not updating database

1. Check `resendClient.handleWebhook` implementation
2. Verify database connection
3. Check RLS policies allow service role access
4. Review application logs for errors

---

## Support

- **Resend Documentation**: [https://resend.com/docs](https://resend.com/docs)
- **Resend Webhook Guide**: [https://resend.com/docs/dashboard/webhooks](https://resend.com/docs/dashboard/webhooks)
- **Svix Documentation**: [https://docs.svix.com](https://docs.svix.com) (for signature verification)

---

## Quick Checklist

- [ ] Webhook endpoint deployed and accessible via HTTPS
- [ ] Webhook created in Resend dashboard
- [ ] All 7 events selected (sent, delivered, opened, clicked, bounced, complained, failed)
- [ ] Webhook secret copied from Resend
- [ ] `RESEND_WEBHOOK_SECRET` set in environment variables
- [ ] Test email sent to verify webhook delivery
- [ ] Webhook events appearing in Resend dashboard
- [ ] Application logs showing processed events
- [ ] Database records updating correctly

---

**Last Updated**: January 2025

