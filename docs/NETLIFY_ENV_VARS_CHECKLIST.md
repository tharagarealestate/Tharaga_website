# Netlify Environment Variables Checklist

## Required Environment Variables

These variables MUST be set in Netlify for the application to build and run:

### Supabase (Required)
- `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (for client-side)
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SERVICE_ROLE` - Supabase service role key (for server-side)

**Note:** The build script (`scripts/ensure-next-public-env.mjs`) will automatically map `SUPABASE_URL` → `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_ANON_KEY` → `NEXT_PUBLIC_SUPABASE_ANON_KEY` if the `NEXT_PUBLIC_*` versions are not set.

### Application URL (Recommended)
- `NEXT_PUBLIC_APP_URL` - Base URL of your application (defaults to `https://tharaga.co.in`)

## Optional Environment Variables

These are optional but enable specific features:

### Razorpay (For Payment Processing)
- `RAZORPAY_KEY_ID` - Razorpay key ID
- `RAZORPAY_KEY_SECRET` - Razorpay key secret
- `RAZORPAY_WEBHOOK_SECRET` - Razorpay webhook secret for signature verification

**Note:** If not set, payment features will not work, but the app will still build and run.

### Resend (For Email Sending)
- `RESEND_API_KEY` - Resend API key for sending emails
- `RESEND_FROM_EMAIL` - Default from email address (defaults to `Tharaga <leads@tharaga.co.in>`)

**Note:** If not set, emails will be logged but not sent. The app will still build and run.

### RERA Partner API (For RERA Verification)
- `RERA_PARTNER_API_KEY` - Partner API key for RERA verification
- `RERA_PARTNER_API_URL` - Partner API URL

**Note:** If not set, RERA verification will fall back to manual verification queue.

### Zoho CRM (Optional)
- `ZOHO_CLIENT_ID` - Zoho CRM client ID
- `ZOHO_CLIENT_SECRET` - Zoho CRM client secret
- `ZOHO_REDIRECT_URI` - Zoho CRM redirect URI

**Note:** If not set, Zoho CRM integration will not work, but the app will still build and run.

## How Services Handle Missing Variables

All services now use **lazy initialization**, meaning:

1. ✅ **Build Time**: Services do NOT initialize during build, so missing env vars won't cause build failures
2. ✅ **Runtime**: Services only initialize when actually called
3. ✅ **Error Handling**: Services throw errors only when called without required vars, not during build

### Service-Specific Behavior

- **Revenue Service**: Requires Supabase + Razorpay (throws only when payment methods are called)
- **Email Service**: Requires Resend (logs warning, returns null if not configured)
- **RERA Service**: Requires Supabase (falls back to manual verification if partner API not configured)
- **Webhook Service**: Requires Supabase (throws only when webhook methods are called)
- **Team Management**: Requires Supabase (throws only when team methods are called)
- **AI Insights**: Requires Supabase (throws only when insight methods are called)
- **Sitemap Generator**: Requires Supabase (throws only when sitemap generation is called)

## Netlify Setup Steps

1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Add all **Required** variables listed above
3. Add **Optional** variables as needed for your features
4. Trigger a new deployment

## Verification

After setting environment variables, verify:

1. ✅ Build completes successfully (check Netlify build logs)
2. ✅ No "Supabase URL and service role key are required" errors during build
3. ✅ Application loads correctly on the deployed site
4. ✅ Features that require optional vars show appropriate warnings/logs (not errors)

## Troubleshooting

### Build Fails with "Supabase URL and service role key are required"
- **Cause**: A service is being initialized at build time (should not happen with lazy init)
- **Fix**: Check if any service is being imported and called at module level

### Runtime Errors for Optional Services
- **Cause**: Optional service called without required env vars
- **Fix**: Either set the required env vars or ensure the feature is not being used

### NEXT_PUBLIC_* Variables Not Available Client-Side
- **Cause**: Variables not set in Netlify or build script failed
- **Fix**: Ensure `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set (build script will map them)

