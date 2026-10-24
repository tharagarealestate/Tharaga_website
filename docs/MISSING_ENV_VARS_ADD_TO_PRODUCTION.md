# Missing Environment Variables - Add to .env.production

## 🔴 Critical Missing Variables (Add Immediately)

Add these variables to your `.env.production` file:

```bash
# Critical Security
INTERNAL_API_KEY=your-strong-random-secret-key-here
NEXT_PUBLIC_ADMIN_TOKEN=your-admin-auth-token-here

# Twilio WhatsApp Webhook (if using WhatsApp features)
TWILIO_PHONE_NUMBER_SID=your-twilio-phone-number-sid-here
```

## 🟡 Optional Variables (Add if using these features)

### WordPress SEO Integration (if using SEO content publishing)
```bash
WORDPRESS_URL=https://your-wordpress-site.com
WORDPRESS_JWT_TOKEN=your-wordpress-jwt-token-here
GOOGLE_INDEXING_API_TOKEN=your-google-indexing-api-token-here
```

### Marketing Automation - Paid Ads Tracking (if using paid advertising)
```bash
GOOGLE_ADS_CONVERSION_ID=your-google-ads-conversion-id
META_PIXEL_ID=your-meta-pixel-id
LINKEDIN_PARTNER_ID=your-linkedin-partner-id
```

### Influencer Outreach (if using influencer marketing features)
```bash
HYPEAUDITOR_API_KEY=your-hypeauditor-api-key
CISION_API_KEY=your-cision-api-key
PRNEWSWIRE_API_KEY=your-prnewswire-api-key
```

### AI Image Generation (if using virtual staging)
```bash
STABILITY_AI_API_KEY=your-stability-ai-api-key
```

### Newsletter Automation
```bash
GOOGLE_ALERTS_RSS_URL=https://www.google.com/alerts/feeds/...
```

## 📝 Instructions

1. Open `.env.production` file in root directory
2. Add the critical variables first (INTERNAL_API_KEY, NEXT_PUBLIC_ADMIN_TOKEN)
3. Add optional variables only if you're using those specific features
4. Never commit `.env.production` to git (already in .gitignore)
5. Add the same variables to your deployment platform (Netlify/Vercel) environment settings

## ⚠️ Important Notes

- **INTERNAL_API_KEY**: Generate a strong random key (e.g., using `openssl rand -hex 32`)
- **NEXT_PUBLIC_ADMIN_TOKEN**: Generate a unique token for admin dashboard access
- **TWILIO_PHONE_NUMBER_SID**: Found in Twilio Console → Phone Numbers → your number
- Most optional variables have fallback behavior if not set, so they won't break functionality

## 🔒 Security Reminder

- Never share these values
- Use different values for development and production
- Rotate keys periodically
- Monitor for unauthorized access











































