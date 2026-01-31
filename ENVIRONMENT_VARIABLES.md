# Environment Variables Configuration

## ⚠️ IMPORTANT: Never Commit Secrets to Git

**DO NOT** commit actual secret values to git. This file documents what environment variables are needed.

---

## Required Environment Variables

### Resend Email Service

| Variable | Description | Where to Get It | Example |
|----------|-------------|-----------------|---------|
| `RESEND_API_KEY` | Resend API key for sending emails | [Resend Dashboard → API Keys](https://resend.com/api-keys) | `re_H9TCXTNw_LDFKwRKd92qow9MNng5adhH6` |
| `RESEND_WEBHOOK_SECRET` | Webhook signing secret for verifying Resend webhooks | [Resend Dashboard → Webhooks](https://resend.com/webhooks) | `whsec_6ye4RO8LdTMW1yAY8qOJEGKEfazhmeR1` |
| `RESEND_FROM_EMAIL` | Default sender email address | Your verified domain in Resend | `noreply@send.notify.tharaga.co.in` |
| `RESEND_FROM_NAME` | Default sender display name | Your brand name | `Tharaga Real Estate` |

### Supabase Configuration

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (for server-side operations) | Supabase Dashboard → Settings → API |

---

## Local Development Setup

1. **Copy the example file:**
   ```bash
   cd app
   cp .env.example .env.local
   ```

2. **Fill in your actual values:**
   ```bash
   # Edit .env.local with your real credentials
   nano .env.local
   ```

3. **Verify .env.local is in .gitignore:**
   - Check that `.env.local` is listed in `.gitignore`
   - Never commit `.env.local` to git

---

## Production Deployment (Netlify)

### Step 1: Add Environment Variables in Netlify Dashboard

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Click **"Add a variable"** for each variable below

### Step 2: Add These Variables

**Resend Configuration:**
```
RESEND_API_KEY=re_H9TCXTNw_LDFKwRKd92qow9MNng5adhH6
RESEND_WEBHOOK_SECRET=whsec_6ye4RO8LdTMW1yAY8qOJEGKEfazhmeR1
RESEND_FROM_EMAIL=noreply@send.notify.tharaga.co.in
RESEND_FROM_NAME=Tharaga Real Estate
```

**Supabase Configuration:**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 3: Set Scope

- **Production**: ✅ (for production deployments)
- **Preview**: ✅ (for pull request previews)
- **Development**: ✅ (for local development if using Netlify Dev)

### Step 4: Redeploy

After adding variables, trigger a new deployment:
- Go to **Deploys** tab
- Click **"Trigger deploy"** → **"Deploy site"**

---

## Production Deployment (Vercel)

### Step 1: Add Environment Variables in Vercel Dashboard

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Click **"Add New"** for each variable

### Step 2: Add These Variables

**Resend Configuration:**
```
RESEND_API_KEY=re_H9TCXTNw_LDFKwRKd92qow9MNng5adhH6
RESEND_WEBHOOK_SECRET=whsec_6ye4RO8LdTMW1yAY8qOJEGKEfazhmeR1
RESEND_FROM_EMAIL=noreply@send.notify.tharaga.co.in
RESEND_FROM_NAME=Tharaga Real Estate
```

**Supabase Configuration:**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 3: Set Environment Scope

For each variable, select:
- ✅ **Production**
- ✅ **Preview**
- ✅ **Development** (optional)

### Step 4: Redeploy

After adding variables, Vercel will automatically redeploy, or you can manually trigger:
- Go to **Deployments** tab
- Click **"Redeploy"** on the latest deployment

---

## Verification

### Test Resend Configuration

1. **Check API Key:**
   - Send a test email through your application
   - Check Resend dashboard for sent emails

2. **Check Webhook:**
   - Send a test email
   - Check Resend dashboard → Webhooks → Recent Events
   - Verify webhook deliveries are successful (200 status)

3. **Check Application Logs:**
   - Look for: `[Resend Webhook] Processed event: email.sent`
   - Verify no authentication errors

---

## Security Best Practices

1. ✅ **Never commit secrets to git**
   - Use `.env.example` for documentation
   - Keep actual values in `.env.local` (local) or platform env vars (production)

2. ✅ **Rotate secrets periodically**
   - Regenerate API keys every 90 days
   - Update webhook secrets if compromised

3. ✅ **Use different secrets per environment**
   - Development: Test API keys
   - Production: Production API keys

4. ✅ **Limit access to secrets**
   - Only team members who need access
   - Use platform secrets management (Netlify/Vercel)

5. ✅ **Monitor secret usage**
   - Check Resend dashboard for unusual activity
   - Set up alerts for failed webhook deliveries

---

## Troubleshooting

### "RESEND_API_KEY is not configured"
- Check environment variable is set correctly
- Verify no typos in variable name
- Restart development server after adding to `.env.local`

### "RESEND_WEBHOOK_SECRET not configured"
- Check webhook secret is set in environment
- Verify secret starts with `whsec_`
- Check webhook is created in Resend dashboard

### Webhook signature verification failing
- Verify `RESEND_WEBHOOK_SECRET` matches Resend dashboard
- Check secret doesn't have extra spaces or quotes
- Ensure webhook endpoint URL is correct

---

**Last Updated**: January 2025

