# Netlify Environment Variables - Complete List

## 📋 All Environment Variables Required for Calendar Integration

### ✅ 1. Supabase Configuration

#### Required
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Description:**
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL (public)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous/public key (public)
- `SUPABASE_SERVICE_ROLE_KEY`: Required for admin operations like user creation (SECRET - keep private)

**Where to find:**
- Go to Supabase Dashboard → Project Settings → API
- Copy the Project URL and anon/public key
- Copy the service_role key (keep it secret!)

---

### ✅ 2. Google Calendar API

#### Required
```
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_REDIRECT_URI=https://tharaga.co.in/api/calendar/callback
```

#### Optional
```
DEFAULT_CALENDAR_ID=primary
DEFAULT_TIMEZONE=Asia/Kolkata
```

**Description:**
- `GOOGLE_CLIENT_ID`: Google OAuth 2.0 Client ID (from Google Cloud Console)
- `GOOGLE_CLIENT_SECRET`: Google OAuth 2.0 Client Secret (SECRET - keep private)
- `GOOGLE_REDIRECT_URI`: OAuth callback URL (must match Google Cloud Console settings)
- `DEFAULT_CALENDAR_ID`: Default calendar ID (usually 'primary')
- `DEFAULT_TIMEZONE`: Default timezone for calendar events

**Setup Instructions:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable Google Calendar API
4. Go to Credentials → Create OAuth 2.0 Client ID
5. Application type: Web application
6. Authorized redirect URIs: `https://tharaga.co.in/api/calendar/callback`
7. Copy Client ID and Client Secret

**Important:** 
- The redirect URI must exactly match your production domain
- For local development, use: `http://localhost:3000/api/calendar/callback`

---

### ✅ 3. Resend Email Service

#### Required (Optional - will log emails if not set)
```
RESEND_API_KEY=your-resend-api-key-here
RESEND_FROM_EMAIL=noreply@tharaga.co.in
```

**Description:**
- `RESEND_API_KEY`: Resend API key for sending emails (SECRET - keep private)
- `RESEND_FROM_EMAIL`: Default from email address (must be verified in Resend)

**Setup Instructions:**
1. Sign up at [Resend](https://resend.com/)
2. Go to API Keys → Create API Key
3. Copy the API key
4. Verify your domain or use the default domain
5. Set `RESEND_FROM_EMAIL` to your verified email address

**Note:** 
- If `RESEND_API_KEY` is not set, emails will be logged to console but not sent (mock mode)
- This is useful for development/testing

---

### ✅ 4. Twilio SMS/WhatsApp Service

#### Required
```
TWILIO_ACCOUNT_SID=your-twilio-account-sid-here
TWILIO_AUTH_TOKEN=your-twilio-auth-token-here
```

#### Optional
```
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+1234567890
TWILIO_WEBHOOK_URL=https://tharaga.co.in/api/webhooks/twilio
```

**Description:**
- `TWILIO_ACCOUNT_SID`: Twilio Account SID (from Twilio Dashboard)
- `TWILIO_AUTH_TOKEN`: Twilio Auth Token (SECRET - keep private)
- `TWILIO_PHONE_NUMBER`: Twilio phone number for SMS (optional, format: +1234567890)
- `TWILIO_WHATSAPP_NUMBER`: Twilio WhatsApp number (optional, format: +1234567890)
- `TWILIO_WEBHOOK_URL`: Webhook URL for delivery status updates (optional)

**Setup Instructions:**
1. Sign up at [Twilio](https://www.twilio.com/)
2. Go to Console Dashboard
3. Copy Account SID and Auth Token
4. (Optional) Purchase a phone number for SMS
5. (Optional) Set up WhatsApp messaging
6. (Optional) Configure webhook URL for delivery tracking

**Note:**
- Phone numbers must include country code (e.g., +1234567890)
- Webhook URL is optional but recommended for delivery tracking

---

### ✅ 5. Next.js Configuration

#### Optional
```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://tharaga.co.in
```

**Description:**
- `NODE_ENV`: Environment mode (production, development, etc.)
- `NEXT_PUBLIC_APP_URL`: Your application URL (for redirects and links)

---

## 📝 Complete Environment Variables List (Copy-Paste Ready)

```bash
# =============================================
# SUPABASE CONFIGURATION
# =============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# =============================================
# GOOGLE CALENDAR API
# =============================================
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_REDIRECT_URI=https://tharaga.co.in/api/calendar/callback
DEFAULT_CALENDAR_ID=primary
DEFAULT_TIMEZONE=Asia/Kolkata

# =============================================
# RESEND EMAIL SERVICE
# =============================================
RESEND_API_KEY=your-resend-api-key-here
RESEND_FROM_EMAIL=noreply@tharaga.co.in

# =============================================
# TWILIO SMS/WHATSAPP SERVICE
# =============================================
TWILIO_ACCOUNT_SID=your-twilio-account-sid-here
TWILIO_AUTH_TOKEN=your-twilio-auth-token-here
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+1234567890
TWILIO_WEBHOOK_URL=https://tharaga.co.in/api/webhooks/twilio

# =============================================
# NEXT.JS CONFIGURATION
# =============================================
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://tharaga.co.in
```

---

## 🔒 Security Notes

### ⚠️ Keep Secret (Never Commit to Git)
- `SUPABASE_SERVICE_ROLE_KEY` - Has admin access to database
- `GOOGLE_CLIENT_SECRET` - OAuth 2.0 secret
- `TWILIO_AUTH_TOKEN` - Twilio authentication token
- `RESEND_API_KEY` - Email service API key

### ✅ Safe to Expose (Public)
- `NEXT_PUBLIC_SUPABASE_URL` - Public URL (already public)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public key (protected by RLS)
- `GOOGLE_CLIENT_ID` - Public OAuth client ID
- `NEXT_PUBLIC_APP_URL` - Public URL

---

## 🚀 How to Add Environment Variables in Netlify

### Step 1: Go to Netlify Dashboard
1. Navigate to [Netlify Dashboard](https://app.netlify.com/)
2. Select your site
3. Go to **Site configuration** → **Environment variables**

### Step 2: Add Variables
1. Click **"Add a variable"** button
2. Enter variable name (e.g., `GOOGLE_CLIENT_ID`)
3. Enter variable value
4. Click **"Save"**
5. Repeat for all variables

### Step 3: Deploy
1. After adding all variables, trigger a new deployment
2. Variables will be available in the next deployment
3. Check deployment logs to verify variables are loaded

---

## ✅ Verification Checklist

After adding environment variables, verify:

- [ ] Supabase connection works
- [ ] Google Calendar OAuth flow works
- [ ] Email sending works (if RESEND_API_KEY is set)
- [ ] SMS sending works (if Twilio credentials are set)
- [ ] Site visit booking flow works
- [ ] Calendar sync works
- [ ] Availability checking works
- [ ] User creation works (if SUPABASE_SERVICE_ROLE_KEY is set)

---

## 🔧 Troubleshooting

### Google Calendar OAuth Issues
- **Problem:** OAuth redirect error
- **Solution:** Verify redirect URI matches exactly (including https/http)
- **Problem:** API not enabled
- **Solution:** Check that Google Calendar API is enabled in Google Cloud Console

### Email Not Sending
- **Problem:** Emails not sent
- **Solution:** Check RESEND_API_KEY is set correctly
- **Solution:** Verify RESEND_FROM_EMAIL is verified in Resend
- **Solution:** Check Resend dashboard for error logs

### SMS Not Sending
- **Problem:** SMS not sent
- **Solution:** Verify TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are correct
- **Solution:** Check Twilio account has sufficient credits
- **Solution:** Verify phone number format (include country code)

### Database Issues
- **Problem:** User creation fails
- **Solution:** Verify SUPABASE_SERVICE_ROLE_KEY is set correctly
- **Problem:** RLS policies blocking access
- **Solution:** Check that migration 023_calendar_integration.sql is applied
- **Solution:** Verify RLS policies are configured correctly

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Google Calendar API Documentation](https://developers.google.com/calendar)
- [Resend Documentation](https://resend.com/docs)
- [Twilio Documentation](https://www.twilio.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

## 📅 Last Updated

2024-01-XX - Calendar Integration Environment Variables

---

## 🎯 Quick Reference

### Required Variables (Must Set)
1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `SUPABASE_SERVICE_ROLE_KEY`
4. `GOOGLE_CLIENT_ID`
5. `GOOGLE_CLIENT_SECRET`
6. `GOOGLE_REDIRECT_URI`
7. `TWILIO_ACCOUNT_SID`
8. `TWILIO_AUTH_TOKEN`

### Optional Variables (Recommended)
1. `RESEND_API_KEY` (for email sending)
2. `RESEND_FROM_EMAIL` (for email sending)
3. `TWILIO_PHONE_NUMBER` (for SMS)
4. `TWILIO_WHATSAPP_NUMBER` (for WhatsApp)
5. `DEFAULT_CALENDAR_ID` (default: 'primary')
6. `DEFAULT_TIMEZONE` (default: 'Asia/Kolkata')
7. `NEXT_PUBLIC_APP_URL` (for redirects)

---

## 📞 Support

For issues or questions:
1. Check Netlify deployment logs
2. Check Supabase logs
3. Check Google Cloud Console logs
4. Check Resend dashboard
5. Check Twilio dashboard
6. Review error messages in application logs

---

## ✅ Summary

All environment variables have been documented and verified. The calendar integration is ready for deployment once these variables are set in Netlify.

**Next Steps:**
1. Add all environment variables to Netlify
2. Trigger a new deployment
3. Test the calendar integration
4. Verify all features work correctly

---

## 🎉 Success!

Your calendar integration is now ready for production! 🚀

