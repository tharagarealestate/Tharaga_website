#!/bin/bash
# Test RERA API endpoints using curl

API_BASE_URL="${API_BASE_URL:-http://localhost:3000}"

echo "🚀 Testing RERA API Endpoints"
echo "API Base URL: $API_BASE_URL"
echo ""

# Test 1: POST /api/rera/verify - Valid request
echo "=== Test 1: POST /api/rera/verify (Valid) ==="
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/api/rera/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "reraNumber": "TN/01/Building/12345/2024",
    "state": "Tamil Nadu",
    "type": "builder"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
  echo "✅ PASS: HTTP $HTTP_CODE"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo "❌ FAIL: HTTP $HTTP_CODE"
  echo "$BODY"
fi
echo ""

# Test 2: POST /api/rera/verify - Invalid format
echo "=== Test 2: POST /api/rera/verify (Invalid Format) ==="
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/api/rera/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "reraNumber": "INVALID",
    "state": "Tamil Nadu"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 400 ]; then
  echo "✅ PASS: HTTP $HTTP_CODE (Expected error)"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo "❌ FAIL: Expected HTTP 400, got $HTTP_CODE"
  echo "$BODY"
fi
echo ""

# Test 3: GET /api/rera/verify
echo "=== Test 3: GET /api/rera/verify ==="
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_BASE_URL/api/rera/verify?reraNumber=TN/01/Building/12345/2024&state=Tamil%20Nadu")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ PASS: HTTP $HTTP_CODE"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo "❌ FAIL: HTTP $HTTP_CODE"
  echo "$BODY"
fi
echo ""

# Test 4: GET /api/rera/test (Health check)
echo "=== Test 4: GET /api/rera/test (Health Check) ==="
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_BASE_URL/api/rera/test")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ PASS: HTTP $HTTP_CODE"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo "❌ FAIL: HTTP $HTTP_CODE"
  echo "$BODY"
fi
echo ""

echo "=== Tests Complete ==="

