# Netlify Environment Variables

## Complete List of Environment Variables Required for Calendar Integration

### 1. Supabase Configuration

#### Required
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Notes:**
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY`: Required for admin operations (user creation). **KEEP SECRET**

---

### 2. Google Calendar API

#### Required
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/calendar/callback
```

#### Optional
```
DEFAULT_CALENDAR_ID=primary
DEFAULT_TIMEZONE=Asia/Kolkata
```

**Notes:**
- `GOOGLE_CLIENT_ID`: Google OAuth 2.0 Client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth 2.0 Client Secret
- `GOOGLE_REDIRECT_URI`: Must match the redirect URI configured in Google Cloud Console
- `DEFAULT_CALENDAR_ID`: Default calendar ID (usually 'primary')
- `DEFAULT_TIMEZONE`: Default timezone for calendar events

**Setup Instructions:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URI: `https://your-domain.com/api/calendar/callback`
6. Copy Client ID and Client Secret

---

### 3. Resend Email Service

#### Required (Optional - will log emails if not set)
```
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@tharaga.co.in
```

**Notes:**
- `RESEND_API_KEY`: Resend API key for sending emails
- `RESEND_FROM_EMAIL`: Default from email address (must be verified in Resend)
- If `RESEND_API_KEY` is not set, emails will be logged but not sent (mock mode)

**Setup Instructions:**
1. Sign up at [Resend](https://resend.com/)
2. Create an API key
3. Verify your domain or use the default domain
4. Copy the API key

---

### 4. Twilio SMS/WhatsApp Service

#### Required
```
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
```

#### Optional
```
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+1234567890
TWILIO_WEBHOOK_URL=https://your-domain.com/api/webhooks/twilio
```

**Notes:**
- `TWILIO_ACCOUNT_SID`: Twilio Account SID
- `TWILIO_AUTH_TOKEN`: Twilio Auth Token (keep secret)
- `TWILIO_PHONE_NUMBER`: Twilio phone number for SMS (optional)
- `TWILIO_WHATSAPP_NUMBER`: Twilio WhatsApp number (optional)
- `TWILIO_WEBHOOK_URL`: Webhook URL for delivery status updates (optional)

**Setup Instructions:**
1. Sign up at [Twilio](https://www.twilio.com/)
2. Get your Account SID and Auth Token from the dashboard
3. Purchase a phone number (if needed)
4. Configure webhook URL (if using delivery tracking)

---

### 5. Next.js Configuration

#### Optional
```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

**Notes:**
- `NODE_ENV`: Environment (production, development, etc.)
- `NEXT_PUBLIC_APP_URL`: Your application URL (for redirects and links)

---

## Complete Environment Variables List (Copy-Paste Ready)

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Calendar API
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/calendar/callback
DEFAULT_CALENDAR_ID=primary
DEFAULT_TIMEZONE=Asia/Kolkata

# Resend Email Service
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@tharaga.co.in

# Twilio SMS/WhatsApp Service
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+1234567890
TWILIO_WEBHOOK_URL=https://your-domain.com/api/webhooks/twilio

# Next.js Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## How to Add Environment Variables in Netlify

1. **Go to Netlify Dashboard**
   - Navigate to your site
   - Click on "Site configuration"
   - Click on "Environment variables"

2. **Add Variables**
   - Click "Add a variable"
   - Enter variable name (e.g., `GOOGLE_CLIENT_ID`)
   - Enter variable value
   - Click "Save"

3. **Deploy**
   - After adding all variables, trigger a new deployment
   - Variables will be available in the next deployment

---

## Security Notes

### ⚠️ Keep Secret
- `SUPABASE_SERVICE_ROLE_KEY` - Has admin access
- `GOOGLE_CLIENT_SECRET` - OAuth secret
- `TWILIO_AUTH_TOKEN` - Twilio authentication
- `RESEND_API_KEY` - Email service API key

### ✅ Safe to Expose
- `NEXT_PUBLIC_SUPABASE_URL` - Public URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public key (protected by RLS)
- `GOOGLE_CLIENT_ID` - Public OAuth client ID
- `NEXT_PUBLIC_APP_URL` - Public URL

---

## Verification Checklist

After adding environment variables, verify:

- [ ] Supabase connection works
- [ ] Google Calendar OAuth flow works
- [ ] Email sending works (if RESEND_API_KEY is set)
- [ ] SMS sending works (if Twilio credentials are set)
- [ ] Site visit booking flow works
- [ ] Calendar sync works
- [ ] Availability checking works

---

## Troubleshooting

### Google Calendar OAuth Issues
- Verify redirect URI matches exactly (including https/http)
- Check that Google Calendar API is enabled
- Verify OAuth consent screen is configured

### Email Not Sending
- Check RESEND_API_KEY is set correctly
- Verify RESEND_FROM_EMAIL is verified in Resend
- Check Resend dashboard for error logs

### SMS Not Sending
- Verify TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are correct
- Check Twilio account has sufficient credits
- Verify phone number format (include country code)

### Database Issues
- Verify SUPABASE_SERVICE_ROLE_KEY is set correctly
- Check that migration 023_calendar_integration.sql is applied
- Verify RLS policies are configured correctly

---

## Support

For issues or questions:
1. Check Netlify deployment logs
2. Check Supabase logs
3. Check Google Cloud Console logs
4. Check Resend dashboard
5. Check Twilio dashboard

---

## Last Updated

2024-01-XX - Calendar Integration Environment Variables

