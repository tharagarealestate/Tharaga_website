# Email Automation - Environment Variables Configuration

## ✅ Generated CRON_SECRET

**CRON_SECRET**: `hdN8SGSEsSulptdqHg0O2Yss2lpxXwKUlDvMZM3ABso=`

**Usage**: This secret is used to authenticate cron job requests from n8n to your API endpoints.

---

## 📋 Complete Environment Variables Checklist

### ✅ Already Configured
- [x] **RESEND_WEBHOOK_SECRET**: `whsec_b2akJsaEFVZl8i6fKAnztSqHxqIEi/cU`

### 🔑 Required Environment Variables

#### 1. **Tharaga API Configuration**
```bash
THARAGA_API_URL=https://tharaga.co.in
THARAGA_API_KEY=your-api-key-here  # ⚠️ NEED TO CONFIGURE
CRON_SECRET=hdN8SGSEsSulptdqHg0O2Yss2lpxXwKUlDvMZM3ABso=  # ✅ GENERATED
```

#### 2. **Resend Email Service**
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx  # ⚠️ NEED TO CONFIGURE
RESEND_WEBHOOK_SECRET=whsec_b2akJsaEFVZl8i6fKAnztSqHxqIEi/cU  # ✅ CONFIGURED
RESEND_FROM_EMAIL=noreply@tharaga.co.in  # ⚠️ NEED TO CONFIGURE
```

#### 3. **Supabase Database**
```bash
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co  # ⚠️ NEED TO CONFIGURE
SUPABASE_SERVICE_ROLE_KEY=xxxxxxxxxxxxx  # ⚠️ NEED TO CONFIGURE
```

#### 4. **Anthropic AI (Claude)**
```bash
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx  # ⚠️ NEED TO CONFIGURE
```

---

## 🔧 Where to Configure These Variables

### Option 1: n8n Environment Variables
1. Go to your n8n instance
2. Navigate to **Settings** → **Credentials** → **Environment Variables**
3. Add each variable listed above

### Option 2: Application Environment Variables
If you're running the application directly (not through n8n), add these to:
- `.env.local` (for local development)
- Production environment variables (Vercel/Netlify/etc.)

---

## 📝 Configuration Steps

### Step 1: Get Resend API Key
1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Create a new API key
3. Copy the key (starts with `re_`)
4. Add to `RESEND_API_KEY`

### Step 2: Verify Resend Domain
1. Go to [Resend Domains](https://resend.com/domains)
2. Verify `tharaga.co.in` domain
3. Configure DKIM/SPF records
4. Set `RESEND_FROM_EMAIL` to verified email

### Step 3: Get Supabase Credentials
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

### Step 4: Get Anthropic API Key
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Navigate to **API Keys**
3. Create a new API key
4. Copy the key (starts with `sk-ant-`)
5. Add to `ANTHROPIC_API_KEY`

### Step 5: Generate THARAGA_API_KEY
1. This should be a secure API key for your application
2. Generate using: `openssl rand -base64 32`
3. Store securely and add to `THARAGA_API_KEY`

---

## 🔐 Security Best Practices

1. **Never commit secrets to Git**
   - Add `.env.local` to `.gitignore`
   - Use environment variable management tools

2. **Use different keys for different environments**
   - Development: `CRON_SECRET_DEV`
   - Production: `CRON_SECRET_PROD`

3. **Rotate secrets regularly**
   - Change `CRON_SECRET` every 90 days
   - Rotate API keys if compromised

4. **Restrict API key permissions**
   - Use least privilege principle
   - Limit scope of each key

---

## ✅ Verification Checklist

After configuring all variables, verify:

- [ ] All 9 environment variables are set
- [ ] `CRON_SECRET` is added to n8n credentials
- [ ] `RESEND_WEBHOOK_SECRET` matches Resend dashboard
- [ ] Resend domain is verified
- [ ] Supabase connection works
- [ ] Anthropic API key is valid
- [ ] Test endpoints respond correctly

---

## 🧪 Test Configuration

### Test CRON_SECRET:
```bash
curl -X POST https://tharaga.co.in/api/automation/email/process-sequence-queue \
  -H "Authorization: Bearer hdN8SGSEsSulptdqHg0O2Yss2lpxXwKUlDvMZM3ABso=" \
  -H "Content-Type: application/json"
```

### Test Resend Webhook:
1. Send a test email via Resend
2. Check webhook logs in Resend dashboard
3. Verify events are received at `/api/webhooks/resend`

---

## 📞 Support

If you encounter issues:
1. Check n8n execution logs
2. Verify environment variables are set correctly
3. Test API endpoints individually
4. Contact: tech@tharaga.co.in

---

**Generated**: January 2025
**CRON_SECRET**: `hdN8SGSEsSulptdqHg0O2Yss2lpxXwKUlDvMZM3ABso=`
**Status**: Ready for configuration






