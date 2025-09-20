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

