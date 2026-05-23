# 🚀 Tharaga Backend - Production API Reference

## 📋 Overview

Enterprise-grade FastAPI backend for Tharaga - India's AI-powered real estate platform.

**Base URL (Production)**: `https://api.tharaga.co.in`  
**Base URL (Local)**: `http://localhost:8001`  
**API Prefix**: `/api/v1`  
**API Docs**: `/api/docs` (Swagger UI)

---

## 🎯 Setup Steps

### 1. **Run Supabase SQL Migration**
```sql
-- File: /app/SUPABASE_SETUP.sql
-- Run in Supabase SQL Editor
-- Creates: locality_insights, meta_events, rera_verification, live_metrics
-- Adds: smart_score, smart_tier columns to leads
-- Creates: helper functions
```

### 2. **Environment Variables (.env)**
```bash
SUPABASE_URL=https://wedevtjjmdvngyshqdro.supabase.co
SUPABASE_KEY=<service_role_key>
META_ACCESS_TOKEN=<meta_capi_token>
META_PIXEL_ID=1431070318716490
WHATSAPP_ACCESS_TOKEN=<optional>
ZOHO_REFRESH_TOKEN=<optional>
```

### 3. **Install Dependencies**
```bash
cd /app/backend
pip install -r requirements.txt
```

### 4. **Run Backend**
```bash
# Local
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Production (Cloud Run)
# Dockerfile already configured
```

---

## 📚 API Endpoints

### 🩺 Health & Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Comprehensive health check with dependency status |
| GET | `/` | Service info |
| GET | `/api/docs` | Interactive Swagger documentation |

---

### 🎯 Lead Management (10 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/leads/` | **Create lead with SmartScore AI** (auto-scoring) |
| GET | `/api/v1/leads/` | Search leads with filters |
| GET | `/api/v1/leads/{lead_id}` | Get lead details |
| GET | `/api/v1/leads/{lead_id}/score` | Get detailed SmartScore breakdown |
| PUT | `/api/v1/leads/{lead_id}/status` | Update lead status |
| POST | `/api/v1/leads/{lead_id}/qualify` | Mark lead as qualified |
| GET | `/api/v1/leads/{lead_id}/activities` | Get activity timeline |
| POST | `/api/v1/leads/{lead_id}/activities` | Add activity |
| GET | `/api/v1/leads/tier/{tier}` | Get leads by tier (lion/monkey/dog) |
| POST | `/api/v1/leads/{lead_id}/reassign` | Reassign to different sales person |

**Example: Create Lead**
```bash
curl -X POST https://api.tharaga.co.in/api/v1/leads/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rahul Kumar",
    "phone": "9876543210",
    "email": "rahul@example.com",
    "source": "web",
    "budget_min": 5000000,
    "budget_max": 8000000,
    "property_type": "apartment",
    "bedrooms": 3,
    "preferred_localities": ["Adyar", "Velachery"],
    "timeline": "1-3months"
  }'
```

---

### 🏠 Property Management (5 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/properties/` | Create property with AI scoring |
| GET | `/api/v1/properties/{property_id}` | Get property details |
| POST | `/api/v1/properties/search` | Advanced search with 10+ filters |
| GET | `/api/v1/properties/{property_id}/score` | Get AI score breakdown |
| POST | `/api/v1/properties/verify-rera` | Verify RERA ID |

**Example: Search Properties**
```bash
curl -X POST https://api.tharaga.co.in/api/v1/properties/search \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Chennai",
    "locality": "Anna Nagar",
    "min_price": 5000000,
    "max_price": 15000000,
    "bedrooms": 3,
    "rera_verified_only": true,
    "sort_by": "ai_score",
    "limit": 20
  }'
```

---

### 🏗️ Builder Management (5 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/builders/` | Register builder |
| GET | `/api/v1/builders/{builder_id}` | Get builder profile |
| GET | `/api/v1/builders/{builder_id}/dashboard` | **Real-time builder dashboard** |
| GET | `/api/v1/builders/{builder_id}/properties` | Get builder's properties |
| PUT | `/api/v1/builders/{builder_id}` | Update builder info |

---

### 📊 Analytics & Live Metrics (3 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/analytics/live-metrics` | **Real-time dashboard metrics** |
| GET | `/api/v1/analytics/market-data?city=Chennai` | Market intelligence |
| GET | `/api/v1/analytics/locality-insights?city=X&locality=Y` | Locality details |

---

### 🧮 AI Tools / Calculators (6 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/tools/roi-calculator` | ROI Calculator |
| POST | `/api/v1/tools/emi-calculator` | EMI Calculator with monthly breakdown |
| POST | `/api/v1/tools/budget-planner` | Home buying budget planner |
| POST | `/api/v1/tools/loan-eligibility` | Loan eligibility check |
| POST | `/api/v1/tools/property-valuation` | **AI property valuation** |
| GET | `/api/v1/tools/locality-insights` | Locality insights |

**Example: EMI Calculator**
```bash
curl -X POST https://api.tharaga.co.in/api/v1/tools/emi-calculator \
  -H "Content-Type: application/json" \
  -d '{
    "loan_amount": 5000000,
    "interest_rate_yearly": 8.5,
    "tenure_months": 240
  }'
```

---

### 🔌 Integrations (4 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/integrations/meta-capi/event` | Send Meta CAPI event |
| POST | `/api/v1/integrations/whatsapp/send` | Send WhatsApp message |
| GET/POST | `/api/v1/integrations/whatsapp/webhook` | WhatsApp webhook handler |
| POST | `/api/v1/integrations/zoho-crm/sync-lead` | Sync to Zoho CRM |

---

## 🧠 SmartScore AI Algorithm

Lead scoring is based on **5 weighted factors**:

| Factor | Weight | Description |
|--------|--------|-------------|
| Budget | 25% | Higher budgets score higher |
| Timeline | 20% | Immediate buyers score highest |
| Engagement | 20% | Landing page & UTM signals |
| Source | 15% | Referral/direct > paid > organic |
| Qualification | 20% | AI qualification status |

**Tiers:**
- 🦁 **LION** (≥75): Senior exec (15min SLA)
- 🐵 **MONKEY** (50-74): Round robin (60min SLA)
- 🐕 **DOG** (<50): Channel partners (240min SLA)

---

## 🎨 Frontend Integration

### Include the API client
```html
<script src="/js/tharaga-api.js"></script>
```

### Use the API
```javascript
// Create lead (auto-captures UTM, referrer, FBP, FBC)
const result = await tharagaAPI.leads.create({
  name: 'John Doe',
  phone: '9876543210',
  email: 'john@example.com',
  source: 'web',
  budget_min: 5000000,
  budget_max: 10000000,
  property_type: 'apartment',
  timeline: '1-3months'
});

// Get live metrics
const metrics = await tharagaAPI.analytics.getLiveMetrics();

// Search properties
const properties = await tharagaAPI.properties.search({
  city: 'Chennai',
  bedrooms: 3,
  rera_verified_only: true
});

// Calculate EMI
const emi = await tharagaAPI.tools.calculateEMI({
  loan_amount: 5000000,
  interest_rate_yearly: 8.5,
  tenure_months: 240
});
```

---

## ⚡ Production Features

✅ **Rate Limiting**: Path-specific limits (20 leads/min, 60 tools/min)  
✅ **Circuit Breakers**: For Meta CAPI, WhatsApp, Zoho (5 failures → 60s cooldown)  
✅ **Retry Logic**: Exponential backoff for external services  
✅ **TTL Caching**: 5-min cache for live metrics, market data  
✅ **Request ID Tracking**: All requests get X-Request-ID header  
✅ **Structured Logging**: With timing info  
✅ **Health Checks**: Including downstream dependencies  
✅ **CORS Configured**: With proper origin handling  
✅ **Graceful Degradation**: Falls back when DB/services unavailable  

---

## 📦 Deployment

### Cloud Run (Recommended)
```bash
# Build & deploy
gcloud run deploy tharaga-api \
  --source=/app/backend \
  --region=asia-south1 \
  --allow-unauthenticated \
  --set-env-vars="SUPABASE_URL=...,SUPABASE_KEY=..."
```

### Docker
```dockerfile
# Already in /app/backend/Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8080"]
```

---

## 🐛 Troubleshooting

### Backend won't start
```bash
sudo supervisorctl status backend
tail -50 /var/log/supervisor/backend.err.log
```

### Test specific endpoints
```bash
# Health check
curl http://localhost:8001/health

# Tools (no DB needed)
curl -X POST http://localhost:8001/api/v1/tools/emi-calculator \
  -H "Content-Type: application/json" \
  -d '{"loan_amount":5000000,"interest_rate_yearly":8.5,"tenure_months":240}'
```

---

## 🎯 What's Next

After running `SUPABASE_SETUP.sql`:
1. ✅ All endpoints will work with smart_score/smart_tier columns
2. ✅ Market data API will return Chennai locality insights
3. ✅ Lead distribution will work with sales team
4. ✅ Meta CAPI events will be tracked
