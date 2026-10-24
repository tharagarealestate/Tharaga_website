# Razorpay Production Configuration

## 🔐 API Credentials (Live Mode)

```bash
RAZORPAY_KEY_ID=rzp_live_Rl1YtIxc7Oxr7w
RAZORPAY_KEY_SECRET=HCuBVkSEPq37BObkeDHIx7K7
```

## 🔗 Webhook Configuration

**Webhook URL**: `https://tharaga.co.in/api/webhooks/razorpay`

**Webhook Secret**: (Get this from Razorpay Dashboard → Settings → Webhooks)
- Copy the webhook secret and add it to `RAZORPAY_WEBHOOK_SECRET` environment variable

## 📋 Plan IDs (From Razorpay Dashboard)

### Builder Starter Plans
```bash
RZP_PLAN_STARTER_MONTHLY=plan_R10vbRMpp1REnR      # ₹999/month
RZP_PLAN_STARTER_ANNUAL=plan_R1119eAytZrt4K      # ₹9,990/year
```

### Builder Professional Plans
```bash
RZP_PLAN_PROFESSIONAL_MONTHLY=plan_R10wrI9bH8Uj7s  # ₹2,999/month
RZP_PLAN_PROFESSIONAL_ANNUAL=plan_R112vIHWdH1YaL  # ₹29,990/year
```

### Builder Enterprise Plans
```bash
RZP_PLAN_ENTERPRISE_MONTHLY=plan_Rl0yjA9bcQrsAn    # ₹5,999/month
RZP_PLAN_ENTERPRISE_ANNUAL=plan_R114Se4JD0v3k0    # ₹59,990/year
```

## 📝 Complete Environment Variables for Production

Add these to your production environment (Vercel/Netlify/Server):

```bash
# Razorpay API Credentials
RAZORPAY_KEY_ID=rzp_live_Rl1YtIxc7Oxr7w
RAZORPAY_KEY_SECRET=HCuBVkSEPq37BObkeDHIx7K7
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_from_dashboard

# Builder Starter Plans
RZP_PLAN_STARTER_MONTHLY=plan_R10vbRMpp1REnR
RZP_PLAN_STARTER_ANNUAL=plan_R1119eAytZrt4K

# Builder Professional Plans
RZP_PLAN_PROFESSIONAL_MONTHLY=plan_R10wrI9bH8Uj7s
RZP_PLAN_PROFESSIONAL_ANNUAL=plan_R112vIHWdH1YaL

# Builder Enterprise Plans
RZP_PLAN_ENTERPRISE_MONTHLY=plan_Rl0yjA9bcQrsAn
RZP_PLAN_ENTERPRISE_ANNUAL=plan_R114Se4JD0v3k0
```

## ✅ Next Steps

1. **Get Webhook Secret**:
   - Go to Razorpay Dashboard → Settings → Webhooks
   - Find your webhook for `https://tharaga.co.in/api/webhooks/razorpay`
   - Copy the webhook secret
   - Add it to `RAZORPAY_WEBHOOK_SECRET` environment variable

2. **Set Environment Variables**:
   - **Vercel**: Go to Project Settings → Environment Variables → Add all variables
   - **Netlify**: Go to Site Settings → Environment Variables → Add all variables
   - **Server**: Add to your `.env` file or environment configuration

3. **Verify Webhook**:
   - Ensure webhook URL is set in Razorpay: `https://tharaga.co.in/api/webhooks/razorpay`
   - Enable these events:
     - `subscription.activated`
     - `subscription.charged`
     - `subscription.cancelled`
     - `payment.captured`
     - `payment.failed`
     - `invoice.paid`

4. **Test**:
   - Create a test subscription
   - Verify webhook events are received
   - Check database for subscription records

## 🔒 Security Notes

- ⚠️ **Never commit** `.env.production` or this file to git
- ⚠️ Keep API keys and secrets secure
- ⚠️ Rotate keys periodically
- ⚠️ Use different keys for test and production

## 📊 Plan Mapping

| Plan Name | Monthly Plan ID | Annual Plan ID | Amount |
|-----------|----------------|----------------|--------|
| Starter | `plan_R10vbRMpp1REnR` | `plan_R1119eAytZrt4K` | ₹999/mo, ₹9,990/yr |
| Professional | `plan_R10wrI9bH8Uj7s` | `plan_R112vIHWdH1YaL` | ₹2,999/mo, ₹29,990/yr |
| Enterprise | `plan_Rl0yjA9bcQrsAn` | `plan_R114Se4JD0v3k0` | ₹5,999/mo, ₹59,990/yr |

