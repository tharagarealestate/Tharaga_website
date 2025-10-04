from __future__ import annotations

import json
from typing import List

import pytest
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_recommendations_for_known_user():
    payload = {"user_id": "U1", "num_results": 3}
    res = client.post("/api/recommendations", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    items: List[dict] = data["items"]
    assert 1 <= len(items) <= 3
    for item in items:
        assert set(["property_id", "title", "image_url", "specs", "reasons", "score"]).issubset(item.keys())
        assert isinstance(item["reasons"], list)
        assert item["score"] >= 0


def test_recommendations_cold_start():
    payload = {"session_id": "S1", "num_results": 2}
    res = client.post("/api/recommendations", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 2


def test_requires_user_or_session():
    res = client.post("/api/recommendations", json={})
    assert res.status_code == 400
    assert "Provide either user_id or session_id" in res.text


def test_rera_verify_basic():
    payload = {"rera_id": "TN-1234-XYZ", "state": "TN", "project_name": "Demo Homes"}
    res = client.post("/api/verify/rera", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data.get("verified"), bool)
    assert 0.0 <= data.get("confidence", 0) <= 1.0


def test_title_verify_hash():
    payload = {"property_id": "P1", "document_hash": "a"*64, "network": "polygon"}
    res = client.post("/api/verify/title", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "transaction_hash" in data
    assert isinstance(data.get("verified"), bool)


def test_fraud_score_bounds():
    payload = {"price_inr": 1000000, "sqft": 1000, "has_rera_id": False, "has_title_docs": False, "seller_type": "broker", "listed_days_ago": 200}
    res = client.post("/api/fraud/score", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert 0 <= data.get("risk_score", 0) <= 100
    assert data.get("risk_level") in {"low", "medium", "high"}


def test_predictive_analytics_shape():
    res = client.post("/api/analytics/predict", json={"city": "Bengaluru", "locality": "Indiranagar"})
    assert res.status_code == 200
    data = res.json()
    assert "price_appreciation_1y_pct" in data
    assert "expected_rent_yield_pct" in data

