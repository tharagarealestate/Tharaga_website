# Cron & Scheduled Jobs Environment Variables

This document lists all environment variables required for the cron and scheduled jobs system.

## Required Environment Variables

Add these to your `.env` file (or `.env.local` for local development):

```bash
# =============================================
# CRON & SCHEDULED JOBS CONFIGURATION
# =============================================

# Cron Configuration
# Secret token for securing the cron execution endpoint
# Used by external cron services (Vercel Cron, GitHub Actions)
# Generate a strong random token: openssl rand -hex 32
CRON_SECRET=your-secret-token-here

# =============================================
# Schedule Settings
# =============================================

# Maximum number of jobs that can run concurrently
# Default: 10
MAX_CONCURRENT_JOBS=10

# Job execution timeout in milliseconds
# Default: 300000 (5 minutes)
JOB_EXECUTION_TIMEOUT=300000

# Queue check interval in milliseconds
# How often the queue processor checks for pending jobs
# Default: 30000 (30 seconds)
QUEUE_CHECK_INTERVAL=30000

# =============================================
# Cleanup Settings
# =============================================

# Enable automatic cleanup of old job logs and queue items
# Default: true
AUTO_CLEANUP_ENABLED=true

# Number of days to keep completed/failed jobs before cleanup
# Default: 7
CLEANUP_OLDER_THAN_DAYS=7
```

## Optional Environment Variables

These are used by webhook integrations (for reference):

```bash
# Razorpay Webhook Secret
RAZORPAY_WEBHOOK_SECRET=your-razorpay-webhook-secret

# Zoho CRM Webhook Token
ZOHO_WEBHOOK_TOKEN=your-zoho-webhook-token
ZOHO_WEBHOOK_SECRET=your-zoho-webhook-secret

# Twilio Auth Token (for webhook verification)
TWILIO_AUTH_TOKEN=your-twilio-auth-token

# Resend Webhook Secret
RESEND_WEBHOOK_SECRET=your-resend-webhook-secret
```

## Generating CRON_SECRET

To generate a secure random token for `CRON_SECRET`:

```bash
# Using OpenSSL
openssl rand -hex 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using Python
python -c "import secrets; print(secrets.token_hex(32))"
```

## Setting Up in Different Environments

### Local Development

Create a `.env.local` file in the `app` directory:

```bash
cd app
cp .env.example .env.local
# Edit .env.local with your values
```

### Vercel

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add all required variables
4. Set `CRON_SECRET` for Production, Preview, and Development

### GitHub Actions

1. Go to your repository settings
2. Navigate to "Secrets and variables" > "Actions"
3. Add `CRON_SECRET` and `API_URL` secrets

### Other Platforms

Ensure these environment variables are set in your deployment platform's environment variable configuration.

## Default Values

If environment variables are not set, the system uses these defaults:

- `MAX_CONCURRENT_JOBS`: 10
- `JOB_EXECUTION_TIMEOUT`: 300000 (5 minutes)
- `QUEUE_CHECK_INTERVAL`: 30000 (30 seconds)
- `AUTO_CLEANUP_ENABLED`: true
- `CLEANUP_OLDER_THAN_DAYS`: 7
- `CRON_SECRET`: Not set (endpoint will warn in production but allow access)

## Security Notes

⚠️ **Important**: 
- Never commit `.env` files to version control
- Use strong, random values for `CRON_SECRET`
- Rotate secrets periodically
- Use different secrets for development, staging, and production
- Keep `CRON_SECRET` secure - it protects your cron endpoint from unauthorized access






