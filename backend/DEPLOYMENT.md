# 🚀 Tharaga Backend - Cloud Run Deployment Guide

## Quick Deploy to Cloud Run

The backend is already configured with a Dockerfile for Cloud Run deployment.

### Prerequisites
- Google Cloud project: `your-project-id`
- gcloud CLI installed and authenticated
- Existing custom domain mapped: `api.tharaga.co.in`

### 1. Build and Deploy

```bash
cd /app/backend

# Deploy with environment variables
gcloud run deploy tharaga-api \
  --source=. \
  --region=asia-south1 \
  --platform=managed \
  --allow-unauthenticated \
  --port=8001 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=1 \
  --max-instances=10 \
  --timeout=60 \
  --set-env-vars="\
SUPABASE_URL=https://wedevtjjmdvngyshqdro.supabase.co,\
SUPABASE_KEY=YOUR_SERVICE_ROLE_KEY,\
META_ACCESS_TOKEN=YOUR_META_TOKEN,\
META_PIXEL_ID=1431070318716490,\
ALLOWED_ORIGINS=https://tharaga.co.in,https://www.tharaga.co.in"
```

### 2. Verify Deployment

```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe tharaga-api --region=asia-south1 --format='value(status.url)')

# Test
curl $SERVICE_URL/health
```

### 3. Configure Custom Domain

```bash
# Map your custom domain
gcloud beta run domain-mappings create \
  --service=tharaga-api \
  --domain=api.tharaga.co.in \
  --region=asia-south1
```

### 4. Update Netlify Frontend

The Netlify config (`/app/netlify.toml`) already proxies `/api/*` to `https://api.tharaga.co.in`. No changes needed once Cloud Run is deployed.

```toml
[[redirects]]
  from = "/api/*"
  to = "https://api.tharaga.co.in/:splat"
  status = 200
  force = true
```

## Pre-Deployment Checklist

- [ ] Run `/app/SUPABASE_SETUP.sql` in Supabase SQL Editor
- [ ] Refresh Meta CAPI access token in env vars
- [ ] Add WhatsApp credentials (if using)
- [ ] Add Zoho CRM credentials (if using)
- [ ] Update `ALLOWED_ORIGINS` to production domains only
- [ ] Set `DEBUG=False`
- [ ] Test all endpoints locally first

## Environment Variables Reference

### Required
```bash
SUPABASE_URL              # Your Supabase URL
SUPABASE_KEY              # Service role key (NOT anon key)
```

### Recommended
```bash
META_ACCESS_TOKEN         # For CAPI tracking
META_PIXEL_ID             # Pixel ID
ALLOWED_ORIGINS           # CORS origins (comma-separated)
```

### Optional
```bash
WHATSAPP_PHONE_NUMBER_ID  # WhatsApp Business API
WHATSAPP_ACCESS_TOKEN     # WhatsApp Business API token
WHATSAPP_VERIFY_TOKEN     # For webhook verification
ZOHO_CLIENT_ID            # Zoho CRM
ZOHO_CLIENT_SECRET        # Zoho CRM
ZOHO_REFRESH_TOKEN        # Zoho CRM
```

## Health Monitoring

Cloud Run provides automatic health checks on `/health`. The endpoint returns:
- `200` with status info if healthy
- Auto-restart if unhealthy

## Scaling Configuration

- **Min instances**: 1 (to avoid cold starts)
- **Max instances**: 10 (adjust based on traffic)
- **CPU**: 1 (sufficient for most operations)
- **Memory**: 512Mi (can increase if needed)
- **Concurrency**: 80 (default)

## Cost Optimization

For low traffic:
- Set `min-instances=0` (cold starts acceptable)
- Use `--cpu-throttling` to reduce idle CPU costs
- Lower max-instances if budget constrained

## Monitoring

```bash
# View logs
gcloud run services logs read tharaga-api --region=asia-south1

# Stream logs
gcloud run services logs tail tharaga-api --region=asia-south1
```

## Rollback

```bash
# List revisions
gcloud run revisions list --service=tharaga-api --region=asia-south1

# Rollback to specific revision
gcloud run services update-traffic tharaga-api \
  --region=asia-south1 \
  --to-revisions=tharaga-api-00001-abc=100
```

---

## 🎉 Deployment Complete

Once deployed:
- Backend live at: `https://api.tharaga.co.in`
- API docs at: `https://api.tharaga.co.in/api/docs`
- Frontend automatically proxies via Netlify
