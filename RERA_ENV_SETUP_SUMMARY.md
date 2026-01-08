# RERA Environment Variables Setup Summary

## ✅ Status

I've created a script to add all required RERA environment variables to your `.env.production` file.

## 📋 Required Environment Variables

### RERA System Variables (✅ Added)
- `USE_SYNTHETIC_RERA=true` - Enable synthetic data for testing
- `RERA_PARTNER_API_URL` - Internal partner API URL
- `RERA_PARTNER_API_KEY` - Internal partner API key  
- `RERA_MONITOR_API_KEY` - Monitor endpoint security key

### Supabase Variables (⚠️ Needs Service Role Key)
- `NEXT_PUBLIC_SUPABASE_URL` - ✅ Already present
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - ✅ Already present
- `SUPABASE_SERVICE_ROLE_KEY` - ⚠️ **NEEDS TO BE SET** (placeholder added)
- `SUPABASE_SERVICE_ROLE` - ⚠️ **NEEDS TO BE SET** (placeholder added)

## 🔧 How to Complete Setup

### Option 1: Run the Script (Recommended)
```powershell
cd app
.\scripts\add-all-env-vars.ps1
```

This will:
- Clean up duplicate entries
- Add all RERA variables
- Add Supabase service role key placeholders

### Option 2: Manual Setup

1. **Get Supabase Service Role Key**:
   - Go to: https://app.supabase.com/project/wedevtjjmdvngyshqdro/settings/api
   - Find the **service_role** key (secret key)
   - Copy it

2. **Edit `app/.env.production`** and add:
```env
# Supabase Service Role Key
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here
SUPABASE_SERVICE_ROLE=your-actual-service-role-key-here

# RERA Configuration
USE_SYNTHETIC_RERA=true
RERA_PARTNER_API_URL=https://wedevtjjmdvngyshqdro.supabase.co/functions/v1/rera-partner
RERA_PARTNER_API_KEY=internal-service-key
RERA_MONITOR_API_KEY=qYofRsFAXnbNhAk8odyASeTym5cfmx/SKabs4QA1wgE=
```

## ✅ Verification

After setup, verify all variables are present:
```powershell
cd app
Get-Content .env.production | Select-String -Pattern "RERA_|USE_SYNTHETIC|SUPABASE_SERVICE_ROLE"
```

Expected output:
- `USE_SYNTHETIC_RERA=true`
- `RERA_PARTNER_API_URL=...`
- `RERA_PARTNER_API_KEY=...`
- `RERA_MONITOR_API_KEY=...`
- `SUPABASE_SERVICE_ROLE_KEY=...` (with actual key, not placeholder)

## 📝 Summary

**What's Done:**
- ✅ Script created to add all RERA variables
- ✅ All RERA variables configured
- ✅ Supabase placeholders added

**What You Need to Do:**
- ⚠️ Get your Supabase Service Role Key from the dashboard
- ⚠️ Replace `your-service-role-key-here` with the actual key

## 🚀 Next Steps

Once all environment variables are set:

1. **Test the system**:
   ```bash
   cd app
   npx tsx scripts/test-rera-direct.ts
   ```

2. **Start the server**:
   ```bash
   cd app
   npm run dev
   ```

3. **Test the API**:
   ```bash
   curl -X POST http://localhost:3000/api/rera/verify \
     -H "Content-Type: application/json" \
     -d '{"reraNumber": "TN/01/Building/12345/2024", "state": "Tamil Nadu", "type": "builder"}'
   ```


























































