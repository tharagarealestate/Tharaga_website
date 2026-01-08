# Quick Fix: Netlify 4KB Environment Variable Limit

## Immediate Action Required

Your deployment is failing because environment variables exceed AWS Lambda's 4KB limit per function.

## Quick Fix (5 minutes)

### Step 1: Remove Duplicate Variables

Go to **Netlify Dashboard → Site Settings → Environment Variables** and remove:

1. **`SUPABASE_SERVICE_ROLE`** - Keep only `SUPABASE_SERVICE_ROLE_KEY` (they contain the same value)
   - This alone will save ~600 bytes

### Step 2: Verify Deployment

After removing the duplicate, trigger a new deployment. It should succeed if you're just over the limit.

## If Still Failing

### Step 3: Review All Variables

1. In Netlify Dashboard, go through ALL environment variables
2. Remove any that are:
   - Unused/obsolete
   - Duplicates
   - Only needed for build (not runtime)

### Step 4: Check Variable Sizes

Large variables to watch:
- JWT tokens (Supabase keys): ~600 bytes each
- API keys: ~50-100 bytes each
- URLs: ~50-100 bytes each

## Multiple Netlify Sites

If you have the same environment in multiple Netlify sites (different email accounts), you'll need to:

1. Remove duplicates in **each site's** environment variables
2. Follow the same steps for each deployment

## Estimated Size Calculation

- Each environment variable: key name + "=" + value + overhead (~10 bytes)
- Example: `SUPABASE_SERVICE_ROLE_KEY=eyJhbG...` ≈ 650 bytes
- 60 variables × ~70 bytes average ≈ 4.2KB (over limit)

## After Fixing

Your deployment should complete successfully. If you add new environment variables in the future, monitor the total size to stay under 4KB.

## Need More Help?

See `NETLIFY_ENV_VAR_4KB_FIX.md` for detailed documentation on:
- Which variables each function needs
- Function-specific configuration options
- Advanced optimization strategies











