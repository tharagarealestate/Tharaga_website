# 🚀 Quick Start - Supabase Setup (5 Minutes)

## ⚡ Ultra-Fast Setup

### Step 1: Apply Migrations (2 minutes)

```bash
cd E:\Tharaga_website\Tharaga_website
supabase link --project-ref wedevtjjmdvngyshqdro
supabase db push
```

Or copy/paste in SQL Editor: https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/editor

Run these NEW migrations in order:
1. `supabase/migrations/007_create_leads_table.sql`
2. `supabase/migrations/008_create_missing_tables.sql`
3. `supabase/migrations/009_extend_properties_table.sql`
4. `supabase/migrations/010_extend_builders_table.sql`
5. `supabase/migrations/011_extend_profiles_table.sql`

### Step 2: Environment Variables (1 minute)

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://wedevtjjmdvngyshqdro.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE=your_service_role_key_here
```

Get keys: https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/settings/api

### Step 3: Phone Auth (1 minute)

For testing:
1. Go to: https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/auth/providers
2. Enable **Phone** provider
3. Toggle **"Use Fake OTP"** ON
4. Save

Use OTP: `123456` for testing

### Step 4: Auth Settings (30 seconds)

Go to: https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/auth/url-configuration

Set:
- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** `http://localhost:3000/**`

### Step 5: Start & Test (30 seconds)

```bash
npm run dev
```

Visit: http://localhost:3000

## ✅ Verify It Works

```sql
-- Run in SQL Editor to check all tables exist:
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';
-- Should return: 14
```

Test:
- [ ] Page loads without errors
- [ ] Lead form works
- [ ] Builder dashboard accessible

## 🎉 Done!

Full guides available:
- `SUPABASE_MIGRATION_GUIDE.md` - Complete migration details
- `PHONE_AUTH_SETUP.md` - Phone auth production setup
- `ENV_SETUP.md` - All environment variables
- `SUPABASE_SYNC_COMPLETE.md` - Full analysis report

## 🆘 Quick Fixes

**"relation 'leads' does not exist"**  
→ Apply migration 007

**"column does not exist"**  
→ Apply migrations 009-011

**Phone auth not working**  
→ Enable Fake OTP in Phone provider

**Environment variables not loading**  
→ Restart: `npm run dev`

---

**Total Time:** ~5 minutes  
**New Migrations:** 5 (007-011)  
**Tables Created:** 8 new + 3 extended

