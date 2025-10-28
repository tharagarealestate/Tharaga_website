# Supabase Migration & Setup Guide

## 🎯 Overview

This guide provides step-by-step instructions for setting up your Supabase database with all required tables, columns, and configurations for the Tharaga website application.

## 📋 Migration Summary

### Existing Migrations (Already Created)
1. ✅ `000_fix_and_consolidate.sql` - Base tables (builders, properties, metro_stations, functions)
2. ✅ `001_auth_profiles.sql` - Profiles table and auth triggers
3. ✅ `003_billing_entitlements.sql` - Subscription management (org_subscriptions)
4. ✅ `004_profiles_role.sql` - Add role column to profiles
5. ✅ `005_builder_subscriptions.sql` - Builder trial subscriptions
6. ✅ `006_add_builder_id_to_leads.sql` - Link leads to builders

### New Migrations (Just Created) ⚡
7. ✅ `007_create_leads_table.sql` - **CRITICAL** - Creates the leads table (was missing!)
8. ✅ `008_create_missing_tables.sql` - Creates: interactions, property_analytics, property_interactions_hourly, page_views, events, payments, reviews
9. ✅ `009_extend_properties_table.sql` - Adds missing columns to properties (project, builder, rera_id, images, amenities, etc.)
10. ✅ `010_extend_builders_table.sql` - Adds missing columns to builders (logo_url, founded, reputation_score, etc.)
11. ✅ `011_extend_profiles_table.sql` - Adds missing columns to profiles (name, company_name, phone)

## 🚀 How to Apply Migrations

### Option 1: Using Supabase CLI (Recommended)

```bash
# 1. Make sure you're in the project root
cd E:\Tharaga_website\Tharaga_website

# 2. Link to your Supabase project (if not already linked)
supabase link --project-ref wedevtjjmdvngyshqdro

# 3. Apply all migrations
supabase db push

# 4. Verify migrations were applied
supabase db diff
```

### Option 2: Using Supabase Dashboard

1. Go to https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/editor
2. Navigate to **SQL Editor**
3. Run each migration file in order (007 through 011)
4. Copy the contents of each file and execute

### Option 3: Using Migration Files Directly

If you have local Supabase running:

```bash
# Start local Supabase
supabase start

# Apply migrations
supabase db reset

# This will run all migrations in order
```

## 📊 Database Schema Overview

### Core Tables

#### 1. **auth.users** (Built-in Supabase Auth)
- User authentication and identity
- Referenced by: profiles, leads, builder_subscriptions

#### 2. **profiles** (Public user profiles)
```sql
- id (uuid, PK, FK to auth.users)
- email, full_name, avatar_url
- name, company_name, phone
- role (admin|builder|user)
- created_at, updated_at
```

#### 3. **builders** (Builder/Developer information)
```sql
- id (uuid, PK)
- name (unique)
- logo_url, description, website, headquarters
- founded, total_projects
- reputation_score, reviews_count, trust_score
- certifications (jsonb)
- created_at, updated_at
```

#### 4. **properties** (Property listings)
```sql
- id (uuid, PK)
- title, description, project, builder
- city, locality, address, location
- property_type, bedrooms, bathrooms, parking
- floor, total_floors, facing, furnished
- price_inr, sqft, lat, lng
- rera_id, tour_url, brochure_url
- images, floor_plan_images, amenities (jsonb)
- is_verified, listing_status
- builder_id (FK to builders)
- embedding (vector), embedding_version
- listed_at, created_at, updated_at
```

#### 5. **leads** ⚡ NEW - CRITICAL
```sql
- id (uuid, PK)
- property_id (FK to properties)
- builder_id (FK to auth.users)
- name, email, phone, message
- status (new|contacted|qualified|converted|lost)
- score (0-10), source, budget
- created_at, updated_at
```

#### 6. **builder_subscriptions** (Trial & subscription tracking)
```sql
- builder_id (uuid, PK, FK to auth.users)
- tier (trial|starter|growth|scale)
- status (active|inactive|expired)
- trial_started_at, trial_expires_at
- updated_at
```

#### 7. **org_subscriptions** (Organization subscriptions)
```sql
- id (bigint, PK)
- user_id (FK to auth.users)
- email, stripe_customer_id, stripe_price_id
- tier, status, active_until
- provider, subscription_id
- created_at, updated_at
```

### Analytics & Tracking Tables

#### 8. **interactions** (User property interactions)
```sql
- id, property_id, user_id, session_id
- interaction_type (view|click|share|favorite|contact|tour_request)
- metadata (jsonb)
- created_at
```

#### 9. **property_analytics** (Daily property analytics)
```sql
- id, property_id, date
- views_count, clicks_count, favorites_count
- shares_count, contact_requests_count, tour_requests_count
- unique_visitors_count
```

#### 10. **property_interactions_hourly** (Real-time analytics)
```sql
- id, property_id, hour
- views_count, clicks_count
```

#### 11. **page_views** (Website analytics)
```sql
- id, user_id, session_id
- page_url, referrer, user_agent
- ip_address, country, city, device_type, browser
- created_at
```

#### 12. **events** (Custom event tracking)
```sql
- id, user_id, session_id
- event_name, event_data (jsonb), page_url
- created_at
```

### Payment & Reviews Tables

#### 13. **payments** (Payment transactions)
```sql
- id, user_id, subscription_id
- amount, currency, status
- payment_method, transaction_id, provider
- metadata (jsonb)
- created_at, updated_at
```

#### 14. **reviews** (Property reviews)
```sql
- id, property_id, user_id
- user_name, user_avatar, rating
- category_location, category_value, category_quality, category_amenities
- text, verified_buyer
- helpful_count, reported_count, status
- created_at, updated_at
```

## 🔐 Row Level Security (RLS) Summary

All tables have RLS enabled with appropriate policies:

- **profiles**: Users can view all profiles, update their own
- **builders**: Public read, admin write
- **properties**: Public read (active listings), builder/admin write
- **leads**: Builders see their own, admins see all
- **builder_subscriptions**: Users see their own
- **interactions**: Public insert, authenticated read
- **analytics tables**: Builders see their own properties, admins see all
- **page_views/events**: Public insert, admin read
- **payments**: Users see their own, admin see all
- **reviews**: Public see approved, users manage their own

## 📞 Step 2: Configure Phone Authentication

### In Supabase Dashboard

1. Navigate to: **Authentication → Providers**
2. Find **Phone** provider and click **Enable**

### Choose SMS Provider:

#### Option A: Twilio (Production)
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

1. Sign up at https://www.twilio.com
2. Get your Account SID and Auth Token
3. Purchase a phone number
4. Add credentials to Supabase Phone provider settings

#### Option B: Fake OTP (Development/Testing)
1. In Phone provider settings, enable "Use Fake OTP"
2. This allows testing without actual SMS
3. OTP will be: `123456` for all phone numbers
4. ⚠️ **DO NOT use in production!**

### Phone Provider Settings:
```
✓ Enable Phone provider
✓ Choose your SMS provider (Twilio recommended)
✓ For testing: Enable "Use Fake OTP"
✓ Confirm rate limits (important for production)
```

## 🔧 Step 3: Environment Variables

### Required Environment Variables

Create/update your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://wedevtjjmdvngyshqdro.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# CRITICAL: Service Role Key (for server-side operations)
SUPABASE_SERVICE_ROLE=your_service_role_key_here

# Optional: Direct database connection
SUPABASE_URL=https://wedevtjjmdvngyshqdro.supabase.co
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.wedevtjjmdvngyshqdro.supabase.co:5432/postgres
```

### Where to Find Keys:

1. Go to: https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/settings/api
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE` ⚠️ Keep secret!

### Deployment (Vercel/Netlify)

Add these to your deployment platform:

**Vercel:**
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE
```

**Netlify:**
- Go to Site Settings → Environment Variables
- Add all three variables above

## ⚙️ Step 4: Configure Auth Settings

### In Supabase Dashboard: Authentication → Settings

#### Site URL:
```
https://tharaga.co.in
```
OR your development URL:
```
http://localhost:3000
```

#### Redirect URLs (Add all these):
```
https://tharaga.co.in/**
https://tharaga.co.in/auth/callback
https://tharaga.co.in/dashboard
https://tharaga.co.in/builder/dashboard
http://localhost:3000/**
http://localhost:3000/auth/callback
```

#### Additional Settings:
- ✓ Enable email confirmations (production)
- ✓ Set session timeout (default: 7 days)
- ✓ Configure password requirements
- ✓ Enable magic link (optional)

## ✅ Verification Checklist

After applying all migrations and configurations:

### Database Verification
```sql
-- Run in Supabase SQL Editor to verify all tables exist:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected tables:
- ✓ builders
- ✓ builder_subscriptions
- ✓ events
- ✓ interactions
- ✓ leads ⚡
- ✓ metro_stations
- ✓ org_subscriptions
- ✓ page_views
- ✓ payments
- ✓ profiles
- ✓ properties
- ✓ property_analytics
- ✓ property_interactions_hourly
- ✓ reviews

### Application Verification
```bash
# 1. Test database connection
npm run dev

# 2. Check browser console for errors
# 3. Test these features:
# - User registration (phone/email)
# - Property listing view
# - Lead submission form
# - Builder dashboard (if builder account)
# - Admin metrics (if admin account)
```

## 🐛 Troubleshooting

### Issue: "relation 'leads' does not exist"
**Solution:** Apply migration `007_create_leads_table.sql` - this was missing!

### Issue: "column does not exist" errors
**Solution:** Apply migrations 009-011 to extend existing tables

### Issue: Phone auth not working
**Solution:** 
1. Enable Phone provider in Supabase
2. Configure Twilio OR enable Fake OTP for testing
3. Check environment variables

### Issue: RLS policy violations
**Solution:**
- Check user has correct role in profiles table
- Verify auth.uid() is set (user is logged in)
- Use service role key for admin operations

### Issue: Migration failed
**Solution:**
```bash
# Check migration status
supabase migration list

# Reset and reapply
supabase db reset

# Or apply specific migration
psql $DATABASE_URL -f supabase/migrations/007_create_leads_table.sql
```

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Phone Auth Setup](https://supabase.com/docs/guides/auth/phone-login)
- [Migrations Guide](https://supabase.com/docs/guides/cli/local-development#database-migrations)

## 🎉 Success!

Once all migrations are applied and configurations are complete:

1. ✅ Database schema is complete with all 14+ tables
2. ✅ RLS policies protect data appropriately
3. ✅ Phone authentication is configured
4. ✅ Environment variables are set
5. ✅ Your application is ready for deployment!

---

**Last Updated:** October 28, 2025  
**Migrations:** 000-011 (12 total)  
**Critical Fix:** Migration 007 adds the missing leads table

