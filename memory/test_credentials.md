# Tharaga Backend - Test Credentials

## 🔑 Supabase
- **URL**: `https://wedevtjjmdvngyshqdro.supabase.co`
- **Service Key**: Already configured in `/app/backend/.env`

## 🌐 API Base URLs
- **Local**: `http://localhost:8001`
- **Production**: `https://api.tharaga.co.in` (Cloud Run)

## 🧪 Test Lead Data
Use these formats for testing:
```json
{
  "name": "Test User",
  "phone": "9876543XXX",  // 10 digits, unique per test
  "email": "test@example.com",
  "source": "web",
  "budget_min": 5000000,
  "budget_max": 8000000,
  "property_type": "apartment",
  "bedrooms": 3,
  "preferred_localities": ["Adyar", "Velachery"],
  "timeline": "1-3months"
}
```

## 📊 Existing Data in Production DB
- **Leads**: 7+ existing leads (verify with `GET /api/v1/leads/`)
- **Properties**: 32 Chennai properties (verify with `POST /api/v1/properties/search`)
- **Builders**: Existing builder records

## 🔌 Integration Status
- **Meta CAPI**: Configured (token may need refresh - check `error: token expired`)
  - Pixel ID: 1431070318716490
- **WhatsApp**: NOT configured (placeholder)
- **Zoho CRM**: NOT configured (placeholder)

## 📝 Known Limitations
1. **Optional SQL Migration**: `/app/SUPABASE_SETUP.sql` adds:
   - `smart_score`, `smart_tier` columns to `leads`
   - Tables: `locality_insights`, `meta_events`, `rera_verification`, `live_metrics`
   - Helper functions: `increment_current_leads`, `decrement_current_leads`
   
2. **Without SQL Migration**, the API still works with graceful degradation:
   - SmartScore computed in API response (just not stored in DB)
   - Market data returns empty list
   - RERA verification uses mock fallback (len > 5)

## 🚀 Quick Test Commands
```bash
# Health check
curl http://localhost:8001/health

# Create lead
curl -X POST http://localhost:8001/api/v1/leads/ \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","phone":"9999999999","source":"web","budget_max":5000000,"timeline":"immediate"}'

# Property search
curl -X POST http://localhost:8001/api/v1/properties/search \
  -H "Content-Type: application/json" \
  -d '{"city":"Chennai","limit":5}'

# EMI Calculator
curl -X POST http://localhost:8001/api/v1/tools/emi-calculator \
  -H "Content-Type: application/json" \
  -d '{"loan_amount":5000000,"interest_rate_yearly":8.5,"tenure_months":240}'

# Live metrics
curl http://localhost:8001/api/v1/analytics/live-metrics
```
