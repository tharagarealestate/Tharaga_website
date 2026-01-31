# Razorpay Pricing Configuration Guide

This guide explains how to sync your new builder pricing tiers (Starter ₹999, Professional ₹2,999, Enterprise ₹5,999) with Razorpay subscriptions.

## 📋 Table of Contents
1. [Overview](#overview)
2. [Step 1: Create Plans in Razorpay Dashboard](#step-1-create-plans-in-razorpay-dashboard)
3. [Step 2: Configure Environment Variables](#step-2-configure-environment-variables)
4. [Step 3: Update Code to Use New Plan Names](#step-3-update-code-to-use-new-plan-names)
5. [Step 4: Configure Webhooks](#step-4-configure-webhooks)
6. [Step 5: Testing](#step-5-testing)
7. [Troubleshooting](#troubleshooting)

---

## Overview

Your new pricing structure:
- **Builder Starter**: ₹999/month (₹9,990/year)
- **Builder Professional**: ₹2,999/month (₹29,990/year)
- **Builder Enterprise**: ₹5,999/month (₹59,990/year)

You need to create **6 Razorpay Plans** (3 tiers × 2 billing cycles).

---

## Step 1: Create Plans in Razorpay Dashboard

### 1.1 Login to Razorpay Dashboard
1. Go to https://dashboard.razorpay.com
2. Login with your Razorpay account credentials
3. Navigate to **Settings** → **Plans** (or **Subscriptions** → **Plans**)

### 1.2 Create Monthly Plans

#### Plan 1: Builder Starter Monthly
- **Plan Name**: `builder_starter_monthly`
- **Description**: `Builder Starter Plan - Monthly Subscription`
- **Amount**: `₹999` (99900 paise)
- **Billing Period**: `Monthly`
- **Billing Frequency**: `1` (every 1 month)
- **Plan Type**: `Recurring`
- **Add-ons**: None
- **Notes**:
  ```json
  {
    "tier": "starter",
    "billing_cycle": "monthly",
    "plan_type": "builder"
  }
  ```
- Click **Create Plan**
- **Copy the Plan ID** (e.g., `plan_XXXXXXXXXXXXXX`)

#### Plan 2: Builder Professional Monthly
- **Plan Name**: `builder_professional_monthly`
- **Description**: `Builder Professional Plan - Monthly Subscription`
- **Amount**: `₹2,999` (299900 paise)
- **Billing Period**: `Monthly`
- **Billing Frequency**: `1`
- **Plan Type**: `Recurring`
- **Notes**:
  ```json
  {
    "tier": "professional",
    "billing_cycle": "monthly",
    "plan_type": "builder"
  }
  ```
- Click **Create Plan**
- **Copy the Plan ID**

#### Plan 3: Builder Enterprise Monthly
- **Plan Name**: `builder_enterprise_monthly`
- **Description**: `Builder Enterprise Plan - Monthly Subscription`
- **Amount**: `₹5,999` (599900 paise)
- **Billing Period**: `Monthly`
- **Billing Frequency**: `1`
- **Plan Type**: `Recurring`
- **Notes**:
  ```json
  {
    "tier": "enterprise",
    "billing_cycle": "monthly",
    "plan_type": "builder"
  }
  ```
- Click **Create Plan**
- **Copy the Plan ID**

### 1.3 Create Annual Plans

#### Plan 4: Builder Starter Annual
- **Plan Name**: `builder_starter_annual`
- **Description**: `Builder Starter Plan - Annual Subscription (Save 17%)`
- **Amount**: `₹9,990` (999000 paise)
- **Billing Period**: `Yearly` (or `Monthly` with frequency 12)
- **Billing Frequency**: `12` (if using Monthly period)
- **Plan Type**: `Recurring`
- **Notes**:
  ```json
  {
    "tier": "starter",
    "billing_cycle": "annual",
    "plan_type": "builder",
    "discount": "17%"
  }
  ```
- Click **Create Plan**
- **Copy the Plan ID**

#### Plan 5: Builder Professional Annual
- **Plan Name**: `builder_professional_annual`
- **Description**: `Builder Professional Plan - Annual Subscription (Save 17%)`
- **Amount**: `₹29,990` (2999000 paise)
- **Billing Period**: `Yearly` (or `Monthly` with frequency 12)
- **Billing Frequency**: `12`
- **Plan Type**: `Recurring`
- **Notes**:
  ```json
  {
    "tier": "professional",
    "billing_cycle": "annual",
    "plan_type": "builder",
    "discount": "17%"
  }
  ```
- Click **Create Plan**
- **Copy the Plan ID**

#### Plan 6: Builder Enterprise Annual
- **Plan Name**: `builder_enterprise_annual`
- **Description**: `Builder Enterprise Plan - Annual Subscription (Save 17%)`
- **Amount**: `₹59,990` (5999000 paise)
- **Billing Period**: `Yearly` (or `Monthly` with frequency 12)
- **Billing Frequency**: `12`
- **Plan Type**: `Recurring`
- **Notes**:
  ```json
  {
    "tier": "enterprise",
    "billing_cycle": "annual",
    "plan_type": "builder",
    "discount": "17%"
  }
  ```
- Click **Create Plan**
- **Copy the Plan ID**

### 1.4 Important Notes for Razorpay Plans

⚠️ **Important Configuration Tips:**
1. **Amount in Paise**: Razorpay uses paise (smallest currency unit). ₹999 = 99900 paise
2. **Billing Period**: For annual plans, you can either:
   - Use "Yearly" period with frequency 1
   - Use "Monthly" period with frequency 12 (recommended for better control)
3. **Plan ID Format**: Plan IDs look like `plan_XXXXXXXXXXXXXX` - save these carefully
4. **Test Mode**: Create plans in Test Mode first, then replicate in Live Mode

---

## Step 2: Configure Environment Variables

Add the following environment variables to your `.env` file and deployment platform (Vercel/Netlify):

### 2.1 Required Environment Variables

```bash
# Razorpay API Credentials
RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# Builder Starter Plans
RZP_PLAN_STARTER_MONTHLY=plan_XXXXXXXXXXXXXX
RZP_PLAN_STARTER_ANNUAL=plan_XXXXXXXXXXXXXX

# Builder Professional Plans
RZP_PLAN_PROFESSIONAL_MONTHLY=plan_XXXXXXXXXXXXXX
RZP_PLAN_PROFESSIONAL_ANNUAL=plan_XXXXXXXXXXXXXX

# Builder Enterprise Plans
RZP_PLAN_ENTERPRISE_MONTHLY=plan_XXXXXXXXXXXXXX
RZP_PLAN_ENTERPRISE_ANNUAL=plan_XXXXXXXXXXXXXX
```

### 2.2 Where to Find Razorpay Credentials

1. **Key ID & Key Secret**:
   - Go to Razorpay Dashboard → **Settings** → **API Keys**
   - Copy `Key ID` and `Key Secret`
   - Use **Live Mode** keys for production

2. **Webhook Secret**:
   - Go to **Settings** → **Webhooks**
   - Create a new webhook endpoint (see Step 4)
   - Copy the `Webhook Secret` generated

### 2.3 Update Environment Variables in Different Platforms

#### Vercel
```bash
vercel env add RAZORPAY_KEY_ID
vercel env add RAZORPAY_KEY_SECRET
vercel env add RAZORPAY_WEBHOOK_SECRET
vercel env add RZP_PLAN_STARTER_MONTHLY
vercel env add RZP_PLAN_STARTER_ANNUAL
vercel env add RZP_PLAN_PROFESSIONAL_MONTHLY
vercel env add RZP_PLAN_PROFESSIONAL_ANNUAL
vercel env add RZP_PLAN_ENTERPRISE_MONTHLY
vercel env add RZP_PLAN_ENTERPRISE_ANNUAL
```

#### Netlify
1. Go to **Site Settings** → **Environment Variables**
2. Add each variable manually or use Netlify CLI:
```bash
netlify env:set RAZORPAY_KEY_ID "rzp_live_XXXXXXXXXXXXXX"
netlify env:set RAZORPAY_KEY_SECRET "your_secret"
# ... repeat for all variables
```

#### Local Development (.env.local)
Create/update `.env.local`:
```bash
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXX  # Use test keys for local dev
RAZORPAY_KEY_SECRET=your_test_secret
RAZORPAY_WEBHOOK_SECRET=your_test_webhook_secret
RZP_PLAN_STARTER_MONTHLY=plan_test_XXXXXXXXXXXXXX
RZP_PLAN_STARTER_ANNUAL=plan_test_XXXXXXXXXXXXXX
RZP_PLAN_PROFESSIONAL_MONTHLY=plan_test_XXXXXXXXXXXXXX
RZP_PLAN_PROFESSIONAL_ANNUAL=plan_test_XXXXXXXXXXXXXX
RZP_PLAN_ENTERPRISE_MONTHLY=plan_test_XXXXXXXXXXXXXX
RZP_PLAN_ENTERPRISE_ANNUAL=plan_test_XXXXXXXXXXXXXX
```

---

## Step 3: Update Code to Use New Plan Names

The code needs to be updated to map the new pricing tiers to Razorpay plan IDs. Here's what needs to change:

### 3.1 Update Subscription Creation Route

The file `app/app/api/rzp/create-subscription/route.ts` needs to be updated to handle the new plan names:

**Current mapping** (needs update):
- `growth` → `RZP_PLAN_GROWTH`
- `scale` → `RZP_PLAN_SCALE`

**New mapping** (should be):
- `starter` → `RZP_PLAN_STARTER_MONTHLY` / `RZP_PLAN_STARTER_ANNUAL`
- `professional` → `RZP_PLAN_PROFESSIONAL_MONTHLY` / `RZP_PLAN_PROFESSIONAL_ANNUAL`
- `enterprise` → `RZP_PLAN_ENTERPRISE_MONTHLY` / `RZP_PLAN_ENTERPRISE_ANNUAL`

### 3.2 Code Changes Required

Update `app/app/api/rzp/create-subscription/route.ts`:

```typescript
// Replace the plan ID mapping section (around line 65-84)
const plan_starter_monthly = process.env.RZP_PLAN_STARTER_MONTHLY;
const plan_starter_annual = process.env.RZP_PLAN_STARTER_ANNUAL;
const plan_professional_monthly = process.env.RZP_PLAN_PROFESSIONAL_MONTHLY;
const plan_professional_annual = process.env.RZP_PLAN_PROFESSIONAL_ANNUAL;
const plan_enterprise_monthly = process.env.RZP_PLAN_ENTERPRISE_MONTHLY;
const plan_enterprise_annual = process.env.RZP_PLAN_ENTERPRISE_ANNUAL;

if (!plan_starter_monthly || !plan_professional_monthly || !plan_enterprise_monthly) {
  return NextResponse.json(
    { error: 'Razorpay plan IDs not configured' },
    { status: 500 }
  );
}

// Determine plan ID based on tier and billing cycle
const plan_id = (() => {
  if (plan === 'starter') {
    return annual ? (plan_starter_annual || plan_starter_monthly) : plan_starter_monthly;
  }
  if (plan === 'professional') {
    return annual ? (plan_professional_annual || plan_professional_monthly) : plan_professional_monthly;
  }
  if (plan === 'enterprise') {
    return annual ? (plan_enterprise_annual || plan_enterprise_monthly) : plan_enterprise_monthly;
  }
  // Fallback to professional if plan not recognized
  return annual ? (plan_professional_annual || plan_professional_monthly) : plan_professional_monthly;
})();
```

### 3.3 Update Frontend Pricing Page

When users click "Subscribe" on the pricing page, ensure the API call includes the correct plan name:

```typescript
// Example API call from pricing page
const response = await fetch('/api/rzp/create-subscription', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    plan: 'starter', // or 'professional', 'enterprise'
    annual: false, // or true for yearly
    email: user.email,
    phone: user.phone,
    notes: {
      source: 'pricing_page',
      tier: 'starter'
    }
  })
});
```

---

## Step 4: Configure Webhooks

### 4.1 Create Webhook Endpoint in Razorpay

1. Go to Razorpay Dashboard → **Settings** → **Webhooks**
2. Click **+ Add New Webhook**
3. Configure:
   - **Webhook URL**:
     - Production: `https://yourdomain.com/api/webhooks/razorpay`
     - Test: `https://yourdomain.com/api/webhooks/razorpay` (or use ngrok for local testing)
   - **Active Events**: Select all subscription-related events:
     - ✅ `subscription.activated`
     - ✅ `subscription.charged`
     - ✅ `subscription.cancelled`
     - ✅ `subscription.paused`
     - ✅ `subscription.resumed`
     - ✅ `payment.authorized`
     - ✅ `payment.captured`
     - ✅ `payment.failed`
     - ✅ `invoice.paid`
     - ✅ `invoice.payment_failed`
   - **Secret**: Copy the generated webhook secret (this is your `RAZORPAY_WEBHOOK_SECRET`)
4. Click **Create Webhook**

### 4.2 Webhook URL for Different Environments

- **Production**: `https://yourdomain.com/api/webhooks/razorpay`
- **Staging**: `https://staging.yourdomain.com/api/webhooks/razorpay`
- **Local Testing**: Use ngrok or similar:
  ```bash
  ngrok http 3000
  # Use the ngrok URL: https://xxxxx.ngrok.io/api/webhooks/razorpay
  ```

### 4.3 Verify Webhook is Working

After creating the webhook:
1. Razorpay will send a test event
2. Check your server logs to see if the webhook is received
3. Verify signature validation is working

---

## Step 5: Testing

### 5.1 Test Mode Setup

1. **Create Test Plans**: Create all 6 plans in Razorpay Test Mode first
2. **Use Test API Keys**: Use `rzp_test_...` keys for testing
3. **Test Webhook**: Use ngrok to expose local server for webhook testing

### 5.2 Test Subscription Flow

1. **Create Test Subscription**:
   ```bash
   curl -X POST https://yourdomain.com/api/rzp/create-subscription \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "plan": "starter",
       "annual": false,
       "email": "test@example.com"
     }'
   ```

2. **Verify Response**: Should return subscription ID and short_url
3. **Complete Payment**: Use Razorpay test cards:
   - Success: `4111 1111 1111 1111`
   - Failure: `4000 0000 0000 0002`
4. **Check Webhook**: Verify webhook events are received and processed

### 5.3 Test Cards (Razorpay Test Mode)

| Card Number | Scenario |
|------------|----------|
| `4111 1111 1111 1111` | Successful payment |
| `4000 0000 0000 0002` | Payment failure |
| `5104 0600 0000 0008` | 3D Secure authentication |

**CVV**: Any 3 digits (e.g., `123`)
**Expiry**: Any future date (e.g., `12/25`)

### 5.4 Verify Database Updates

After successful subscription:
1. Check `user_subscriptions` table in Supabase
2. Verify `razorpay_subscription_id` is stored
3. Verify `status` is set to `active`
4. Verify `billing_cycle` is correct (`monthly` or `yearly`)

---

## Troubleshooting

### Issue 1: "Razorpay plan IDs not configured"

**Solution**:
- Verify all environment variables are set correctly
- Check variable names match exactly (case-sensitive)
- Restart your server after adding environment variables

### Issue 2: "Invalid plan_id" error

**Solution**:
- Verify the Plan ID from Razorpay dashboard matches the environment variable
- Ensure you're using the correct mode (test vs live)
- Check for extra spaces or characters in the Plan ID

### Issue 3: Webhook signature verification fails

**Solution**:
- Verify `RAZORPAY_WEBHOOK_SECRET` matches the secret in Razorpay dashboard
- Ensure webhook endpoint receives raw body (not parsed JSON)
- Check that signature header `x-razorpay-signature` is being read correctly

### Issue 4: Subscription created but not activated

**Solution**:
- Check webhook events in Razorpay dashboard
- Verify webhook URL is accessible and returns 200 status
- Check server logs for webhook processing errors
- Ensure `subscription.charged` event is being handled

### Issue 5: Wrong plan ID being used

**Solution**:
- Verify the `plan` parameter in API request matches expected values (`starter`, `professional`, `enterprise`)
- Check the plan ID mapping logic in `create-subscription` route
- Add logging to see which plan ID is being selected

---

## Quick Reference: Plan ID Mapping

| Tier | Billing Cycle | Environment Variable | Razorpay Plan ID |
|------|---------------|---------------------|------------------|
| Starter | Monthly | `RZP_PLAN_STARTER_MONTHLY` | `plan_XXXXXXXXXXXXXX` |
| Starter | Annual | `RZP_PLAN_STARTER_ANNUAL` | `plan_XXXXXXXXXXXXXX` |
| Professional | Monthly | `RZP_PLAN_PROFESSIONAL_MONTHLY` | `plan_XXXXXXXXXXXXXX` |
| Professional | Annual | `RZP_PLAN_PROFESSIONAL_ANNUAL` | `plan_XXXXXXXXXXXXXX` |
| Enterprise | Monthly | `RZP_PLAN_ENTERPRISE_MONTHLY` | `plan_XXXXXXXXXXXXXX` |
| Enterprise | Annual | `RZP_PLAN_ENTERPRISE_ANNUAL` | `plan_XXXXXXXXXXXXXX` |

---

## Next Steps

1. ✅ Create all 6 plans in Razorpay dashboard
2. ✅ Copy Plan IDs and add to environment variables
3. ✅ Update code to use new plan names
4. ✅ Configure webhook endpoint
5. ✅ Test in Test Mode
6. ✅ Deploy to production with Live Mode keys
7. ✅ Monitor webhook events and subscription activations

---

## Support

If you encounter issues:
1. Check Razorpay Dashboard → **Logs** for API errors
2. Check your server logs for webhook processing
3. Verify environment variables are set correctly
4. Test with Razorpay test cards first

For Razorpay support: https://razorpay.com/support/

