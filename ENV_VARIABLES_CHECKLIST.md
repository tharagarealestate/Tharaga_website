# Environment Variables Checklist for RERA System

## ✅ All Required Environment Variables

### Supabase Configuration
- [x] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key (for client-side)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - **⚠️ NEEDS TO BE SET** (get from Supabase dashboard)
- [x] `SUPABASE_URL` - Alternative URL (backward compatibility)
- [x] `SUPABASE_SERVICE_ROLE` - Alternative service role key

### RERA Verification System
- [x] `USE_SYNTHETIC_RERA` - Enable/disable synthetic data (true for testing)
- [x] `RERA_PARTNER_API_URL` - Internal partner API URL
- [x] `RERA_PARTNER_API_KEY` - Internal partner API key
- [x] `RERA_MONITOR_API_KEY` - Monitor endpoint security key

### Other APIs
- [x] `NEXT_PUBLIC_GOOGLE_MAPS_KEY` - Google Maps API key
- [x] `OPENAI_API_KEY` - OpenAI API key

## ⚠️ Action Required

### 1. Get Supabase Service Role Key

1. Go to: https://app.supabase.com/project/wedevtjjmdvngyshqdro/settings/api
2. Find the **service_role** key (it's the secret key)
3. Copy it and add to `app/.env.production`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here
   SUPABASE_SERVICE_ROLE=your-actual-service-role-key-here
   ```

**⚠️ IMPORTANT**: The service role key has full database access. Keep it secret!

### 2. Verify All Variables Are Set

Run this command to check:
```powershell
cd app
Get-Content .env.production | Select-String -Pattern "SUPABASE_SERVICE_ROLE|RERA_|USE_SYNTHETIC"
```

Expected output should show:
- `SUPABASE_SERVICE_ROLE_KEY=...` (with actual key)
- `USE_SYNTHETIC_RERA=true`
- `RERA_PARTNER_API_URL=...`
- `RERA_PARTNER_API_KEY=...`
- `RERA_MONITOR_API_KEY=...`

## File Location

All environment variables are in: `app/.env.production`

## For Production Deployment

When deploying to production (Vercel, Netlify, etc.), make sure to:

1. **Add all variables** to your deployment platform's environment variables section
2. **Mark sensitive variables** as "Secret" or "Encrypted"
3. **Never commit** `.env.production` to git (it should be in `.gitignore`)

## Testing

After setting all variables, test with:
```bash
cd app
npx tsx scripts/test-rera-direct.ts
```

This will verify that all required environment variables are accessible.

























