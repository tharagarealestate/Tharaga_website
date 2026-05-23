"""
Tharaga Backend API - Comprehensive Test Suite
Covers: health, leads, properties, tools, analytics, integrations
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001").rstrip("/")


@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# Track lead IDs created across tests
class State:
    lead_id = None
    property_id = None


state = State()


# ============ HEALTH / ROOT ============
class TestHealth:
    def test_health(self, api):
        r = api.get(f"{BASE_URL}/health")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] in ("healthy", "degraded")
        assert "checks" in data
        assert data["checks"]["supabase"] == "healthy"
        assert data["checks"]["meta_capi"] == "configured"

    def test_root(self, api):
        r = api.get(f"{BASE_URL}/")
        assert r.status_code == 200
        d = r.json()
        assert d["service"] == "Tharaga Backend API"
        assert d["status"] == "operational"

    def test_request_id_header(self, api):
        r = api.get(f"{BASE_URL}/health")
        assert "x-request-id" in {k.lower() for k in r.headers.keys()}


# ============ LEADS ============
class TestLeads:
    def test_create_lead(self, api):
        unique = uuid.uuid4().hex[:8]
        # Generate unique 10-digit phone to avoid duplicate-key conflict
        import random
        phone = "9" + "".join(str(random.randint(0, 9)) for _ in range(9))
        payload = {
            "name": f"TEST_User_{unique}",
            "email": f"test_{unique}@example.com",
            "phone": phone,
            "source": "web",
            "budget_min": 5000000,
            "budget_max": 8000000,
            "property_type": "apartment",
            "bedrooms": 3,
            "preferred_localities": ["Velachery", "OMR"],
            "timeline": "immediate",
            "utm_source": "google",
            "utm_campaign": "test_campaign",
        }
        r = api.post(f"{BASE_URL}/api/v1/leads/", json=payload)
        assert r.status_code == 201, f"Expected 201, got {r.status_code}: {r.text}"
        data = r.json()
        assert "id" in data
        assert data["name"] == payload["name"]
        assert data["phone"] == payload["phone"]
        # Score should be computed (0-100)
        assert "score" in data
        assert isinstance(data["score"], int)
        assert 0 <= data["score"] <= 100
        # Tier should be one of lion/monkey/dog
        assert data["tier"] in ("lion", "monkey", "dog")
        state.lead_id = data["id"]
        state.created_phone = payload["phone"]
        print(f"Created lead {state.lead_id} with score={data['score']} tier={data['tier']}")

    def test_create_lead_duplicate_phone_returns_409(self, api):
        # After fix: duplicate phone should return 409, not 500
        # Reuse phone from previous test (state.created_phone) to force unique violation
        phone = getattr(state, "created_phone", None)
        if not phone:
            pytest.skip("No created phone from previous test")
        unique = uuid.uuid4().hex[:8]
        payload = {
            "name": f"TEST_Dup_{unique}",
            "email": f"dup_{unique}@example.com",
            "phone": phone,
            "source": "web",
        }
        r = api.post(f"{BASE_URL}/api/v1/leads/", json=payload)
        assert r.status_code == 409, f"Expected 409 for duplicate phone, got {r.status_code}: {r.text}"
        body = r.json()
        detail = str(body.get("detail", "")).lower()
        assert "23505" not in detail, f"Raw DB error leaked: {body}"
        assert "phone" in detail or "exist" in detail or "duplicate" in detail, f"Unexpected detail: {body}"

    def test_get_lead(self, api):
        if not state.lead_id:
            pytest.skip("No lead created")
        r = api.get(f"{BASE_URL}/api/v1/leads/{state.lead_id}")
        assert r.status_code == 200, r.text
        data = r.json()
        assert str(data["id"]) == str(state.lead_id)

    def test_get_lead_score(self, api):
        if not state.lead_id:
            pytest.skip("No lead created")
        r = api.get(f"{BASE_URL}/api/v1/leads/{state.lead_id}/score")
        assert r.status_code == 200, r.text
        data = r.json()
        assert "score" in data
        assert "tier" in data
        assert "factors" in data
        assert isinstance(data["factors"], dict)
        assert 0 <= data["score"] <= 100

    def test_get_lead_activities(self, api):
        if not state.lead_id:
            pytest.skip("No lead created")
        r = api.get(f"{BASE_URL}/api/v1/leads/{state.lead_id}/activities")
        assert r.status_code == 200, r.text
        data = r.json()
        assert "activities" in data
        assert isinstance(data["activities"], list)

    def test_search_leads(self, api):
        r = api.get(f"{BASE_URL}/api/v1/leads/?limit=10")
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, list)

    def test_leads_by_tier(self, api):
        # Use one tier to keep within rate-limit (10/min for /api/v1/leads bucket)
        r = api.get(f"{BASE_URL}/api/v1/leads/tier/lion?limit=5")
        assert r.status_code == 200, r.text
        assert isinstance(r.json(), list)

    def test_get_lead_not_found(self, api):
        r = api.get(f"{BASE_URL}/api/v1/leads/999999999")
        assert r.status_code == 404

    def test_create_lead_invalid(self, api):
        # Missing name and phone
        r = api.post(f"{BASE_URL}/api/v1/leads/", json={"email": "x@y.com"})
        assert r.status_code in (400, 422), r.text


# ============ PROPERTIES ============
class TestProperties:
    def test_search_properties(self, api):
        payload = {"city": "Chennai", "limit": 5, "offset": 0}
        r = api.post(f"{BASE_URL}/api/v1/properties/search", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, list)
        if data:
            state.property_id = data[0]["id"]
            assert "title" in data[0]
            assert "price_inr" in data[0]
            print(f"Picked property: {state.property_id}")

    def test_search_with_filters(self, api):
        payload = {
            "city": "Chennai",
            "bedrooms": 3,
            "min_price": 1000000,
            "max_price": 100000000,
            "sort_by": "price_asc",
            "limit": 10,
        }
        r = api.post(f"{BASE_URL}/api/v1/properties/search", json=payload)
        assert r.status_code == 200, r.text
        assert isinstance(r.json(), list)

    def test_get_property(self, api):
        if not state.property_id:
            pytest.skip("No property id available")
        r = api.get(f"{BASE_URL}/api/v1/properties/{state.property_id}")
        assert r.status_code == 200, r.text
        d = r.json()
        assert str(d["id"]) == str(state.property_id)

    def test_get_property_score(self, api):
        if not state.property_id:
            pytest.skip("No property id available")
        r = api.get(f"{BASE_URL}/api/v1/properties/{state.property_id}/score")
        assert r.status_code == 200, r.text
        d = r.json()
        assert "ai_score" in d
        assert "factors" in d
        assert "reasons" in d

    def test_property_not_found(self, api):
        r = api.get(f"{BASE_URL}/api/v1/properties/00000000-0000-0000-0000-000000000000")
        assert r.status_code in (404, 400, 500)

    def test_verify_rera_valid(self, api):
        # After fix: nested try/except - mock fallback (len>5) should run when table missing.
        r = api.post(f"{BASE_URL}/api/v1/properties/verify-rera?rera_id=TN-RERA-123456")
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["rera_id"] == "TN-RERA-123456"
        assert d["is_valid"] is True, f"Expected is_valid=True for long RERA id, got {d}"

    def test_verify_rera_invalid(self, api):
        r = api.post(f"{BASE_URL}/api/v1/properties/verify-rera?rera_id=AB")
        assert r.status_code == 200
        d = r.json()
        assert d["is_valid"] is False


# ============ TOOLS / CALCULATORS ============
class TestTools:
    def test_roi_calculator(self, api):
        payload = {
            "purchase_price": 5000000,
            "rental_income_monthly": 25000,
            "maintenance_cost_monthly": 2000,
            "property_tax_yearly": 15000,
            "appreciation_rate_yearly": 6.0,
            "holding_period_years": 10,
        }
        r = api.post(f"{BASE_URL}/api/v1/tools/roi-calculator", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["roi_percentage"] != 0
        assert d["appreciation_value"] > 0
        assert "net_profit" in d

    def test_emi_calculator(self, api):
        payload = {"loan_amount": 5000000, "interest_rate_yearly": 8.5, "tenure_months": 240}
        r = api.post(f"{BASE_URL}/api/v1/tools/emi-calculator", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        # EMI for 50L @8.5% for 20yr is ~43391
        assert 40000 < d["emi"] < 50000
        assert d["principal_amount"] == 5000000
        assert len(d["monthly_breakdown"]) == 12

    def test_budget_planner(self, api):
        payload = {
            "monthly_income": 150000,
            "existing_emis": 20000,
            "down_payment_available": 1000000,
            "interest_rate": 8.5,
            "tenure_years": 20,
        }
        r = api.post(f"{BASE_URL}/api/v1/tools/budget-planner", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["max_affordable_emi"] > 0
        assert d["max_loan_amount"] > 0
        assert d["max_property_price"] > d["max_loan_amount"]

    def test_loan_eligibility(self, api):
        payload = {
            "monthly_income": 100000,
            "existing_obligations": 10000,
            "age": 32,
            "employment_type": "salaried",
            "credit_score": 780,
        }
        r = api.post(f"{BASE_URL}/api/v1/tools/loan-eligibility", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["eligible"] is True
        assert d["max_loan_amount"] > 0
        assert d["monthly_emi"] > 0

    def test_loan_ineligible(self, api):
        payload = {"monthly_income": 15000, "age": 30, "employment_type": "salaried"}
        r = api.post(f"{BASE_URL}/api/v1/tools/loan-eligibility", json=payload)
        assert r.status_code == 200
        assert r.json()["eligible"] is False

    def test_property_valuation(self, api):
        payload = {
            "city": "Chennai",
            "locality": "Velachery",
            "property_type": "apartment",
            "bedrooms": 3,
            "sqft": 1500,
            "age_years": 5,
            "amenities": ["gym", "pool", "clubhouse"],
        }
        r = api.post(f"{BASE_URL}/api/v1/tools/property-valuation", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["estimated_price"] > 0
        assert d["price_per_sqft"] > 0
        assert d["market_comparison"] in ("below_market", "at_market", "above_market")


# ============ ANALYTICS ============
class TestAnalytics:
    def test_live_metrics(self, api):
        r = api.get(f"{BASE_URL}/api/v1/analytics/live-metrics")
        assert r.status_code == 200, r.text
        d = r.json()
        # After fix: properties_listed should use real count from DB (~32 expected)
        assert "properties_listed" in d
        assert isinstance(d["properties_listed"], int)
        assert d["properties_listed"] > 0, f"properties_listed expected > 0, got {d['properties_listed']}"
        # active_leads should also be populated (real count via tier fallback)
        assert "active_leads" in d
        assert isinstance(d["active_leads"], int)
        print(f"live-metrics: properties_listed={d['properties_listed']} active_leads={d['active_leads']} lion={d.get('lion_leads')} monkey={d.get('monkey_leads')} dog={d.get('dog_leads')}")

    def test_market_data(self, api):
        r = api.get(f"{BASE_URL}/api/v1/analytics/market-data?city=Chennai")
        assert r.status_code == 200, r.text
        d = r.json()
        assert isinstance(d, dict)


# ============ INTEGRATIONS ============
class TestIntegrations:
    def test_meta_capi_event(self, api):
        # After fix: endpoint accepts JSON body via MetaEventRequest model
        body = {
            "event_name": "TestEvent",
            "lead_id": "test_lead_1",
            "user_data": {"email": "test@example.com"},
            "custom_data": {"value": 1},
        }
        r = api.post(f"{BASE_URL}/api/v1/integrations/meta-capi/event", json=body)
        assert r.status_code == 200, r.text
        d = r.json()
        # Token may be expired but endpoint should not crash
        assert isinstance(d, dict)
        print(f"Meta CAPI response: {d}")

    def test_meta_capi_event_validation(self, api):
        # Missing event_name should be 422
        r = api.post(f"{BASE_URL}/api/v1/integrations/meta-capi/event", json={"lead_id": "x"})
        assert r.status_code == 422, r.text

    def test_whatsapp_send_not_configured(self, api):
        # After fix: JSON body via WhatsAppSendRequest model
        body = {"phone": "9876543210", "message": "hello from test", "lead_id": None}
        r = api.post(f"{BASE_URL}/api/v1/integrations/whatsapp/send", json=body)
        assert r.status_code == 200, r.text  # graceful
        d = r.json()
        assert isinstance(d, dict)
        # WhatsApp not configured - expect success=False
        assert d.get("success") is False

    def test_whatsapp_send_validation(self, api):
        # Missing required field (message) should be 422
        r = api.post(f"{BASE_URL}/api/v1/integrations/whatsapp/send", json={"phone": "9876543210"})
        assert r.status_code == 422, r.text

    def test_zoho_sync_not_configured(self, api):
        # After fix: lead_data wrapped in ZohoSyncRequest
        body = {"lead_data": {"name": "Test", "phone": "9876543210"}}
        r = api.post(f"{BASE_URL}/api/v1/integrations/zoho-crm/sync-lead", json=body)
        assert r.status_code == 200, r.text
        d = r.json()
        assert isinstance(d, dict)
        # Zoho not configured - expect success=False
        assert d.get("success") is False


# ============ RATE LIMITING ============
class TestRateLimit:
    def test_rate_limit_tools_shared_across_subpaths(self, api):
        """After fix: 30/min SHARED across all /api/v1/tools/* endpoints.
        Mix EMI + ROI + budget calls and expect a 429 before 35 succeed."""
        hit_429_at = None
        endpoints = [
            ("emi-calculator", {"loan_amount": 1000000, "interest_rate_yearly": 8, "tenure_months": 120}),
            ("roi-calculator", {
                "purchase_price": 5000000, "rental_income_monthly": 25000,
                "maintenance_cost_monthly": 2000, "property_tax_yearly": 15000,
                "appreciation_rate_yearly": 6.0, "holding_period_years": 10,
            }),
            ("budget-planner", {
                "monthly_income": 150000, "existing_emis": 20000,
                "down_payment_available": 1000000, "interest_rate": 8.5, "tenure_years": 20,
            }),
        ]
        for i in range(40):
            ep, payload = endpoints[i % len(endpoints)]
            r = api.post(f"{BASE_URL}/api/v1/tools/{ep}", json=payload)
            if r.status_code == 429:
                hit_429_at = i + 1
                break
        print(f"Tools shared rate limit hit_429_at_request={hit_429_at}")
        assert hit_429_at is not None and hit_429_at <= 35, (
            f"Expected 429 within ~30 mixed tool calls (shared bucket), got hit_429_at={hit_429_at}"
        )

    def test_rate_limit_leads_tighter(self, api):
        """After fix: leads limited to 10/min per IP. Send 12 quickly."""
        import random
        hit_429_at = None
        for i in range(15):
            phone = "9" + "".join(str(random.randint(0, 9)) for _ in range(9))
            payload = {
                "name": f"TEST_RL_{i}_{uuid.uuid4().hex[:6]}",
                "phone": phone,
                "source": "web",
            }
            r = api.post(f"{BASE_URL}/api/v1/leads/", json=payload)
            if r.status_code == 429:
                hit_429_at = i + 1
                break
        print(f"Leads rate limit hit_429_at_request={hit_429_at}")
        assert hit_429_at is not None and hit_429_at <= 12, (
            f"Expected 429 within ~10 lead creates, got hit_429_at={hit_429_at}"
        )
