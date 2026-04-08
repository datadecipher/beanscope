#!/bin/bash

# BeanScope Deployment Verification Script
# Run this to verify all endpoints are working correctly
# Before: validates basic functionality
# After Alchemy key added: validates full analytics functionality

set -e

SITE="https://beanscope.xyz"
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== BeanScope Deployment Verification ===${NC}\n"

# Test 1: Analytics endpoint responds
echo -e "${YELLOW}[1/6] Testing /api/analytics endpoint...${NC}"
ANALYTICS=$(curl -s "$SITE/api/analytics")
if echo "$ANALYTICS" | grep -q "currentRound"; then
  CURRENT_ROUND=$(echo "$ANALYTICS" | node -e "process.stdin.on('data', d => console.log(JSON.parse(d).currentRound))")
  BEAN_SUPPLY=$(echo "$ANALYTICS" | node -e "process.stdin.on('data', d => console.log(JSON.parse(d).beanSupply))")
  echo -e "${GREEN}✓ Analytics endpoint working${NC}"
  echo "  Current round: $CURRENT_ROUND"
  echo "  BEAN supply: $BEAN_SUPPLY"
else
  echo -e "${RED}✗ Analytics endpoint failed${NC}"
  exit 1
fi

# Test 2: Free stats endpoint
echo -e "\n${YELLOW}[2/6] Testing /api/free-stats endpoint...${NC}"
FREE_STATS=$(curl -s "$SITE/api/free-stats")
if echo "$FREE_STATS" | grep -q "roundStatus"; then
  ROUND_STATUS=$(echo "$FREE_STATS" | node -e "process.stdin.on('data', d => console.log(JSON.parse(d).roundStatus))")
  echo -e "${GREEN}✓ Free stats endpoint working${NC}"
  echo "  Round status: $ROUND_STATUS"
else
  echo -e "${RED}✗ Free stats endpoint failed${NC}"
  exit 1
fi

# Test 3: Paywall enforcing (test with zero address)
echo -e "\n${YELLOW}[3/6] Testing paywall enforcement...${NC}"
NO_ACCESS=$(curl -s "$SITE/api/dashboard?wallet=0x0000000000000000000000000000000000000001")
if echo "$NO_ACCESS" | grep -q "no_access"; then
  echo -e "${GREEN}✓ Paywall enforcing correctly${NC}"
  echo "  Non-paying wallet correctly denied"
else
  echo -e "${RED}✗ Paywall not enforcing${NC}"
  exit 1
fi

# Test 4: Superadmin bypass
echo -e "\n${YELLOW}[4/6] Testing superadmin whitelist...${NC}"
ADMIN_ACCESS=$(curl -s "$SITE/api/dashboard?wallet=0x79Ac5C4bA1c60E106eCD6031dA5c16D11f09A014")
if echo "$ADMIN_ACCESS" | grep -q '"ok":true'; then
  echo -e "${GREEN}✓ Superadmin bypass working${NC}"
  echo "  Admin address has access"
else
  echo -e "${RED}✗ Superadmin bypass failed${NC}"
  exit 1
fi

# Test 5: Chart data status (before Alchemy key)
echo -e "\n${YELLOW}[5/6] Checking chart data population...${NC}"
CHART_COUNT=$(echo "$ANALYTICS" | node -e "process.stdin.on('data', d => {
  const r = JSON.parse(d);
  console.log(r.roundHistory?.length || 0);
})")
if [ "$CHART_COUNT" = "0" ]; then
  echo -e "${YELLOW}⚠ Charts are EMPTY (expected before Alchemy key)${NC}"
  echo "  roundHistory: $CHART_COUNT entries"
  echo "  → Add Alchemy API key to populate charts"
else
  WIN_COUNTS=$(echo "$ANALYTICS" | node -e "process.stdin.on('data', d => {
    const r = JSON.parse(d);
    console.log(r.blockWinCounts.filter(x => x > 0).length);
  })")
  echo -e "${GREEN}✓ Charts are POPULATED${NC}"
  echo "  roundHistory: $CHART_COUNT entries"
  echo "  blockWinCounts with wins: $WIN_COUNTS"
fi

# Test 6: Response times
echo -e "\n${YELLOW}[6/6] Checking response times...${NC}"
START=$(date +%s%N)
curl -s "$SITE/api/analytics" > /dev/null
END=$(date +%s%N)
DURATION=$((($END - $START) / 1000000))
echo -e "${GREEN}✓ /api/analytics response time: ${DURATION}ms${NC}"
if [ $DURATION -lt 5000 ]; then
  echo "  Performance: Excellent (< 5s)"
elif [ $DURATION -lt 10000 ]; then
  echo "  Performance: Good (5-10s)"
else
  echo "  Performance: Slow (> 10s) — check Alchemy rate limits"
fi

echo -e "\n${BLUE}=== Verification Complete ===${NC}"
echo -e "${GREEN}All endpoints are working correctly.${NC}\n"

if [ "$CHART_COUNT" = "0" ]; then
  echo -e "${YELLOW}Next Step:${NC}"
  echo "1. Get Alchemy API key from https://www.alchemy.com (free tier)"
  echo "2. Run: cd frontend && npx vercel env add ALCHEMY_API_KEY production"
  echo "3. Paste your key and press Enter"
  echo "4. Run: npx vercel --prod --yes"
  echo "5. Re-run this script to verify charts are populated"
else
  echo -e "${GREEN}Charts are populated. Dashboard is ready for users!${NC}"
fi
