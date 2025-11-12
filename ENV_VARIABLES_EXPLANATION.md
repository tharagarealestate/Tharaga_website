# Environment Variables Explanation: NEXT_PUBLIC_API_URL vs NEXT_PUBLIC_APP_URL

## ❌ NO - They are NOT the same!

### Difference Between the Two Variables

#### 1. `NEXT_PUBLIC_API_URL` (You Already Have This) ✅
- **Value:** `https://tharaga-backend-796994429555.us-central1.run.app`
- **Purpose:** Backend API service URL (Cloud Run)
- **Used For:** 
  - API calls to backend services
  - External service integrations
  - Backend API endpoints
- **Status:** ✅ **YOU ALREADY HAVE THIS SET IN NETLIFY**
- **Action:** ✅ **KEEP IT AS-IS - DO NOT CHANGE**

#### 2. `NEXT_PUBLIC_APP_URL` (Optional) ⚠️
- **Value:** `https://tharaga.co.in` (your frontend domain)
- **Purpose:** Frontend application URL (Netlify/Next.js app)
- **Used For:**
  - Links in emails
  - Frontend redirects
  - Public-facing URLs
- **Status:** ⚠️ **OPTIONAL - NOT REQUIRED FOR CALENDAR INTEGRATION**
- **Action:** ⚠️ **NOT CURRENTLY USED IN CALENDAR INTEGRATION**

---

## 🎯 Answer to Your Question

### ❌ **NO, you do NOT need to change `NEXT_PUBLIC_API_URL` to `NEXT_PUBLIC_APP_URL`**

**Why?**
1. They serve **different purposes**:
   - `NEXT_PUBLIC_API_URL` = Backend service (Cloud Run)
   - `NEXT_PUBLIC_APP_URL` = Frontend application (Netlify)

2. **Calendar integration does NOT use `NEXT_PUBLIC_APP_URL`**:
   - Calendar uses `request.url` which auto-detects the current domain
   - Redirects work automatically without needing `NEXT_PUBLIC_APP_URL`
   - Only one place uses a hardcoded URL (in site-visits email), and it's hardcoded to `https://tharaga.co.in`

3. **You already have `NEXT_PUBLIC_API_URL` set correctly**:
   - Your value: `https://tharaga-backend-796994429555.us-central1.run.app`
   - This is correct for your backend service
   - Keep it as-is

---

## 📋 What You Need to Do

### ✅ Keep `NEXT_PUBLIC_API_URL` (You Already Have This)
```
NEXT_PUBLIC_API_URL=https://tharaga-backend-796994429555.us-central1.run.app
```
**Action:** ✅ **KEEP IT - DO NOT CHANGE**

### ⚠️ `NEXT_PUBLIC_APP_URL` is Optional
```
NEXT_PUBLIC_APP_URL=https://tharaga.co.in
```
**Action:** ⚠️ **OPTIONAL - NOT REQUIRED FOR CALENDAR INTEGRATION**

---

## 🔍 Where Each Variable is Used

### `NEXT_PUBLIC_API_URL` Usage:
- `app/next.config.mjs` - API base URL
- `app/hooks/useBehaviorTracking.ts` - API calls
- `app/app/microsite/[id]/page.tsx` - API calls
- `app/lib/saas-api.ts` - API calls
- `app/lib/api.ts` - API base URL
- `app/components/ui/PayButton.tsx` - API calls
- `app/components/ui/FeatureGate.tsx` - API calls
- `app/app/saas/dashboard/page.tsx` - API calls
- `app/app/saas/analytics/page.tsx` - API calls
- `app/app/properties/[id]/page.tsx` - API calls
- `app/app/api/recommendations/route.ts` - API calls
- `app/app/api/interactions/route.ts` - API calls

### `NEXT_PUBLIC_APP_URL` Usage:
- **NOT CURRENTLY USED IN CALENDAR INTEGRATION**
- Could be used for email links (but currently hardcoded)
- Could be used for frontend redirects (but calendar uses `request.url`)

---

## ✅ Summary

1. **`NEXT_PUBLIC_API_URL`** = Backend service URL ✅ **YOU HAVE THIS**
2. **`NEXT_PUBLIC_APP_URL`** = Frontend application URL ⚠️ **OPTIONAL**
3. **Calendar integration** uses `request.url` (auto-detects domain) ✅ **WORKS WITHOUT `NEXT_PUBLIC_APP_URL`**
4. **You do NOT need to change** `NEXT_PUBLIC_API_URL` to `NEXT_PUBLIC_APP_URL` ✅ **KEEP IT AS-IS**

---

## 🚀 Next Steps

1. ✅ **Keep `NEXT_PUBLIC_API_URL`** as-is in Netlify
2. ⚠️ **`NEXT_PUBLIC_APP_URL` is optional** - only add it if you need it for other features
3. ✅ **Calendar integration will work** without `NEXT_PUBLIC_APP_URL`
4. ✅ **All redirects work automatically** using `request.url`

---

## 📝 Example

### Current Setup (Correct) ✅
```
NEXT_PUBLIC_API_URL=https://tharaga-backend-796994429555.us-central1.run.app
```
**This is your backend service URL - KEEP IT**

### Optional Addition (Not Required) ⚠️
```
NEXT_PUBLIC_APP_URL=https://tharaga.co.in
```
**This would be your frontend URL - OPTIONAL**

---

## 🎉 Conclusion

**You do NOT need to change `NEXT_PUBLIC_API_URL` to `NEXT_PUBLIC_APP_URL`**. They are different variables serving different purposes:

- **`NEXT_PUBLIC_API_URL`** = Backend service (Cloud Run) ✅ **YOU HAVE THIS**
- **`NEXT_PUBLIC_APP_URL`** = Frontend application (Netlify) ⚠️ **OPTIONAL**

**Calendar integration works without `NEXT_PUBLIC_APP_URL`** because it uses `request.url` to auto-detect the current domain.

