# 🔐 Environment Variables Setup Guide

## Overview

This guide covers all environment variables needed for the Tharaga website application.

## 📋 Required Environment Variables

### .env.local (Development)

Create this file in your project root: `E:\Tharaga_website\Tharaga_website\.env.local`

```bash
# ============================================
# SUPABASE CONFIGURATION (Required)
# ============================================

# Public Supabase URL - Safe to expose in browser
NEXT_PUBLIC_SUPABASE_URL=https://wedevtjjmdvngyshqdro.supabase.co

# Public Anon Key - Safe to expose in browser
# This key has RLS (Row Level Security) restrictions
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Service Role Key - KEEP SECRET! Server-side only
# This key bypasses RLS - never expose to browser
SUPABASE_SERVICE_ROLE=your_service_role_key_here

# Alternative URL variable (used by some scripts)
SUPABASE_URL=https://wedevtjjmdvngyshqdro.supabase.co

# ============================================
# DATABASE (Optional - for direct connections)
# ============================================

# Direct database connection string
# Replace [YOUR-PASSWORD] with your actual database password
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.wedevtjjmdvngyshqdro.supabase.co:5432/postgres

# ============================================
# AUTHENTICATION (Optional)
# ============================================

# JWT Secret (optional - for custom JWT handling)
SUPABASE_JWT_SECRET=your_jwt_secret_here

# Site URL for redirects
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# ============================================
# EXTERNAL SERVICES (Optional)
# ============================================

# Google Analytics
NEXT_PUBLIC_GA_TRACKING_ID=UA-XXXXXXXXX-X

# Stripe (if using for payments)
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Razorpay (alternative payment provider)
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx

# Google Maps (for property locations)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXX

# ============================================
# EMBEDDINGS & AI (Optional)
# ============================================

# OpenAI for embeddings
OPENAI_API_KEY=sk-xxxxx

# Alternative embedding service
EMBEDDING_API_URL=https://your-embedding-service.com/embed
EMBEDDING_API_KEY=xxxxx
```

## 🔑 How to Get Your Supabase Keys

### Step 1: Go to Supabase Dashboard

Navigate to: https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/settings/api

### Step 2: Copy Your Keys

You'll see three important values:

1. **Project URL**
   ```
   https://wedevtjjmdvngyshqdro.supabase.co
   ```
   → Copy to: `NEXT_PUBLIC_SUPABASE_URL`

2. **anon public key** (Long string starting with `eyJ...`)
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi...
   ```
   → Copy to: `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **service_role key** (Long string starting with `eyJ...`)
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi...
   ```
   → Copy to: `SUPABASE_SERVICE_ROLE`

### Step 3: Database Password

If you need direct database access:

1. Go to: https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/settings/database
2. Copy the **Database Password** (you set this during project creation)
3. Update `DATABASE_URL` with this password

## 🚀 Deployment Environments

### Production (.env.production)

```bash
# Same as .env.local but with production URLs
NEXT_PUBLIC_SUPABASE_URL=https://wedevtjjmdvngyshqdro.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE=your_production_service_role_key
NEXT_PUBLIC_SITE_URL=https://tharaga.co.in

# Use production payment keys
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
RAZORPAY_KEY_ID=rzp_live_xxxxx
```

### Vercel Deployment

Add environment variables in Vercel Dashboard:

1. Go to: https://vercel.com/your-project/settings/environment-variables

2. Add each variable:
   ```
   NEXT_PUBLIC_SUPABASE_URL → Production
   NEXT_PUBLIC_SUPABASE_ANON_KEY → Production
   SUPABASE_SERVICE_ROLE → Production (Keep Secret!)
   NEXT_PUBLIC_SITE_URL → Production
   ```

3. Or use Vercel CLI:
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE
   ```

### Netlify Deployment

Add environment variables in Netlify Dashboard:

1. Go to: **Site Settings → Environment Variables**

2. Add each variable with values from your `.env.local`

3. Or use `netlify.toml`:
   ```toml
   [build.environment]
     NEXT_PUBLIC_SUPABASE_URL = "https://wedevtjjmdvngyshqdro.supabase.co"
     NEXT_PUBLIC_SITE_URL = "https://tharaga.co.in"
   ```

4. Secrets via Netlify CLI:
   ```bash
   netlify env:set SUPABASE_SERVICE_ROLE "your_service_role_key"
   ```

## 🔒 Security Best Practices

### ✅ Safe to Expose (Public Variables)

These can be in client-side code:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (protected by RLS)
- `NEXT_PUBLIC_GA_TRACKING_ID`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `STRIPE_PUBLISHABLE_KEY` / `RAZORPAY_KEY_ID` (public keys)

### ❌ NEVER Expose (Secret Variables)

These must ONLY be server-side:
- `SUPABASE_SERVICE_ROLE` ⚠️ CRITICAL
- `SUPABASE_JWT_SECRET`
- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `RAZORPAY_KEY_SECRET`
- `OPENAI_API_KEY`

### How to Keep Secrets Safe:

1. **Never commit to Git:**
   ```bash
   # Add to .gitignore
   .env.local
   .env.production
   .env*.local
   ```

2. **Use environment-specific files:**
   - `.env.local` - Local development (gitignored)
   - `.env.production` - Production (gitignored)
   - `.env.example` - Template (can commit)

3. **Access server-side only:**
   ```typescript
   // ✅ GOOD - Server-side API route
   // app/api/admin/route.ts
   const serviceKey = process.env.SUPABASE_SERVICE_ROLE
   
   // ❌ BAD - Client component
   // components/MyComponent.tsx
   const serviceKey = process.env.SUPABASE_SERVICE_ROLE // Won't work!
   ```

4. **Use Next.js API routes for sensitive operations:**
   ```typescript
   // ✅ Client calls API route
   const response = await fetch('/api/admin/delete-user', {
     method: 'POST',
     body: JSON.stringify({ userId })
   })
   
   // ✅ API route uses service key
   // app/api/admin/delete-user/route.ts
   const supabase = createClient(
     process.env.SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_ROLE!
   )
   ```

## 📝 .env.example Template

Create this file to help other developers:

```bash
# Copy this file to .env.local and fill in your values

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE=your_service_role_key_here
SUPABASE_URL=https://your-project.supabase.co
DATABASE_URL=postgresql://postgres:your_password@db.your-project.supabase.co:5432/postgres

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional: Analytics
NEXT_PUBLIC_GA_TRACKING_ID=

# Optional: Payments
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Optional: Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# Optional: AI/Embeddings
OPENAI_API_KEY=
```

## 🧪 Testing Environment Variables

### Verify Variables are Loaded

Create a test API route:

```typescript
// app/api/test-env/route.ts
export async function GET() {
  return Response.json({
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE,
    // Don't return actual values!
  })
}
```

Test it:
```bash
curl http://localhost:3000/api/test-env
# Should return: {"hasSupabaseUrl":true,"hasAnonKey":true,"hasServiceRole":true}
```

### Check Variables in Browser

```typescript
// In browser console (only works for NEXT_PUBLIC_* variables)
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
// Should print: https://wedevtjjmdvngyshqdro.supabase.co

console.log(process.env.SUPABASE_SERVICE_ROLE)
// Should print: undefined (good! It's a secret)
```

## 🐛 Troubleshooting

### Issue: "Supabase URL not defined"

**Solution:**
1. Check `.env.local` exists in project root
2. Restart dev server: `npm run dev`
3. Verify variable name: `NEXT_PUBLIC_SUPABASE_URL` (exact)
4. No spaces around `=`: `URL=value` not `URL = value`

### Issue: "403 Forbidden" or RLS errors

**Solution:**
1. Using `SUPABASE_SERVICE_ROLE` instead of anon key?
2. Service role bypasses RLS, anon key enforces it
3. Use anon key in client, service role in API routes

### Issue: Variables not updating

**Solution:**
1. Restart Next.js dev server
2. Clear `.next` cache: `rm -rf .next`
3. Rebuild: `npm run build`

### Issue: Variables work locally but not in deployment

**Solution:**
1. Add variables to Vercel/Netlify dashboard
2. Verify variable names match exactly
3. Redeploy after adding variables
4. Check deployment logs for errors

## 📚 Resources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase API Settings](https://supabase.com/dashboard/project/_/settings/api)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Netlify Environment Variables](https://docs.netlify.com/configure-builds/environment-variables/)

## ✅ Quick Checklist

- [ ] Created `.env.local` in project root
- [ ] Added `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Added `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Added `SUPABASE_SERVICE_ROLE`
- [ ] Added `.env.local` to `.gitignore`
- [ ] Restarted dev server
- [ ] Tested API connection
- [ ] Added production variables to hosting platform
- [ ] Verified secrets are not exposed in browser

---

**Your Supabase Project ID:** `wedevtjjmdvngyshqdro`  
**Dashboard:** https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro

