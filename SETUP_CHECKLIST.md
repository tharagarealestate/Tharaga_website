# Twilio Messaging System - Setup Checklist

## ✅ What's Already Done

- ✅ Code implementation complete
- ✅ Dependencies installed (`twilio` and `@types/twilio`)
- ✅ Environment variables file created (`.env.local`)
- ✅ All files committed and pushed to main

## 🔧 What You Need to Do

### 1. ✅ Verify Environment Variables (Already Done)

Your `.env.local` file should have:
```env
TWILIO_ACCOUNT_SID=AC5acba63623d179f5
TWILIO_AUTH_TOKEN=43f19dea71a0fb4da3c2
TWILIO_PHONE_NUMBER=+12187783385
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_WEBHOOK_URL=https://tharaga.co.in/api/messaging/webhook
```

**Action:** Verify these values are correct in your `.env.local` file.

---

### 2. 🗄️ **CRITICAL: Run Database Migration**

**Location:** `supabase/migrations/022_twilio_messaging.sql`

**Steps:**
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Open the file: `supabase/migrations/022_twilio_messaging.sql`
4. Copy the entire SQL content
5. Paste into Supabase SQL Editor
6. Click "Run" to execute

**Or use Supabase CLI:**
```bash
supabase db push
```

**What it creates:**
- `message_templates` table
- `message_campaigns` table
- Updates `lead_interactions` table with SMS/WhatsApp support
- Row Level Security (RLS) policies
- Indexes for performance

**⚠️ This is REQUIRED - the system won't work without this migration!**

---

### 3. 🔗 Configure Twilio Webhook

**Steps:**
1. Log in to [Twilio Console](https://console.twilio.com)
2. Go to **Phone Numbers** → **Manage** → **Active Numbers**
3. Click on your phone number (`+12187783385`)
4. Scroll to **Messaging Configuration**
5. Under **A MESSAGE COMES IN**, set:
   - **Webhook URL:** `https://tharaga.co.in/api/messaging/webhook`
   - **HTTP Method:** `POST`
6. Click **Save**

**For WhatsApp:**
1. Go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Or go to **Phone Numbers** → **WhatsApp Senders**
3. Configure webhook URL: `https://tharaga.co.in/api/messaging/webhook`

**⚠️ Important:** 
- Webhook URL must be publicly accessible (HTTPS)
- Signature validation is enabled for security

---

### 4. 🧪 Test the Implementation

**Test Checklist:**

1. **Test SMS Sending:**
   - Navigate to `/builder/messaging`
   - Select SMS tab
   - Enter a test phone number
   - Send a test message
   - Verify message appears in Twilio console

2. **Test WhatsApp Sending:**
   - Switch to WhatsApp tab
   - Send a test message
   - Verify delivery

3. **Test Templates:**
   - Go to "Template Library" tab
   - Select a pre-built template
   - Fill in variables
   - Send test message

4. **Test Webhook:**
   - Send a message
   - Check Twilio console for webhook delivery
   - Verify status updates in database

---

### 5. 🔐 Production Environment Variables

**For Production Deployment:**

Make sure these environment variables are set in your production environment:

- Vercel: Go to Project Settings → Environment Variables
- Netlify: Go to Site Settings → Environment Variables
- Other platforms: Set in your hosting platform's environment settings

**Required Variables:**
```env
TWILIO_ACCOUNT_SID=AC5acba63623d179f5
TWILIO_AUTH_TOKEN=43f19dea71a0fb4da3c2
TWILIO_PHONE_NUMBER=+12187783385
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_WEBHOOK_URL=https://tharaga.co.in/api/messaging/webhook
```

---

### 6. 📊 Verify Database Tables

**After running migration, verify in Supabase:**

1. Go to **Table Editor**
2. Check these tables exist:
   - ✅ `message_templates`
   - ✅ `message_campaigns`
3. Check `lead_interactions` table has:
   - ✅ `sms_sent` and `whatsapp_sent` in interaction_type
   - ✅ `sent`, `delivered`, `failed` in status

---

### 7. 🚀 Deploy to Production

**Steps:**
1. Push changes to your production branch (if different from main)
2. Deploy to your hosting platform
3. Verify environment variables are set
4. Test messaging functionality in production

---

## ⚠️ Important Notes

### Security
- ✅ Webhook signature validation is enabled
- ✅ All API routes require authentication
- ✅ Row Level Security (RLS) policies are in place

### Rate Limits
- SMS: 10 messages per minute per number
- WhatsApp: 60 messages per hour per number
- Built-in rate limiting prevents exceeding limits

### Costs
- Monitor Twilio usage in Twilio Console
- SMS costs vary by country
- WhatsApp messages have different pricing
- Check your Twilio account balance regularly

---

## 🐛 Troubleshooting

### Issue: "Twilio credentials not configured"
**Solution:** Check `.env.local` file exists and has all variables

### Issue: "Template not found"
**Solution:** Run the database migration to create `message_templates` table

### Issue: "Webhook not receiving updates"
**Solution:** 
- Verify webhook URL is publicly accessible
- Check Twilio console for webhook delivery status
- Ensure HTTPS is used (required by Twilio)

### Issue: "Rate limit exceeded"
**Solution:** Wait for rate limit window to expire or implement queue system

---

## ✅ Final Checklist

Before going live, ensure:

- [ ] Database migration executed successfully
- [ ] Twilio webhook configured in Twilio Console
- [ ] Environment variables set in production
- [ ] Test SMS sent successfully
- [ ] Test WhatsApp sent successfully
- [ ] Webhook receiving status updates
- [ ] Templates working correctly
- [ ] UI accessible at `/builder/messaging`

---

## 📞 Support

If you encounter any issues:
1. Check the error logs in your hosting platform
2. Verify Twilio console for message status
3. Check Supabase logs for database errors
4. Review the implementation documentation files

---

**Status:** Ready for setup! 🚀

