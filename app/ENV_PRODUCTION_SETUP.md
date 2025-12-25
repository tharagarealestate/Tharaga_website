# Production Environment Variables Setup

## Security & Monitoring Configuration

This document lists the production environment variables that need to be configured in your hosting platform (Vercel, Netlify, etc.).

### Required Environment Variables

Add these variables to your production environment:

```env
# Security: Encryption key for sensitive data (AES-256-GCM)
ENCRYPTION_KEY=38654974446faacba8b904fe04d11173deffd0f774455e62bbf3bf73850bb6f7

# Admin Email: Email address for receiving security alerts
ADMIN_EMAIL=tharagarealestate@gmail.com

# Resend API Key: Email service API key for sending security alert emails
RESEND_API_KEY=re_H9TCXTNw_LDFKwRKd92qow9MNng5adhH6

# Cron Secret: Secret key for authenticating cron job requests
CRON_SECRET=6d995a138f9cc817e14ccf75bb8cd817c19f4e44db59a9a65cfd9fcc751bba4a

# Encryption Key Rotation: Days between automatic key rotations
ENCRYPTION_KEY_ROTATION_DAYS=90
```

### How to Add to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable above
4. Select **Production** environment
5. Click **Save**

### How to Add to Netlify

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add each variable above
4. Click **Save**

### Security Notes

- **ENCRYPTION_KEY**: Never share or commit this key. It's used to encrypt sensitive user data.
- **CRON_SECRET**: Used to authenticate cron job requests. Keep it secret.
- **RESEND_API_KEY**: Your Resend API key for sending security alert emails.
- **ADMIN_EMAIL**: Email address that will receive critical security alerts.

### Cron Job Setup

To enable automated security monitoring, set up a cron job that calls:

```
GET https://your-domain.com/api/cron/security-monitoring
Authorization: Bearer 6d995a138f9cc817e14ccf75bb8cd817c19f4e44db59a9a65cfd9fcc751bba4a
```

**Recommended schedule**: Every 15 minutes (`*/15 * * * *`)

### Vercel Cron Configuration

If using Vercel, add this to your `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/security-monitoring",
    "schedule": "*/15 * * * *"
  }]
}
```

### Verification

After setting up the environment variables:

1. Check that security monitoring is working: Visit `/admin/security`
2. Verify email alerts: Trigger a test alert and check `ADMIN_EMAIL`
3. Test cron endpoint: Call `/api/cron/security-monitoring` with the CRON_SECRET

---

**Important**: The `.env.production` file is intentionally excluded from git for security reasons. Always configure these variables in your hosting platform's environment variable settings.

