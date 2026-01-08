# Netlify Environment Variable 4KB Limit Fix

## Problem

Netlify passes ALL environment variables to ALL Lambda functions. AWS Lambda has a 4KB limit on environment variables per function. With 60+ environment variables, the total size exceeds this limit, causing deployment failures.

## Error Message

```
Failed to create function: invalid parameter for function creation: Your environment variables exceed the 4KB limit imposed by AWS Lambda.
```

## Solution Options

### Option 1: Configure Function-Specific Environment Variables (Recommended)

Configure each function to only receive the environment variables it needs via Netlify UI:

1. Go to Netlify Dashboard → Site Settings → Functions
2. For each function, click "Edit" and configure only the required environment variables
3. See the "Required Variables Per Function" section below

### Option 2: Remove Duplicate Environment Variables

Several environment variables are duplicated. Remove one of each pair:

**Duplicates to Remove:**
- `SUPABASE_SERVICE_ROLE` (keep `SUPABASE_SERVICE_ROLE_KEY` only)
- Consider consolidating `SUPABASE_URL` usage (functions should use `SUPABASE_URL`, Next.js uses `NEXT_PUBLIC_SUPABASE_URL`)

### Option 3: Use Build-Time Only Variables

Move variables that are ONLY needed during build (not at runtime) to `[build.environment]` in `netlify.toml`. However, note that Netlify may still pass these to functions.

## Required Environment Variables Per Function

### Common Variables (Required by Most Functions)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SERVICE_ROLE`
- `SUPABASE_ANON_KEY` (for admin functions that verify users)

### Function-Specific Variables

#### Admin Functions
- `admin-stats.mjs`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`
- `admin-get-builders.mjs`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`
- `admin-verify-builder.mjs`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `URL`
- `admin-properties-list.js`: `ADMIN_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`
- `admin-metrics.js`: `ADMIN_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`
- `admin-leads-list.js`: `ADMIN_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`
- `admin-builders-list.js`: `ADMIN_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`
- `admin-builder-update.js`: `ADMIN_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`
- `admin-verify-property.js`: `ADMIN_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`

#### Payment Functions
- `stripeWebhook.js`: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`
- `stripeCheckout.js`: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_GROWTH`, `STRIPE_PRICE_SCALE`, `STRIPE_PRICE_GROWTH_ANNUAL`, `STRIPE_PRICE_SCALE_ANNUAL`, `CHECKOUT_SUCCESS_URL`, `CHECKOUT_CANCEL_URL`
- `stripePortal.js`: `STRIPE_SECRET_KEY`, `PORTAL_RETURN_URL`
- `razorpayWebhook.js`: `RAZORPAY_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`
- `razorpayCreateSubscription.js`: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RZP_PLAN_GROWTH`, `RZP_PLAN_SCALE`, `RZP_PLAN_GROWTH_ANNUAL`, `RZP_PLAN_SCALE_ANNUAL`

#### User Management Functions
- `user-roles.mjs`: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- `user-add-role.mjs`: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- `user-switch-role.mjs`: `SUPABASE_URL`, `SUPABASE_ANON_KEY`

#### Other Functions
- `lead-create.js`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`, `SLACK_WEBHOOK_URL`
- `properties-list.js`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`
- `push-subscribe.js`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`
- `push-send.js`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`
- `digest-send.js`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`, `RESEND_API_KEY`
- `authCheckEmail.js`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SERVICE_ROLE`
- `send-verification-email.mjs`: `SENDGRID_API_KEY`
- `recommendations.js`: `BACKEND_URL`
- `api.js`: `BACKEND_URL`

## Quick Fix Steps

### Step 1: Remove Duplicate Variables in Netlify UI

1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Remove `SUPABASE_SERVICE_ROLE` (keep only `SUPABASE_SERVICE_ROLE_KEY`)
3. Verify no other duplicates exist

### Step 2: Verify Function-Specific Configuration (Optional but Recommended)

For critical functions, configure them individually in Netlify UI to only include required variables. This ensures they don't exceed the 4KB limit even if new variables are added later.

## Alternative: Reduce Total Environment Variables

If you have many unused environment variables, consider:

1. Reviewing all environment variables in Netlify Dashboard
2. Removing variables that are no longer used
3. Moving rarely-used variables to a configuration service/database

## Note

The Next.js application itself uses `NEXT_PUBLIC_*` environment variables, which are embedded at build time and don't affect function environment variable limits.











