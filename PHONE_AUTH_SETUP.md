# 📞 Phone Authentication Setup Guide

## Quick Setup Instructions

### Step 1: Enable Phone Provider in Supabase

1. Go to your Supabase project: https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro
2. Navigate to: **Authentication → Providers**
3. Scroll down to find **Phone** provider
4. Click to expand and enable it

### Step 2: Choose Your SMS Provider

#### Option A: Production Setup (Twilio)

**For production use with real SMS:**

1. **Sign up for Twilio:**
   - Go to: https://www.twilio.com/try-twilio
   - Create a free account (includes $15 credit)
   - Complete phone verification

2. **Get Your Credentials:**
   - Account SID: Found in Twilio Console Dashboard
   - Auth Token: Found in Twilio Console Dashboard
   - Phone Number: Purchase one from Twilio (costs ~$1-2/month)

3. **Configure in Supabase:**
   ```
   Provider: Twilio
   Account SID: [Your Account SID]
   Auth Token: [Your Auth Token]
   Sender Phone Number: [Your Twilio Number, e.g., +12223334444]
   ```

4. **Twilio Pricing (India):**
   - SMS to India: ~₹0.50-1.50 per SMS
   - Phone number: ~₹150-300/month
   - Great for production!

#### Option B: Development/Testing Setup (Fake OTP)

**For development and testing (NO REAL SMS):**

1. In Supabase Phone provider settings
2. Toggle on: **"Use Fake OTP"**
3. Save changes

**How it works:**
- Any phone number can be used for testing
- The OTP is always: `123456`
- No actual SMS sent
- Perfect for development
- ⚠️ **NEVER use in production!**

### Step 3: Test Phone Authentication

#### Using Fake OTP (Testing):

```javascript
// In your app
const { data, error } = await supabase.auth.signInWithOtp({
  phone: '+919876543210', // Any number works
})

// User enters OTP: 123456 (always this in test mode)
const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
  phone: '+919876543210',
  token: '123456',
  type: 'sms'
})
```

#### Using Twilio (Production):

```javascript
// Same code, but real SMS will be sent
const { data, error } = await supabase.auth.signInWithOtp({
  phone: '+919876543210', // Real phone number
})

// User receives SMS with real OTP code
// User enters the code they received
const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
  phone: '+919876543210',
  token: 'REAL_CODE', // The code from SMS
  type: 'sms'
})
```

## Configuration in Supabase Dashboard

### Phone Provider Settings

Navigate to: **Authentication → Providers → Phone**

```yaml
✓ Enable Phone Sign-in
  
SMS Provider: 
  ○ Twilio (Production)
  ○ MessageBird (Alternative)
  ○ Vonage (Alternative)
  ● Use Fake OTP (Testing Only)

# If Twilio selected:
Twilio Account SID: ACxxxxxxxxxxxxxxxxxx
Twilio Auth Token: xxxxxxxxxxxxxxxxxx
Sender Phone Number: +1234567890

# Rate Limiting (Important!):
Max OTP attempts: 5
OTP expiry: 60 seconds
Cooldown period: 60 seconds
```

## Phone Number Format

**Always use E.164 format:**
- ✅ Correct: `+919876543210` (India)
- ✅ Correct: `+12223334444` (USA)
- ✅ Correct: `+442012345678` (UK)
- ❌ Wrong: `9876543210` (missing country code)
- ❌ Wrong: `+91 98765 43210` (has spaces)
- ❌ Wrong: `+91-9876543210` (has hyphens)

## Testing Checklist

### Development Phase:
- [ ] Phone provider enabled in Supabase
- [ ] "Use Fake OTP" enabled
- [ ] Test sign-up with phone number
- [ ] Test OTP verification (use 123456)
- [ ] Verify user created in auth.users
- [ ] Verify profile created in public.profiles

### Production Phase:
- [ ] Twilio account created
- [ ] Twilio credentials configured in Supabase
- [ ] Phone number purchased
- [ ] "Use Fake OTP" DISABLED
- [ ] Test with real phone number
- [ ] Verify SMS received
- [ ] Test in different countries (if needed)
- [ ] Monitor Twilio usage/costs

## Common Issues & Solutions

### Issue: Phone auth not working
**Symptoms:** No SMS received, errors in console

**Solutions:**
1. ✓ Check phone provider is enabled
2. ✓ Verify phone number format (E.164)
3. ✓ Check Twilio credentials are correct
4. ✓ Verify Twilio phone number is correct
5. ✓ Check Twilio account balance
6. ✓ For testing: Enable "Use Fake OTP"

### Issue: OTP verification fails
**Symptoms:** "Invalid OTP" or "Expired OTP"

**Solutions:**
1. ✓ OTP expires after 60 seconds (default)
2. ✓ Check for typos in OTP entry
3. ✓ Verify phone number matches exactly
4. ✓ For testing: Use `123456` as OTP
5. ✓ Check rate limiting hasn't blocked user

### Issue: SMS not delivered (Twilio)
**Symptoms:** User doesn't receive SMS

**Solutions:**
1. ✓ Check Twilio logs for delivery status
2. ✓ Verify phone number is valid and reachable
3. ✓ Check Twilio account has sufficient balance
4. ✓ Verify sender phone number is verified
5. ✓ Check country restrictions in Twilio settings

### Issue: Too expensive (Twilio)
**Symptoms:** High SMS costs

**Solutions:**
1. Consider alternative providers:
   - MessageBird: Cheaper for Europe/Asia
   - Vonage: Good global rates
   - AWS SNS: If using AWS already
2. Implement rate limiting in app
3. Add CAPTCHA to prevent abuse
4. Use email as fallback method

## Alternative SMS Providers

### MessageBird
- Good pricing for Europe and Asia
- Easy setup similar to Twilio
- Dashboard: https://www.messagebird.com

### Vonage (formerly Nexmo)
- Competitive pricing globally
- Good for high-volume
- Dashboard: https://dashboard.nexmo.com

### AWS SNS
- Very cheap (~$0.00645/SMS to India)
- Requires AWS account and setup
- Good if already using AWS

### Firebase Phone Auth
- Free tier available
- Integrated with Google Cloud
- Alternative to Supabase auth

## Code Examples

### Complete Phone Auth Flow

```typescript
// components/PhoneAuth.tsx
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export function PhoneAuth() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)

  const handleSendOTP = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone,
      })
      
      if (error) throw error
      
      setStep('otp')
      alert('OTP sent! Check your phone.')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: otp,
        type: 'sms'
      })
      
      if (error) throw error
      
      alert('Success! You are logged in.')
      // Redirect to dashboard
      window.location.href = '/dashboard'
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (step === 'phone') {
    return (
      <div>
        <h2>Sign in with Phone</h2>
        <input
          type="tel"
          placeholder="+919876543210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button onClick={handleSendOTP} disabled={loading}>
          {loading ? 'Sending...' : 'Send OTP'}
        </button>
      </div>
    )
  }

  return (
    <div>
      <h2>Enter OTP</h2>
      <p>Sent to {phone}</p>
      <input
        type="text"
        placeholder="123456"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        maxLength={6}
      />
      <button onClick={handleVerifyOTP} disabled={loading}>
        {loading ? 'Verifying...' : 'Verify OTP'}
      </button>
      <button onClick={() => setStep('phone')}>
        Change Phone Number
      </button>
    </div>
  )
}
```

## Security Best Practices

1. **Rate Limiting:**
   - Limit OTP requests per phone number (e.g., 3 per hour)
   - Implement CAPTCHA before sending OTP
   - Block suspicious patterns

2. **Phone Verification:**
   - Validate phone format before sending OTP
   - Use libphonenumber for validation
   - Store verified phone numbers

3. **OTP Security:**
   - Never log OTPs in production
   - Short expiry time (60-120 seconds)
   - Invalidate after use
   - Max 3-5 attempts

4. **Cost Control:**
   - Set billing alerts in Twilio
   - Monitor usage regularly
   - Implement abuse detection
   - Use email as alternative

## Support & Resources

- [Supabase Phone Auth Docs](https://supabase.com/docs/guides/auth/phone-login)
- [Twilio Console](https://console.twilio.com)
- [E.164 Format Validator](https://www.twilio.com/docs/glossary/what-e164)
- [libphonenumber GitHub](https://github.com/google/libphonenumber)

---

**Quick Start:** For testing, just enable "Use Fake OTP" and use `123456` as the OTP! 🚀

