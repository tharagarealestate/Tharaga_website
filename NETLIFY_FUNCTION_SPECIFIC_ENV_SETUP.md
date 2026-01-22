# 🎯 Netlify Function-Specific Environment Variables - Complete Setup Guide

## 📋 Overview

By default, Netlify passes **ALL** site environment variables to **EVERY** function. This causes the 4KB limit issue. 

**Solution**: Configure each function to only receive the variables it actually needs.

## 🚀 Step-by-Step Instructions

### Step 1: Access Function Settings

1. Go to **https://app.netlify.com**
2. Select your site (e.g., `dulcet-caramel-1f7489`)
3. Click **Site Settings** (gear icon in top navigation)
4. Click **Functions** in the left sidebar
5. You'll see a list of all your Netlify functions

### Step 2: Configure Each Function

For **EACH function** in the list, follow these steps:

#### 2.1 Open Function Settings
- Click on the function name (e.g., `properties-list`, `razorpayWebhook`, etc.)
- Or click the **"Edit"** button next to the function

#### 2.2 Disable Inherit All
- Find the **"Environment variables"** section
- **Uncheck** the checkbox that says **"Inherit all environment variables"** or **"Inherit from site"**

#### 2.3 Select Specific Variables
- You'll see a list of all available environment variables
- **Check ONLY the variables that this specific function needs** (see list below)
- Click **"Save"** or **"Update"**

### Step 3: Repeat for All Functions

Go through **every function** in your list and configure them individually.

---

## 📦 Variable Requirements by Function

### 🔵 Common Variables (ALL Functions Need These)

These should be selected for **every function**:

- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `SUPABASE_ANON_KEY`

---

### 💳 Payment Functions

**Functions**: `razorpayWebhook`, `razorpayCreateSubscription`, `stripeWebhook`, `stripeCheckout`, `stripePortal`

**Variables Needed**:
- All common variables (3)
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `RZP_PLAN_STARTER_MONTHLY`
- `RZP_PLAN_STARTER_ANNUAL`
- `RZP_PLAN_PROFESSIONAL_MONTHLY`
- `RZP_PLAN_PROFESSIONAL_ANNUAL`
- `RZP_PLAN_ENTERPRISE_MONTHLY`
- `RZP_PLAN_ENTERPRISE_ANNUAL`
- `STRIPE_SECRET_KEY` (only for Stripe functions)
- `STRIPE_WEBHOOK_SECRET` (only for Stripe functions)

**Total**: ~13-15 variables per payment function

---

### 📧 Email Functions

**Functions**: `digest-send`

**Variables Needed**:
- All common variables (3)
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_FROM_NAME`
- `RESEND_WEBHOOK_SECRET`

**Total**: ~7 variables

---

### 🔔 Push Notification Functions

**Functions**: `push-subscribe`, `push-send`

**Variables Needed**:
- All common variables (3)
- `VAPID_PRIVATE_KEY`
- `VAPID_PUBLIC_KEY`

**Total**: ~5 variables

---

### 👤 Admin Functions

**Functions**: `admin-properties-list`, `admin-verify-property`, `admin-metrics`, `admin-leads-list`, `admin-builders-list`, `admin-builder-update`, `admin-stats`, `admin-get-builders`, `admin-verify-builder`

**Variables Needed**:
- All common variables (3)
- `ADMIN_TOKEN` or `NEXT_PUBLIC_ADMIN_TOKEN`
- `ADMIN_EMAIL` (if used)

**Total**: ~4-5 variables

---

### 🔐 Auth Functions

**Functions**: `authCheckEmail`, `send-verification-email`

**Variables Needed**:
- All common variables (3)
- (No additional variables needed)

**Total**: ~3 variables

---

### 📊 Data Functions

**Functions**: `properties-list`, `lead-create`, `recommendations`, `user-roles`, `user-add-role`, `user-switch-role`, `env-intel`, `api`

**Variables Needed**:
- All common variables (3)
- (No additional variables needed for most)

**Total**: ~3 variables

---

## 📝 Complete Function List with Variables

Here's a quick reference for all your functions:

| Function Name | Variables Needed |
|--------------|------------------|
| `properties-list` | Common (3) |
| `lead-create` | Common (3) |
| `digest-send` | Common (3) + Resend (4) = **7** |
| `push-subscribe` | Common (3) + VAPID (2) = **5** |
| `push-send` | Common (3) + VAPID (2) = **5** |
| `admin-properties-list` | Common (3) + Admin (1-2) = **4-5** |
| `admin-verify-property` | Common (3) + Admin (1-2) = **4-5** |
| `admin-metrics` | Common (3) + Admin (1-2) = **4-5** |
| `admin-leads-list` | Common (3) + Admin (1-2) = **4-5** |
| `admin-builders-list` | Common (3) + Admin (1-2) = **4-5** |
| `admin-builder-update` | Common (3) + Admin (1-2) = **4-5** |
| `admin-stats` | Common (3) + Admin (1-2) = **4-5** |
| `admin-get-builders` | Common (3) + Admin (1-2) = **4-5** |
| `admin-verify-builder` | Common (3) + Admin (1-2) = **4-5** |
| `razorpayWebhook` | Common (3) + Razorpay (9) = **12** |
| `razorpayCreateSubscription` | Common (3) + Razorpay (9) = **12** |
| `stripeWebhook` | Common (3) + Stripe (2) = **5** |
| `stripeCheckout` | Common (3) + Stripe (2) = **5** |
| `stripePortal` | Common (3) + Stripe (2) = **5** |
| `authCheckEmail` | Common (3) = **3** |
| `send-verification-email` | Common (3) = **3** |
| `user-roles` | Common (3) = **3** |
| `user-add-role` | Common (3) = **3** |
| `user-switch-role` | Common (3) = **3** |
| `recommendations` | Common (3) = **3** |
| `env-intel` | Common (3) = **3** |
| `api` | Common (3) = **3** |

---

## ⚡ Quick Setup Script (Manual Process)

Since Netlify doesn't have an API for this, you'll need to do it manually. Here's the fastest approach:

### Batch 1: Simple Functions (3 variables each)
Do these first - they're quick:
- `properties-list`
- `lead-create`
- `authCheckEmail`
- `send-verification-email`
- `user-roles`
- `user-add-role`
- `user-switch-role`
- `recommendations`
- `env-intel`
- `api`

**For each**: Select only the 3 common variables.

### Batch 2: Admin Functions (4-5 variables each)
- All `admin-*` functions

**For each**: Select common (3) + `ADMIN_TOKEN` + `ADMIN_EMAIL` (if needed).

### Batch 3: Push Functions (5 variables each)
- `push-subscribe`
- `push-send`

**For each**: Select common (3) + `VAPID_PRIVATE_KEY` + `VAPID_PUBLIC_KEY`.

### Batch 4: Email Functions (7 variables)
- `digest-send`

**Select**: Common (3) + `RESEND_API_KEY` + `RESEND_FROM_EMAIL` + `RESEND_FROM_NAME` + `RESEND_WEBHOOK_SECRET`.

### Batch 5: Payment Functions (12-15 variables each)
- `razorpayWebhook`
- `razorpayCreateSubscription`
- `stripeWebhook`
- `stripeCheckout`
- `stripePortal`

**For Razorpay**: Common (3) + all Razorpay variables (9).
**For Stripe**: Common (3) + `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`.

---

## ✅ Verification Steps

After configuring all functions:

1. **Check Function Count**: Make sure you've configured all ~28 functions
2. **Test Deployment**: Trigger a new deployment
3. **Check Build Logs**: Look for "Functions bundling" - should succeed
4. **Verify No 4KB Errors**: Should see no "exceeds 4KB limit" errors
5. **Test Functions**: Test a few functions to ensure they work correctly

---

## 🎯 Expected Results

### Before
- **All functions**: 50 variables × ~100 bytes = **~5KB** ❌ (exceeds limit)

### After
- **Simple functions**: 3 variables × ~100 bytes = **~300 bytes** ✅
- **Admin functions**: 5 variables × ~100 bytes = **~500 bytes** ✅
- **Email functions**: 7 variables × ~100 bytes = **~700 bytes** ✅
- **Payment functions**: 12 variables × ~100 bytes = **~1.2KB** ✅

**All functions now well under the 4KB limit!** 🎉

---

## 💡 Tips & Best Practices

1. **Start with Simple Functions**: Configure the 3-variable functions first to get familiar
2. **Use Browser Bookmarks**: Bookmark the Netlify functions page for quick access
3. **Take Notes**: Keep track of which functions you've configured
4. **Test Incrementally**: After configuring a batch, test deployment
5. **Double-Check**: Make sure you didn't miss any functions

---

## 🆘 Troubleshooting

### "Function not found" error
- Make sure the function name matches exactly (case-sensitive)
- Check that the function exists in `netlify/functions/`

### Function still fails after configuration
- Verify all required variables are selected
- Check function logs in Netlify Dashboard
- Ensure variable names match exactly (case-sensitive)

### Can't find "Environment variables" section
- Make sure you're in the function's individual settings page
- Some Netlify plans may have different UI - look for "Configuration" or "Settings"

---

## 📞 Need Help?

If you encounter issues:
1. Check Netlify's documentation: https://docs.netlify.com/functions/configuration/
2. Verify function names match your `netlify/functions/` directory
3. Check that all required variables exist in your site's environment variables

---

## ✅ Completion Checklist

- [ ] Accessed Netlify Dashboard → Site Settings → Functions
- [ ] Configured all simple functions (3 variables each)
- [ ] Configured all admin functions (4-5 variables each)
- [ ] Configured push functions (5 variables each)
- [ ] Configured email functions (7 variables)
- [ ] Configured payment functions (12-15 variables each)
- [ ] Triggered new deployment
- [ ] Verified no 4KB limit errors
- [ ] Tested functions work correctly

**Estimated Time**: 30-45 minutes for all functions

**Result**: Permanent fix for 4KB environment variable limit! 🎉
