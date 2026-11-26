# Security Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables

Ensure these are set in your deployment environment:

```bash
# Required
SUPABASE_URL=https://wedevtjjmdvngyshqdro.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE=your-service-role-key
ENCRYPTION_KEY=your-encryption-key-32-chars-min

# For Edge Functions (push notifications)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

**Generate ENCRYPTION_KEY**:
```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2. Database Migrations

Apply security-related migrations:

```bash
# Navigate to project root
cd E:\Tharaga_website\Tharaga_website

# Apply migrations
supabase migration up

# Or via SQL Editor in Supabase Dashboard:
```

Apply these migrations:
1. `018_auth_rate_limits.sql` - Auth rate limiting table
2. `019_audit_logs.sql` - Audit logging system

### 3. Deploy Edge Functions

```bash
# Deploy auth rate limiting function
supabase functions deploy auth-rate-limit

# Deploy (or redeploy) push notifications
supabase functions deploy send-push

# Verify deployment
supabase functions list
```

### 4. Update Dependencies

```bash
cd app
npm install
```

### 5. Build and Test

```bash
# Build for production
npm run build

# Test in production mode
npm start
```

## Deployment Platforms

### Netlify

1. **Build Settings**:
   - Build command: `cd app && npm run build`
   - Publish directory: `app/.next`

2. **Environment Variables**: Add all required variables in Netlify dashboard

3. **Headers**: Already configured in `next.config.mjs`

### Vercel

1. **Build Settings**: Automatically detected from `next.config.mjs`

2. **Environment Variables**: Add via Vercel dashboard or CLI

```bash
vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE production
vercel env add ENCRYPTION_KEY production
```

3. **Deploy**:
```bash
vercel --prod
```

### Render

1. **Environment**: Set environment variables in Render dashboard

2. **Build Command**: 
```bash
cd app && npm install && npm run build
```

3. **Start Command**:
```bash
cd app && npm start
```

## Post-Deployment Verification

### 1. Security Headers Check

```bash
curl -I https://your-domain.com | grep -E "(X-Frame-Options|Content-Security-Policy|Strict-Transport-Security)"
```

Expected headers:
- `X-Frame-Options: DENY`
- `Content-Security-Policy: default-src 'self';...`
- `Strict-Transport-Security: max-age=31536000...`

### 2. Rate Limiting Test

```bash
# Test auth rate limiting
for i in {1..10}; do
  curl -X POST https://your-domain.com/.netlify/functions/auth-rate-limit \
    -H "Content-Type: application/json" \
    -d '{"action":"login","email":"test@example.com"}'
done
```

Should return 429 after 5 attempts.

### 3. SSL/TLS Verification

```bash
# Check SSL certificate
openssl s_client -connect your-domain.com:443 -showcerts

# Or use online tools:
# https://www.ssllabs.com/ssltest/
```

### 4. API Security Test

```bash
# Test lead submission with validation
curl -X POST https://your-domain.com/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone": "1234567890",
    "email": "test@example.com"
  }'

# Should fail (invalid phone - needs to start with 6-9)
```

### 5. Audit Logging Verification

Query Supabase:
```sql
-- Check audit logs are being created
SELECT * FROM audit_logs 
ORDER BY timestamp DESC 
LIMIT 10;

-- Should see recent login/activity events
```

## Monitoring

### Set Up Alerts

1. **Rate Limit Exceeded**:
```sql
-- Alert if > 100 rate limit violations per hour
SELECT COUNT(*) as violations
FROM audit_logs 
WHERE action = 'rate_limit_exceeded' 
AND timestamp > NOW() - INTERVAL '1 hour';
```

2. **Failed Login Attempts**:
```sql
-- Alert if > 50 failed logins per hour
SELECT COUNT(*) as failed_logins
FROM audit_logs 
WHERE action = 'login_failed' 
AND timestamp > NOW() - INTERVAL '1 hour';
```

### Log Aggregation

Consider integrating with:
- Supabase Logs
- Datadog / New Relic
- Sentry for error tracking
- CloudWatch / Cloud Logging

## Maintenance

### Weekly Tasks

- Review audit logs for anomalies
- Check error rates
- Verify rate limiting is working

### Monthly Tasks

- Review security incident reports
- Update dependencies
- Review and update access controls

### Quarterly Tasks

- Security audit
- Penetration testing
- Encryption key rotation
- Access review

## Rollback Plan

If security issues detected:

1. **Immediate**:
   ```bash
   # Revert to previous deployment
   # Netlify/Vercel: Use rollback feature
   ```

2. **Database**:
   ```bash
   # If needed, rollback migrations
   supabase migration down 1
   ```

3. **Edge Functions**:
   ```bash
   # Redeploy previous version
   supabase functions deploy auth-rate-limit --version previous
   ```

## Security Incident Response

### If Breach Detected

1. **Isolate**: Take affected systems offline
2. **Assess**: Review audit logs to determine scope
3. **Contain**: Revoke compromised credentials
4. **Communicate**: Notify affected users
5. **Fix**: Implement patches
6. **Document**: Record incident details
7. **Prevent**: Update security measures

### Contact Chain

1. Development Team Lead
2. CTO / Technical Director
3. Legal / Compliance
4. Public Relations (if customer data affected)

## Compliance

### Data Protection

- ✅ Encryption at rest (implemented)
- ✅ Encryption in transit (HTTPS)
- ✅ Access logging (audit_logs)
- ✅ Data minimization

### Privacy

- Review user data collection
- Ensure GDPR/PDPA compliance
- Implement user rights requests

## Resources

- **Documentation**: [Security Implementation Guide](./SECURITY_IMPLEMENTATION.md)
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Security**: https://nextjs.org/docs/advanced-features/security
- **OWASP**: https://owasp.org

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-XX  
**Next Review**: Quarterly

