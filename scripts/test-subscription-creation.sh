#!/bin/bash

# Test Subscription Creation Script
# Tests the subscription creation API endpoint

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_URL="${API_URL:-http://localhost:3000}"
AUTH_TOKEN="${AUTH_TOKEN:-}"

echo -e "${BLUE}🚀 Testing Subscription Creation${NC}\n"

# Test 1: Starter Monthly
echo -e "${BLUE}Test 1: Starter Monthly Subscription${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/rzp/create-subscription" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -d '{
    "plan": "starter",
    "annual": false,
    "email": "test@example.com"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✅ Success${NC}"
  echo "$BODY" | jq '.'

  SUB_ID=$(echo "$BODY" | jq -r '.id')
  PLAN_ID=$(echo "$BODY" | jq -r '.plan_id // empty')

  if [ -n "$SUB_ID" ]; then
    echo -e "${GREEN}Subscription ID: ${SUB_ID}${NC}"
    echo -e "${YELLOW}Payment URL: $(echo "$BODY" | jq -r '.short_url')${NC}"
  fi
else
  echo -e "${RED}❌ Failed (HTTP $HTTP_CODE)${NC}"
  echo "$BODY"
fi

echo ""

# Test 2: Professional Annual
echo -e "${BLUE}Test 2: Professional Annual Subscription${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/rzp/create-subscription" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -d '{
    "plan": "professional",
    "annual": true,
    "email": "test@example.com"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✅ Success${NC}"
  echo "$BODY" | jq '.'
else
  echo -e "${RED}❌ Failed (HTTP $HTTP_CODE)${NC}"
  echo "$BODY"
fi

echo ""

# Test 3: Enterprise Monthly
echo -e "${BLUE}Test 3: Enterprise Monthly Subscription${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/rzp/create-subscription" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -d '{
    "plan": "enterprise",
    "annual": false,
    "email": "test@example.com"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✅ Success${NC}"
  echo "$BODY" | jq '.'
else
  echo -e "${RED}❌ Failed (HTTP $HTTP_CODE)${NC}"
  echo "$BODY"
fi

echo ""
echo -e "${BLUE}📋 Test Summary${NC}"
echo -e "All subscription creation tests completed."

