# Auth Settings Configuration Guide

## Overview
This document provides instructions for configuring Supabase Auth settings to address security recommendations.

## Required Configuration Changes

### 1. OTP Expiry Settings

**Current Issue**: OTP expiry is set to more than 1 hour (recommended: < 1 hour)

**Steps to Fix**:
1. Go to Supabase Dashboard → Authentication → Settings
2. Find "Email OTP Expiry" or "OTP Expiry" setting
3. Set the expiry time to **3600 seconds (1 hour)** or less (recommended: **1800 seconds / 30 minutes**)
4. Click "Save"

**Why**: Shorter OTP expiry times reduce the window of opportunity for unauthorized access if an OTP is compromised.

### 2. Leaked Password Protection

**Current Issue**: Leaked password protection is disabled

**Steps to Fix**:
1. Go to Supabase Dashboard → Authentication → Settings
2. Find "Password Security" or "Leaked Password Protection" section
3. Enable "Check passwords against HaveIBeenPwned database"
4. Click "Save"

**Why**: This prevents users from using passwords that have been compromised in data breaches, significantly improving account security.

## Additional Security Recommendations

### 3. Password Strength Requirements

While configuring, also consider:
- **Minimum password length**: 8+ characters (recommended: 12+)
- **Password complexity**: Require mix of uppercase, lowercase, numbers, and symbols
- **Password history**: Prevent reuse of recent passwords

### 4. Rate Limiting

Ensure rate limiting is enabled for:
- Login attempts
- Password reset requests
- OTP requests

### 5. Session Management

Configure:
- **Session timeout**: Set appropriate timeout (e.g., 24 hours)
- **Refresh token rotation**: Enable for better security
- **Multi-factor authentication**: Consider enabling MFA for builders

## Verification

After making changes:
1. Test OTP expiry by requesting a new OTP and verifying it expires at the configured time
2. Test leaked password protection by trying to use a known compromised password
3. Verify settings are saved in the dashboard

## Notes

- These settings are managed in the Supabase Dashboard, not via SQL migrations
- Changes take effect immediately
- Some settings may require Supabase Pro plan or higher
- Always test in a development environment first

## References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Password Security Guide](https://supabase.com/docs/guides/auth/password-security)
- [Going to Production Guide](https://supabase.com/docs/guides/platform/going-into-prod#security)












