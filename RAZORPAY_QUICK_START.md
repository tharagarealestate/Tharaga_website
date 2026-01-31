# Razorpay Integration - Quick Start Checklist

## ✅ Step-by-Step Checklist

### 1. Create Razorpay Plans (Dashboard)
- [ ] Login to https://dashboard.razorpay.com
- [ ] Go to **Settings** → **Plans**
- [ ] Create 6 plans:

| Plan Name | Amount | Billing | Plan ID (Copy This) |
|-----------|--------|---------|---------------------|
| builder_starter_monthly | ₹999 | Monthly | `plan_XXXXXXXXXXXXXX` |
| builder_starter_annual | ₹9,990 | Yearly | `plan_XXXXXXXXXXXXXX` |
| builder_professional_monthly | ₹2,999 | Monthly | `plan_XXXXXXXXXXXXXX` |
| builder_professional_annual | ₹29,990 | Yearly | `plan_XXXXXXXXXXXXXX` |
| builder_enterprise_monthly | ₹5,999 | Monthly | `plan_XXXXXXXXXXXXXX` |
| builder_enterprise_annual | ₹59,990 | Yearly | `plan_XXXXXXXXXXXXXX` |

### 2. Get Razorpay Credentials
- [ ] Go to **Settings** → **API Keys**
- [ ] Copy `Key ID`: `rzp_live_XXXXXXXXXXXXXX`
- [ ] Copy `Key Secret`: `your_secret_here`
- [ ] Go to **Settings** → **Webhooks** → Create webhook
- [ ] Copy `Webhook Secret`: `your_webhook_secret_here`

### 3. Set Environment Variables

Add these to your `.env` file and deployment platform:

```bash
RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=your_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

RZP_PLAN_STARTER_MONTHLY=plan_XXXXXXXXXXXXXX
RZP_PLAN_STARTER_ANNUAL=plan_XXXXXXXXXXXXXX
RZP_PLAN_PROFESSIONAL_MONTHLY=plan_XXXXXXXXXXXXXX
RZP_PLAN_PROFESSIONAL_ANNUAL=plan_XXXXXXXXXXXXXX
RZP_PLAN_ENTERPRISE_MONTHLY=plan_XXXXXXXXXXXXXX
RZP_PLAN_ENTERPRISE_ANNUAL=plan_XXXXXXXXXXXXXX
```

### 4. Configure Webhook
- [ ] Go to **Settings** → **Webhooks** in Razorpay
- [ ] Add webhook URL: `https://yourdomain.com/api/webhooks/razorpay`
- [ ] Select events:
  - ✅ `subscription.activated`
  - ✅ `subscription.charged`
  - ✅ `subscription.cancelled`
  - ✅ `payment.captured`
  - ✅ `payment.failed`
  - ✅ `invoice.paid`
- [ ] Save webhook secret to `RAZORPAY_WEBHOOK_SECRET`

### 5. Test
- [ ] Use test mode first
- [ ] Test subscription creation
- [ ] Test payment with card: `4111 1111 1111 1111`
- [ ] Verify webhook events are received
- [ ] Check database for subscription record

### 6. Deploy
- [ ] Update environment variables in production
- [ ] Use Live Mode API keys
- [ ] Update webhook URL to production domain
- [ ] Test with real payment (small amount)

---

## 📝 Important Notes

1. **Amount in Paise**: Razorpay uses paise. ₹999 = 99900 paise
2. **Plan IDs**: Must start with `plan_` prefix
3. **Webhook URL**: Must be HTTPS in production
4. **Test First**: Always test in Test Mode before going live

---

## 🔗 API Usage

When creating a subscription from your frontend:

```typescript
const response = await fetch('/api/rzp/create-subscription', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    plan: 'starter', // or 'professional', 'enterprise'
    annual: false, // or true for yearly
    email: user.email,
    phone: user.phone
  })
});

const { id, short_url } = await response.json();
// Redirect user to short_url to complete payment
```

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "Plan IDs not configured" | Check all 6 environment variables are set |
| "Invalid plan_id" | Verify Plan ID from Razorpay dashboard |
| Webhook fails | Check webhook secret matches |
| Payment not captured | Verify webhook events are enabled |

---

For detailed instructions, see `RAZORPAY_PRICING_SETUP_GUIDE.md`

