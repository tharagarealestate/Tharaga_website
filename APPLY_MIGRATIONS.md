# How to Apply Migrations to Supabase

## 🎯 You Need to Apply These 2 Migrations:

### Migration 1: `005_builder_subscriptions.sql`
Already exists in: `supabase/migrations/005_builder_subscriptions.sql`

### Migration 2: `006_add_builder_id_to_leads.sql`
Just created in: `supabase/migrations/006_add_builder_id_to_leads.sql`

---

## 📋 Option 1: Via Supabase Dashboard (Recommended - Easiest)

1. Open https://app.supabase.com/project/wedevtjjmdvngyshqdro/sql
2. Click **SQL Editor** (or you're already there)
3. Click **New Query**

### Run Migration 005:
Copy and paste this SQL:

```sql
-- From 005_builder_subscriptions.sql
CREATE TABLE IF NOT EXISTS public.builder_subscriptions (
  builder_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier text NOT NULL DEFAULT 'trial',
  status text NOT NULL DEFAULT 'active',
  trial_started_at timestamptz NOT NULL DEFAULT now(),
  trial_expires_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_builder_subs_tier ON public.builder_subscriptions(tier);

CREATE OR REPLACE FUNCTION public.set_updated_at_builder_subs()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN new.updated_at = now(); RETURN new; END; $$;

CREATE TRIGGER trg_builder_subs_updated
BEFORE UPDATE ON public.builder_subscriptions
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at_builder_subs();

ALTER TABLE public.builder_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own builder sub read" ON public.builder_subscriptions
FOR SELECT USING (auth.uid() = builder_id);

CREATE POLICY "service insert/update" ON public.builder_subscriptions
FOR INSERT WITH CHECK (true);

CREATE POLICY "service insert/update 2" ON public.builder_subscriptions
FOR UPDATE USING (true);
```

4. Click **Run** (or press F5)
5. You should see: "Success. No rows returned"

### Run Migration 006:
Create another new query and paste:

```sql
-- From 006_add_builder_id_to_leads.sql
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS builder_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_builder_id ON public.leads(builder_id);

COMMENT ON COLUMN public.leads.builder_id IS 'References the builder (auth user) who receives this lead during their trial';
```

6. Click **Run**
7. Done! ✅

---

## 📋 Option 2: Via Supabase CLI

If you prefer using the CLI:

```bash
# First, you need to login and link
cd E:\Tharaga_website\Tharaga_website

# Login to Supabase (will open browser)
supabase login

# Link to your project (will ask for database password)
supabase link --project-ref wedevtjjmdvngyshqdro

# Push migrations
supabase db push
```

You'll need your database password from:
https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/settings/database

---

## ✅ How to Verify Migrations Were Applied

Run this query in SQL Editor:

```sql
-- Check if builder_subscriptions table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'builder_subscriptions'
);

-- Check if leads.builder_id column exists
SELECT EXISTS (
  SELECT FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'leads'
  AND column_name = 'builder_id'
);
```

Both should return `true`.

---

## 🔐 Also Configure These in Dashboard:

### 1. Enable Phone Auth
- Go to: https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/auth/providers
- Enable **Phone** provider
- Configure Twilio or enable "Fake OTP" for testing

### 2. Set Site URL
- Go to: https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/auth/url-configuration
- Set **Site URL** to your production domain

### 3. Check Environment Variables
Make sure these are set in Vercel/Netlify:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE`

---

## 📊 After Applying Migrations

Your database will have:
- ✅ `builder_subscriptions` table for trial tracking
- ✅ `leads.builder_id` column for lead attribution
- ✅ Proper RLS policies for security
- ✅ Indexes for performance

Then the trial signup flow will work correctly!
