# Zoho OAuth Configuration Issue - Analysis & Fix

## 🔍 Problem Identified

The "Invalid Client" error is caused by a **redirect URI mismatch** between:
1. What's configured in `.env.production`
2. What the CRM dashboard endpoint expects
3. What's registered in your Zoho app

## 📋 Current Configuration

### From `.env.production`:
```env
ZOHO_CLIENT_ID=1000.067ETSWHZFEI3BF8EKNZ6VK2GJ3S3O
ZOHO_CLIENT_SECRET=801faf8bf5619d439bad82e5d35b5d00a10be3df68
ZOHO_REDIRECT_URI=https://tharaga.co.in/api/integrations/zoho/oauth
```

### What CRM Dashboard Uses:
- **Endpoint**: `/api/crm/zoho/connect`
- **Expected Callback**: `/api/crm/zoho/callback`
- **Current Redirect URI in env**: `/api/integrations/zoho/oauth` ❌ **WRONG!**

## 🎯 Root Cause

The CRM dashboard (`CRMDashboard.tsx`) calls `/api/crm/zoho/connect`, which:
1. Uses `ZOHO_REDIRECT_URI` from environment if set
2. Falls back to `/api/crm/zoho/callback` if not set

Since `ZOHO_REDIRECT_URI` is set to `/api/integrations/zoho/oauth`, it's using the wrong redirect URI, which doesn't match what's registered in your Zoho app.

## ✅ Solution

### Option 1: Update `.env.production` (Recommended)

Update the redirect URI to match the CRM endpoint:

```env
ZOHO_REDIRECT_URI=https://tharaga.co.in/api/crm/zoho/callback
```

**Then update your Zoho app settings:**
1. Go to https://api-console.zoho.in (India) or https://api-console.zoho.com (International)
2. Find your app with Client ID: `1000.067ETSWHZFEI3BF8EKNZ6VK2GJ3S3O`
3. Update the **Redirect URI** to: `https://tharaga.co.in/api/crm/zoho/callback`
4. Save the changes

### Option 2: Remove ZOHO_REDIRECT_URI from env

If you remove `ZOHO_REDIRECT_URI` from `.env.production`, the code will use the default `/api/crm/zoho/callback`.

**However, you still need to:**
- Set the redirect URI in your Zoho app to: `https://tharaga.co.in/api/crm/zoho/callback`

## 🔧 Additional Checks

### 1. Verify Client ID Exists
- The Client ID `1000.067ETSWHZFEI3BF8EKNZ6VK2GJ3S3O` must exist in your Zoho account
- If it doesn't exist, you need to create a new Zoho app

### 2. Verify Region
- Check if your Zoho account is **India** (`.in`) or **International** (`.com`)
- If needed, add to `.env.production`:
  ```env
  ZOHO_ACCOUNTS_URL=https://accounts.zoho.in  # For India
  # OR
  ZOHO_ACCOUNTS_URL=https://accounts.zoho.com  # For International
  ```

### 3. Verify Redirect URI Format
The redirect URI in Zoho app settings must match **EXACTLY** (including protocol, domain, and path):
- ✅ Correct: `https://tharaga.co.in/api/crm/zoho/callback`
- ❌ Wrong: `http://tharaga.co.in/api/crm/zoho/callback` (http vs https)
- ❌ Wrong: `https://tharaga.co.in/api/crm/zoho/callback/` (trailing slash)

## 📝 Steps to Fix

1. **Update `.env.production`**:
   ```env
   ZOHO_REDIRECT_URI=https://tharaga.co.in/api/crm/zoho/callback
   ```

2. **Update Netlify Environment Variables**:
   - Go to Netlify Dashboard → Site Settings → Environment Variables
   - Update `ZOHO_REDIRECT_URI` to: `https://tharaga.co.in/api/crm/zoho/callback`

3. **Update Zoho App Settings**:
   - Go to https://api-console.zoho.in (or .com for International)
   - Find your app
   - Update Redirect URI to: `https://tharaga.co.in/api/crm/zoho/callback`
   - Save changes

4. **Redeploy** (if needed):
   - Netlify should pick up the new environment variable automatically
   - Or trigger a new deployment

5. **Test**:
   - Go to Builder Dashboard → CRM tab
   - Click "Connect Now"
   - Should redirect to Zoho OAuth (no "Invalid Client" error)

## 🚨 Important Notes

- The redirect URI must match **EXACTLY** in both places:
  - Netlify environment variable (`ZOHO_REDIRECT_URI`)
  - Zoho app settings (Redirect URI field)
  
- There are TWO different Zoho integration endpoints:
  - `/api/crm/zoho/*` - Used by CRM Dashboard
  - `/api/integrations/zoho/*` - Used by Integrations page
  
- Make sure you're updating the correct one based on which feature you're using.

## ✅ Verification Checklist

- [ ] `.env.production` has correct `ZOHO_REDIRECT_URI`
- [ ] Netlify environment variables updated
- [ ] Zoho app redirect URI matches exactly
- [ ] Client ID exists in Zoho console
- [ ] Region (India/International) is correct
- [ ] Tested OAuth flow end-to-end
