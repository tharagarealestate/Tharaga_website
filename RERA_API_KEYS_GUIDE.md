# RERA API Keys Configuration Guide

This guide explains where to get and how to configure the optional API keys for the RERA verification system.

## Overview

The RERA verification system supports three types of API integrations:

1. **RERA Partner API** - Third-party RERA verification services
2. **RERA Monitor API Key** - Security key for the monitoring endpoint
3. **Supabase Service Role Key** - Already configured, used internally

---

## 1. RERA Partner API (Optional)

### What is it?
A third-party service that provides RERA verification data via API. This can be faster and more reliable than web scraping.

### Where to get it?

#### Option A: Commercial RERA API Providers
- **RERA API Services**: Search for "RERA API India" or "Real Estate API India"
- **Data Providers**: Companies like:
  - PropTiger API
  - 99acres API
  - MagicBricks API
  - CommonFloor API
- **Government Data Aggregators**: Some companies aggregate RERA data from multiple states

#### Option B: Build Your Own
If you have access to official RERA portals with APIs:
- Tamil Nadu: https://www.tn-rera.in/
- Karnataka: https://rera.karnataka.gov.in/
- Maharashtra: https://maharera.mahaonline.gov.in/
- Check each state's RERA portal for API documentation

#### Option C: Use Web Scraping (Current Default)
The system currently uses web scraping as the default method. No API key needed.

### Configuration

```env
# Optional: Partner API URL
RERA_PARTNER_API_URL=https://api.rera-provider.com/api/v1

# Optional: Partner API Key
RERA_PARTNER_API_KEY=your-partner-api-key-here
```

### API Contract Expected

The partner API should accept POST requests with this format:

```json
POST /verify
Headers:
  Content-Type: application/json
  X-API-Key: your-api-key

Body:
{
  "rera_number": "TN/01/Building/0001/2016",
  "state": "Tamil Nadu",
  "type": "builder"
}

Response:
{
  "found": true,
  "data": {
    "registered_name": "Project Name",
    "registration_date": "2023-01-01",
    "expiry_date": "2028-01-01",
    "promoter_name": "Builder Name",
    "status": "active",
    "compliance_score": 100,
    "complaints": 0
  }
}
```

---

## 2. RERA Monitor API Key (Optional but Recommended)

### What is it?
A security key to protect the `/api/rera/monitor` endpoint from unauthorized access.

### Where to get it?
**You generate it yourself!** It's just a random secret string.

### How to generate:

#### Option A: Using OpenSSL (Recommended)
```bash
openssl rand -base64 32
```

#### Option B: Using Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### Option C: Using Python
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### Option D: Online Generator
Visit: https://randomkeygen.com/ and use a "CodeIgniter Encryption Keys" (256-bit)

### Configuration

```env
# Recommended: API key for monitoring endpoint
RERA_MONITOR_API_KEY=your-generated-secret-key-here
```

### Usage

When calling the monitoring endpoint, include the key:

```bash
curl -X POST https://your-domain.com/api/rera/monitor \
  -H "Authorization: Bearer your-generated-secret-key-here" \
  -H "Content-Type: application/json"
```

Or:

```bash
curl -X POST https://your-domain.com/api/rera/monitor \
  -H "X-API-Key: your-generated-secret-key-here" \
  -H "Content-Type: application/json"
```

---

## 3. Supabase Service Role Key (Already Configured)

### What is it?
The Supabase service role key that gives full database access. This is already configured in your project.

### Where to find it?
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Find **Service Role Key** (keep it secret!)
5. Copy the key

### Configuration

```env
# Already configured in your project
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
# OR
SUPABASE_SERVICE_ROLE=your-service-role-key-here
```

**⚠️ Important**: Never expose this key in client-side code. It has full database access.

---

## Complete Environment Variables Setup

### Required Variables (Already Set)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Optional RERA Variables
```env
# Enable/disable synthetic RERA data (for testing)
USE_SYNTHETIC_RERA=true  # Set to false for real scraping

# Optional: Partner API
RERA_PARTNER_API_URL=https://api.rera-provider.com/api/v1
RERA_PARTNER_API_KEY=your-partner-api-key

# Optional: Monitor API Key (recommended for production)
RERA_MONITOR_API_KEY=your-generated-secret-key
```

---

## Where to Set Environment Variables

### Local Development (.env.local)
Create `app/.env.local`:
```env
USE_SYNTHETIC_RERA=true
RERA_MONITOR_API_KEY=your-local-key
```

### Vercel
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable for the appropriate environments (Production, Preview, Development)

### Netlify
1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add each variable

### Supabase Edge Functions
For edge functions, set in Supabase Dashboard:
1. Go to **Edge Functions** → **Settings**
2. Add secrets via CLI:
```bash
supabase secrets set RERA_MONITOR_API_KEY=your-key
```

---

## Testing Your Configuration

### Test Partner API (if configured)
```bash
curl -X POST https://your-domain.com/api/rera/verify \
  -H "Content-Type: application/json" \
  -d '{
    "rera_number": "TN/01/Building/0001/2016",
    "state": "Tamil Nadu"
  }'
```

### Test Monitor Endpoint
```bash
curl -X POST https://your-domain.com/api/rera/monitor \
  -H "Authorization: Bearer your-RERA_MONITOR_API_KEY" \
  -H "Content-Type: application/json"
```

---

## Security Best Practices

1. **Never commit API keys to Git**
   - Add `.env.local` to `.gitignore`
   - Use environment variables in production

2. **Rotate keys regularly**
   - Change `RERA_MONITOR_API_KEY` every 90 days
   - Update partner API keys when they expire

3. **Use different keys for different environments**
   - Development, staging, and production should have separate keys

4. **Monitor API usage**
   - Check logs for unauthorized access attempts
   - Set up alerts for unusual activity

---

## Troubleshooting

### "Partner API not configured" warning
- This is normal if you're not using a partner API
- The system will fall back to web scraping

### "Unauthorized" error on monitor endpoint
- Check that `RERA_MONITOR_API_KEY` is set correctly
- Verify the Authorization header format: `Bearer your-key`

### Partner API returns errors
- Verify the API URL and key are correct
- Check the API documentation for the expected request format
- The system will fall back to web scraping if partner API fails

---

## Summary

| Variable | Required | Where to Get | Purpose |
|----------|----------|--------------|---------|
| `RERA_PARTNER_API_URL` | No | Third-party provider | Faster RERA verification |
| `RERA_PARTNER_API_KEY` | No | Third-party provider | Authenticate with partner API |
| `RERA_MONITOR_API_KEY` | Recommended | Generate yourself | Secure monitoring endpoint |
| `USE_SYNTHETIC_RERA` | No | Set to true/false | Enable/disable real scraping |

**For most users**: You only need to generate `RERA_MONITOR_API_KEY` for production. The partner API is optional and only needed if you want faster verification than web scraping.






















