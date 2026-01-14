# 📝 Manual .env.production Cleanup Guide

Since the automated script had issues with the file format, here's a **manual guide** to clean your `.env.production` file.

## 🎯 Goal

Remove these specific variables from `.env.production`:

### ❌ Variables to DELETE

1. **`RESEND_WEBHOOK_SECRET_ALT`** - Duplicate of `RESEND_WEBHOOK_SECRET`
2. **`SUPABASE_SERVICE_ROLE`** - Replaced by `SUPABASE_SERVICE_ROLE_KEY`
3. **`NODE_VERSION`** - Build-time only
4. **`NPM_FLAGS`** - Build-time only
5. **`NODE_ENV`** - Auto-set by Netlify
6. **`FIREBASE_API_KEY`** - Not used in codebase
7. **`FIREBASE_AUTH_DOMAIN`** - Not used in codebase
8. **`FIREBASE_PROJECT_ID`** - Not used in codebase
9. **`FIREBASE_APP_ID`** - Not used in codebase

## 📋 Step-by-Step Instructions

### Option 1: Manual Edit (Recommended)

1. **Open** `.env.production` in your editor
2. **Search** for each variable name above (use Ctrl+F)
3. **Delete** the entire line containing that variable (including the `=` and value)
4. **Save** the file

### Option 2: Using Find & Replace

1. Open `.env.production` in your editor
2. Use Find & Replace (Ctrl+H) to remove each line:
   - Find: `^RESEND_WEBHOOK_SECRET_ALT=.*$\n?`
   - Replace: (empty)
   - Enable "Regular Expression" mode
   - Repeat for each variable

### Option 3: Using PowerShell (If file is accessible)

Run this command in PowerShell from the project root:

```powershell
# Variables to remove
$varsToRemove = @(
    'RESEND_WEBHOOK_SECRET_ALT',
    'SUPABASE_SERVICE_ROLE',
    'NODE_VERSION',
    'NPM_FLAGS',
    'NODE_ENV',
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_APP_ID'
)

# Read file
$content = Get-Content .env.production -Raw

# Remove each variable line
foreach ($var in $varsToRemove) {
    $pattern = "(?m)^$var=.*$\r?\n?"
    $content = $content -replace $pattern, ''
}

# Save cleaned file
$content | Out-File .env.production -Encoding UTF8 -NoNewline
```

## ✅ What to Keep

**Keep ALL other variables**, especially:
- All `NEXT_PUBLIC_*` variables
- All `SUPABASE_*` variables (except `SUPABASE_SERVICE_ROLE`)
- All `RESEND_*` variables (except `RESEND_WEBHOOK_SECRET_ALT`)
- All `RAZORPAY_*` variables
- All `TWILIO_*` variables
- All `ZOHO_*` variables
- All `GOOGLE_*` variables
- All `OPENAI_*` and `ANTHROPIC_*` variables
- All `RERA_*` variables
- All `VAPID_*` variables
- All `ADMIN_*` variables
- All other variables that are actually used

## 🔍 How to Verify

After cleanup, check that:
1. ✅ File still has ~45-48 variables (down from ~50)
2. ✅ All `NEXT_PUBLIC_*` variables are still present
3. ✅ All `SUPABASE_*` variables are still present (except `SUPABASE_SERVICE_ROLE`)
4. ✅ Removed variables are gone
5. ✅ File still has proper formatting

## 📊 Expected Result

- **Before**: ~50 variables
- **After**: ~45-48 variables
- **Removed**: ~5-9 variables

## 🚀 Next Steps

After cleaning `.env.production`:
1. ✅ File is cleaned
2. ⏳ Remove same variables from Netlify Dashboard
3. ⏳ Configure function-specific environment variables (optional but recommended)
