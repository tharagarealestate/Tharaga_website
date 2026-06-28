# .env.production Analysis and Cleanup Plan

## Current Status

Based on analysis of `.env.production` and codebase usage:

### ✅ Good News
1. **No `SUPABASE_SERVICE_ROLE` duplicate** - The file only has `SUPABASE_SERVICE_ROLE_KEY` (correct!)
2. Most variables are properly used

### ⚠️ Issues Found

#### 1. RESEND_WEBHOOK_SECRET Duplicate
- `RESEND_WEBHOOK_SECRET` = `whsec_6ye4RO8LdTMW1yAY8qOJEGKEfazhmeR1`
- `RESEND_WEBHOOK_SECRET_ALT` = `whsec_6ye4RO8LdTMW1yAY8qOJEGKEfazhmeR1` (same value!)

**Action**: Remove `RESEND_WEBHOOK_SECRET_ALT` - it's a duplicate with the same value.

#### 2. Netlify Functions Using Wrong Variable Name
Some Netlify functions still use `SUPABASE_SERVICE_ROLE` instead of `SUPABASE_SERVICE_ROLE_KEY`:
- `netlify/functions/properties-list.js` - uses `SUPABASE_SERVICE_ROLE`
- `netlify/functions/push-subscribe.js` - uses `SUPABASE_SERVICE_ROLE`
- `netlify/functions/push-send.js` - uses `SUPABASE_SERVICE_ROLE`
- `netlify/functions/lead-create.js` - uses `SUPABASE_SERVICE_ROLE`
- `netlify/functions/admin-properties-list.js` - uses `SUPABASE_SERVICE_ROLE`
- `netlify/functions/admin-verify-property.js` - uses `SUPABASE_SERVICE_ROLE`
- `netlify/functions/admin-metrics.js` - uses `SUPABASE_SERVICE_ROLE`
- `netlify/functions/admin-leads-list.js` - uses `SUPABASE_SERVICE_ROLE`
- `netlify/functions/admin-builders-list.js` - uses `SUPABASE_SERVICE_ROLE`
- `netlify/functions/admin-builder-update.js` - uses `SUPABASE_SERVICE_ROLE`

**Note**: `authCheckEmail.js` already has fallback: `process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE`

**Action**: Update these functions to use `SUPABASE_SERVICE_ROLE_KEY` OR keep both variables (but that adds to 4KB limit).

### 📋 Intentional Pairs (NOT Duplicates)

These are intentional and should be kept:
- `SUPABASE_URL` (server-side) + `NEXT_PUBLIC_SUPABASE_URL` (client-side)
- `SUPABASE_ANON_KEY` (server-side) + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client-side)
- `RAZORPAY_KEY_ID` (server-side) + `NEXT_PUBLIC_RAZORPAY_KEY_ID` (client-side)

### 🎯 Recommended Actions

1. **Remove `RESEND_WEBHOOK_SECRET_ALT`** from `.env.production` (duplicate)
2. **Update Netlify functions** to use `SUPABASE_SERVICE_ROLE_KEY` consistently
3. **Verify** all variables in Netlify dashboard match `.env.production` (remove any duplicates there)

### 📊 Variable Count Analysis

Current variables in `.env.production`: ~48 variables
After cleanup (removing `RESEND_WEBHOOK_SECRET_ALT`): ~47 variables

This alone won't solve the 4KB limit, but it's a step in the right direction.
