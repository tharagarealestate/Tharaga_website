# ⚡ Quick Start - Function-Specific Environment Variables

## 🎯 Goal
Configure each Netlify function to only receive the environment variables it needs (instead of all 50 variables).

## 📍 Where to Go
1. **Netlify Dashboard** → Your Site
2. **Site Settings** (gear icon)
3. **Functions** (left sidebar)

## 🔧 What to Do (For Each Function)

1. Click on function name
2. Find **"Environment variables"** section
3. **Uncheck** "Inherit all environment variables"
4. **Check ONLY** the variables listed below for that function
5. Click **Save**

## 📋 Quick Reference

### ✅ ALL Functions Need (Common):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

### 📧 Email Functions (`digest-send`):
Common (3) + `RESEND_API_KEY` + `RESEND_FROM_EMAIL` + `RESEND_FROM_NAME` + `RESEND_WEBHOOK_SECRET`

### 🔔 Push Functions (`push-subscribe`, `push-send`):
Common (3) + `VAPID_PRIVATE_KEY` + `VAPID_PUBLIC_KEY`

### 👤 Admin Functions (all `admin-*`):
Common (3) + `ADMIN_TOKEN` + `ADMIN_EMAIL`

### 💳 Payment Functions (`razorpayWebhook`, `razorpayCreateSubscription`):
Common (3) + `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` + `RAZORPAY_WEBHOOK_SECRET` + all 6 `RZP_PLAN_*` variables

### 💳 Stripe Functions (`stripeWebhook`, `stripeCheckout`, `stripePortal`):
Common (3) + `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`

### 📊 Simple Functions (everything else):
Common (3) only

## ⏱️ Time Estimate
- **Simple functions** (3 vars): ~1 min each = 10 min
- **Admin functions** (5 vars): ~2 min each = 18 min
- **Special functions** (5-12 vars): ~3 min each = 15 min
- **Total**: ~45 minutes

## ✅ Result
Each function gets only what it needs → **Well under 4KB limit** → **Deployment succeeds!**

For detailed instructions, see `NETLIFY_FUNCTION_SPECIFIC_ENV_SETUP.md`
