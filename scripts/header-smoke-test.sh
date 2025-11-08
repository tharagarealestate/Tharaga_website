#!/bin/bash
# Tharaga Header Smoke Test
# ==========================
# 
# Automated smoke test to verify header is present on all pages.
# 
# USAGE:
#   ./scripts/header-smoke-test.sh [BASE_URL]
# 
# EXAMPLE:
#   ./scripts/header-smoke-test.sh https://staging.tharaga.co.in
#   ./scripts/header-smoke-test.sh http://localhost:3000

set -e

# Default base URL (can be overridden via command line argument)
BASE_URL="${1:-https://staging.tharaga.co.in}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test URLs
URLS=(
  "/"
  "/about"
  "/pricing"
  "/tools/vastu"
  "/tools/environment"
  "/tools/voice-tamil"
  "/tools/verification"
  "/tools/roi"
  "/tools/currency-risk"
  "/properties"
  "/builder"
  "/my-dashboard"
)

# Counters
PASSED=0
FAILED=0
TOTAL=${#URLS[@]}

echo "=========================================="
echo "Tharaga Header Smoke Test"
echo "=========================================="
echo "Base URL: $BASE_URL"
echo "Testing $TOTAL pages..."
echo ""

# Test each URL
for path in "${URLS[@]}"; do
  url="${BASE_URL}${path}"
  echo -n "Testing $url... "
  
  # Fetch page content
  if ! response=$(curl -sL -w "\n%{http_code}" "$url" 2>/dev/null); then
    echo -e "${RED}FAILED${NC} (curl error)"
    FAILED=$((FAILED + 1))
    continue
  fi
  
  # Extract HTTP status code (last line)
  http_code=$(echo "$response" | tail -n1)
  html=$(echo "$response" | sed '$d')
  
  # Check HTTP status
  if [ "$http_code" != "200" ]; then
    echo -e "${YELLOW}SKIPPED${NC} (HTTP $http_code)"
    continue
  fi
  
  # Check for header presence
  if echo "$html" | grep -q 'id="tharaga-static-header"'; then
    echo -e "${GREEN}PASS${NC}"
    PASSED=$((PASSED + 1))
  elif echo "$html" | grep -q 'tharaga-header'; then
    echo -e "${GREEN}PASS${NC} (found tharaga-header)"
    PASSED=$((PASSED + 1))
  elif echo "$html" | grep -q 'id="tharaga-header-mount"'; then
    echo -e "${GREEN}PASS${NC} (found mount point)"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}FAIL${NC} (header not found)"
    FAILED=$((FAILED + 1))
  fi
done

echo ""
echo "=========================================="
echo "Results:"
echo "  Total:  $TOTAL"
echo "  Passed: $PASSED"
echo "  Failed: $FAILED"
echo "=========================================="

# Exit with error code if any tests failed
if [ $FAILED -gt 0 ]; then
  exit 1
fi

exit 0

