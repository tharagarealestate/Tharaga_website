# Supabase Setup & Key Rotation Guide for Tharaga

## 🚨 URGENT: Rotate Your Keys

Your Supabase credentials were exposed publicly. Follow these steps immediately:

---

## Part 1: Rotate Your Supabase API Keys

### Step 1: Access Your Supabase Dashboard

1. Go to: https://app.supabase.com
2. Log in with your account
3. Select your project: `wedevtjjmdvngyshqdro`

### Step 2: Navigate to API Settings

1. Click on **Settings** (⚙️ icon in left sidebar)
2. Click on **API** in the settings menu
3. You'll see your current API keys

### Step 3: Generate New Keys

#### Option A: Reset Project API Keys (Recommended)
1. Scroll down to find **"Reset project API keys"** or **"Regenerate keys"** button
2. Click the button
3. Confirm the action (this will invalidate old keys)
4. Copy the new keys:
   - **anon public** (new SUPABASE_ANON_KEY)
   - **service_role** (new SUPABASE_SERVICE_ROLE_KEY)

#### Option B: If No Reset Button Available
Some Supabase plans may not have a reset button. In this case:
1. Consider upgrading your plan for better security features
2. Or rotate your database password instead (see Step 4)

### Step 4: Change Database Password

1. Go to **Settings** → **Database**
2. Find **Database Password** section
3. Click **Reset database password**
4. Generate a new strong password (suggestion: use 20+ characters with mix of letters, numbers, symbols)
5. Save this password securely
6. Your new DATABASE_URL will be:
   ```
   postgresql://postgres:NEW_PASSWORD@db.wedevtjjmdvngyshqdro.supabase.co:5432/postgres
   ```

### Step 5: Update Your Local .env File

Open `/e/Tharaga_website/Tharaga_website/.env` and update:

```bash
# Update with NEW keys from Supabase dashboard
SUPABASE_URL=https://wedevtjjmdvngyshqdro.supabase.co
SUPABASE_ANON_KEY=your_new_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_new_service_role_key_here
DATABASE_URL=postgresql://postgres:NEW_PASSWORD@db.wedevtjjmdvngyshqdro.supabase.co:5432/postgres
```

### Step 6: Update Client-Side Configuration

Since your frontend uses hardcoded keys in `js/supabase-init.js`, you need to update that file too.

**IMPORTANT**: The anon key is safe to expose in client-side code (it respects RLS policies), but you should still rotate it.

---

## Part 2: Set Up Supabase Client Configuration

Your project structure:
- **Frontend**: Vanilla JavaScript (loads Supabase from CDN)
- **Backend**: Python
- **Edge Functions**: TypeScript/JavaScript

### A. Frontend Configuration (Vanilla JavaScript)

#### Current Setup Issue
Your `js/supabase-init.js` has hardcoded credentials. Let's fix this.

#### Solution: Create a Config File

**Option 1: Keep credentials in a separate config file (not committed)**

Create `js/config.js`:
```javascript
// js/config.js
// This file contains your Supabase configuration
// DO NOT commit this file to git (add to .gitignore)

export const SUPABASE_CONFIG = {
  url: 'https://wedevtjjmdvngyshqdro.supabase.co',
  anonKey: 'your_new_anon_key_here' // Update after rotation
};
```

Update `js/supabase-init.js` to import from config:
```javascript
// js/supabase-init.js
import { SUPABASE_CONFIG } from './config.js';

;(function(){
  const CONFIG = {
    url: SUPABASE_CONFIG.url,
    key: SUPABASE_CONFIG.anonKey
  };

  // ... rest of your existing code
})();
```

Add to `.gitignore`:
```
js/config.js
```

Create `js/config.example.js` for team members:
```javascript
// js/config.example.js
// Copy this to config.js and fill in your values

export const SUPABASE_CONFIG = {
  url: 'https://your-project.supabase.co',
  anonKey: 'your-anon-key-here'
};
```

**Option 2: For production builds with bundlers (if you add Vite/Webpack later)**

Create a build process that injects environment variables:
```javascript
// Using Vite example
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

### B. Backend Configuration (Python)

Create `backend/.env` (if it doesn't exist):
```bash
# backend/.env
SUPABASE_URL=https://wedevtjjmdvngyshqdro.supabase.co
SUPABASE_KEY=your_new_service_role_key_here
SUPABASE_DB_URL=postgresql://postgres:NEW_PASSWORD@db.wedevtjjmdvngyshqdro.supabase.co:5432/postgres
```

Install python-dotenv:
```bash
cd backend
pip install python-dotenv supabase
```

Create `backend/app/config.py`:
```python
# backend/app/config.py
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_KEY = os.getenv('SUPABASE_KEY')
    SUPABASE_DB_URL = os.getenv('SUPABASE_DB_URL')

    @classmethod
    def validate(cls):
        """Validate that required config is present"""
        required = ['SUPABASE_URL', 'SUPABASE_KEY']
        missing = [key for key in required if not getattr(cls, key)]
        if missing:
            raise ValueError(f"Missing required config: {', '.join(missing)}")
```

Create `backend/app/supabase_client.py`:
```python
# backend/app/supabase_client.py
from supabase import create_client, Client
from .config import Config

Config.validate()

# Initialize Supabase client
supabase: Client = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)

# Export for use in other files
__all__ = ['supabase']
```

Usage in your Python code:
```python
# backend/app/some_route.py
from .supabase_client import supabase

# Now use supabase client
def get_user_data(user_id):
    response = supabase.table('users').select('*').eq('id', user_id).execute()
    return response.data
```

### C. Supabase Edge Functions Configuration

Your edge functions automatically have access to environment variables.

Check your edge function (example):
```typescript
// supabase/functions/search/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // These are automatically available in Supabase Edge Functions
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Your function logic here
})
```

No configuration needed - Supabase automatically injects these variables!

---

## Part 3: Update Deployment Configurations

### Netlify/Vercel (Frontend)

1. Go to your hosting dashboard (Netlify/Vercel)
2. Navigate to **Environment Variables** or **Settings** → **Environment**
3. Add/Update:
   ```
   SUPABASE_URL = https://wedevtjjmdvngyshqdro.supabase.co
   SUPABASE_ANON_KEY = your_new_anon_key_here
   ```

### Render (Backend)

If deploying Python backend on Render:
1. Go to Render dashboard
2. Select your service
3. Go to **Environment** tab
4. Add/Update environment variables with new keys

### Docker Deployment

Update your `backend/env.yaml` or Docker environment:
```yaml
# backend/env.yaml
SUPABASE_URL: 'https://wedevtjjmdvngyshqdro.supabase.co'
SUPABASE_KEY: 'your_new_service_role_key_here'
```

---

## Part 4: Testing After Rotation

### Test Checklist

1. **Local Frontend Test**:
   ```bash
   # Start local server
   npm run serve
   # Open browser and check console for Supabase connection
   ```

2. **Backend Test**:
   ```bash
   cd backend
   python -m pytest tests/  # Run your tests
   ```

3. **Edge Function Test**:
   ```bash
   supabase functions serve search
   # Test with curl or Postman
   ```

4. **Check RLS Policies Still Work**:
   - Try logging in
   - Try accessing protected resources
   - Verify unauthorized access is blocked

---

## Part 5: Security Best Practices Going Forward

### ✅ DO

1. **Use .gitignore properly**
   - Never commit `.env` files
   - Never commit `js/config.js` (if using that approach)

2. **Rotate keys periodically**
   - Every 90 days as a best practice
   - Immediately if suspected compromise

3. **Use appropriate keys for each context**:
   - Client-side: `SUPABASE_ANON_KEY` ✓
   - Server-side: `SUPABASE_SERVICE_ROLE_KEY` ✓
   - Never mix them up!

4. **Monitor access logs**
   - Check Supabase dashboard → Reports
   - Look for unusual activity

5. **Use Row Level Security (RLS)**
   - RLS protects data even if anon key is exposed
   - Always enable RLS on user tables

### ❌ DON'T

1. **Never commit credentials to git**
   ```bash
   # If you accidentally committed secrets:
   git rm --cached .env
   git commit -m "Remove accidentally committed .env"
   # Then rotate keys immediately!
   ```

2. **Never use service_role key in client-side code**
   ```javascript
   // ❌ NEVER DO THIS
   const supabase = createClient(url, SERVICE_ROLE_KEY)

   // ✅ Always use anon key on client
   const supabase = createClient(url, ANON_KEY)
   ```

3. **Never share keys in chat/email/screenshots**
   - Use password managers
   - Use secure secret sharing tools if needed

---

## Quick Reference: Which Key Where?

| Context | Key Type | Why |
|---------|----------|-----|
| **Browser JavaScript** | ANON_KEY | Respects RLS, safe to expose |
| **Python Backend** | SERVICE_ROLE_KEY | Bypasses RLS, full access |
| **Edge Functions** | SERVICE_ROLE_KEY | Server-side operations |
| **Direct DB Access** | DATABASE_URL | For migrations, admin tasks |
| **Mobile Apps** | ANON_KEY | Same as browser |

---

## Need Help?

- **Supabase Docs**: https://supabase.com/docs/guides/auth
- **RLS Guides**: https://supabase.com/docs/guides/auth/row-level-security
- **Security Best Practices**: https://supabase.com/docs/guides/platform/security

---

## After Rotation Checklist

- [ ] Rotated API keys in Supabase dashboard
- [ ] Changed database password
- [ ] Updated local `.env` file
- [ ] Updated `js/supabase-init.js` (or created config.js)
- [ ] Updated backend configuration
- [ ] Updated deployment environment variables (Netlify/Render/etc)
- [ ] Tested local frontend
- [ ] Tested backend
- [ ] Tested edge functions
- [ ] Verified RLS policies work
- [ ] Added `js/config.js` to `.gitignore` (if using that approach)
- [ ] Committed changes (excluding secrets!)
